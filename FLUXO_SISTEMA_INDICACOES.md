# Fluxo do Sistema de Indicações

## Diagrama de Fluxo

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Usuário A     │    │   Usuário B     │    │   Usuário C     │
│  (Referrer)     │    │  (Referee)      │    │  (Referee)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. Cadastra           │ 2. Cadastra           │ 3. Cadastra
         │    recebe código      │    usa código A       │    usa código A
         │    ABC12345           │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Código: ABC12345│    │ Indicação criada│    │ Indicação criada│
│ Indicações: 0   │    │ para Usuário A  │    │ para Usuário A  │
│ Desconto: R$ 0  │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │ 4. Paga mensalidade   │ 5. Paga mensalidade
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Indicações: 1   │    │ Assinatura      │    │ Assinatura      │
│ Desconto: R$ 10 │    │ ATIVA           │    │ ATIVA           │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Indicações: 2   │    │ Indicação       │    │ Indicação       │
│ Desconto: R$ 20 │    │ ATIVA           │    │ ATIVA           │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Indicações: 3   │    │ Indicação       │    │ Indicação       │
│ Desconto: R$ 30 │    │ ATIVA           │    │ ATIVA           │
│ (GRATUITO!)     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Indicações: 4+  │    │ Indicação       │    │ Indicação       │
│ PIX: R$ 10      │    │ ATIVA           │    │ ATIVA           │
│ por indicação   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Fluxo de Cancelamento

```
┌─────────────────┐    ┌─────────────────┐
│   Usuário B     │    │   Usuário A     │
│  (Referee)      │    │  (Referrer)     │
└─────────────────┘    └─────────────────┘
         │                       │
         │ 1. Cancela            │
         │    assinatura         │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│ Indicação       │    │ Indicações: -1  │
│ DESATIVADA      │    │ Desconto/PIX    │
│                 │    │ recalculado     │
└─────────────────┘    └─────────────────┘
```

## Estados do Sistema

### Usuário Referrer (Quem Indica)
- **0 indicações**: Sem desconto
- **1 indicação**: R$ 10 desconto
- **2 indicações**: R$ 20 desconto  
- **3 indicações**: R$ 30 desconto (gratuito)
- **4+ indicações**: R$ 10 PIX por indicação adicional

### Usuário Referee (Quem é Indicado)
- **Ativo**: Indicação conta para o referrer
- **Inativo**: Indicação não conta (cancelou assinatura)

### Pagamentos
- **PENDING**: Aguardando pagamento via PIX
- **PAID**: Pago pelo admin
- **CANCELLED**: Cancelado (usuário cancelou assinatura)

## Processo de Pagamento

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Usuário       │    │   Sistema       │    │   Admin         │
│   Paga          │    │   Processa      │    │   Paga PIX      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. Paga mensalidade   │                       │
         │                       │                       │
         ▼                       │                       │
┌─────────────────┐              │                       │
│ Pagamento       │              │                       │
│ Confirmado      │              │                       │
└─────────────────┘              │                       │
         │                       │                       │
         │ 2. Notifica sistema   │                       │
         │                       │                       │
         ▼                       ▼                       │
┌─────────────────┐    ┌─────────────────┐              │
│ Aguarda         │    │ Cria pagamentos │              │
│ processamento   │    │ PENDING para    │              │
│                 │    │ referrers       │              │
└─────────────────┘    └─────────────────┘              │
                                │                       │
                                │ 3. Notifica admin     │
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Lista pagamentos│    │ Marca como PAID │
                       │ pendentes       │    │ após PIX        │
                       └─────────────────┘    └─────────────────┘
```

## Regras de Negócio

1. **Código único**: Cada usuário tem um código de 8 caracteres
2. **Indicação única**: Um usuário só pode ser indicado uma vez
3. **Ativação automática**: Indicação fica ativa quando usuário paga
4. **Desativação automática**: Indicação fica inativa quando usuário cancela
5. **Desconto máximo**: R$ 30 (3 indicações = mensalidade gratuita)
6. **PIX automático**: A partir da 4ª indicação, R$ 10 por indicação
7. **Cancelamento**: Se usuário cancela, referrer perde a indicação
8. **Histórico**: Todas as operações são registradas
