# 🗓️ Guia de Notificações Agendadas - LookFinder

## **📋 Visão Geral**

Sistema completo para criar, agendar e gerenciar notificações push com data/hora específica e recorrência.

---

## **🗃️ 1. Configuração do Banco**

### **📊 Execute o SQL:**
```sql
-- Execute database_avisos_scheduled_update.sql no Supabase
-- Isso adiciona campos de agendamento à tabela avisos
```

**🔧 Novos Campos:**
- `scheduled_for`: Data/hora para envio
- `sent_at`: Quando foi enviada
- `schedule_type`: Tipo de agendamento
- `recurrence_config`: Configurações de recorrência

---

## **📱 2. Formas de Cadastrar Notificações**

### **🎯 A. Via Código (Programática)**

```typescript
import { avisosService } from '@/services';

// 1. Notificação imediata
await avisosService.createAviso({
  user_id: 'uuid-do-usuario',
  aviso_tipo: 'promotion',
  titulo: 'Oferta especial! 🎉',
  descricao: 'Desconto de 50% apenas hoje!',
  ativo: true
});

// 2. Notificação agendada para data específica
const amanha = new Date();
amanha.setDate(amanha.getDate() + 1);
amanha.setHours(14, 0, 0, 0); // 14:00

await avisosService.createScheduledNotification(
  'uuid-do-usuario',
  'Lembrete diário! ⏰',
  'Não esqueça de conferir os novos looks de hoje!',
  amanha,
  'custom'
);

// 3. Notificação recorrente (diária)
await avisosService.createRecurringNotification(
  'uuid-do-usuario',
  'Inspiração diária! ✨',
  'Novos looks todos os dias às 10h!',
  'recurring_daily',
  new Date() // Começa hoje
);
```

### **🌐 B. Via Edge Function (API)**

```bash
# Notificação agendada
curl -X POST https://seu-projeto.supabase.co/functions/v1/notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create_scheduled",
    "user_id": "uuid-do-usuario",
    "titulo": "Black Friday chegando! 🖤",
    "descricao": "Prepare-se para os maiores descontos do ano!",
    "aviso_tipo": "promotion",
    "scheduled_for": "2024-11-29T08:00:00.000Z"
  }'

# Processar notificações agendadas (executar via cron)
curl -X POST https://seu-projeto.supabase.co/functions/v1/notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "process_scheduled"}'
```

### **📱 C. Via Interface Administrativa**

```typescript
import { NotificationAdmin } from '@/components';

// Use em qualquer tela administrativa
<NotificationAdmin 
  visible={showAdmin} 
  onClose={() => setShowAdmin(false)} 
/>
```

---

## **⏰ 3. Tipos de Agendamento**

### **📋 Tipos Disponíveis:**

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `immediate` | Envio imediato | Boas-vindas |
| `scheduled` | Data/hora específica | Black Friday 29/11 08:00 |
| `recurring_daily` | Todos os dias | Inspiração diária 10:00 |
| `recurring_weekly` | Toda semana | Novidades semanais |
| `recurring_monthly` | Todo mês | Resumo mensal |

### **🔄 Recorrência:**
- **Diária**: Cria nova notificação todo dia no mesmo horário
- **Semanal**: Cria nova notificação toda semana
- **Mensal**: Cria nova notificação todo mês

---

## **🤖 4. Automação com Cron**

### **⚙️ Configurar Cron Job:**

```bash
# No seu servidor ou GitHub Actions
# Executar a cada 5 minutos para processar agendadas
*/5 * * * * curl -X POST https://seu-projeto.supabase.co/functions/v1/notifications \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{"action": "process_scheduled"}'
```

### **🔧 Ou via Supabase Cron:**
```sql
-- No Supabase, criar uma função cron
SELECT cron.schedule(
  'process-scheduled-notifications',
  '*/5 * * * *', -- A cada 5 minutos
  $$
  SELECT net.http_post(
    url := 'https://seu-projeto.supabase.co/functions/v1/notifications',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}',
    body := '{"action": "process_scheduled"}'
  );
  $$
);
```

---

## **📊 5. Exemplos Práticos**

### **🎯 Cenários Comuns:**

```typescript
// 1. Lembrete de renovação (3 dias antes)
const dataVencimento = new Date('2024-12-01');
const lembrete = new Date(dataVencimento);
lembrete.setDate(dataVencimento.getDate() - 3);

await avisosService.createScheduledNotification(
  userId,
  'Assinatura expira em 3 dias! ⏰',
  'Renove sua assinatura para manter acesso aos recursos premium.',
  lembrete,
  'promotion'
);

// 2. Promoção de fim de semana (toda sexta 18h)
await avisosService.createRecurringNotification(
  userId,
  'Ofertas de fim de semana! 🎉',
  'Confira as promoções especiais para o fim de semana!',
  'recurring_weekly',
  new Date('2024-01-05T18:00:00') // Próxima sexta às 18h
);

// 3. Inspiração diária (todo dia 10h)
await avisosService.createRecurringNotification(
  userId,
  'Inspiração do dia! ✨',
  'Novos looks selecionados especialmente para você!',
  'recurring_daily',
  new Date('2024-01-01T10:00:00') // Todo dia às 10h
);
```

---

## **🔍 6. Monitoramento**

### **📊 Estatísticas Expandidas:**
```typescript
const stats = await avisosService.getUserNotificationStats(userId);
// Retorna:
// {
//   total: 15,
//   naoMostrados: 3,
//   mostrados: 8,
//   ativos: 12,
//   inativos: 3,
//   agendados: 5,    // ← Novo
//   enviados: 7      // ← Novo
// }
```

### **📋 Buscar Pendentes:**
```typescript
const pending = await avisosService.getPendingScheduledNotifications();
// Retorna todas as notificações que devem ser enviadas agora
```

---

## **⚡ 7. Automação Completa**

### **🔄 Fluxo Automático:**
```
1. Criar notificação agendada → Salva na tabela
2. Cron executa a cada 5min → Chama Edge Function
3. Edge Function processa → Envia push notifications
4. Marca como enviada → Cria próxima recorrência (se aplicável)
```

### **🎯 Casos de Uso:**
- ✅ **Lembretes de renovação**
- ✅ **Promoções sazonais**
- ✅ **Inspiração diária**
- ✅ **Novidades semanais**
- ✅ **Campanhas de marketing**

---

## **📱 8. Interface de Usuário**

### **🎛️ Componente Administrativo:**
```typescript
// Para administradores criarem notificações
<NotificationAdmin 
  visible={showAdmin} 
  onClose={() => setShowAdmin(false)} 
/>
```

**🌟 Funcionalidades:**
- ✅ **Formulário completo** para criar notificações
- ✅ **Preview em tempo real** da notificação
- ✅ **Seleção de tipo** e agendamento
- ✅ **Validação de campos** obrigatórios
- ✅ **Interface intuitiva** e responsiva

---

## **✨ Resultado Final**

**🎉 Sistema Completo de Notificações Agendadas:**
- 📅 **Agendamento flexível** (data/hora específica)
- 🔄 **Recorrência automática** (diária, semanal, mensal)
- 🤖 **Processamento automático** via cron
- 📊 **Monitoramento completo** com estatísticas
- 🎛️ **Interface administrativa** para criação
- 🗃️ **Integração total** com tabela avisos

**🚀 Agora você pode criar campanhas de marketing automatizadas e lembretes personalizados para engajar seus usuários!** 🌟
