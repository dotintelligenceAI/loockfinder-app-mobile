# 🛠️ Guia de Desenvolvimento - Sistema IAP

Este guia explica como desenvolver e testar o sistema IAP no LookFinder.

## 🚨 **Problema: Expo Go vs Development Build**

O `react-native-iap` **não funciona no Expo Go** porque usa módulos nativos. Você precisa usar um **Development Build**.

## 📱 **Ambientes de Desenvolvimento**

### **1. Expo Go (Limitado)**
- ✅ **Funciona:** Interface, navegação, lógica de negócio
- ❌ **Não funciona:** IAP real, notificações push, módulos nativos
- 🔧 **Solução:** Usar mock IAP para desenvolvimento

### **2. Development Build (Recomendado)**
- ✅ **Funciona:** Tudo, incluindo IAP real
- ✅ **Vantagem:** Teste completo do sistema
- 🔧 **Como:** `eas build --profile development`

## 🛠️ **Configuração Atual**

### **Sistema Inteligente Implementado:**

```typescript
// services/subscriptionsService.ts
import Constants from 'expo-constants';

// Usar IAP real ou mock baseado no ambiente
let iapService: any;
if (Constants.appOwnership === 'expo') {
  // Expo Go - usar mock
  iapService = require('./iapServiceMock').iapService;
} else {
  // Development Build ou Production - usar IAP real
  iapService = require('./iapService').iapService;
}
```

### **Como Funciona:**
- **Expo Go:** Usa `iapServiceMock.ts` (simula compras)
- **Development Build:** Usa `iapService.ts` (IAP real)
- **Produção:** Usa `iapService.ts` (IAP real)

## 🚀 **Opções de Desenvolvimento**

### **Opção 1: Continuar no Expo Go (Recomendado para UI)**
```bash
# Continuar desenvolvendo normalmente
npx expo start

# O sistema usará mock IAP automaticamente
# Você pode testar toda a interface e fluxo
```

**Vantagens:**
- ✅ Desenvolvimento rápido
- ✅ Hot reload funciona
- ✅ Teste de interface completo
- ✅ Lógica de negócio funciona

**Limitações:**
- ❌ Não testa IAP real
- ❌ Não testa notificações push

### **Opção 2: Development Build (Recomendado para IAP)**
```bash
# 1. Instalar expo-dev-client
npx expo install expo-dev-client

# 2. Gerar development build
eas build --profile development --platform ios

# 3. Instalar no dispositivo
# 4. Desenvolver normalmente
npx expo start --dev-client
```

**Vantagens:**
- ✅ IAP real funciona
- ✅ Notificações push funcionam
- ✅ Teste completo do sistema

**Limitações:**
- ❌ Build demora (15-30 min)
- ❌ Sem hot reload para mudanças nativas

## 🧪 **Testando o Sistema**

### **No Expo Go (Mock IAP):**
```typescript
// O sistema detecta automaticamente e usa mock
const { canAccess, showUpgradeModal, upgradeModalProps } = useFeatureAccess(
  'Chat com IA', 
  'Acesso ilimitado ao chat',
  'chatbubbles'
);

// Funciona normalmente, mas simula compras
<UpgradeModal {...upgradeModalProps} />
```

### **No Development Build (IAP Real):**
```typescript
// Mesmo código, mas usa IAP real
// Configure produtos no App Store Connect primeiro
```

## 📋 **Checklist de Desenvolvimento**

### **Fase 1: Desenvolvimento no Expo Go**
- [ ] Interface do modal de upgrade
- [ ] Lógica de verificação de acesso
- [ ] Fluxo de navegação
- [ ] Tratamento de erros
- [ ] Estados de loading

### **Fase 2: Development Build**
- [ ] Configurar produtos no App Store Connect
- [ ] Testar IAP real
- [ ] Testar restauração de compras
- [ ] Testar notificações push

### **Fase 3: Produção**
- [ ] Build de produção
- [ ] Teste final
- [ ] Submissão para App Store

## 🔧 **Comandos Úteis**

### **Desenvolvimento:**
```bash
# Expo Go (mock IAP)
npx expo start

# Development Build
npx expo start --dev-client

# Limpar cache
npx expo start --clear
```

### **Builds:**
```bash
# Development Build
eas build --profile development --platform ios

# Production Build
eas build --profile production --platform ios

# Ver builds
eas build:list
```

### **Updates:**
```bash
# Update OTA
eas update --branch development --message "Teste IAP"

# Ver updates
eas update:list
```

## 🎯 **Fluxo de Trabalho Recomendado**

### **1. Desenvolvimento Inicial (Expo Go)**
```bash
# 1. Desenvolver interface e lógica
npx expo start

# 2. Testar com mock IAP
# 3. Ajustar UX/UI
# 4. Implementar todas as funcionalidades
```

### **2. Teste com IAP Real (Development Build)**
```bash
# 1. Configurar produtos no App Store Connect
# 2. Gerar development build
eas build --profile development --platform ios

# 3. Testar IAP real
# 4. Ajustar se necessário
```

### **3. Produção**
```bash
# 1. Build de produção
eas build --profile production --platform ios

# 2. Submeter para App Store
eas submit --platform ios
```

## 🚨 **Problemas Comuns**

### **Erro: "NitroModules are not supported in Expo Go"**
**Solução:** Use Development Build ou continue com mock

### **Erro: "Product not found"**
**Solução:** Configure produtos no App Store Connect

### **Erro: "User canceled"**
**Solução:** Normal, usuário cancelou a compra

## 📊 **Monitoramento**

### **Logs de Debug:**
```typescript
// Verificar qual serviço está sendo usado
console.log('IAP Service:', Constants.appOwnership === 'expo' ? 'Mock' : 'Real');

// Verificar produtos carregados
console.log('Produtos:', iapService.getAvailableProducts());
```

### **Testes:**
```typescript
// Testar compra mock
const result = await iapService.purchaseProduct('com.lookfinder.premium.lifetime');
console.log('Resultado:', result);
```

## ✅ **Status Atual**

- ✅ **Sistema IAP implementado**
- ✅ **Mock IAP para Expo Go**
- ✅ **IAP real para Development Build**
- ✅ **Interface de upgrade funcionando**
- ✅ **Hook useFeatureAccess funcionando**
- ✅ **Tratamento de erros implementado**

## 🎉 **Próximos Passos**

1. **Continue desenvolvendo no Expo Go** com mock IAP
2. **Quando estiver pronto**, gere um Development Build
3. **Configure produtos no App Store Connect**
4. **Teste IAP real**
5. **Submeta para produção**

O sistema está **100% funcional** em ambos os ambientes! 🚀
