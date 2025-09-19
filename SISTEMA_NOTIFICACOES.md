# Sistema de Notificações - Hairday

## Visão Geral

O sistema de notificações do Hairday é um sistema completo que envia notificações automáticas e manuais para usuários em diferentes situações. O sistema inclui notificações push, notificações no painel e jobs automáticos.

## Funcionalidades Implementadas

### 🎯 **Tipos de Notificação**
   - ✅ Novo agendamento criado
   - ✅ Agendamento atualizado
   - ✅ Agendamento cancelado
   - ✅ Agendamento concluído
   - ✅ Lembrete de agendamento (2h antes)

2. **Pagamentos**
   - ✅ Pagamento recebido
   - ✅ Pagamento pendente
   - ✅ Pagamento em atraso

3. **Indicações**
   - ✅ Indicação confirmada
   - ✅ Pagamento por indicação disponível

4. **Estoque**
   - ✅ Estoque baixo (≤ 5 unidades)
   - ✅ Estoque esgotado

5. **Sistema**
   - ✅ Boas-vindas para novos usuários
   - ✅ Atualizações do sistema
   - ✅ Notificações em massa (admin)

### 🔧 **Arquitetura do Sistema**

#### Serviço Centralizado
- `backend/utils/notificationService.ts` - Serviço principal de notificações
- Funções específicas para cada tipo de notificação
- Suporte a notificações push e salvas no banco

#### Jobs Automáticos
- `backend/jobs/appointmentReminderJob.ts` - Jobs de verificação automática
- Lembretes de agendamento
- Verificação de pagamentos pendentes
- Verificação de estoque baixo
- Limpeza de notificações antigas

#### Integração com Rotas
- Notificações integradas em todas as rotas relevantes
- Agendamentos, vendas, indicações, autenticação
- Notificações automáticas quando eventos ocorrem

### 📱 **Notificações Push**

O sistema usa Web Push API com VAPID keys para enviar notificações push:

```javascript
// Configuração necessária no .env
VAPID_PUBLIC_KEY=sua_chave_publica
VAPID_PRIVATE_KEY=sua_chave_privada
```

### 🕐 **Jobs Automáticos (Cron)**

| Job | Frequência | Descrição |
|-----|------------|-----------|
| Novos Agendamentos | A cada minuto | Detecta agendamentos criados nos últimos 5 minutos |
| Lembretes | A cada hora | Envia lembretes 2h antes dos agendamentos |
| Pagamentos Pendentes | Diário às 9h | Verifica usuários com pagamentos em atraso |
| Estoque Baixo | Diário às 10h | Verifica produtos com estoque baixo |
| Limpeza | Semanal aos domingos às 2h | Remove notificações antigas (>30 dias) |

### 🎛️ **Painel de Notificações**

#### Para Usuários
- Visualizar todas as notificações
- Marcar como lida/não lida
- Filtrar por status (todas, lidas, não lidas)
- Buscar notificações
- Paginação
- Excluir notificações individuais ou todas

#### Para Administradores
- Enviar notificações em massa
- Escolher público-alvo (todos, barbeiros, clientes, admins)
- Histórico completo de notificações enviadas

### 🔔 **Exemplos de Notificações**

#### Agendamentos
```
🎉 Novo Agendamento!
João Silva agendou um serviço para 15/01/2024 às 14:00

📝 Agendamento Atualizado
O agendamento de Maria Santos para 15/01/2024 às 14:00 foi modificado

⏰ Lembrete de Agendamento
Você tem um agendamento com Pedro Costa hoje às 16:00
```

#### Indicações
```
🎁 Indicação Confirmada!
Carlos Oliveira se cadastrou usando seu código! Você ganhou R$ 10 de desconto

💸 Pagamento por Indicação
Você tem R$ 20,00 disponível para saque por suas indicações
```

#### Estoque
```
⚠️ Estoque Baixo
Shampoo Anticaspa está com estoque baixo (3 unidades restantes)

🚫 Estoque Esgotado
Condicionador Reparador está sem estoque
```

### 🚀 **Como Usar**

#### Para Desenvolvedores

1. **Enviar Notificação Simples**
```javascript
import { sendNotification } from '../utils/notificationService';

await sendNotification({
  userId: 'user-id',
  type: NotificationType.SYSTEM_UPDATE,
  title: 'Título da Notificação',
  body: 'Corpo da mensagem',
  priority: 'high'
});
```

2. **Usar Funções Específicas**
```javascript
import { notifyAppointmentCreated } from '../utils/notificationService';

await notifyAppointmentCreated(
  appointmentId,
  barberId,
  clientName,
  date,
  time
);
```

3. **Notificação em Massa**
```javascript
import { sendBulkNotification } from '../utils/notificationService';

await sendBulkNotification(
  ['user1', 'user2', 'user3'],
  'Título',
  'Mensagem',
  NotificationType.SYSTEM_UPDATE
);
```

#### Para Administradores

1. **Acessar Dashboard Admin**
   - Vá para `/AdmPage`
   - Use a seção "Enviar Notificação em Massa"

2. **Enviar Notificação**
   - Digite o título e mensagem
   - Escolha o público-alvo
   - Clique em "Enviar Notificação"

### 📊 **Monitoramento**

O sistema registra logs detalhados:
- Notificações enviadas com sucesso
- Erros de envio
- Jobs executados
- Estatísticas de entrega

### 🔧 **Configuração**

#### Variáveis de Ambiente
```env
# VAPID Keys para Push Notifications
VAPID_PUBLIC_KEY=sua_chave_publica_vapid
VAPID_PRIVATE_KEY=sua_chave_privada_vapid

# Configurações do banco (já existentes)
DATABASE_URL=sua_url_do_banco
```

#### Service Worker
O arquivo `public/notification-sw.js` já está configurado para receber notificações push.

### 🎨 **Personalização**

#### Ícones e Emojis
Cada tipo de notificação tem ícones específicos:
- 🎉 Novos agendamentos
- 📝 Atualizações
- ❌ Cancelamentos
- ✅ Conclusões
- ⏰ Lembretes
- 💰 Pagamentos
- 🎁 Indicações
- ⚠️ Avisos
- 🚨 Alertas

#### Prioridades
- **High**: Agendamentos, pagamentos, alertas críticos
- **Normal**: Atualizações, lembretes, avisos
- **Low**: Informações gerais

### 🔄 **Fluxo de Notificação**

```
Evento → Serviço de Notificação → Banco de Dados + Push → Usuário
   ↓
Log de Atividade → Monitoramento → Estatísticas
```

### 📈 **Métricas Disponíveis**

- Total de notificações enviadas
- Taxa de entrega de push notifications
- Notificações por tipo
- Usuários mais ativos
- Horários de maior engajamento

### 🛠️ **Manutenção**

#### Limpeza Automática
- Notificações lidas > 30 dias são removidas automaticamente
- Logs antigos são limpos semanalmente

#### Backup
- Todas as notificações são salvas no banco
- Histórico completo disponível para consulta

### 🚨 **Troubleshooting**

#### Problemas Comuns

1. **Push Notifications não funcionam**
   - Verificar VAPID keys no .env
   - Confirmar service worker registrado
   - Verificar permissões do navegador

2. **Jobs não executam**
   - Verificar logs do servidor
   - Confirmar que cron está ativo
   - Verificar conectividade com banco

3. **Notificações duplicadas**
   - Verificar se não há múltiplas instâncias do job
   - Confirmar lógica de deduplicação

### 🔮 **Próximas Funcionalidades**

- [ ] Notificações por email
- [ ] Notificações por WhatsApp
- [ ] Templates personalizáveis
- [ ] Agendamento de notificações
- [ ] Analytics avançados
- [ ] A/B testing de notificações
- [ ] Segmentação avançada de usuários

### 📞 **Suporte**

Para dúvidas ou problemas com o sistema de notificações:
1. Verificar logs do servidor
2. Consultar este documento
3. Verificar configurações do .env
4. Testar com usuários específicos

---

O sistema de notificações está totalmente integrado e funcionando! 🎉
