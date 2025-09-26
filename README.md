# 👗 LookFinder - App Mobile

**Descubra seu estilo com IA** - Plataforma de moda personalizada com looks, cupons e links de compra.

---

## **📱 Sobre o App**

LookFinder é um aplicativo de moda que utiliza inteligência artificial para personalizar looks, oferece cupons exclusivos e links de compra premium para usuários.

### **🌟 Funcionalidades:**
- 🤖 **Chat com IA** para sugestões personalizadas de moda
- 👗 **Galeria de looks** com categorias e subcategorias
- 🎫 **Cupons de desconto** exclusivos
- 🛍️ **Links de compra** com preços especiais
- 🌐 **Sistema de assinaturas** via site externo (conforme políticas das lojas)
- 🔔 **Notificações push** personalizadas
- 🌍 **Multi-idioma** (PT, EN, ES)

---

## **🚀 Desenvolvimento**

### **📋 Pré-requisitos:**
```bash
# Node.js 18+ e npm
node --version
npm --version

# Expo CLI
npm install -g @expo/cli

# EAS CLI para builds
npm install -g eas-cli
```

### **⚙️ Configuração Inicial:**
```bash
# 1. Clonar repositório
git clone <seu-repositorio>
cd loockfinder-app-mobile

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas chaves do Supabase

# 4. Iniciar desenvolvimento
npx expo start
```

Atualizar no Expo

# Para mandar update OTA para produção:
eas update --branch production --message "Correção de layout na tela de login" --platform all

# Para mandar update OTA para preview/testes:
eas update --branch preview --message "Testando nova feature X" --platform all

## **📱 Development Build (Para Push Notifications)**

> ⚠️ **IMPORTANTE**: Push notifications não funcionam no Expo Go a partir do SDK 53. É necessário usar development build.

### **🛠️ Gerar Development Build:**
```bash
# Primeiro build de desenvolvimento
eas build --profile development --platform android
eas build --profile development --platform ios

# Instalar no dispositivo
# Android: Baixar APK e instalar
# iOS: Usar TestFlight ou instalação direta
```

### **🔄 Workflow de Desenvolvimento:**
```bash
# 1. Gerar development build (apenas uma vez)
eas build --profile development --platform android

# 2. Durante desenvolvimento, usar updates OTA
eas update --branch development --message "Testando notificações"

# 3. Para testar em produção
eas build --profile production --platform all
```

Gerar build de produção

# iOS
eas build -p ios --profile production

# Android
eas build -p android --profile production

# Ambos
eas build -p all --profile production

---

## **🏗️ Builds e Publicação**

### **📱 1. Build de Desenvolvimento**

```bash
# Limpar cache (se necessário)
npx expo start --clear

# Build para Android (APK)
eas build --platform android --profile development

# Build para iOS (simulador)
eas build --platform ios --profile development

# Build para ambos
eas build --platform all --profile development
```

### **🚀 2. Build de Produção**

```bash
# Verificar configuração
eas build:configure

# Build de produção para Android
eas build --platform android --profile production

# Build de produção para iOS
eas build --platform ios --profile production

# Build para ambos (produção)
eas build --platform all --profile production
```

### **📦 3. Build Preview (Teste)**

```bash
# Build preview para teste interno
eas build --platform android --profile preview
eas build --platform ios --profile preview

# Instalar preview no dispositivo
# Android: Baixar APK do link fornecido
# iOS: Instalar via TestFlight ou link direto
```

---

## **🏪 Publicação nas Lojas**

### **🤖 1. Google Play Store (Android)**

#### **📋 Preparação:**
```bash
# 1. Gerar AAB de produção
eas build --platform android --profile production

# 2. Verificar se build foi bem-sucedida
eas build:list

# 3. Baixar AAB do dashboard Expo
# Acesse: https://expo.dev/accounts/[seu-username]/projects/lookfinderMobile/builds
```

#### **📤 Upload:**
```bash
# Opção 1: Upload manual
# 1. Acesse Google Play Console
# 2. Vá em "Versões do app" > "Produção"
# 3. Faça upload do arquivo .aab
# 4. Preencha informações da versão
# 5. Enviar para análise

# Opção 2: Upload automático via EAS
eas submit --platform android
```

#### **✅ Checklist Android:**
- [ ] Ícone do app configurado (`adaptive-icon`)
- [ ] Versão incrementada no `app.json`
- [ ] Permissões necessárias declaradas
- [ ] Teste em dispositivos reais
- [ ] Screenshots para Play Store
- [ ] Descrição atualizada

### **🍎 2. App Store (iOS)**

#### **📋 Preparação:**
```bash
# 1. Gerar IPA de produção
eas build --platform ios --profile production

# 2. Verificar certificados
eas credentials

# 3. Configurar App Store Connect
# - Criar app no App Store Connect
# - Configurar informações básicas
```

#### **📤 Upload:**
```bash
# Upload automático via EAS
eas submit --platform ios

# Ou manual via Xcode/Transporter
# 1. Baixar .ipa do dashboard Expo
# 2. Usar Transporter ou Xcode para upload
```

Opção 1: Fazer updates separados para cada plataforma
basheas update --branch production --message "update" --platform android
basheas update --branch production --message "update" --platform ios

#### **✅ Checklist iOS:**
- [ ] Certificados de distribuição válidos
- [ ] Bundle ID configurado
- [ ] Ícone do app em todas as resoluções
- [ ] Versão incrementada
- [ ] Screenshots para App Store
- [ ] Política de privacidade
- [ ] Teste no TestFlight

---

## **🔄 Atualizações OTA (Over-The-Air)**

### **⚡ Updates Instantâneos:**
```bash
# 1. Fazer alterações no código
# 2. Publicar update
eas update --branch production --message "Correções e melhorias"

# 3. Update para branch específica
eas update --branch preview --message "Teste de novas funcionalidades"

# 4. Ver status dos updates
eas update:list
```

### **🎯 Updates por Canal:**
```bash
# Produção
eas update --channel production --message "Versão estável"

# Desenvolvimento
eas update --channel development --message "Versão em desenvolvimento"

# Preview
eas update --channel preview --message "Versão de teste"
```

---

## **📊 Monitoramento e Debug**

### **🔍 Logs e Analytics:**
```bash
# Ver logs de builds
eas build:list --limit 10

# Ver logs de updates
eas update:list --limit 10

# Ver logs em tempo real
npx expo start --dev-client

# Logs de produção
# Acesse: https://expo.dev/accounts/[seu-username]/projects/lookfinderMobile/logs
```

### **🧪 Teste em Dispositivos:**
```bash
# Android (via ADB)
adb devices
adb install app-release.apk

# iOS (via Xcode)
xcrun simctl install booted app.app

# Teste via Expo Go (desenvolvimento)
npx expo start --tunnel
```

---

## **🔧 Comandos de Manutenção**

### **🧹 Limpeza:**
```bash
# Limpar cache do Metro
npx expo start --clear

# Limpar cache do npm
npm cache clean --force

# Limpar node_modules
rm -rf node_modules
npm install

# Reset completo do projeto
npm run reset-project
```

### **📦 Dependências:**
```bash
# Instalar nova dependência
npx expo install nome-da-dependencia

# Atualizar dependências do Expo
npx expo install --fix

# Verificar dependências desatualizadas
npm outdated
```

---

## **🌍 Configurações por Ambiente**

### **📱 Profiles EAS:**
```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

### **🔧 Variáveis de Ambiente:**
```bash
# .env.local (desenvolvimento)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx

# EAS Secrets (produção)
eas secret:create --scope project --name SUPABASE_URL --value "https://xxx.supabase.co"
eas secret:create --scope project --name SUPABASE_ANON_KEY --value "xxx"
```

---

## **📋 Checklist de Release**

### **✅ Antes de Publicar:**
- [ ] Testar em dispositivos Android e iOS
- [ ] Verificar todas as funcionalidades (login, compras, notificações)
- [ ] Testar integração com Stripe
- [ ] Verificar push notifications
- [ ] Testar multi-idioma
- [ ] Incrementar versão no `app.json`
- [ ] Atualizar changelog
- [ ] Fazer backup do banco de dados

### **🚀 Processo de Release:**
```bash
# 1. Finalizar desenvolvimento
git add .
git commit -m "feat: versão X.X.X pronta para produção"
git push origin main

# 2. Incrementar versão
# Editar app.json: "version": "1.X.X"

# 3. Build de produção
eas build --platform all --profile production

# 4. Aguardar builds (15-30 min)
eas build:list

# 5. Submeter para lojas
eas submit --platform all

# 6. Publicar update OTA (se necessário)
eas update --channel production --message "Versão X.X.X"
```

---

## **🏪 Conformidade com Políticas das Lojas**

### **⚠️ Importante - Sistema de Assinaturas:**

Para garantir conformidade com as políticas da **Google Play Store** e **App Store**:

#### **🚫 O que foi removido:**
- ❌ Checkout interno no app
- ❌ Processamento de pagamentos via Stripe no app
- ❌ Referencias diretas a "comprar" ou "assinar"

#### **✅ O que foi implementado:**
- ✅ **Redirecionamento para site externo** para upgrades
- ✅ **Linguagem neutra** ("atualizar conta", "visitar site")
- ✅ **Sincronização automática** após upgrade no site
- ✅ **Manutenção do sistema de validação** de planos

#### **🔄 Fluxo de Upgrade:**
```
1. Usuário clica em "Atualizar no Site"
2. App redireciona para https://lookfinder.com/upgrade
3. Usuário faz upgrade no site externo
4. Ao voltar, app verifica automaticamente o status
5. Interface é atualizada se houver mudança de plano
```

#### **💡 Para Desenvolvedores:**
```javascript
// URL de upgrade com parâmetros
const websiteUrl = `https://lookfinder.com/upgrade?userId=${userId}&planId=${planId}&email=${email}`;

// Abrir browser externo
WebBrowser.openBrowserAsync(websiteUrl);

// Verificar mudanças ao retornar
subscriptionsService.getProfileWithPlan(userId);
```

---

## **🔗 Links Úteis**

### **📚 Documentação:**
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)
- [Expo Updates](https://docs.expo.dev/eas-update/introduction/)

### **🛠️ Ferramentas:**
- [Expo Dashboard](https://expo.dev/accounts/asaphcruz/projects/lookfinderMobile)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Stripe Dashboard](https://dashboard.stripe.com)

### **🎯 Supabase:**
- [Dashboard](https://supabase.com/dashboard)
- [Edge Functions](https://supabase.com/dashboard/project/jlqjgsnjthrhapiaespq/functions)
- [Database](https://supabase.com/dashboard/project/jlqjgsnjthrhapiaespq/editor)

---

## **🆘 Resolução de Problemas**

### **🔧 Problemas Comuns:**

```bash
# Metro cache error
npx expo start --clear

# Build failing
eas build:list
eas build --platform android --profile production --clear-cache

# Dependencies issues
npx expo install --fix
npm cache clean --force

# iOS certificate problems
eas credentials --platform ios

# Android keystore issues
eas credentials --platform android
```

### **📞 Suporte:**
- **Expo**: [Expo Discord](https://chat.expo.dev)
- **React Native**: [GitHub Issues](https://github.com/facebook/react-native/issues)
- **Supabase**: [Discord](https://discord.supabase.com)

---

## **📈 Versionamento**

### **🔢 Esquema de Versões:**
- **Major** (X.0.0): Mudanças grandes, breaking changes
- **Minor** (1.X.0): Novas funcionalidades
- **Patch** (1.1.X): Correções e melhorias

### **📝 Exemplo de Changelog:**
```
v1.2.0 (2024-01-15)
🆕 Adicionado sistema de push notifications
🆕 Implementado cupons de desconto
🐛 Corrigido bug na busca de looks
🎨 Melhorado design da TabBar

v1.1.5 (2024-01-10)
🐛 Corrigido problema de login
🎨 Ajustes visuais na home
```

---

## **🎯 Comandos Rápidos**

```bash
# Desenvolvimento diário
npx expo start                    # Iniciar desenvolvimento
npx expo start --clear           # Limpar cache e iniciar

# Builds
eas build -p android             # Build Android
eas build -p ios                 # Build iOS
eas build -p all                 # Build ambos

# Publicação
eas submit -p android            # Enviar para Play Store
eas submit -p ios                # Enviar para App Store
eas submit -p all                # Enviar para ambas

# Updates OTA
eas update --channel production  # Update para produção
eas update --channel preview     # Update para preview

# Monitoramento
eas build:list                   # Ver builds recentes
eas update:list                  # Ver updates recentes
```

---

**🎉 LookFinder - Desenvolvido com ❤️ usando Expo + React Native + Supabase**

**📧 Contato:** asaph@lookfinder.com | **🌐 Website:** lookfinder.com