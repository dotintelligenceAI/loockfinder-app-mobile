# 🎨 Botão de Upgrade/Ver Planos no Perfil

## 📋 **Implementação**

Adicionado botão destacado na tela de perfil que muda de acordo com o status do usuário.

---

## 🎯 **Comportamento**

### **Usuário FREE (planName === 'Finder Free')**

```
┌───────────────────────────────────────────┐
│  ⭐ Fazer Upgrade para Premium  →         │
│  [Gradiente vermelho/laranja chamativo]   │
└───────────────────────────────────────────┘
```

**Características:**
- ✨ Gradiente chamativo (vermelho → laranja)
- ⭐ Ícone de estrela
- → Seta indicando ação
- 🔔 Sombra com glow effect
- 📍 Posicionado logo após as estatísticas

**Ação:** Redireciona para `/upgrade`

---

### **Usuário PREMIUM (planName !== 'Finder Free')**

```
┌───────────────────────────────────────────┐
│  ✓ Ver Planos Disponíveis  →              │
│  [Borda verde, fundo claro]                │
└───────────────────────────────────────────┘
```

**Características:**
- ✓ Ícone de checkmark verde
- 🎨 Borda verde (cor de sucesso)
- → Seta indicando ação
- 📍 Mesmo posicionamento

**Ação:** Redireciona para `/upgrade` (para ver outros planos)

---

## 📱 **Layout Completo da Tela**

```
┌─────────────────────────────────────┐
│  [Avatar]                           │
│  Nome do Usuário                    │
│  📌 Plano Atual Badge               │
│  Bio do usuário                     │
│                                     │
│  ┌─────────────────┐                │
│  │ 📊 Favoritos    │                │
│  │     15          │                │
│  └─────────────────┘                │
│                                     │
│  ┌───────────────────────────┐     │ ← NOVO!
│  │ ⭐ Fazer Upgrade Premium →│     │
│  └───────────────────────────┘     │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │ ✏️ Editar│  │ 🚪 Sair  │        │
│  └──────────┘  └──────────┘        │
│                                     │
│  👤 Desativar conta                 │
│                                     │
│  ─────────────────────────          │
│  ❤️ Favoritos (15)                  │
│                                     │
│  [Grid de Looks]                    │
└─────────────────────────────────────┘
```

---

## 🎨 **Estilos Aplicados**

### **Botão de Upgrade (FREE)**
```typescript
{
  width: '100%',
  marginBottom: 20,
  borderRadius: 16,
  overflow: 'hidden',
  elevation: 4,
  shadowColor: '#FF6B6B',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
}

// Gradiente
colors: ['#FF6B6B', '#FF8E53']
```

### **Botão Ver Planos (PREMIUM)**
```typescript
{
  width: '100%',
  marginBottom: 20,
  borderRadius: 16,
  backgroundColor: '#F8F9FA',
  borderWidth: 2,
  borderColor: '#4CAF50',
  overflow: 'hidden',
}
```

---

## 🔄 **Fluxo de Navegação**

```
Perfil → Clicar no Botão → /upgrade → Ver Planos
```

### **Para Usuário FREE:**
```
1. Usuário vê botão chamativo "Fazer Upgrade"
   ↓
2. Clica no botão
   ↓
3. Redireciona para /upgrade
   ↓
4. Vê 3 planos disponíveis:
   - Finder mensal ($2.99/mês)
   - Finder semestral ($14.99/6 meses)
   - Finder Anual ($19.99/ano)
   ↓
5. Seleciona plano e completa compra
```

### **Para Usuário PREMIUM:**
```
1. Usuário vê botão "Ver Planos Disponíveis"
   ↓
2. Clica no botão
   ↓
3. Redireciona para /upgrade
   ↓
4. Vê planos disponíveis e seu plano atual
   ↓
5. Pode fazer upgrade/downgrade ou ver detalhes
```

---

## 🎯 **Posicionamento**

O botão está posicionado **entre as estatísticas e os botões de ação**, pois:

1. ✅ **Visibilidade alta** - Usuário vê logo ao abrir o perfil
2. ✅ **Não invasivo** - Não atrapalha outras ações
3. ✅ **Lógica** - Está relacionado ao plano mostrado acima
4. ✅ **Acima do fold** - Aparece sem precisar rolar a tela

---

## 📊 **Estados do Botão**

| Status do Usuário | Texto do Botão | Cor | Ícone |
|---|---|---|---|
| FREE | "Fazer Upgrade para Premium" | Gradiente Vermelho/Laranja | ⭐ |
| PREMIUM (Mensal) | "Ver Planos Disponíveis" | Verde | ✓ |
| PREMIUM (Semestral) | "Ver Planos Disponíveis" | Verde | ✓ |
| PREMIUM (Anual) | "Ver Planos Disponíveis" | Verde | ✓ |

---

## 🔍 **Código Implementado**

### **Renderização Condicional:**
```typescript
{planName === 'Finder Free' ? (
  // Botão de Upgrade (Usuário Free)
  <TouchableOpacity 
    style={styles.upgradePlanButton}
    onPress={() => router.push('/upgrade')}
  >
    <LinearGradient
      colors={['#FF6B6B', '#FF8E53']}
      style={styles.upgradePlanGradient}
    >
      <Ionicons name="star" size={20} color="#FFFFFF" />
      <Text style={styles.upgradePlanText}>
        Fazer Upgrade para Premium
      </Text>
      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
    </LinearGradient>
  </TouchableOpacity>
) : (
  // Botão Ver Planos (Usuário Premium)
  <TouchableOpacity 
    style={styles.viewPlansButton}
    onPress={() => router.push('/upgrade')}
  >
    <View style={styles.viewPlansContent}>
      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
      <Text style={styles.viewPlansText}>
        Ver Planos Disponíveis
      </Text>
      <Ionicons name="arrow-forward" size={18} color="#666666" />
    </View>
  </TouchableOpacity>
)}
```

---

## ✅ **Benefícios**

1. **Conversão Aumentada** 📈
   - Botão chamativo aumenta conversão de free → premium
   - Sempre visível ao abrir o perfil

2. **UX Melhorada** 🎨
   - Caminho claro para upgrade
   - Feedback visual do status (free vs premium)

3. **Consistência** 🔄
   - Mesma navegação para todos os usuários
   - Comportamento previsível

4. **Acessibilidade** ♿
   - Botão grande e fácil de clicar
   - Texto claro e objetivo

---

## 🧪 **Testar**

1. **Como usuário FREE:**
   - Criar nova conta
   - Ir para perfil
   - Verificar botão vermelho/laranja
   - Clicar e confirmar redirecionamento

2. **Como usuário PREMIUM:**
   - Fazer upgrade para premium
   - Ir para perfil
   - Verificar botão verde
   - Clicar e confirmar redirecionamento

---

## 📝 **Notas**

- O botão também permanece no modal de edição de perfil
- Ambos os caminhos levam para `/upgrade`
- A lógica de detecção é baseada em `planName === 'Finder Free'`
- Funciona tanto para usuários existentes quanto novos

---

**✅ Implementação completa e pronta para uso!**
