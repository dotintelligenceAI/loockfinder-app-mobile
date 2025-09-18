-- =====================================================
-- CONFIGURAÇÃO DE MÚLTIPLAS MOEDAS - LOOKFINDER
-- =====================================================

-- 1. Adicionar colunas necessárias à tabela subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS region VARCHAR(10) DEFAULT 'BR',
ADD COLUMN IF NOT EXISTS stripe_product_id VARCHAR(255);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_region ON subscription_plans(region);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug_region ON subscription_plans(slug, region);

-- 3. Exemplo de dados para diferentes regiões
-- =====================================================

-- PLANO GRATUITO (Free) - Mesmo para todas as regiões
INSERT INTO subscription_plans (
  name, slug, description, price_cents, currency, billing_period,
  stripe_price_id, stripe_product_id, region, is_active, sort_order,
  features, limits_config
) VALUES (
  'Lookfinder Free', 'free', 'Plano gratuito do Lookfinder', 0, 'BRL', 'lifetime',
  NULL, NULL, 'BR', true, 0,
  '{"chat_messages": 5, "favorites": 10}',
  '{"daily_chat_messages": 5, "max_favorites": 10, "can_access_shopping_links": false}'
);

-- PLANO MENSAL - BRASIL
INSERT INTO subscription_plans (
  name, slug, description, price_cents, currency, billing_period,
  stripe_price_id, stripe_product_id, region, is_active, sort_order,
  features, limits_config
) VALUES (
  'Lookfinder Pro Mensal', 'monthly', 'Plano mensal do Lookfinder Pro', 3990, 'BRL', 'monthly',
  'price_1234567890_br_monthly', 'prod_lookfinder_pro', 'BR', true, 1,
  '{"unlimited_chat": true, "unlimited_favorites": true, "shopping_links": true}',
  '{"daily_chat_messages": 999, "max_favorites": 999, "can_access_shopping_links": true}'
);

-- PLANO MENSAL - ESTADOS UNIDOS
INSERT INTO subscription_plans (
  name, slug, description, price_cents, currency, billing_period,
  stripe_price_id, stripe_product_id, region, is_active, sort_order,
  features, limits_config
) VALUES (
  'Lookfinder Pro Monthly', 'monthly', 'Lookfinder Pro monthly plan', 790, 'USD', 'monthly',
  'price_1234567890_us_monthly', 'prod_lookfinder_pro', 'US', true, 1,
  '{"unlimited_chat": true, "unlimited_favorites": true, "shopping_links": true}',
  '{"daily_chat_messages": 999, "max_favorites": 999, "can_access_shopping_links": true}'
);

-- PLANO MENSAL - EUROPA
INSERT INTO subscription_plans (
  name, slug, description, price_cents, currency, billing_period,
  stripe_price_id, stripe_product_id, region, is_active, sort_order,
  features, limits_config
) VALUES (
  'Lookfinder Pro Mensuel', 'monthly', 'Plan mensuel Lookfinder Pro', 790, 'EUR', 'monthly',
  'price_1234567890_eu_monthly', 'prod_lookfinder_pro', 'EU', true, 1,
  '{"unlimited_chat": true, "unlimited_favorites": true, "shopping_links": true}',
  '{"daily_chat_messages": 999, "max_favorites": 999, "can_access_shopping_links": true}'
);

-- PLANO SEMESTRAL - BRASIL
INSERT INTO subscription_plans (
  name, slug, description, price_cents, currency, billing_period,
  stripe_price_id, stripe_product_id, region, is_active, sort_order,
  features, limits_config
) VALUES (
  'Lookfinder Pro Semestral', 'semiannual', 'Plano semestral do Lookfinder Pro', 19900, 'BRL', 'semiannual',
  'price_1234567890_br_semiannual', 'prod_lookfinder_pro', 'BR', true, 2,
  '{"unlimited_chat": true, "unlimited_favorites": true, "shopping_links": true}',
  '{"daily_chat_messages": 999, "max_favorites": 999, "can_access_shopping_links": true}'
);

-- PLANO SEMESTRAL - ESTADOS UNIDOS
INSERT INTO subscription_plans (
  name, slug, description, price_cents, currency, billing_period,
  stripe_price_id, stripe_product_id, region, is_active, sort_order,
  features, limits_config
) VALUES (
  'Lookfinder Pro Semiannual', 'semiannual', 'Lookfinder Pro semiannual plan', 3990, 'USD', 'semiannual',
  'price_1234567890_us_semiannual', 'prod_lookfinder_pro', 'US', true, 2,
  '{"unlimited_chat": true, "unlimited_favorites": true, "shopping_links": true}',
  '{"daily_chat_messages": 999, "max_favorites": 999, "can_access_shopping_links": true}'
);

-- PLANO SEMESTRAL - EUROPA
INSERT INTO subscription_plans (
  name, slug, description, price_cents, currency, billing_period,
  stripe_price_id, stripe_product_id, region, is_active, sort_order,
  features, limits_config
) VALUES (
  'Lookfinder Pro Semestriel', 'semiannual', 'Plan semestriel Lookfinder Pro', 3990, 'EUR', 'semiannual',
  'price_1234567890_eu_semiannual', 'prod_lookfinder_pro', 'EU', true, 2,
  '{"unlimited_chat": true, "unlimited_favorites": true, "shopping_links": true}',
  '{"daily_chat_messages": 999, "max_favorites": 999, "can_access_shopping_links": true}'
);

-- PLANO ANUAL - BRASIL
INSERT INTO subscription_plans (
  name, slug, description, price_cents, currency, billing_period,
  stripe_price_id, stripe_product_id, region, is_active, sort_order,
  features, limits_config
) VALUES (
  'Lookfinder Pro Anual', 'annual', 'Plano anual do Lookfinder Pro', 34900, 'BRL', 'annual',
  'price_1234567890_br_annual', 'prod_lookfinder_pro', 'BR', true, 3,
  '{"unlimited_chat": true, "unlimited_favorites": true, "shopping_links": true}',
  '{"daily_chat_messages": 999, "max_favorites": 999, "can_access_shopping_links": true}'
);

-- PLANO ANUAL - ESTADOS UNIDOS
INSERT INTO subscription_plans (
  name, slug, description, price_cents, currency, billing_period,
  stripe_price_id, stripe_product_id, region, is_active, sort_order,
  features, limits_config
) VALUES (
  'Lookfinder Pro Annual', 'annual', 'Lookfinder Pro annual plan', 6990, 'USD', 'annual',
  'price_1234567890_us_annual', 'prod_lookfinder_pro', 'US', true, 3,
  '{"unlimited_chat": true, "unlimited_favorites": true, "shopping_links": true}',
  '{"daily_chat_messages": 999, "max_favorites": 999, "can_access_shopping_links": true}'
);

-- PLANO ANUAL - EUROPA
INSERT INTO subscription_plans (
  name, slug, description, price_cents, currency, billing_period,
  stripe_price_id, stripe_product_id, region, is_active, sort_order,
  features, limits_config
) VALUES (
  'Lookfinder Pro Annuel', 'annual', 'Plan annuel Lookfinder Pro', 6990, 'EUR', 'annual',
  'price_1234567890_eu_annual', 'prod_lookfinder_pro', 'EU', true, 3,
  '{"unlimited_chat": true, "unlimited_favorites": true, "shopping_links": true}',
  '{"daily_chat_messages": 999, "max_favorites": 999, "can_access_shopping_links": true}'
);

-- =====================================================
-- VERIFICAÇÃO DOS DADOS
-- =====================================================

-- Verificar planos por região
SELECT 
  region,
  currency,
  COUNT(*) as total_plans,
  STRING_AGG(DISTINCT slug, ', ') as available_plans
FROM subscription_plans 
WHERE is_active = true 
GROUP BY region, currency
ORDER BY region, currency;

-- Verificar preços por região
SELECT 
  region,
  currency,
  slug,
  name,
  price_cents,
  CASE 
    WHEN currency = 'BRL' THEN CONCAT('R$ ', (price_cents / 100.0)::DECIMAL(10,2))
    WHEN currency = 'USD' THEN CONCAT('$', (price_cents / 100.0)::DECIMAL(10,2))
    WHEN currency = 'EUR' THEN CONCAT('€', (price_cents / 100.0)::DECIMAL(10,2))
  END as formatted_price
FROM subscription_plans 
WHERE is_active = true AND slug != 'free'
ORDER BY region, sort_order;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

/*
1. SUBSTITUA OS STRIPE_PRICE_ID pelos IDs reais do seu Stripe:
   - price_1234567890_br_monthly → seu price_id real do Stripe para Brasil
   - price_1234567890_us_monthly → seu price_id real do Stripe para EUA
   - price_1234567890_eu_monthly → seu price_id real do Stripe para Europa

2. SUBSTITUA O STRIPE_PRODUCT_ID:
   - prod_lookfinder_pro → seu product_id real do Stripe

3. AJUSTE OS PREÇOS conforme necessário:
   - Brasil: R$ 39,90 (3990 centavos)
   - EUA: $7.90 (790 centavos)
   - Europa: €7.90 (790 centavos)

4. TESTE A DETECÇÃO DE LOCALIZAÇÃO:
   - Abra o console do navegador para ver os logs
   - Verifique se a região está sendo detectada corretamente
   - Confirme se os planos corretos estão sendo carregados

5. EXEMPLO DE FLUXO:
   - Usuário em Paris → detecta região 'EU' → carrega planos em EUR
   - Usuário em Nova York → detecta região 'US' → carrega planos em USD
   - Usuário em São Paulo → detecta região 'BR' → carrega planos em BRL
*/
