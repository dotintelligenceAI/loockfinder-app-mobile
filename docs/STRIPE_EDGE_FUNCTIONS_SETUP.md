# 🚀 Configuração das Edge Functions do Stripe - LookFinder

## 📋 Visão Geral

Este documento explica como configurar as Edge Functions do Supabase para gerenciar completamente o sistema de assinaturas com Stripe, incluindo pagamentos e cancelamentos.

## 🔧 Edge Functions Necessárias

### 1. **prepare-checkout-data** ✅ (Já implementada)
- **Arquivo**: `indexedgefunction.md` (atual)
- **Função**: Criar sessões de checkout do Stripe
- **Status**: ✅ Funcionando

### 2. **cancel-subscription** 🆕 (Nova)
- **Arquivo**: `cancel-subscription-edge-function.ts`
- **Função**: Cancelar assinaturas no Stripe
- **Status**: 🔄 Precisa ser deployada

### 3. **stripe-webhook** 🆕 (Nova)  
- **Arquivo**: `stripe-webhook-edge-function.ts`
- **Função**: Processar webhooks do Stripe
- **Status**: 🔄 Precisa ser deployada

## 🛠️ Como Deployar as Edge Functions

### 1. **Instalar Supabase CLI:**
```bash
npm install -g supabase
```

### 2. **Fazer Login:**
```bash
supabase login
```

### 3. **Criar as Edge Functions:**
```bash
# Criar função de cancelamento
supabase functions new cancel-subscription

# Criar função de webhook
supabase functions new stripe-webhook
```

### 4. **Copiar o código:**
- Copie o conteúdo de `cancel-subscription-edge-function.ts` para `supabase/functions/cancel-subscription/index.ts`
- Copie o conteúdo de `stripe-webhook-edge-function.ts` para `supabase/functions/stripe-webhook/index.ts`

### 5. **Deploy:**
```bash
# Deploy da função de cancelamento
supabase functions deploy cancel-subscription

# Deploy da função de webhook
supabase functions deploy stripe-webhook
```

## 🔐 Variáveis de Ambiente Necessárias

Configure no dashboard do Supabase (Settings > Edge Functions):

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 🎯 Fluxo Completo de Assinatura

### **1. Compra de Plano:**
```
App → prepare-checkout-data → Stripe Checkout → Pagamento
                                     ↓
Webhook stripe-webhook ← Stripe (checkout.session.completed)
                ↓
Atualiza profiles: subscription_status = 'active'
```

### **2. Renovação Automática:**
```
Stripe (cobrança mensal) → invoice.payment_succeeded → stripe-webhook
                                                              ↓
                                    Atualiza subscription_expires_at
```

### **3. Cancelamento:**
```
App → cancel-subscription → Stripe API (cancel) → Atualiza profiles
                                     ↓
                        subscription_status = 'free'
```

### **4. Falha de Pagamento:**
```
Stripe → invoice.payment_failed → stripe-webhook → subscription_status = 'past_due'
```

## 📊 Campos da Tabela `profiles` para Assinaturas

Certifique-se de que a tabela `profiles` tem estes campos:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_plan_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);
```

## 🔗 Configuração do Webhook no Stripe

### 1. **No Dashboard do Stripe:**
- Vá para "Developers" > "Webhooks"
- Clique "Add endpoint"
- URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`

### 2. **Eventos para Escutar:**
```
checkout.session.completed
invoice.payment_succeeded  
invoice.payment_failed
customer.subscription.deleted
customer.subscription.updated
```

### 3. **Copiar Webhook Secret:**
- Copie o `whsec_...` e adicione nas variáveis de ambiente

## 🧪 Testando o Sistema

### **Teste de Compra:**
1. Usuário seleciona plano
2. Verifica se checkout abre corretamente
3. Simula pagamento no Stripe (modo test)
4. Verifica se status foi atualizado no banco

### **Teste de Cancelamento:**
1. Usuário com plano pago clica "Cancelar plano"
2. Confirma no modal
3. Verifica se voltou para plano gratuito
4. Verifica logs no Supabase Functions

## 🚨 Considerações Importantes

### **⚠️ Segurança:**
- **NUNCA** exponha `STRIPE_SECRET_KEY` no frontend
- **SEMPRE** valide webhooks com assinatura
- **Use HTTPS** em produção

### **💳 Experiência do Usuário:**
- **Manter acesso** até fim do período pago (mesmo após cancelamento)
- **Notificações** de renovação e falhas de pagamento
- **Período de carência** para pagamentos em atraso

### **🔄 Sincronização:**
- **Webhooks são assíncronos** - pode haver delay
- **Implementar retry logic** para falhas temporárias
- **Logs detalhados** para debugging

## 📈 Próximos Passos

1. ✅ **Deploy das Edge Functions**
2. ✅ **Configurar webhook no Stripe**  
3. ✅ **Testar fluxo completo**
4. 🔄 **Implementar notificações push**
5. 🔄 **Adicionar histórico de faturas**
6. 🔄 **Implementar downgrades de plano**

---

**🎉 Com essa configuração, o LookFinder terá um sistema de assinaturas completo e profissional!**
