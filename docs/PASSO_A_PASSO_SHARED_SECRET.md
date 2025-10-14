# 📸 Passo a Passo - Obter Apple Shared Secret

## 🎯 **Guia Visual Completo**

---

## 📍 **PASSO 1: Acessar App Store Connect**

1. Abra seu navegador
2. Acesse: https://appstoreconnect.apple.com
3. Faça login com sua Apple ID de desenvolvedor

```
┌─────────────────────────────────────┐
│  🍎 App Store Connect               │
│                                     │
│  Login: seu@email.com              │
│  Senha: **********                  │
│                                     │
│  [   Sign In   ]                    │
└─────────────────────────────────────┘
```

---

## 📍 **PASSO 2: Selecionar Seu App**

1. Na página inicial, clique em **"My Apps"**
2. Procure e clique em **"LookFinder"**

```
┌─────────────────────────────────────┐
│  My Apps                            │
│                                     │
│  ┌──────────────┐                   │
│  │ LookFinder   │ ← Clique aqui     │
│  │ Version 1.0  │                   │
│  └──────────────┘                   │
└─────────────────────────────────────┘
```

---

## 📍 **PASSO 3: Ir para In-App Purchases**

1. No menu lateral esquerdo, clique em **"Features"**
2. Depois clique em **"In-App Purchases"**

```
┌─────────────────┬─────────────────────┐
│ ← LookFinder    │                     │
│                 │                     │
│ 📱 General      │  In-App Purchases   │
│ 🎯 Features  ←  │                     │
│   ↳ IAP ✓       │  Seus produtos:     │
│ 💰 Subscriptions│  • Finder mensal    │
│ 📊 TestFlight   │  • Finder semestral │
│ 📈 Analytics    │  • Finder Anual     │
└─────────────────┴─────────────────────┘
```

---

## 📍 **PASSO 4: Encontrar Shared Secret**

1. **Role a página para baixo** até o final
2. Procure a seção **"App-Specific Shared Secret"**
3. Você verá algo assim:

```
┌────────────────────────────────────────────┐
│  App-Specific Shared Secret                │
│                                            │
│  ⚠️ Not Generated                          │
│  or                                        │
│  ✅ ••••••••••••••••••••••••••••••••       │
│                                            │
│  [ Generate ]  [ View ]                    │
└────────────────────────────────────────────┘
```

---

## 📍 **PASSO 5: Gerar/Ver o Secret**

### **Se NÃO foi gerado ainda:**
1. Clique em **"Generate"**
2. Confirme a ação
3. Secret será gerado

### **Se JÁ foi gerado:**
1. Clique em **"View"**
2. Secret aparecerá

```
┌────────────────────────────────────────────┐
│  App-Specific Shared Secret                │
│                                            │
│  a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0 │
│                                            │
│  [ Copy ]  [ Regenerate ]                  │
└────────────────────────────────────────────┘
```

---

## 📍 **PASSO 6: Copiar o Secret**

1. **Selecione TODO o código** (geralmente 32-64 caracteres)
2. Clique em **"Copy"** ou use Ctrl+C
3. **GUARDE** em local seguro

**Exemplo de Shared Secret:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

⚠️ **ATENÇÃO:** Não compartilhe este código publicamente!

---

## 📍 **PASSO 7: Adicionar no App**

1. Abra seu projeto
2. Vá para `config/supabase.ts`
3. Cole o Shared Secret:

```typescript
// config/supabase.ts
export const iapConfig = {
  appleSharedSecret: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
  //                  ↑ Cole seu secret aqui
};
```

---

## 📍 **PASSO 8: Fazer Build**

```bash
# Terminal
eas build --profile production --platform ios
```

Aguarde ~20-30 minutos

---

## 📍 **PASSO 9: Testar no TestFlight**

1. Instalar build no TestFlight
2. Abrir app
3. Ir para **Profile** → **Fazer Upgrade para Premium**
4. Selecionar **Finder mensal**
5. Completar compra com **conta sandbox**
6. **Verificar:**
   - ✅ Não dá erro
   - ✅ Aparece confirmação de sucesso
   - ✅ Perfil muda para "Premium"

---

## 📍 **PASSO 10: Responder à Apple**

Copie o template de `docs/SOLUCAO_PROBLEMA_APPLE_RECEIPT.md` e envie via App Store Connect

---

## ✅ **Checklist Completo**

- [ ] **Shared Secret obtido** do App Store Connect
- [ ] **Shared Secret adicionado** em config/supabase.ts
- [ ] **Código commitado** no Git
- [ ] **Build feito** (eas build)
- [ ] **Instalado** no TestFlight
- [ ] **Testado** compra sandbox
- [ ] **Funcionou** sem erros
- [ ] **Resposta enviada** para Apple

---

## 🔴 **Erros Comuns**

### **1. "Não encontrei App-Specific Shared Secret"**

**Onde está:**
- App Store Connect
- Seu App
- Features → In-App Purchases
- **Role ATÉ O FINAL da página**

### **2. "Secret está errado"**

**Verifique:**
- Copiou o secret completo (todos os caracteres)
- Não tem espaços antes/depois
- É App-Specific (não Master)

### **3. "Continua dando erro no app"**

**Verifique:**
- Shared Secret foi salvo corretamente
- Build foi feito COM a alteração
- Está testando com o build novo (não o antigo)

---

## 💡 **Dicas**

### **Master vs App-Specific:**

| Tipo | Uso | Recomendação |
|---|---|---|
| **Master Shared Secret** | Todos os apps da conta | ❌ Não use |
| **App-Specific Shared Secret** | Apenas este app | ✅ Use este |

### **Segurança:**

```
✅ Guardar em password manager
✅ Não compartilhar em chat/email
✅ Não commitar em repositório público
❌ Não colocar em screenshot
❌ Não compartilhar com terceiros
```

---

## 📞 **Precisa de Ajuda?**

Se não conseguir encontrar ou gerar:

1. **Apple Developer Support:**
   - https://developer.apple.com/contact/
   
2. **Documentação Oficial:**
   - https://developer.apple.com/documentation/appstorereceipts

3. **Forums:**
   - https://developer.apple.com/forums/

---

## 🎉 **Após Configurar**

Quando o Shared Secret estiver configurado e testado:

1. ✅ Receipt validation funcionará
2. ✅ Apple conseguirá testar compras
3. ✅ Review será aprovado
4. ✅ App vai para App Store

---

**🚀 Vamos lá! Copie o Shared Secret e adicione no código!**
