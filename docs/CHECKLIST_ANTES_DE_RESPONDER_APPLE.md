# ✅ Checklist - Antes de Responder à Apple

## 🔍 **VERIFICAÇÕES OBRIGATÓRIAS**

### **1. App Store Connect - Contracts**
- [ ] Acesse [App Store Connect](https://appstoreconnect.apple.com)
- [ ] Vá para **"Agreements, Tax, and Banking"**
- [ ] Verifique se o **"Paid Apps Agreement"** está **ACTIVE**
- [ ] Se estiver **"Processing"** ou **"Pending"**, aguarde aprovação
- [ ] Se não houver contrato, aceite-o primeiro

**❗ SEM O CONTRATO ACEITO, OS IAPs NÃO FUNCIONAM EM REVISÃO**

---

### **2. Product IDs no App Store Connect**
- [ ] Acesse seu app no App Store Connect
- [ ] Vá para **Features → In-App Purchases**
- [ ] Verifique se os 3 produtos estão listados:
  - [ ] `com.lookfinder.premium.lifetime`
  - [ ] `com.lookfinder.premium.semest`
  - [ ] `com.lookfinder.premium.annual`

**Status de cada produto deve ser:**
- [ ] **"Ready to Submit"** OU
- [ ] **"Waiting for Review"** OU  
- [ ] **"Approved"**

**❌ NÃO PODE SER:**
- [ ] "Missing Metadata"
- [ ] "Rejected"
- [ ] "Developer Removed"

---

### **3. Subscription Group**
- [ ] Verifique se existe um **Subscription Group** chamado "LookFinder Premium"
- [ ] Confirme que os produtos `premium.semest` e `premium.annual` fazem parte deste grupo
- [ ] Status do grupo deve estar ativo

---

### **4. Product Metadata Completo**
Para cada produto, verifique se tem:

**Lifetime (com.lookfinder.premium.lifetime):**
- [ ] Reference Name preenchido
- [ ] Display Name preenchido
- [ ] Description preenchida
- [ ] Price Tier selecionado ($9.99)
- [ ] Screenshot de revisão (opcional mas recomendado)

**Monthly (com.lookfinder.premium.semest):**
- [ ] Tudo acima +
- [ ] Subscription Duration: 1 Month
- [ ] Subscription Group configurado

**Annual (com.lookfinder.premium.annual):**
- [ ] Tudo acima +
- [ ] Subscription Duration: 1 Year
- [ ] Subscription Group configurado

---

### **5. Banking & Tax Information**
- [ ] Vá para **"Agreements, Tax, and Banking"**
- [ ] Seção **"Banking"**: Informações bancárias preenchidas e verificadas
- [ ] Seção **"Tax Forms"**: Formulários fiscais preenchidos
- [ ] Status deve mostrar **"Active"** ou **"Processing"**

**❗ SEM ISSO, PAGAMENTOS NÃO FUNCIONAM**

---

### **6. Build Submetido**
- [ ] A build atual no TestFlight/Review contém o código de IAP
- [ ] Versão do build: ___________
- [ ] Data de submissão: ___________

---

### **7. Teste Manual (Faça Você Mesmo)**

**Opção A: TestFlight**
- [ ] Baixe o app via TestFlight
- [ ] Vá para Profile → Upgrade to Premium
- [ ] Verifique se os 3 planos aparecem
- [ ] Verifique se os preços estão corretos
- [ ] Tente fazer uma compra (sandbox)
- [ ] Teste o botão "Restore Purchases"

**Opção B: Simulador com Xcode**
- [ ] Abra o projeto no Xcode
- [ ] Configure StoreKit Configuration File
- [ ] Teste a tela de upgrade
- [ ] Verifique loading de produtos
- [ ] Teste fluxo de compra

---

## 📝 **INFORMAÇÕES PARA A RESPOSTA**

Anote estas informações antes de responder:

### **Dados do Produto:**
- [ ] Lifetime Price: $______
- [ ] Monthly Price: $______
- [ ] Annual Price: $______

### **Status dos Produtos:**
- [ ] Lifetime status: __________
- [ ] Monthly status: __________
- [ ] Annual status: __________

### **Conta de Teste Sandbox:**
- [ ] Email da conta sandbox: __________
- [ ] Senha (guarde em local seguro): __________

---

## 🚨 **PROBLEMAS COMUNS E SOLUÇÕES**

### **Problema 1: "Produtos não aparecem no app"**
**Causas:**
- Contrato não aceito
- Product IDs incorretos
- Produtos não estão "Ready to Submit"

**Solução:**
1. Verificar contrato aceito
2. Comparar Product IDs no código vs App Store Connect
3. Verificar status dos produtos

---

### **Problema 2: "Paid Apps Agreement não aceito"**
**Solução:**
1. Ir para **Agreements, Tax, and Banking**
2. Clicar no contrato pendente
3. Ler e aceitar os termos
4. Aguardar confirmação (pode levar 24h)

---

### **Problema 3: "Missing metadata nos produtos"**
**Solução:**
1. Abrir cada produto
2. Preencher todos os campos obrigatórios:
   - Display Name
   - Description
   - Price
   - Screenshot (se pedido)
3. Salvar e verificar status

---

### **Problema 4: "Subscription group não configurado"**
**Solução:**
1. Criar novo Subscription Group
2. Nome: "LookFinder Premium"
3. Adicionar os 2 produtos de assinatura ao grupo
4. Salvar configurações

---

## 📧 **ANTES DE ENVIAR A RESPOSTA**

### **Resposta Curta (Se tudo estiver OK):**
```
Copie e cole de: docs/RESPOSTA_APPLE_COPIAR_COLAR.txt
```

### **Resposta Longa (Se houver problemas):**
```
Use: docs/APPLE_REVIEW_RESPONSE.md
+ Explique quais problemas você encontrou
+ Diga quando serão corrigidos
+ Peça extensão se necessário
```

---

## ⏰ **TIMELINE**

1. **Verificar tudo (30-60 min):** Percorrer este checklist
2. **Corrigir problemas (1-4 horas):** Se houver algum
3. **Testar manualmente (30 min):** TestFlight ou simulador
4. **Responder Apple (10 min):** Copiar e colar resposta
5. **Aguardar resposta (1-3 dias):** Apple vai testar novamente

---

## 🎯 **CRITÉRIOS DE APROVAÇÃO**

Para responder, você precisa ter certeza de:

- [ ] **Paid Apps Agreement ACEITO e ATIVO**
- [ ] **Todos os 3 produtos em "Ready to Submit" ou melhor**
- [ ] **Banking & Tax information COMPLETOS**
- [ ] **Você testou os IAPs no TestFlight/Sandbox com sucesso**
- [ ] **Os preços estão corretos ($9.99, $2.99, $19.99)**
- [ ] **Subscription group configurado**

**✅ Se TODOS os itens acima estiverem OK, pode responder com confiança!**

**❌ Se ALGUM item estiver pendente, RESOLVA PRIMEIRO antes de responder**

---

## 💡 **DICA PROFISSIONAL**

**Não tenha pressa em responder!**

- Apple te dá alguns dias para responder
- É melhor gastar 1-2 dias corrigindo tudo
- Do que responder rápido e ser rejeitado de novo

**Responda apenas quando tiver 100% de certeza que está tudo funcionando!**

---

## 📞 **PRECISA DE AJUDA?**

Se encontrar problemas que não consegue resolver:

1. **Apple Developer Support:**
   - https://developer.apple.com/contact/
   - Phone: disponível no App Store Connect

2. **Request a call from App Review:**
   - No email da Apple, há opção "Request a phone call"
   - Agende uma call para discutir o problema

3. **Forums:**
   - https://developer.apple.com/forums/
   - Procure por problemas similares

---

**✅ BOA SORTE COM A REVISÃO!**
