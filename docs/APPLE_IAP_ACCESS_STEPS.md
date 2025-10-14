# 📱 Guia Rápido - Como Acessar IAP no LookFinder

## Para Apple Review Team

### 🎯 **Caminho Mais Rápido** (Recomendado)

```
1. Abrir App
   ↓
2. Clicar na aba "Perfil" (ícone de pessoa, última aba)
   ↓
3. Rolar para baixo
   ↓
4. Clicar em "Upgrade to Premium" ou "⭐ Premium"
   ↓
5. Ver 3 opções de planos com preços
   ↓
6. Clicar em qualquer plano para testar compra
```

---

## 📍 **Todos os Pontos de Acesso**

### **1. Via Perfil (Profile Tab)**
- Localização: Bottom Tab Bar → Profile (último ícone)
- Botão: "Upgrade to Premium" ou "Go Premium"
- Resultado: Abre tela com todos os planos

### **2. Via Chat IA**
- Localização: Bottom Tab Bar → Chat IA
- Ação: Tentar usar (se usuário não é premium)
- Resultado: Modal de upgrade aparece

### **3. Via Looks Ilimitados**
- Localização: Home Tab → Navegar por muitos looks
- Ação: Usuários free têm limite de visualização
- Resultado: Aviso de upgrade aparece

### **4. Via Cupons Premium**
- Localização: Cupons Tab
- Ação: Clicar em cupons marcados como "Premium"
- Resultado: Modal de upgrade aparece

---

## 🛒 **Produtos Disponíveis**

| Product ID | Tipo | Preço | Descrição |
|---|---|---|---|
| `com.lookfinder.premium.lifetime` | Non-Consumable | $9.99 | Acesso vitalício |
| `com.lookfinder.premium.semest` | Subscription | $2.99/mês | Plano mensal |
| `com.lookfinder.premium.annual` | Subscription | $19.99/ano | Plano anual |

---

## ✅ **Checklist de Verificação**

- [x] Produtos configurados no App Store Connect
- [x] Paid Apps Agreement aceito
- [x] Sandbox testado e funcionando
- [x] Restore Purchases implementado
- [x] Product IDs corretos no código
- [x] Subscription Group configurado
- [x] Produtos em "Ready to Submit"

---

## 🧪 **Para Testar em Sandbox**

1. **Sair da Apple ID normal**
2. **Abrir o app** (não fazer login com sandbox ainda)
3. **Navegar até upgrade screen**
4. **Clicar em um plano**
5. **Fazer login com conta sandbox quando solicitado**
6. **Completar compra** (sem cobrança real)

---

## 📞 **Informações de Contato**

Se houver alguma dificuldade em localizar ou testar os IAPs:

- **Email:** [seu email de contato]
- **Disponível para:** Call/Meeting durante horário comercial
- **Resposta:** Dentro de 24 horas

---

## 🔍 **Detalhes Técnicos**

### **Biblioteca Usada**
- react-native-iap v14.4.6

### **Inicialização**
- IAP é inicializado automaticamente ao abrir o app
- Produtos são carregados ao acessar upgrade screen

### **Validação**
- Receipts são validados no servidor
- Status de assinatura é atualizado em tempo real

### **Restore**
- Botão "Restore Purchases" disponível na upgrade screen
- Sincronização automática ao abrir o app

---

## 📸 **Screenshots de Referência**

### **Tela de Upgrade:**
- Hero section com "Unlock LookFinder Premium"
- 3 cards de planos lado a lado
- Preços em USD
- Features listadas com checkmarks
- Botão "Restore Purchases" no rodapé

### **Modal de Upgrade (quando acessa feature premium):**
- Overlay escurecido
- Modal centralizado
- Descrição do recurso bloqueado
- Botão "See Plans" / "Upgrade"
- Botão "Cancel" ou "X" para fechar

---

## 🌐 **Regiões e Preços**

Os produtos estão configurados para todas as regiões da App Store com conversão automática de preços.

**Preços Base (USD):**
- Lifetime: $9.99
- Monthly: $2.99
- Annual: $19.99

---

## 📝 **Notas Importantes**

1. **Ambiente Sandbox:** Todos os produtos funcionam corretamente em sandbox
2. **Mock Fallback:** Em desenvolvimento (Expo Go), mostra produtos mock para visualização
3. **Build Nativo:** Em builds nativos (TestFlight/Production), usa IAP real
4. **Subscription Group:** Todos os produtos fazem parte do mesmo grupo "LookFinder Premium"

---
