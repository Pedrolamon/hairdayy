# Sistema de Indicações - Hairday

## Visão Geral

O sistema de indicações permite que usuários ganhem descontos e recebam pagamentos por indicar novos usuários para a plataforma.

## Como Funciona

### Para o Usuário que Indica:

1. **1ª indicação**: R$ 10 de desconto na mensalidade
2. **2ª indicação**: R$ 20 de desconto na mensalidade  
3. **3ª indicação**: R$ 30 de desconto (mensalidade gratuita!)
4. **4ª indicação em diante**: R$ 10 por indicação via PIX

### Para o Usuário Indicado:

- Pode usar o código de indicação durante o cadastro
- Não há custo adicional
- A indicação fica ativa enquanto o usuário mantém a assinatura

## Funcionalidades Implementadas

### 1. Código de Indicação
- Cada usuário recebe um código único de 8 caracteres (ex: ABC12345)
- Código é exibido na página de informações pessoais
- Pode ser copiado facilmente para compartilhamento

### 2. Processo de Cadastro
- Campo opcional para código de indicação no formulário de registro
- Sistema valida se o código existe e cria o vínculo
- Usuário indicado é automaticamente vinculado ao referrer

### 3. Dashboard do Usuário
- Mostra estatísticas de indicações
- Exibe desconto atual aplicado
- Mostra valor a receber via PIX
- Histórico de indicações e pagamentos

### 4. Dashboard de Admin
- Lista todos os pagamentos pendentes
- Permite marcar pagamentos como realizados
- Estatísticas gerais do sistema
- Informações de contato dos usuários

### 5. Processamento Automático
- Quando um usuário paga a mensalidade, os referrers são automaticamente creditados
- Quando um usuário cancela, as indicações são desativadas
- Pagamentos pendentes são cancelados automaticamente

## Estrutura do Banco de Dados

### Tabela `User`
- `referralCode`: Código único de indicação
- `referredBy`: Código do usuário que indicou (opcional)

### Tabela `Referral`
- `referrerId`: ID do usuário que fez a indicação
- `refereeId`: ID do usuário indicado
- `active`: Se a indicação está ativa
- `createdAt`: Data da indicação
- `activatedAt`: Data de ativação
- `deactivatedAt`: Data de desativação

### Tabela `ReferralPayout`
- `referrerId`: ID do usuário que receberá o pagamento
- `amount`: Valor do pagamento
- `status`: PENDING, PAID, CANCELLED
- `createdAt`: Data de criação
- `paidAt`: Data do pagamento
- `operatorId`: ID do admin que processou o pagamento

## APIs Disponíveis

### Para Usuários
- `GET /api/referral/my-referrals` - Buscar dados de indicações do usuário

### Para Admin
- `GET /api/referral/admin/payouts` - Listar todos os pagamentos
- `PATCH /api/referral/payout/:id` - Atualizar status de pagamento

### Para Sistema
- `POST /api/referral/process-payment` - Processar pagamento de indicação
- `POST /api/referral/cancel-referral` - Cancelar indicação

## Como Usar

### 1. Para Usuários Comuns

1. Acesse "Informações Pessoais" no menu
2. Copie seu código de indicação
3. Compartilhe com amigos
4. Acompanhe seus ganhos no Dashboard

### 2. Para Administradores

1. Acesse `/admin-referrals` no sistema
2. Veja a lista de pagamentos pendentes
3. Marque como "Pago" quando realizar o PIX
4. Adicione observações se necessário

### 3. Integração com Sistema de Pagamento

Quando um usuário paga a mensalidade, chame:
```javascript
await api.post('/api/referral/process-payment', { userId: 'user-id' });
```

Quando um usuário cancela, chame:
```javascript
await api.post('/api/referral/cancel-referral', { userId: 'user-id' });
```

## Exemplo de Fluxo

1. **João** se cadastra e recebe código `ABC12345`
2. **Maria** se cadastra usando código `ABC12345` de João
3. **Maria** paga a primeira mensalidade
4. **João** recebe R$ 10 de desconto na próxima mensalidade
5. **Pedro** se cadastra usando código `ABC12345` de João
6. **Pedro** paga a primeira mensalidade
7. **João** recebe R$ 20 de desconto na próxima mensalidade
8. **Ana** se cadastra usando código `ABC12345` de João
9. **Ana** paga a primeira mensalidade
10. **João** recebe R$ 30 de desconto (mensalidade gratuita!)
11. **Carlos** se cadastra usando código `ABC12345` de João
12. **Carlos** paga a primeira mensalidade
13. **João** recebe R$ 10 via PIX (processado pelo admin)

## Segurança

- Apenas administradores podem marcar pagamentos como realizados
- Códigos de indicação são únicos e não podem ser alterados
- Indicações são automaticamente desativadas quando usuário cancela
- Histórico completo de todas as operações é mantido

## Monitoramento

O sistema mantém logs de:
- Criação de indicações
- Ativação/desativação de indicações
- Criação de pagamentos
- Processamento de pagamentos
- Cancelamentos

## Próximos Passos

1. Integrar com gateway de pagamento para PIX automático
2. Adicionar notificações por email/WhatsApp
3. Implementar relatórios mais detalhados
4. Adicionar sistema de níveis (bronze, prata, ouro)
5. Implementar cashback para usuários indicados
