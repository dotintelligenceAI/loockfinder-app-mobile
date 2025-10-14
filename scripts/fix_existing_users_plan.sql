-- 🔧 Corrigir usuários existentes sem plano definido
-- Este script atualiza todos os perfis que têm current_plan_id NULL
-- para usar o plano FREE

-- Atualizar perfis sem plano definido
UPDATE profiles
SET 
  current_plan_id = 'a08937af-188f-4c46-af71-5d9688e00b76', -- ID do plano "Finder Free"
  subscription_status = 'free',
  user_type = COALESCE(user_type, 'standard'),
  is_trial = COALESCE(is_trial, false),
  updated_at = NOW()
WHERE current_plan_id IS NULL
  AND subscription_status = 'free';

-- Verificar quantos registros foram atualizados
SELECT 
  COUNT(*) as usuarios_corrigidos
FROM profiles
WHERE current_plan_id = 'a08937af-188f-4c46-af71-5d9688e00b76'
  AND subscription_status = 'free';

-- Ver resumo dos planos
SELECT 
  sp.name as plano,
  sp.slug,
  COUNT(p.id) as quantidade_usuarios,
  COUNT(CASE WHEN p.subscription_status = 'free' THEN 1 END) as free,
  COUNT(CASE WHEN p.subscription_status = 'active' THEN 1 END) as active
FROM profiles p
LEFT JOIN subscription_plans sp ON p.current_plan_id = sp.id
GROUP BY sp.name, sp.slug
ORDER BY quantidade_usuarios DESC;

