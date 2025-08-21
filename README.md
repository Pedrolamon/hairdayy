# Hairday - Sistema para Barbearias

## Descrição
Sistema web completo para gestão de barbearias, com agendamento online (chatbot), painel do barbeiro/admin, controle financeiro, clientes, serviços e disponibilidade. Feito com React (Vite, Tailwind), Node.js/Express, TypeORM e PostgreSQL.

---

## Funcionalidades
- **Agendamento online** (chatbot para clientes)
- **Painel do barbeiro/admin** (agenda, serviços, clientes, financeiro, disponibilidade)
- **Gestão de clientes** (histórico, notas)
- **Gestão financeira** (receitas, despesas, relatórios)
- **Gestão de disponibilidade** (bloqueios, horários de trabalho)
- **Autenticação JWT**
- **Responsivo e acessível**

---

## Tecnologias
- **Frontend:** React, Vite, Tailwind CSS, React Router, Context API
- **Backend:** Node.js, Express, TypeORM, PostgreSQL, JWT
- **Testes:** Jest, React Testing Library

---

## Instalação e Setup

### 1. Clone o repositório
```bash
 git clone <repo-url>
 cd hairday
```

### 2. Instale as dependências
```bash
 npm install
```

### 3. Configure o banco de dados
- Crie um banco PostgreSQL (local ou cloud)
- Copie `.env.example` para `.env` e preencha:
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
DB_DATABASE=hairday
JWT_SECRET=sua_chave_secreta
JWT_EXPIRES_IN=1d
```

### 4. Rode o backend
```bash
 cd src/backend
 npm install
 npm run dev
```

### 5. Rode o frontend
```bash
 cd ../../
 npm run dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

---

## Principais Endpoints (Backend)

- **Auth:**
  - `POST /api/auth/login` - Login (JWT)
  - `GET /api/auth/me` - Dados do usuário autenticado
- **Serviços:**
  - `GET/POST/PUT/DELETE /api/services`
- **Agendamentos:**
  - `GET/POST/PUT/DELETE /api/appointments`
  - `GET /api/appointments/available` - Horários disponíveis
- **Barbeiros:**
  - `GET /api/barbers/availability` - Bloqueios de disponibilidade
  - `POST /api/barbers/availability` - Criar bloqueio
  - `DELETE /api/barbers/availability/:id` - Remover bloqueio
  - `GET /api/barbers/clients` - Listar clientes
  - `GET /api/barbers/clients/:id` - Detalhes/histórico do cliente
  - `PUT /api/barbers/clients/:id/notes` - Salvar notas
- **Financeiro:**
  - `GET /api/financial/report` - Relatório financeiro
  - `POST /api/financial` - Lançar receita/despesa
  - `PUT /api/financial/:id` - Editar registro
  - `DELETE /api/financial/:id` - Remover registro

---

## Variáveis de Ambiente
Veja `.env.example` para todas as variáveis necessárias.

---

## Deploy
- **Frontend:** Pode ser hospedado em Vercel, Netlify, etc.
- **Backend:** Pode ser hospedado em Render, Heroku, VPS, etc.
- **Banco:** PostgreSQL local ou cloud (Supabase, Neon, ElephantSQL, etc).

---

## Testes
```bash
npm test
```

---

## Licença
MIT
