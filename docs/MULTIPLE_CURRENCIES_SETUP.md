# Configuração de Múltiplas Moedas - Lookfinder

## 📋 Visão Geral

Este documento explica como configurar o sistema de múltiplas moedas no Lookfinder, permitindo que usuários de diferentes regiões vejam preços em suas moedas locais.

## 🗄️ Configuração do Banco de Dados

### 1. Atualizar Tabela `subscription_plans`

Adicione as seguintes colunas à tabela `subscription_plans`:

```sql
-- Adicionar colunas para suporte a múltiplas moedas
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS region VARCHAR(10) DEFAULT 'BR',
ADD COLUMN IF NOT EXISTS stripe_product_id VARCHAR(255);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_region ON subscription_plans(region);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug_region ON subscription_plans(slug, region);
```

### 2. Estrutura de Dados Recomendada

Para cada plano, você deve criar registros para cada região:

```sql
-- Exemplo: Plano Mensal para Brasil
INSERT INTO subscription_plans (
  name, slug, description, price_cents, currency, billing_period,
  stripe_price_id, stripe_product_id, region, is_active, sort_order
) VALUES (
  'Lookfinder Mensal', 'monthly', 'Plano mensal do Lookfinder', 3990, 'BRL', 'monthly',
  'price_1234567890_br', 'prod_1234567890', 'BR', true, 1
);

-- Exemplo: Plano Mensal para Estados Unidos
INSERT INTO subscription_plans (
  name, slug, description, price_cents, currency, billing_period,
  stripe_price_id, stripe_product_id, region, is_active, sort_order
) VALUES (
  'Lookfinder Monthly', 'monthly', 'Lookfinder monthly plan', 790, 'USD', 'monthly',
  'price_1234567890_us', 'prod_1234567890', 'US', true, 1
);

-- Exemplo: Plano Mensal para Europa
INSERT INTO subscription_plans (
  name, slug, description, price_cents, currency, billing_period,
  stripe_price_id, stripe_product_id, region, is_active, sort_order
) VALUES (
  'Lookfinder Mensuel', 'monthly', 'Plan mensuel Lookfinder', 790, 'EUR', 'monthly',
  'price_1234567890_eu', 'prod_1234567890', 'EU', true, 1
);
```

### 3. Atualizar Tabela `profiles` (Opcional)

Para salvar a localização do usuário:

```sql
-- Adicionar colunas de localização ao perfil
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS country_code VARCHAR(5),
ADD COLUMN IF NOT EXISTS region VARCHAR(10),
ADD COLUMN IF NOT EXISTS currency VARCHAR(5),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50);
```

## 🏪 Configuração no Stripe

### 1. Criar Produtos

No Stripe Dashboard, crie um produto para cada plano:

```
Produto: Lookfinder Monthly
- ID: prod_1234567890
- Descrição: Plano mensal do Lookfinder
```

### 2. Criar Preços por Região

Para cada produto, crie preços em diferentes moedas:

```
Brasil (BRL):
- Preço: R$ 39,90
- ID: price_1234567890_br
- Moeda: BRL

Estados Unidos (USD):
- Preço: $ 7.90
- ID: price_1234567890_us
- Moeda: USD

Europa (EUR):
- Preço: € 7.90
- ID: price_1234567890_eu
- Moeda: EUR
```

## 🌍 Regiões Suportadas

O sistema suporta as seguintes regiões:

| Região | Código | Moeda | Países |
|--------|--------|-------|--------|
| Brasil | `BR` | BRL | Brasil |
| Estados Unidos | `US` | USD | Estados Unidos |
| Europa | `EU` | EUR | França, Alemanha, Espanha, Itália, etc. |
| Outros | `OTHER` | USD | Canadá, Reino Unido, Austrália, etc. |

## 🔧 Configuração de Preços

### Valores Sugeridos

```javascript
// Exemplo de configuração de preços
const PRICING_CONFIG = {
  monthly: {
    BR: { price_cents: 3990, currency: 'BRL' }, // R$ 39,90
    US: { price_cents: 790, currency: 'USD' },  // $ 7.90
    EU: { price_cents: 790, currency: 'EUR' }   // € 7.90
  },
  semiannual: {
    BR: { price_cents: 19900, currency: 'BRL' }, // R$ 199,00
    US: { price_cents: 3990, currency: 'USD' },  // $ 39.90
    EU: { price_cents: 3990, currency: 'EUR' }   // € 39.90
  },
  annual: {
    BR: { price_cents: 34900, currency: 'BRL' }, // R$ 349,00
    US: { price_cents: 6990, currency: 'USD' },  // $ 69.90
    EU: { price_cents: 6990, currency: 'EUR' }   // € 69.90
  }
};
```

## 🚀 Como Funciona

### 1. Detecção Automática

O sistema detecta automaticamente a localização do usuário usando:

1. **APIs de Geolocalização**: ipapi.co, ipinfo.io, ipgeolocation.io
2. **Fallback por Timezone**: Se as APIs falharem
3. **Fallback Final**: Brasil (BRL)

### 2. Carregamento de Planos

```typescript
// O sistema carrega planos baseados na região detectada
const location = await geolocationService.detectLocation();
const plans = await subscriptionsService.getActivePlans(location.region);
```

### 3. Checkout

```typescript
// O checkout usa o stripe_price_id correto para a região
const checkout = await subscriptionsService.prepareCheckout(
  planId,
  userId,
  stripePriceId,
  region
);
```

## 📱 Interface do Usuário

### Indicador de Localização

A tela de planos mostra um indicador da localização detectada:

```
📍 Preços para Brazil (BRL)
```

### Formatação de Moeda

Os preços são formatados automaticamente:

- **Brasil**: R$ 39,90
- **Estados Unidos**: $7.90
- **Europa**: €7,90

## 🔄 Migração de Dados Existentes

Se você já tem planos configurados:

```sql
-- Atualizar planos existentes para região BR
UPDATE subscription_plans 
SET region = 'BR', currency = 'BRL' 
WHERE region IS NULL OR currency IS NULL;
```

## 🧪 Testes

### Testar Diferentes Regiões

```typescript
// Forçar região específica para testes
const plansBR = await subscriptionsService.getActivePlans('BR');
const plansUS = await subscriptionsService.getActivePlans('US');
const plansEU = await subscriptionsService.getActivePlans('EU');
```

### Limpar Cache de Geolocalização

```typescript
// Limpar cache para forçar nova detecção
geolocationService.clearCache();
```

## 🚨 Considerações Importantes

### 1. Fallbacks

- Se não encontrar planos para uma região, usa planos do Brasil
- Se a detecção de localização falhar, usa Brasil como padrão
- Se não encontrar stripe_price_id, usa o fornecido no parâmetro

### 2. Performance

- Cache de 24 horas para detecção de localização
- Índices no banco para consultas rápidas por região
- Múltiplas APIs de fallback para alta disponibilidade

### 3. Segurança

- APIs de geolocalização são públicas e gratuitas
- Não armazenamos dados sensíveis de localização
- Fallbacks garantem que o sistema sempre funcione

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique os logs do console para erros de geolocalização
2. Confirme que os stripe_price_id estão corretos no banco
3. Teste com diferentes regiões usando o parâmetro manual
4. Verifique se as APIs de geolocalização estão acessíveis

---

**Nota**: Este sistema foi projetado para ser robusto e sempre funcionar, mesmo se a detecção de localização falhar. O fallback para Brasil garante que usuários sempre vejam preços válidos.
