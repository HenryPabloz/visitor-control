<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">API de controle de visitantes, construída com <a href="http://nestjs.com/">NestJS</a> e <a href="https://www.prisma.io/">Prisma ORM 7</a>.</p>

## Descrição

API para controle de visitantes de uma empresa: cadastro de usuários do sistema (recepcionistas e administradores), cadastro de visitantes, registro de check-in/check-out de visitas, e controle de acesso por roles/permissions (RBAC), protegida por autenticação JWT e por API key de aplicação.

## Stack

- **[NestJS 11](https://nestjs.com/)** — framework Node.js/TypeScript
- **[Prisma ORM 7](https://www.prisma.io/)** com driver adapter (`@prisma/adapter-pg`) — sem motor em Rust, conecta direto via `pg`
- **PostgreSQL** — banco de dados
- **JWT** (`@nestjs/jwt` + `passport-jwt`) — autenticação de usuário
- **API key** (header `x-api-key`) — camada extra de autorização por aplicação cliente
- **class-validator / class-transformer** — validação e transformação dos DTOs
- **bcrypt** — hash de senha
- **@nestjs/swagger** — documentação interativa da API
- **Joi** (`@nestjs/config`) — validação das variáveis de ambiente

## Arquitetura

```
src/
├── auth/            # login, JWT, guards (JwtAuthGuard, PermissionsGuard, ApiKeyGuard), decorators
├── users/            # cadastro/consulta de usuários do sistema
├── visitors/         # cadastro/consulta de visitantes
├── visit/            # check-in/check-out de visitas (rotas em /visits)
├── database/prisma/  # PrismaService (conexão com o Postgres via driver adapter)
├── common/filters/   # filtro global que padroniza o formato das respostas de erro
└── config/           # validação das variáveis de ambiente (env.validation.ts)
```

O controle de acesso é feito por **roles** (`RECEPTIONIST`, `ADMIN`) e **permissions** (ex: `VISIT_CREATE`, `VISITOR_VIEW_SENSITIVE`, `USER_CHANGE_ROLE`), guardadas em tabelas no banco (`roles`, `permissions`, `role_permissions`) e verificadas em cada rota pelo decorator `@Permissions(...)` + `PermissionsGuard`.

Regras de negócio centrais (impedir visita duplicada, exigir dados de checkout, etc.) são garantidas em duas camadas: **procedures** do Postgres (`create_visitor`, `insert_visit`, `checkout_visit`) chamadas pelos services, e **triggers** no banco (`prevent_double_active_visit`, `prevent_double_checkout`, `audit_visits`) como defesa extra caso alguém grave direto na tabela. O documento do visitante (CPF, RG ou documento internacional, até 14 caracteres) é único no banco — não é possível cadastrar dois visitantes com o mesmo documento.

Cada rota documentada no Swagger indica explicitamente se a role `RECEPTIONIST` pode ou não executá-la, com base nas permissions atribuídas em `prisma/seed.ts`.

## Configuração

1. Instale as dependências:

```bash
npm install
```

2. Copie o `.env.example` para `.env` e preencha os valores:

```bash
cp .env.example .env
```

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | string de conexão do Postgres |
| `JWT_SECRET` | chave usada para assinar o token JWT (mínimo 16 caracteres) |
| `JWT_EXPIRATION` | tempo de validade do token (ex: `1h`, `24h`) |
| `API_KEY` | chave exigida no header `x-api-key` em toda rota da API |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | credenciais do usuário admin criado automaticamente pelo seed |
| `PORT` | porta em que o servidor sobe (padrão `3000`) |
| `NODE_ENV` | ambiente (`development`, `production` ou `test`) |

3. Rode as migrations (cria tabelas, procedures, triggers e constraints no banco):

```bash
npx prisma migrate dev
```

4. Popule as roles/permissions iniciais (`RECEPTIONIST`, `ADMIN` e suas permissões) e crie o usuário admin inicial (usa `ADMIN_EMAIL`/`ADMIN_PASSWORD` do `.env`) — sem isso não tem como logar pela primeira vez, já que criar um usuário pela API exige estar logado como alguém que já tenha a permissão `USER_CREATE`:

```bash
npx tsx prisma/seed.ts
```

## Rodando o projeto

```bash
# desenvolvimento
npm run start

# modo watch (recompila a cada alteração)
npm run start:dev

# produção
npm run start:prod
```

Depois de subir, a documentação interativa (Swagger) fica disponível em:

```
http://localhost:3000/api/docs
```

## Autenticação nas requisições

Toda rota da API exige o header `x-api-key` (com o valor de `API_KEY` do `.env`). Rotas fora do `/auth/login` também exigem `Authorization: Bearer <token>` (obtido no login) e a permissão correspondente à ação:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "x-api-key: <sua API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","password":"suaSenha"}'
```

## Principais rotas

| Método | Rota | Descrição | Permissão | Recepcionista |
|---|---|---|---|---|
| `POST` | `/auth/login` | autentica e devolve o token JWT | — | ✅ |
| `POST` | `/users` | cria um usuário do sistema | `USER_CREATE` | ❌ (só ADMIN) |
| `GET` | `/users` | lista usuários (paginado) | `USER_LIST` | ❌ (só ADMIN) |
| `GET` | `/users/:id` | busca um usuário pelo id | `USER_LIST` | ❌ (só ADMIN) |
| `PATCH` | `/users/me/password` | troca a própria senha | `USER_UPDATE_OWN` | ✅ |
| `DELETE` | `/users/:id` | exclui um usuário | `USER_DELETE` | ❌ (só ADMIN) |
| `POST` | `/visitors` | cadastra um visitante | `VISITOR_CREATE` | ✅ |
| `GET` | `/visitors/:id` | busca um visitante pelo id | `VISITOR_VIEW` | ✅ |
| `GET` | `/visitors` | lista visitantes (paginado) | `VISITOR_VIEW` | ✅ |
| `PATCH` | `/visitors/:id` | atualiza dados de um visitante (fullName, email, phone, company, purpose) | `VISITOR_UPDATE` | ✅ |
| `POST` | `/visits` | registra o check-in de uma visita | `VISIT_CREATE` | ✅ |
| `GET` | `/visits/:id` | busca uma visita pelo id | `VISIT_VIEW` | ✅ |
| `PATCH` | `/visits/:id/checkout` | registra o check-out de uma visita | `VISIT_CHECKOUT` | ✅ |
| `GET` | `/visits/active` | lista as visitas com status `ACTIVE` | `VISIT_VIEW` | ✅ |

A senha nova em `PATCH /users/me/password` não pode ser igual à senha atual, e o e-mail/documento em `PATCH /visitors/:id` e `POST /visitors` não podem repetir um já cadastrado em outro registro.

## Testes

```bash
# testes unitários
npm run test

# testes e2e
npm run test:e2e

# cobertura
npm run test:cov
```

## Prisma

```bash
# abrir o Prisma Studio (interface visual do banco)
npx prisma studio

# criar uma nova migration a partir de mudanças no schema.prisma
npx prisma migrate dev --name nome_da_mudanca

# regenerar o Prisma Client depois de editar o schema
npx prisma generate
```
