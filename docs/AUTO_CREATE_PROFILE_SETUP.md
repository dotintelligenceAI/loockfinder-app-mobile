# 🆕 Configuração de Criação Automática de Perfil

## 📋 **Objetivo**

Criar automaticamente um registro na tabela `profiles` com plano **FREE** quando um novo usuário se cadastra no app.

---

## 🔧 **Como Funciona**

### **Fluxo Automático:**

```
1. Usuário cria conta no app
   ↓
2. Registro é criado em auth.users (Supabase Auth)
   ↓
3. TRIGGER é disparado automaticamente
   ↓
4. Função handle_new_user() é executada
   ↓
5. Registro é criado em profiles com:
   - subscription_status = 'free'
   - current_plan_id = ID do plano free
   - subscription_expires_at = NULL (nunca expira)
```

---

## 🚀 **Instalação**

### **Passo 1: Executar SQL no Supabase**

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Clique em **New Query**
5. Cole o conteúdo de `scripts/auto_create_profile_on_signup.sql`
6. Clique em **Run** (ou pressione Ctrl+Enter)

### **Passo 2: Verificar se o Plano Free Existe**

Execute este SQL para verificar:

```sql
SELECT * FROM subscription_plans WHERE slug = 'free';
```

**Se não existir**, execute:

```sql
INSERT INTO subscription_plans (
  name,
  slug,
  price_brl,
  price_usd,
  billing_period,
  features,
  is_active
) VALUES (
  'Finder Free',
  'free',
  0.00,
  0.00,
  'lifetime',
  '{"max_looks": 50, "max_favorites": 10, "chat_ai": false}',
  true
)
ON CONFLICT (slug) DO NOTHING;
```

### **Passo 3: Verificar Estrutura da Tabela Profiles**

Execute para verificar as colunas:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';
```

**Se faltar alguma coluna**, adicione:

```sql
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS current_plan_id UUID REFERENCES subscription_plans(id),
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_current_plan_id ON profiles(current_plan_id);
CREATE INDEX IF NOT EXISTS idx_profiles_expires_at ON profiles(subscription_expires_at);
```

---

## ✅ **Testar**

### **1. Criar um Novo Usuário**

No app, faça signup com um novo email:

```typescript
// O app já faz isso automaticamente
await supabase.auth.signUp({
  email: 'teste@example.com',
  password: 'senha123'
});
```

### **2. Verificar se Perfil foi Criado**

No Supabase SQL Editor:

```sql
SELECT 
  p.id,
  p.email,
  p.name,
  p.subscription_status,
  sp.name as plan_name,
  p.created_at
FROM profiles p
LEFT JOIN subscription_plans sp ON p.current_plan_id = sp.id
WHERE p.email = 'teste@example.com';
```

**Resultado Esperado:**
```
id: [UUID do usuário]
email: teste@example.com
name: teste@example.com
subscription_status: free
plan_name: Finder Free
created_at: [timestamp]
```

### **3. Verificar no App**

No app, após login, o usuário deve ver:
- Plano: "Finder Free"
- Status: Acesso limitado a recursos free
- Botão "Upgrade" visível

---

## 🔍 **Troubleshooting**

### **Problema 1: Trigger não está funcionando**

**Verificar se trigger existe:**
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

**Recriar trigger:**
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### **Problema 2: Plano free não existe**

**Erro:** `foreign key violation`

**Solução:** Criar o plano free primeiro (ver Passo 2 acima)

### **Problema 3: Perfil duplicado**

**Erro:** `duplicate key value violates unique constraint`

**Solução:** Adicionar `ON CONFLICT DO NOTHING` na função:

```sql
INSERT INTO public.profiles (...)
VALUES (...)
ON CONFLICT (id) DO NOTHING;
```

### **Problema 4: Coluna não existe**

**Erro:** `column "subscription_status" does not exist`

**Solução:** Adicionar colunas faltantes (ver Passo 3 acima)

---

## 📊 **Estrutura Completa da Tabela Profiles**

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  phone VARCHAR(20),
  location VARCHAR(255),
  instagram VARCHAR(255),
  
  -- Campos de assinatura
  subscription_status VARCHAR(20) DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'canceled', 'expired')),
  current_plan_id UUID REFERENCES subscription_plans(id),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

---

## 🎯 **Status dos Planos**

| Status | Descrição | Quando |
|--------|-----------|--------|
| `free` | Plano gratuito | Signup automático |
| `active` | Assinatura ativa | Após compra IAP |
| `canceled` | Assinatura cancelada | Usuário cancela |
| `expired` | Assinatura expirada | Após vencimento |

---

## 📝 **Logs e Monitoramento**

### **Ver Logs do Trigger:**

No Supabase:
1. Vá para **Database** → **Logs**
2. Filtre por `postgres`
3. Procure por erros relacionados a `handle_new_user`

### **Contar Perfis Criados Hoje:**

```sql
SELECT COUNT(*) as novos_usuarios
FROM profiles
WHERE created_at::date = CURRENT_DATE;
```

### **Ver Últimos 10 Perfis Criados:**

```sql
SELECT 
  p.email,
  p.subscription_status,
  sp.name as plan_name,
  p.created_at
FROM profiles p
LEFT JOIN subscription_plans sp ON p.current_plan_id = sp.id
ORDER BY p.created_at DESC
LIMIT 10;
```

---

## ✅ **Checklist de Implementação**

- [ ] SQL do trigger executado com sucesso
- [ ] Plano "free" existe na tabela subscription_plans
- [ ] Colunas necessárias existem em profiles
- [ ] Trigger aparece em information_schema.triggers
- [ ] Testado com novo signup
- [ ] Perfil criado automaticamente
- [ ] Status é "free"
- [ ] App mostra plano corretamente

---

## 🔄 **Migração de Usuários Existentes**

Se você já tem usuários sem perfil, execute:

```sql
-- Criar perfis para usuários que ainda não têm
INSERT INTO profiles (
  id,
  email,
  name,
  subscription_status,
  current_plan_id,
  created_at,
  updated_at
)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  'free',
  (SELECT id FROM subscription_plans WHERE slug = 'free' LIMIT 1),
  u.created_at,
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;
```

---

**✅ Pronto! Agora todo novo usuário terá um perfil FREE criado automaticamente!**
