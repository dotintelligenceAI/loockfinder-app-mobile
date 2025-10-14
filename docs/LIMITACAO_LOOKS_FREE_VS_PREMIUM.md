# 🎯 Limitação de Looks - Free vs Premium

## 📊 **Como Está Configurado Atualmente**

A limitação de looks para usuários FREE é gerenciada no `services/looksService.ts`:

---

## 🔢 **Limites por Tipo de Visualização**

### **1. Looks Gerais (Todos os Looks)**
```typescript
// services/looksService.ts - linha 34
.limit(isFreeUser ? 50 : 1000)
```

| Usuário | Quantidade | Comportamento |
|---|---|---|
| **FREE** | 50 looks | Embaralhados aleatoriamente |
| **PREMIUM** | 1000 looks | Embaralhados aleatoriamente |

**Localização:** `services/looksService.ts`, linha 14-41

---

### **2. Looks por Categoria**
```typescript
// services/looksService.ts - linha 61
.limit(isFreeUser ? 5 : 1000)
```

| Usuário | Quantidade | Comportamento |
|---|---|---|
| **FREE** | 5 looks | Por categoria |
| **PREMIUM** | 1000 looks | Por categoria |

**Localização:** `services/looksService.ts`, linha 43-69

---

### **3. Looks por Subcategoria**
```typescript
// services/looksService.ts - linha 89
.limit(isFreeUser ? 5 : 1000)
```

| Usuário | Quantidade | Comportamento |
|---|---|---|
| **FREE** | 5 looks | Por subcategoria |
| **PREMIUM** | 1000 looks | Por subcategoria |

**Localização:** `services/looksService.ts`, linha 71-97

---

## 🎲 **Aleatorização (Dinâmico)**

Todos os looks são **embaralhados** para criar experiência dinâmica:

```typescript
// Linha 39, 67, 95
const shuffledData = (data || []).sort(() => Math.random() - 0.5);
```

**Isso significa:**
- ✅ A cada carregamento, ordem muda
- ✅ Usuário vê looks diferentes
- ✅ Experiência mais dinâmica
- ✅ Evita sempre ver os mesmos looks primeiro

---

## 🔍 **Como é Detectado se Usuário é FREE**

```typescript
// Verificação em todas as funções
const userPlan = await subscriptionsService.getProfileWithPlan(userId);

// Usuário é FREE se:
isFreeUser = 
  userPlan.data.plan?.slug === 'free' 
  && 
  userPlan.data.subscription_status === 'free'
```

**Critérios:**
1. ✅ `plan.slug = 'free'` (plano é free)
2. ✅ `subscription_status = 'free'` (status é free)

**Ambos precisam ser TRUE** para ser considerado usuário free.

---

## 📱 **Implementação na Home**

### **Arquivo:** `app/(tabs)/home.tsx`

```typescript
// Linha 38
const [looksLimit, setLooksLimit] = useState(100);

// Linha 50
const [isFreeUser, setIsFreeUser] = useState<boolean>(true);

// Linhas 66-76 - Verifica plano do usuário
const res = await subscriptionsService.getProfileWithPlan(user.id);
const isFree = res.data?.plan?.slug === 'free' && res.data?.subscription_status === 'free';
setIsFreeUser(isFree);

// Linha 140 - Aplica paginação
const paginated = data.slice(0, looksLimit);
```

---

## 🎯 **Fluxo Completo**

```
1. Usuário abre Home
   ↓
2. App verifica plano do usuário (linha 66-76)
   ↓
3. Define isFreeUser (true/false)
   ↓
4. Chama looksService.getLooks(userId)
   ↓
5. LooksService verifica plano novamente
   ↓
6. Aplica limite:
   - FREE: 50 looks (todos) / 5 looks (por categoria)
   - PREMIUM: 1000 looks
   ↓
7. Embaralha resultados
   ↓
8. Retorna para Home
   ↓
9. Home aplica paginação adicional (looksLimit = 100)
```

---

## 💡 **Observações Importantes**

### **1. Dupla Verificação**
O plano é verificado **2 vezes**:
- ✅ Na Home (para controlar UI)
- ✅ No LooksService (para controlar dados)

Isso garante segurança mesmo que o frontend seja manipulado.

### **2. Paginação na Home**
```typescript
// Linha 140
const paginated = data.slice(0, looksLimit);
```

Mesmo que o serviço retorne 50 looks para free, a Home ainda aplica um `looksLimit` (padrão 100).

**Impacto:**
- Para FREE: 50 looks (do serviço) → 50 looks (após paginação)
- Para PREMIUM: 1000 looks (do serviço) → 100 looks (após paginação) ⚠️

### **3. Possível Problema Identificado**

O `looksLimit` na Home está fixo em **100**, o que limita até usuários premium!

**Recomendação:** Ajustar `looksLimit` baseado no plano:

```typescript
// Sugestão de melhoria
const [looksLimit, setLooksLimit] = useState(100);

// Atualizar quando detectar plano
useEffect(() => {
  setLooksLimit(isFreeUser ? 50 : 1000);
}, [isFreeUser]);
```

---

## 📋 **Limites Atuais - Resumo**

| Contexto | FREE | PREMIUM | Onde está |
|---|---|---|---|
| Todos os looks | 50 | 1000 | `looksService.ts:34` |
| Por categoria | 5 | 1000 | `looksService.ts:61` |
| Por subcategoria | 5 | 1000 | `looksService.ts:89` |
| Paginação Home | 100 | 100 ⚠️ | `home.tsx:38` |

---

## 🔧 **Melhorias Sugeridas**

### **1. Ajustar looksLimit Dinamicamente**
```typescript
// home.tsx
useEffect(() => {
  setLooksLimit(isFreeUser ? 50 : 1000);
}, [isFreeUser]);
```

### **2. Mostrar Aviso de Limite**
```typescript
{looks.length >= 50 && isFreeUser && (
  <View style={styles.limitNotice}>
    <Text>Você viu 50 looks. Faça upgrade para ver mais!</Text>
    <TouchableOpacity onPress={() => router.push('/upgrade')}>
      <Text>Upgrade</Text>
    </TouchableOpacity>
  </View>
)}
```

### **3. Analytics de Conversão**
```typescript
// Registrar quando usuário atinge limite
if (looks.length >= 50 && isFreeUser) {
  // Log analytics: "free_user_reached_limit"
}
```

---

## ✅ **Está Funcionando Corretamente?**

**SIM**, mas com ressalvas:

- ✅ Usuários FREE veem no máximo 50 looks (geral)
- ✅ Usuários FREE veem no máximo 5 looks por categoria
- ✅ Verificação é feita no backend (seguro)
- ⚠️ `looksLimit` na Home está fixo em 100 (pode limitar premium)

---

**Quer que eu implemente alguma dessas melhorias?**
