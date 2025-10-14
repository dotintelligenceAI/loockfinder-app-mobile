# 📱 In-App Purchases por Plataforma

## 🎯 **Como Funciona**

O app carrega os produtos corretos automaticamente dependendo da plataforma:

---

## 🍎 **iOS (Apple)**

### **O que aparece:**
```
✅ Produtos da Apple App Store (IAP)
✅ Preços em USD (ou moeda local da App Store)
✅ Cobrados via Apple
✅ 3 produtos configurados:
   - com.lookfinder.premium.monthly
   - com.lookfinder.premium.semest
   - com.lookfinder.premium.annual
```

### **Como funciona:**
1. App detecta `Platform.OS === 'ios'`
2. Carrega `services/iapService.ts` (Apple IAP)
3. Conecta com App Store Connect
4. Busca os 3 produtos configurados
5. Mostra preços reais da Apple
6. Compra é processada via Apple

### **Biblioteca usada:**
- `react-native-iap` v14.4.6
- Conecta diretamente com StoreKit (Apple)

---

## 🤖 **Android (Google Play)**

### **O que aparece:**
```
✅ Produtos do Google Play Store (IAP)
✅ Preços em USD/BRL (ou moeda local)
✅ Cobrados via Google Play
✅ Mesmos 3 produtos (IDs diferentes para Google)
```

### **Como funciona:**
1. App detecta `Platform.OS === 'android'`
2. Carrega `services/iapService.ts` (Google Play Billing)
3. Conecta com Google Play Console
4. Busca produtos configurados
5. Mostra preços reais do Google Play
6. Compra é processada via Google

### **Biblioteca usada:**
- `react-native-iap` v14.4.6
- Conecta com Google Play Billing API

### **⚠️ Nota sobre Stripe no Android:**
Atualmente está configurado para usar **Google Play IAP**. Se quiser usar Stripe no futuro, precisa criar um serviço separado.

---

## 💻 **Web / Desenvolvimento**

### **O que aparece:**
```
🔄 Produtos MOCK (para preview)
🔄 Preços fictícios
✅ Permite testar UI sem Apple/Google
```

### **Como funciona:**
1. App detecta `Platform.OS === 'web'` ou `Expo Go`
2. Carrega `services/iapServiceMock.ts`
3. Mostra produtos fake
4. Permite testar interface

---

## 📊 **Comparação**

| Plataforma | Serviço | Produtos | Preços | Teste |
|---|---|---|---|---|
| **iOS** | Apple IAP | 3 reais | Apple Store | Sandbox |
| **Android** | Google Play | 3 reais | Play Store | Sandbox |
| **Web/Dev** | Mock | 3 fake | Fixos | Sempre |

---

## 🔧 **Configuração por Plataforma**

### **iOS (Apple)**

**Onde configurar:**
1. App Store Connect
2. In-App Purchases
3. Criar produtos:
   - `com.lookfinder.premium.monthly`
   - `com.lookfinder.premium.semest`
   - `com.lookfinder.premium.annual`

**Status:** ✅ Configurado

---

### **Android (Google Play)**

**Onde configurar:**
1. Google Play Console
2. In-app products
3. Criar produtos (mesmos nomes):
   - `com.lookfinder.premium.monthly`
   - `com.lookfinder.premium.semest`
   - `com.lookfinder.premium.annual`

**Status:** ⏳ Pendente configuração

---

## 💳 **Alternativa: Stripe no Android**

Se quiser usar **Stripe no Android** em vez de Google Play:

### **Vantagens:**
- ✅ Sem taxa de 30% do Google (só 2.9% + $0.30 do Stripe)
- ✅ Controle total sobre preços
- ✅ Checkout customizado

### **Desvantagens:**
- ❌ Precisa criar fluxo de pagamento web
- ❌ Mais complexo de implementar
- ❌ Google pode rejeitar (viola políticas)

### **Como implementar:**

```typescript
// Criar novo serviço: services/stripeService.ts
export class StripeService {
  async createCheckout(planId: string) {
    // 1. Criar checkout session no Stripe
    // 2. Redirecionar para Stripe Checkout
    // 3. Receber webhook de confirmação
    // 4. Ativar assinatura no banco
  }
}

// Em upgrade.tsx, adicionar lógica:
if (Platform.OS === 'android') {
  // Usar Stripe em vez de Google Play
  const stripeService = require('../services/stripeService');
  // ...
}
```

**⚠️ Atenção:** Google geralmente exige usar Google Play Billing para assinaturas digitais.

---

## 🧪 **Testando**

### **iOS (Sandbox):**
```bash
1. Criar conta sandbox no App Store Connect
2. Fazer logout da Apple ID no dispositivo
3. Fazer build do app
4. Tentar compra
5. Usar conta sandbox quando solicitado
```

### **Android (Sandbox):**
```bash
1. Adicionar conta de teste no Google Play Console
2. Fazer build do app
3. Instalar via Internal Testing
4. Tentar compra
5. Usar conta de teste do Google
```

### **Web/Dev:**
```bash
1. npm run web
2. Produtos mock aparecem automaticamente
3. Pode clicar mas não processa compra real
```

---

## 📝 **Logs de Debug**

O app mostra logs diferentes por plataforma:

### **iOS:**
```
🍎 Carregando produtos da Apple App Store...
✅ Produtos Apple carregados: 3
```

### **Android:**
```
🤖 Carregando produtos do Google Play Store...
✅ Produtos Google Play carregados: 3
```

### **Dev:**
```
🔄 [DEV] Usando IAP Mock para desenvolvimento...
✅ Produtos Mock carregados: 3
```

---

## ✅ **Resumo**

### **Estado Atual:**

| Plataforma | Status | Produtos |
|---|---|---|
| **iOS** | ✅ Configurado | Apple IAP (3 produtos) |
| **Android** | ⏳ Pendente | Google Play (precisa configurar) |
| **Dev** | ✅ Funcionando | Mock (3 produtos fake) |

### **Próximos Passos:**

1. **Para Android:**
   - [ ] Configurar produtos no Google Play Console
   - [ ] Usar mesmos Product IDs
   - [ ] Testar em Internal Testing

2. **Para iOS:**
   - [x] Produtos configurados
   - [x] Código implementado
   - [x] Pronto para Apple Review

---

## 🔍 **Como Verificar Qual Está Sendo Usado**

No console do app, procure pelos logs:

```typescript
// iOS
console.log('🍎 Carregando produtos da Apple App Store...');

// Android
console.log('🤖 Carregando produtos do Google Play Store...');

// Dev
console.log('🔄 [DEV] Usando IAP Mock para desenvolvimento...');
```

---

## 📞 **Suporte**

Se os produtos não aparecerem:

1. **Verificar logs** no console
2. **Confirmar plataforma** (iOS/Android/Web)
3. **Verificar configuração** na store correspondente
4. **Testar em sandbox** primeiro
5. **Verificar status** dos produtos (devem estar ativos)

---

**✅ Sistema configurado para usar a loja correta automaticamente!**
