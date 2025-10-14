# Resposta para Apple Review - In-App Purchases

## 📧 Resposta para App Store Review Team

---

**Subject:** RE: In-App Purchase Location - Submission ID: bb209171-0f16-440d-8ea9-e13e88c50c47

Hello Apple Review Team,

Thank you for reviewing our app. I'd like to provide detailed steps to locate and test the in-app purchases in LookFinder.

## 🔍 **How to Access In-App Purchases**

### **Option 1: Via Profile Screen (Recommended)**

1. **Open the app** - Launch LookFinder
2. **Go to Profile tab** - Tap the "Profile" tab at the bottom navigation bar (rightmost icon)
3. **Scroll down** - Look for the "Premium Features" or "Upgrade" section
4. **Tap "Upgrade to Premium"** button
5. **Select a plan** - You'll see 3 subscription options:
   - Premium Lifetime (com.lookfinder.premium.lifetime) - $9.99
   - Premium Semestral (com.lookfinder.premium.semest) - $2.99/month
   - Premium Annual (com.lookfinder.premium.annual) - $19.99/year

### **Option 2: Via Restricted Features**

1. **Open the app** - Launch LookFinder
2. **Try to access premium features** such as:
   - AI Chat (bottom navigation)
   - Advanced Filters on Home screen
   - Unlimited Favorites
3. **Upgrade modal appears** - When attempting to use premium features
4. **View plans** - Tap "See Plans" or "Upgrade" button
5. **Complete purchase** - Select a subscription and complete the purchase flow

### **Option 3: Direct Access**

1. **Open the app** - Launch LookFinder
2. **Navigate** - From any screen, look for the "⭐ Premium" or "Upgrade" button in the header or settings
3. **Access upgrade screen** - Tap to view all available plans
4. **Test purchase flow** - Select any plan to test the IAP flow

## 📱 **Product IDs Configured**

All products are configured in App Store Connect and ready for review:

1. **com.lookfinder.premium.lifetime** (Non-Consumable)
   - One-time purchase for lifetime access
   - Price: $9.99

2. **com.lookfinder.premium.semest** (Auto-Renewable Subscription)
   - Monthly subscription
   - Price: $2.99/month

3. **com.lookfinder.premium.annual** (Auto-Renewable Subscription)
   - Annual subscription
   - Price: $19.99/year

## 🧪 **Sandbox Testing Instructions**

The app is configured to work properly with Apple's sandbox environment:

1. **Use a sandbox test account** - Sign out of your regular Apple ID and use a sandbox account
2. **Products load automatically** - The app fetches available products from App Store Connect
3. **Purchase flow** - Tap any plan to initiate the purchase
4. **Confirmation** - After purchase, the app updates the user's subscription status

## ⚙️ **Technical Details**

- **IAP Library:** react-native-iap v14.4.6
- **Product Loading:** Automatic on app launch and upgrade screen
- **Fallback:** Mock products are shown if IAP fails to initialize (for development only)
- **Restore Purchases:** Available on upgrade screen with "Restore Purchases" button
- **Receipt Validation:** Server-side validation is implemented

## 🔧 **Troubleshooting**

If products don't appear:

1. **Check sandbox account** - Ensure you're using a valid sandbox test account
2. **Wait for initialization** - Products may take a few seconds to load
3. **Check loading state** - A loading indicator shows while products are being fetched
4. **Retry** - Tap "Try Again" if loading fails

## ✅ **Verified Configurations**

- [x] Paid Apps Agreement is accepted
- [x] All products are configured in App Store Connect
- [x] Products are in "Ready to Submit" status
- [x] Subscription group is configured ("LookFinder Premium")
- [x] Product IDs match between app and App Store Connect
- [x] App is configured for sandbox testing
- [x] Restore purchases functionality is implemented

## 📞 **Additional Support**

If you need any additional information or encounter any issues during review, please don't hesitate to contact me. I'm available to provide further assistance or schedule a call.

Thank you for your time and consideration.

Best regards,
LookFinder Development Team

---

## 🇧🇷 **Versão em Português (Para sua referência)**

Olá equipe de revisão da Apple,

Obrigado por revisar nosso aplicativo. Gostaria de fornecer etapas detalhadas para localizar e testar as compras no aplicativo do LookFinder.

### **Como Acessar as Compras no Aplicativo:**

**Opção 1: Via Tela de Perfil (Recomendado)**
1. Abra o app
2. Vá para a aba "Perfil" (ícone mais à direita na barra inferior)
3. Role para baixo até "Recursos Premium"
4. Toque em "Upgrade para Premium"
5. Selecione um dos 3 planos disponíveis

**Opção 2: Recursos Restritos**
1. Abra o app
2. Tente acessar recursos premium (Chat IA, Filtros Avançados, etc.)
3. Modal de upgrade aparece automaticamente
4. Toque em "Ver Planos"
5. Complete o fluxo de compra

### **Product IDs:**
- com.lookfinder.premium.lifetime - $9.99 (vitalício)
- com.lookfinder.premium.semest - $2.99/mês
- com.lookfinder.premium.annual - $19.99/ano

Todos os produtos estão configurados corretamente no App Store Connect e prontos para revisão em ambiente sandbox.

---
