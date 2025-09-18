import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({
        error: "STRIPE_SECRET_KEY ausente"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { user_id, subscription_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({
        error: "user_id é obrigatório"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Inicializar cliente Supabase
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Buscar dados do usuário e assinatura atual
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, subscription_plans(*)')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({
        error: "Usuário não encontrado"
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Se tem subscription_id, cancelar no Stripe
    if (subscription_id) {
      const cancelResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscription_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });

      const cancelResult = await cancelResponse.json();
      
      if (!cancelResponse.ok) {
        console.error("Erro ao cancelar no Stripe:", cancelResult);
        // Continuar mesmo se falhar no Stripe, para não deixar usuário "preso"
      }
    }

    // Buscar plano gratuito da mesma região
    const { data: freePlans, error: freePlanError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', 'free')
      .eq('region', profile.subscription_plans?.region || 'BR')
      .eq('is_active', true)
      .limit(1);

    if (freePlanError || !freePlans || freePlans.length === 0) {
      return new Response(JSON.stringify({
        error: "Plano gratuito não encontrado"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const freePlan = freePlans[0];

    // Atualizar perfil do usuário para plano gratuito
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'free',
        current_plan_id: freePlan.id,
        subscription_expires_at: null,
        stripe_customer_id: null, // Limpar dados do Stripe
        stripe_subscription_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id);

    if (updateError) {
      console.error("Erro ao atualizar perfil:", updateError);
      return new Response(JSON.stringify({
        error: "Erro ao atualizar perfil do usuário"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Log da operação
    console.log(`✅ Assinatura cancelada com sucesso para usuário ${user_id}`);

    return new Response(JSON.stringify({
      success: true,
      message: "Assinatura cancelada com sucesso",
      new_plan: freePlan
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (e) {
    console.error("Erro na Edge Function de cancelamento:", e);
    return new Response(JSON.stringify({
      error: "Internal error",
      message: String(e?.message || e)
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
