# 🛍️ Configuração de In-App Purchases no App Store Connect

Este guia explica como configurar os produtos IAP no App Store Connect para o LookFinder.

## 📋 Pré-requisitos

- [ ] App aprovado no App Store Connect
- [ ] Conta de desenvolvedor ativa
- [ ] Acesso ao App Store Connect

## 🎯 Produtos IAP Necessários

### 1. **Produto Não Consumível (Lifetime)**
- **Product ID**: `com.lookfinder.premium.lifetime`
- **Tipo**: Non-Consumable
- **Descrição**: Acesso premium vitalício ao LookFinder
- **Preço**: Definir conforme região

### 2. **Assinatura Mensal**
- **Product ID**: `com.lookfinder.premium.monthly`
- **Tipo**: Auto-Renewable Subscription
- **Duração**: 1 mês
- **Preço**: Definir conforme região

### 3. **Assinatura Anual**
- **Product ID**: `com.lookfinder.premium.annual`
- **Tipo**: Auto-Renewable Subscription
- **Duração**: 1 ano
- **Preço**: Definir conforme região

## 🛠️ Passo a Passo no App Store Connect

### **1. Acessar In-App Purchases**

1. Faça login no [App Store Connect](https://appstoreconnect.apple.com)
2. Selecione seu app "LookFinder"
3. Vá para **"Features"** > **"In-App Purchases"**
4. Clique em **"Create"** > **"In-App Purchase"**

### **2. Criar Produto Lifetime**

1. **Tipo**: Selecione **"Non-Consumable"**
2. **Reference Name**: `LookFinder Premium Lifetime`
3. **Product ID**: `com.lookfinder.premium.lifetime`
4. **Description**: `Acesso premium vitalício com todos os recursos do LookFinder`
5. **Price**: Definir preço por região
6. **Availability**: Marcar como disponível
7. Clique **"Create"**

### **3. Criar Assinatura Mensal**

1. **Tipo**: Selecione **"Auto-Renewable Subscription"**
2. **Reference Name**: `LookFinder Premium Monthly`
3. **Product ID**: `com.lookfinder.premium.monthly`
4. **Subscription Group**: Criar grupo "LookFinder Premium"
5. **Duration**: 1 Month
6. **Price**: Definir preço por região
7. **Review Information**: Adicionar descrição detalhada
8. Clique **"Create"**

### **4. Criar Assinatura Anual**

1. **Tipo**: Selecione **"Auto-Renewable Subscription"**
2. **Reference Name**: `LookFinder Premium Annual`
3. **Product ID**: `com.lookfinder.premium.annual`
4. **Subscription Group**: Usar o mesmo grupo "LookFinder Premium"
5. **Duration**: 1 Year
6. **Price**: Definir preço por região
7. **Review Information**: Adicionar descrição detalhada
8. Clique **"Create"**

## 📝 Informações de Revisão

### **Para Produtos Não Consumíveis:**
```
Título: LookFinder Premium Lifetime
Descrição: Desbloqueie todos os recursos premium do LookFinder para sempre. Inclui:
- Chat com IA ilimitado
- Looks personalizados ilimitados
- Cupons exclusivos
- Links de compra premium
- Suporte prioritário

Preço: [Preço por região]
```

### **Para Assinaturas:**
```
Título: LookFinder Premium [Mensal/Anual]
Descrição: Acesso completo aos recursos premium do LookFinder:
- Chat com IA ilimitado
- Looks personalizados ilimitados
- Cupons exclusivos
- Links de compra premium
- Suporte prioritário

Renovação: [Automática mensal/anual]
Cancelamento: A qualquer momento nas configurações do dispositivo
```

## 🌍 Configuração de Preços por Região

### **Brasil (BR)**
- Lifetime: R$ 49,90
- Mensal: R$ 9,90
- Anual: R$ 89,90

### **Estados Unidos (US)**
- Lifetime: $9.99
- Mensal: $2.99
- Anual: $19.99

### **Europa (EU)**
- Lifetime: €8.99
- Mensal: €2.49
- Anual: €17.99

## 🔧 Configurações Técnicas

### **Subscription Groups**
- **Nome**: LookFinder Premium
- **Reference Name**: LookFinder Premium Subscriptions
- **Level**: 1 (único nível)

### **App Store Review Information**
```
Review Notes: 
Este app oferece funcionalidades premium através de compras in-app:
- Lifetime: Acesso vitalício
- Mensal: Assinatura renovável mensal
- Anual: Assinatura renovável anual

Todos os produtos são opcionais e o app funciona sem eles.
```

## 📱 Testando IAP

### **1. Sandbox Testing**
1. Criar conta de teste no App Store Connect
2. Configurar dispositivo com conta de teste
3. Testar compras em ambiente sandbox

### **2. TestFlight**
1. Adicionar testadores internos
2. Testar fluxo completo de compra
3. Verificar restauração de compras

## 🚨 Políticas da Apple

### **Obrigatório:**
- [ ] Descrição clara dos benefícios
- [ ] Preços visíveis antes da compra
- [ ] Opção de cancelar assinaturas
- [ ] Restaurar compras funcionando
- [ ] Não forçar compras para funcionalidades básicas

### **Proibido:**
- ❌ Compras obrigatórias para funcionalidades básicas
- ❌ Preços ocultos ou enganosos
- ❌ Dificultar cancelamento de assinaturas
- ❌ Compras para conteúdo que deveria ser gratuito

## 🔄 Sincronização com App

### **1. Verificar Product IDs**
```typescript
// services/iapService.ts
private readonly PRODUCT_IDS = {
  PREMIUM_LIFETIME: 'com.lookfinder.premium.lifetime',
  PREMIUM_MONTHLY: 'com.lookfinder.premium.monthly',
  PREMIUM_ANNUAL: 'com.lookfinder.premium.annual',
};
```

### **2. Testar Mapeamento**
```typescript
// Verificar se os Product IDs estão corretos
const mappings = {
  'lifetime': 'com.lookfinder.premium.lifetime',
  'monthly': 'com.lookfinder.premium.monthly',
  'annual': 'com.lookfinder.premium.annual',
};
```

## 📊 Monitoramento

### **Métricas Importantes:**
- Taxa de conversão por produto
- Receita por região
- Cancelamentos de assinatura
- Restaurações de compra

### **App Store Connect Analytics:**
- Vá para **"Analytics"** > **"In-App Purchases"**
- Monitore vendas e conversões
- Ajuste preços conforme necessário

## 🆘 Resolução de Problemas

### **Produtos não aparecem no app:**
1. Verificar se estão aprovados
2. Verificar Product IDs
3. Testar em ambiente sandbox
4. Verificar logs do app

### **Compras não processam:**
1. Verificar conexão com App Store
2. Verificar configuração do IAP
3. Testar com conta sandbox
4. Verificar logs de erro

### **Restauração não funciona:**
1. Verificar implementação de restore
2. Testar com compras reais
3. Verificar status das compras
4. Verificar logs de transação

## 📞 Suporte

- **Apple Developer Support**: [developer.apple.com/support](https://developer.apple.com/support)
- **App Store Connect Help**: [help.apple.com/app-store-connect](https://help.apple.com/app-store-connect)
- **IAP Documentation**: [developer.apple.com/in-app-purchase](https://developer.apple.com/in-app-purchase)

---

**✅ Checklist Final:**
- [ ] Todos os produtos criados
- [ ] Preços configurados por região
- [ ] Informações de revisão preenchidas
- [ ] Testado em sandbox
- [ ] Testado no TestFlight
- [ ] App atualizado com IAP
- [ ] Restauração funcionando
- [ ] Pronto para submissão
