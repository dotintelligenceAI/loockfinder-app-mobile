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
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
      return new Response(JSON.stringify({
        error: "Variáveis do Stripe não configuradas"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Verificar assinatura do webhook
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    
    if (!signature) {
      return new Response(JSON.stringify({
        error: "Assinatura do webhook ausente"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // TODO: Implementar verificação da assinatura do webhook
    // const event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    
    // Por enquanto, vamos parsear diretamente (APENAS PARA DESENVOLVIMENTO)
    const event = JSON.parse(body);
    
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
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
});

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
      subscription_expires_at: null, // Será definido quando soubermos o período
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    console.error("Erro ao atualizar perfil após checkout:", error);
  } else {
    console.log(`✅ Perfil atualizado para usuário ${userId}`);
  }

  // Atualizar registro de pagamento para 'succeeded'
  if (session.payment_intent) {
    const { error: paymentError } = await supabase
      .from('subscription_payments')
      .update({
        status: 'succeeded',
        processed_at: new Date().toISOString(),
        payment_method: 'card', // Assumindo cartão por padrão
        stripe_payment_intent_id: session.payment_intent
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
  const subscriptionId = invoice.subscription;
  
  // Buscar usuário pelo stripe_customer_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();
    
  if (profile) {
    // Calcular nova data de expiração baseada no período
    const periodStart = new Date(invoice.lines.data[0].period.start * 1000);
    const periodEnd = new Date(invoice.lines.data[0].period.end * 1000);
    
    // Atualizar perfil do usuário
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
    // Atualizar status do perfil
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
    }

    // Registrar falha no pagamento
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
    // Buscar plano gratuito para voltar
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
