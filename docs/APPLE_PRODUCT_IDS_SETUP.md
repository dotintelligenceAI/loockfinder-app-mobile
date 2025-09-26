# 🍎 Configuração de Product IDs na Apple

## 📋 **Product IDs Configurados**

### **1. Produtos Não-Consumíveis (One-Time)**
```
com.lookfinder.premium.lifetime
```
- **Tipo**: Non-Consumable
- **Preço**: $9.99
- **Descrição**: Acesso vitalício a todos os recursos premium

### **2. Assinaturas Auto-Renováveis**
```
com.lookfinder.premium.semest
```
- **Tipo**: Auto-Renewable Subscription
- **Preço**: $2.99/mês
- **Descrição**: Assinatura mensal com todos os recursos premium

```
com.lookfinder.premium.annual
```
- **Tipo**: Auto-Renewable Subscription
- **Preço**: $19.99/ano
- **Descrição**: Assinatura anual com todos os recursos premium

## 🔧 **Como Configurar no App Store Connect**

### **Passo 1: Acessar App Store Connect**
1. Vá para [App Store Connect](https://appstoreconnect.apple.com)
2. Faça login com sua conta de desenvolvedor
3. Selecione seu app "LookFinder"

### **Passo 2: Configurar In-App Purchases**
1. No menu lateral, clique em **"Features"**
2. Selecione **"In-App Purchases"**
3. Clique no botão **"+"** para adicionar produtos

### **Passo 3: Criar Produto Lifetime**
1. **Tipo**: Selecione **"Non-Consumable"**
2. **Product ID**: `com.lookfinder.premium.lifetime`
3. **Reference Name**: `LookFinder Premium Lifetime`
4. **Price**: Selecione `$9.99`
5. **Description**: `Acesso vitalício a todos os recursos premium`
6. **Review Information**:
   - **Screenshot**: Adicione uma imagem do produto
   - **Review Notes**: "Produto vitalício que desbloqueia todos os recursos premium"

### **Passo 4: Criar Assinatura Mensal**
1. **Tipo**: Selecione **"Auto-Renewable Subscription"**
2. **Product ID**: `com.lookfinder.premium.monthly`
3. **Reference Name**: `LookFinder Premium Monthly`
4. **Subscription Group**: Crie um novo grupo "LookFinder Premium"
5. **Price**: Selecione `$2.99`
6. **Subscription Duration**: `1 Month`
7. **Description**: `Assinatura mensal com todos os recursos premium`

### **Passo 5: Criar Assinatura Anual**
1. **Tipo**: Selecione **"Auto-Renewable Subscription"**
2. **Product ID**: `com.lookfinder.premium.annual`
3. **Reference Name**: `LookFinder Premium Annual`
4. **Subscription Group**: Use o mesmo grupo "LookFinder Premium"
5. **Price**: Selecione `$19.99`
6. **Subscription Duration**: `1 Year`
7. **Description**: `Assinatura anual com todos os recursos premium`

## 📱 **Configuração no Código**

### **1. Verificar Product IDs**
Os Product IDs já estão configurados nos seguintes arquivos:

**`services/iapService.ts`** (linha 25-29):
```typescript
private readonly PRODUCT_IDS = {
  PREMIUM_LIFETIME: 'com.lookfinder.premium.lifetime',
  PREMIUM_MONTHLY: 'com.lookfinder.premium.monthly',
  PREMIUM_ANNUAL: 'com.lookfinder.premium.annual',
};
```

**`services/iapServiceMock.ts`** (linha 25-29):
```typescript
private readonly PRODUCT_IDS = {
  PREMIUM_LIFETIME: 'com.lookfinder.premium.lifetime',
  PREMIUM_MONTHLY: 'com.lookfinder.premium.monthly',
  PREMIUM_ANNUAL: 'com.lookfinder.premium.annual',
};
```

### **2. Mapeamento de Planos**
**`services/subscriptionsService.ts`** (linha 380-390):
```typescript
private mapPlanToIAPProduct(planId: string): string | null {
  const planMapping: { [key: string]: string } = {
    'lifetime': 'com.lookfinder.premium.lifetime',
    'monthly': 'com.lookfinder.premium.monthly',
    'annual': 'com.lookfinder.premium.annual',
  };
  return planMapping[planId] || null;
}
```

## 🚀 **Build para Apple**

### **1. Configurar EAS Build**
```bash
# Instalar EAS CLI
npm install -g @expo/eas-cli

# Login no Expo
eas login

# Configurar build
eas build:configure
```

### **2. Configurar eas.json**
```json
{
  "build": {
    "production": {
      "ios": {
        "buildConfiguration": "Release",
        "distribution": "store"
      }
    },
    "development": {
      "ios": {
        "buildConfiguration": "Debug",
        "distribution": "development"
      }
    }
  }
}
```

### **3. Fazer Build**
```bash
# Build de desenvolvimento (para testar IAP)
eas build --profile development --platform ios

# Build de produção (para App Store)
eas build --profile production --platform ios
```

## 🧪 **Testando IAP**

### **1. Sandbox Testing**
1. Crie uma conta de teste no App Store Connect
2. Faça logout da App Store no dispositivo
3. Use a conta de teste para fazer compras
4. As compras serão processadas no ambiente sandbox

### **2. TestFlight**
1. Faça upload do build para TestFlight
2. Convide testadores internos
3. Teste as compras em ambiente de produção
4. Verifique se os produtos aparecem corretamente

## ⚠️ **Importante**

### **1. Produtos Devem Estar Aprovados**
- Todos os produtos devem estar **"Ready for Sale"**
- Não é possível testar produtos pendentes
- Aguarde aprovação da Apple (24-48h)

### **2. Contrato de Pagamento**
- Certifique-se de que o contrato de pagamento está ativo
- Verifique se há problemas de pagamento
- Configure informações fiscais se necessário

### **3. Testes em Produção**
- Use sempre contas de teste primeiro
- Não faça compras reais durante desenvolvimento
- Teste todos os fluxos antes do lançamento

## 🔍 **Troubleshooting**

### **Produtos Não Aparecem**
1. Verifique se os Product IDs estão corretos
2. Confirme se os produtos estão aprovados
3. Verifique se o contrato de pagamento está ativo
4. Teste com conta de sandbox

### **Erro de Compra**
1. Verifique se a conta tem saldo/forma de pagamento
2. Confirme se o produto está disponível na região
3. Teste com diferentes contas de teste
4. Verifique logs do dispositivo

### **Assinaturas Não Funcionam**
1. Confirme se o grupo de assinatura está correto
2. Verifique se a duração está configurada
3. Teste renovação automática
4. Confirme se o produto está ativo

## 📞 **Suporte**

Se encontrar problemas:
1. Verifique os logs do dispositivo
2. Teste com diferentes contas
3. Confirme configurações no App Store Connect
4. Entre em contato com suporte da Apple se necessário

---

**✅ Sistema IAP configurado e pronto para produção!**
