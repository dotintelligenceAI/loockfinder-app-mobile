import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({
        error: "STRIPE_SECRET_KEY ausente"
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // Inicializar cliente Supabase
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Verificar se é um webhook do Stripe (tem signature) ou request de checkout
    const signature = req.headers.get('stripe-signature');
    
    if (signature) {
      // É um webhook do Stripe
      return await handleStripeWebhook(req, signature, STRIPE_WEBHOOK_SECRET!, supabase);
    } else {
      // É um request de checkout
      return await handleCheckoutRequest(req, STRIPE_SECRET_KEY, supabase);
    }

  } catch (e) {
    return new Response(JSON.stringify({
      error: "Internal error",
      message: String(e?.message || e)
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});

// Função para processar webhooks do Stripe
async function handleStripeWebhook(req: Request, signature: string, webhookSecret: string, supabase: any) {
  try {
    const body = await req.text();
    
    // TODO: Em produção, implementar verificação da assinatura
    // const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    // Por enquanto, parsear diretamente (DESENVOLVIMENTO)
    const event = JSON.parse(body);
    
    console.log(`📨 Webhook recebido: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, supabase);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, supabase);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, supabase);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, supabase);
        break;
        
      default:
        console.log(`⚠️ Evento não tratado: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (e) {
    console.error("Erro no webhook:", e);
    return new Response(JSON.stringify({
      error: "Webhook processing failed",
      message: String(e?.message || e)
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}

// Função para processar requests de checkout
async function handleCheckoutRequest(req: Request, stripeSecretKey: string, supabase: any) {
  const { plan_id, user_id, stripe_price_id } = await req.json();
    
  // OBS: se você ainda não busca o stripe_price_id do banco aqui,
  // passe-o direto do app temporariamente (stripe_price_id).
  if (!stripe_price_id && !plan_id) {
    return new Response(JSON.stringify({
      error: "Informe plan_id ou stripe_price_id"
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }

  // Criação da sessão no Stripe via REST
  const form = new URLSearchParams();
  form.append("mode", "subscription");
  form.append("line_items[0][price]", stripe_price_id || "price_xxx");
  form.append("line_items[0][quantity]", "1");
  form.append("success_url", "lookfindermobile://checkout-success");
  form.append("cancel_url", "lookfindermobile://plans");
  form.append("allow_promotion_codes", "true");
  if (user_id) form.append("metadata[user_id]", user_id);
  if (plan_id) form.append("metadata[plan_id]", plan_id);

  const stripeResp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form.toString()
  });

  const session = await stripeResp.json();
  if (!stripeResp.ok) {
    return new Response(JSON.stringify({
      error: "Stripe error",
      details: session
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }

  // Registrar início do pagamento na tabela subscription_payments
  if (user_id && session.id) {
    try {
      const { error: paymentError } = await supabase
        .from('subscription_payments')
        .insert({
          user_id: user_id,
          amount_cents: session.amount_total,
          currency: session.currency?.toUpperCase(),
          status: 'pending',
          stripe_payment_intent_id: session.payment_intent,
          period_start: new Date().toISOString(),
          period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      
      if (paymentError) {
        console.error('Erro ao registrar pagamento:', paymentError);
      } else {
        console.log(`✅ Pagamento registrado: ${session.payment_intent}`);
      }
    } catch (e) {
      console.error('Erro ao inserir subscription_payments:', e);
    }
  }

  return new Response(JSON.stringify({
    checkout_url: session.url
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

// Handlers para diferentes eventos do Stripe

async function handleCheckoutCompleted(session: any, supabase: any) {
  console.log("💳 Checkout completado:", session.id);
  
  const userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id;
  
  if (!userId || !planId) {
    console.error("Metadados ausentes no checkout:", { userId, planId });
    return;
  }

  // Atualizar perfil do usuário
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'active',
      current_plan_id: planId,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      subscription_expires_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    console.error("Erro ao atualizar perfil após checkout:", error);
  } else {
    console.log(`✅ Perfil atualizado para usuário ${userId}`);
    
    // Criar notificação de sucesso da assinatura
    try {
      await supabase
        .from('avisos')
        .insert({
          user_id: userId,
          aviso_tipo: 'promotion',
          titulo: 'Assinatura ativada!',
          descricao: 'Parabéns! Sua assinatura premium está ativa. Agora você tem acesso completo a todas as funcionalidades do LookFinder!',
          ativo: true,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        });
      console.log('✅ Notificação de sucesso da assinatura criada');
    } catch (notifError) {
      console.warn('Erro ao criar notificação de sucesso:', notifError);
    }
  }

  // Atualizar registro de pagamento para 'succeeded'
  if (session.payment_intent) {
    const { error: paymentError } = await supabase
      .from('subscription_payments')
      .update({
        status: 'succeeded',
        processed_at: new Date().toISOString(),
        payment_method: 'card'
      })
      .eq('stripe_payment_intent_id', session.payment_intent);

    if (paymentError) {
      console.error("Erro ao atualizar subscription_payments:", paymentError);
    } else {
      console.log(`✅ Pagamento marcado como succeeded: ${session.payment_intent}`);
    }
  }
}

async function handlePaymentSucceeded(invoice: any, supabase: any) {
  console.log("💰 Pagamento bem-sucedido:", invoice.id);
  
  const customerId = invoice.customer;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();
    
  if (profile) {
    const periodStart = new Date(invoice.lines.data[0].period.start * 1000);
    const periodEnd = new Date(invoice.lines.data[0].period.end * 1000);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_expires_at: periodEnd.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);
      
    if (error) {
      console.error("Erro ao renovar assinatura:", error);
    } else {
      console.log(`✅ Assinatura renovada até ${periodEnd.toISOString()}`);
      
      // Criar notificação de renovação
      try {
        await supabase
          .from('avisos')
          .insert({
            user_id: profile.id,
            aviso_tipo: 'update',
            titulo: 'Assinatura renovada! 🔄',
            descricao: `Sua assinatura foi renovada automaticamente e está ativa até ${periodEnd.toLocaleDateString('pt-BR')}. Continue aproveitando todos os recursos premium!`,
            ativo: true,
            criado_em: new Date().toISOString(),
            atualizado_em: new Date().toISOString()
          });
        console.log('✅ Notificação de renovação criada');
      } catch (notifError) {
        console.warn('Erro ao criar notificação de renovação:', notifError);
      }
    }

    // Registrar pagamento de renovação
    const { error: paymentError } = await supabase
      .from('subscription_payments')
      .insert({
        user_id: profile.id,
        amount_cents: invoice.amount_paid,
        currency: invoice.currency?.toUpperCase(),
        status: 'succeeded',
        stripe_payment_intent_id: invoice.payment_intent,
        payment_method: 'card',
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        processed_at: new Date().toISOString()
      });

    if (paymentError) {
      console.error("Erro ao registrar renovação:", paymentError);
    } else {
      console.log(`✅ Renovação registrada em subscription_payments`);
    }
  }
}

async function handlePaymentFailed(invoice: any, supabase: any) {
  console.log("❌ Pagamento falhou:", invoice.id);
  
  const customerId = invoice.customer;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();
    
  if (profile) {
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);
      
    if (error) {
      console.error("Erro ao marcar como em atraso:", error);
    } else {
      console.log(`⚠️ Usuário ${profile.id} marcado como em atraso`);
      
      // Criar notificação de falha no pagamento
      try {
        await supabase
          .from('avisos')
          .insert({
            user_id: profile.id,
            aviso_tipo: 'maintenance',
            titulo: 'Problema com pagamento ⚠️',
            descricao: 'Não conseguimos processar seu pagamento. Verifique seus dados de pagamento para manter o acesso premium.',
            ativo: true,
            criado_em: new Date().toISOString(),
            atualizado_em: new Date().toISOString()
          });
        console.log('✅ Notificação de falha de pagamento criada');
      } catch (notifError) {
        console.warn('Erro ao criar notificação de falha:', notifError);
      }
    }

    if (invoice.payment_intent) {
      const { error: paymentError } = await supabase
        .from('subscription_payments')
        .update({
          status: 'failed',
          failed_reason: invoice.last_payment_error?.message || 'Pagamento recusado',
          processed_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', invoice.payment_intent);

      if (paymentError) {
        console.error("Erro ao registrar falha de pagamento:", paymentError);
      } else {
        console.log(`❌ Falha de pagamento registrada: ${invoice.payment_intent}`);
      }
    }
  }
}

async function handleSubscriptionDeleted(subscription: any, supabase: any) {
  console.log("🚫 Assinatura cancelada:", subscription.id);
  
  const customerId = subscription.customer;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();
    
  if (profile) {
    const { data: freePlans } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', 'free')
      .eq('is_active', true)
      .limit(1);
      
    const freePlan = freePlans?.[0];
    
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'free',
        current_plan_id: freePlan?.id || null,
        subscription_expires_at: null,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);
      
    if (error) {
      console.error("Erro ao cancelar assinatura:", error);
    } else {
      console.log(`✅ Usuário ${profile.id} voltou para plano gratuito`);
    }
  }
}
