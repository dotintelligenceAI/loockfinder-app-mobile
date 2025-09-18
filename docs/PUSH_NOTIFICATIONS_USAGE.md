# 🔔 Sistema de Push Notifications - LookFinder

## **📋 Visão Geral**

Sistema completo de notificações push integrado com a tabela `avisos` do Supabase, usando Expo Notifications.

---

## **🏗️ Arquitetura**

### **📊 Tabelas do Banco:**
- **`avisos`**: Notificações personalizadas por usuário
- **`device_tokens`**: Tokens dos dispositivos para envio

### **🔧 Componentes:**
- **`notificationsService`**: Gerenciamento de notificações
- **`avisosService`**: CRUD da tabela avisos
- **`useNotifications`**: Hook para usar em componentes
- **`NotificationTester`**: Componente para testar/debug

---

## **🚀 Como Usar**

### **1. 📱 No Componente (Exemplo: Perfil)**

```typescript
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationTester } from '@/components';

export default function PerfilScreen() {
  const { unreadCount, hasUnread, processNotifications } = useNotifications();
  const [showTester, setShowTester] = useState(false);

  return (
    <View>
      {/* Indicador de notificações não lidas */}
      {hasUnread && (
        <TouchableOpacity onPress={processNotifications}>
          <Text>Você tem {unreadCount} notificações não lidas</Text>
        </TouchableOpacity>
      )}

      {/* Botão para abrir tester (desenvolvimento) */}
      <TouchableOpacity onPress={() => setShowTester(true)}>
        <Text>🔔 Testar Notificações</Text>
      </TouchableOpacity>

      <NotificationTester 
        visible={showTester} 
        onClose={() => setShowTester(false)} 
      />
    </View>
  );
}
```

### **2. 🔄 Criação Automática (Signup)**

```typescript
// No AuthService ou após signup
import { avisosService } from '@/services';

// Criar notificação de boas-vindas
await avisosService.createWelcomeNotification(userId);

// Criar notificação de nova feature
await avisosService.createFeatureNotification(
  userId,
  'Cupons de Desconto',
  'Agora você pode acessar cupons exclusivos!'
);
```

### **3. 📤 Envio via Edge Function**

```typescript
// Enviar para usuário específico
await supabase.functions.invoke('notifications', {
  body: {
    action: 'send_to_user',
    user_id: 'uuid-do-usuario',
    titulo: 'Nova funcionalidade! 🎉',
    descricao: 'Confira os novos cupons de desconto disponíveis.',
    aviso_tipo: 'new_feature'
  }
});

// Enviar para todos os usuários
await supabase.functions.invoke('notifications', {
  body: {
    action: 'send_to_all',
    titulo: 'Atualização do App',
    descricao: 'Nova versão disponível com melhorias incríveis!',
    aviso_tipo: 'update'
  }
});
```

---

## **🎯 Tipos de Notificações**

### **📝 Tipos Disponíveis:**
- **`welcome_tour`**: Boas-vindas e tour inicial
- **`new_feature`**: Novas funcionalidades
- **`promotion`**: Promoções e ofertas
- **`update`**: Atualizações do app
- **`maintenance`**: Manutenções programadas
- **`custom`**: Personalizadas

### **🎨 Cores por Tipo:**
- 🔵 **welcome_tour**: Azul (`#3B82F6`)
- 🟢 **new_feature**: Verde (`#10B981`)
- 🟡 **promotion**: Amarelo (`#F59E0B`)
- 🟣 **update**: Roxo (`#8B5CF6`)
- 🔴 **maintenance**: Vermelho (`#EF4444`)
- ⚫ **custom**: Cinza (`#6B7280`)

---

## **🔧 Configuração do Banco**

### **📊 Executar SQL:**
```sql
-- Execute o arquivo database_device_tokens_setup.sql no Supabase
-- Isso criará a tabela device_tokens com RLS e triggers
```

### **🌐 Deploy da Edge Function:**
1. Copie `scripts/notifications-edge-function.ts`
2. Cole no Supabase Edge Functions como `notifications`
3. Configure variáveis de ambiente:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

## **📱 Fluxo Completo**

### **🔄 Processo Automático:**
1. **Login** → Registra token do dispositivo
2. **Criação de aviso** → Salva na tabela `avisos`
3. **Edge Function** → Envia push notification
4. **App recebe** → Processa e marca como lido
5. **Usuário interage** → Navega para tela específica

### **🎯 Casos de Uso:**
- ✅ **Boas-vindas** para novos usuários
- ✅ **Anúncio de features** (cupons, links, etc.)
- ✅ **Promoções** e ofertas especiais
- ✅ **Atualizações** do app
- ✅ **Lembretes** personalizados

---

## **🧪 Testando**

### **📱 No App:**
1. Abra o `NotificationTester` em qualquer tela
2. Verifique se o token foi registrado
3. Teste notificação local
4. Processe notificações pendentes
5. Monitore estatísticas

### **🌐 Via Edge Function:**
```bash
# Teste via curl ou Postman
curl -X POST https://seu-projeto.supabase.co/functions/v1/notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send_to_user",
    "user_id": "uuid-do-usuario",
    "titulo": "Teste",
    "descricao": "Notificação de teste",
    "aviso_tipo": "custom"
  }'
```

---

## **✅ Resultado Final**

🎉 **Sistema Completo de Push Notifications:**
- ✅ **Registro automático** de tokens
- ✅ **Integração com tabela avisos**
- ✅ **Envio automático** via Edge Functions
- ✅ **Interface de teste** e debug
- ✅ **Tipos personalizados** de notificações
- ✅ **Estatísticas** e controle de leitura

**🚀 Pronto para produção!**
