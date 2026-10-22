# Library

Aplicativo mobile de biblioteca pessoal para organizar livros, acompanhar o progresso de leitura, registrar sessões, definir metas e receber lembretes locais para manter o hábito de ler. Também é social: você segue amigos, acompanha um feed de resenhas e conquistas, participa de clubes do livro com metas coletivas e conversa pelo chat.

O repositório contém o aplicativo React Native com Expo (`/app`), a API REST própria em Node.js (`/api`) e a documentação do projeto.

**Versão web publicada:** https://sabrinameloborges.github.io/library-app/ (API em https://library-api-q6ey.onrender.com, documentação em `/docs`).

## Sumário

1. [Problema](#problema)
2. [Como o Library resolve o problema](#como-o-library-resolve-o-problema)
3. [Justificativa pessoal](#justificativa-pessoal)
4. [Funcionalidades](#funcionalidades)
5. [Tecnologias](#tecnologias)
6. [Estrutura do projeto](#estrutura-do-projeto)
7. [Pré-requisitos](#pré-requisitos)
8. [API: instalação e execução](#api-instalação-e-execução)
9. [Aplicativo: instalação e execução](#aplicativo-instalação-e-execução)
10. [Variáveis de ambiente](#variáveis-de-ambiente)
11. [Deploy](#deploy)
12. [Banco de dados e migrations](#banco-de-dados-e-migrations)
13. [Testes](#testes)
14. [Endpoints](#endpoints)
15. [DER do banco de dados](#der-do-banco-de-dados)
16. [Telas](#telas)
17. [Mapa dos requisitos acadêmicos](#mapa-dos-requisitos-acadêmicos)
18. [Decisões técnicas](#decisões-técnicas)
19. [Limitações conhecidas](#limitações-conhecidas)
20. [Integrantes](#integrantes)

## Problema

Quem lê com frequência costuma espalhar as informações das leituras entre anotações, planilhas, aplicativos de e-book e a própria memória. Fica difícil saber quantas páginas foram lidas no mês, quais livros estão parados, quanto tempo foi dedicado à leitura e se uma meta anual está sendo cumprida. Sem um registro simples, o hábito se perde.

## Como o Library resolve o problema

- Centraliza a biblioteca pessoal, com status de leitura, progresso, favoritos e avaliações.
- Permite pesquisar livros no catálogo do Open Library e adicioná-los com capa, autores, editora e páginas, ou cadastrá-los manualmente.
- Registra sessões de leitura (páginas, duração, data e observação) e atualiza o progresso automaticamente.
- Calcula metas de livros, páginas, minutos ou dias de leitura a partir dos registros reais, sem contar páginas repetidas.
- Mostra um painel com indicadores do ano e atividade recente.
- Envia lembretes locais no horário e nos dias escolhidos.
- Transforma a leitura em hábito compartilhado: amizades, feed, clubes do livro com metas em conjunto, conversas e conquistas comemoradas como no Duolingo.

## Justificativa pessoal

> **Proposta editável — revisar e reescrever com as experiências reais do grupo antes da entrega.**
>
> O Library nasceu da vontade de transformar a leitura em um hábito acompanhável. No dia a dia, a rotina de estudo e trabalho faz com que livros fiquem pela metade sem que se perceba. Ter em um só lugar o que está sendo lido, quanto já foi avançado e um lembrete gentil no fim do dia ajuda a retomar a leitura com regularidade. O projeto também serve para praticar, de ponta a ponta, o desenvolvimento de um aplicativo mobile integrado a uma API própria.

## Funcionalidades

| Área | O que faz |
| --- | --- |
| Autenticação | Cadastro, login, login com Google na versão web, logout com revogação da sessão no servidor, restauração automática da sessão. |
| Biblioteca | CRUD de livros do usuário, pesquisa por título/autor, filtro por status, ordenação, alternância lista/grade, favorito, avaliação de 1 a 5 e resenha. |
| Feedback | Mensagens de sucesso ao salvar, atualizar ou excluir livros, sessões e metas; erros do servidor exibidos junto aos campos. |
| Catálogo externo | Busca no Open Library com debounce, carregamento, erro, lista vazia, nova tentativa e cadastro manual alternativo. |
| Sessões de leitura | Registro, edição e exclusão com recálculo do progresso; histórico por livro. |
| Metas | Livros concluídos, páginas lidas, minutos ou dias de leitura; períodos diário, semanal, mensal, anual ou personalizado; estado e percentual calculados no backend. |
| Dashboard | Saudação, livros em andamento, concluídos no ano, páginas e tempo do ano, meta anual, continue lendo e atividade recente. |
| Estatísticas | Indicadores do ano e totais, distribuição por status e progresso das metas. |
| Lembretes | Notificações locais diárias ou semanais, seleção de horário e dias, notificação de teste, reconciliação ao abrir o app. |
| Preferências | Tema claro/escuro e visualização da biblioteca persistidos no AsyncStorage. |
| Amigos | Nome de usuário, busca de pessoas, seguir e deixar de seguir, perfis públicos com estantes, estatísticas e conquistas. Quem se segue mutuamente vira amigo. |
| Feed | Livros iniciados e concluídos, resenhas, metas batidas e conquistas de quem você segue, com curtidas e comentários. O compartilhamento pode ser desligado nas configurações. |
| Clubes do livro | Criação de clubes, convite por código ou adição de amigos, leitura do momento, metas coletivas que somam a leitura de todos os membros e ranking de contribuição. |
| Conversas | Chat direto entre amigos e chat em grupo de cada clube, com contagem de não lidas. |
| Conquistas | 16 conquistas em três níveis (bronze, prata e ouro), como “Primeira página”, “Cem páginas”, “Meta batida”, “Semana de leitura” e “Leitor voraz”, com tela de comemoração e publicação no feed. |
| Explorar | Atalhos por gênero na tela inicial que pesquisam o catálogo por assunto; descrição e assuntos da obra trazidos do Open Library. |

Status de leitura: Quero ler, Lendo, Concluído, Pausado e Abandonado.

## Tecnologias

**Aplicativo (`/app`)**: Expo SDK 57, React Native 0.86, React 19, TypeScript, React Navigation 7 (Native Stack + Bottom Tabs), React Native Paper 5, Context API, Axios, AsyncStorage, Expo SecureStore, Expo Notifications, Expo Font (Cormorant Garamond e Inter), Jest + jest-expo + Testing Library.

**API (`/api`)**: Node.js 20+, Express 5, TypeScript, Prisma 6, MySQL 8, JWT (HS256) com sessões revogáveis, bcrypt (bcryptjs), Zod, Helmet, CORS restrito, express-rate-limit, Swagger UI (OpenAPI 3), Vitest + Supertest.

**Ferramentas**: Git, ESLint, Prettier, migrations versionadas do Prisma, Docker Compose para o MySQL local.

## Estrutura do projeto

```
library-app/
├── app/                         Aplicativo React Native (Expo)
│   ├── App.tsx                  Providers (SafeArea, Theme, Paper, Snackbar, Auth, Celebration) e navegação
│   ├── app.json                 Configuração do Expo e plugins
│   └── src/
│       ├── __tests__/           Testes do app (Jest)
│       ├── components/          Componentes reutilizáveis (BookListItem, FeedItemCard, AchievementBadge, ShelfCard...)
│       ├── context/             AuthContext, ThemeContext, SnackbarContext e CelebrationContext
│       ├── hooks/               useAuth, useBookSearch, useLibrary, useActivityList, useChat, useProfile...
│       ├── navigation/          RootNavigator (Stack), MainTabs (Bottom Tabs) e tipos de rotas
│       ├── screens/             Telas (auth, início, biblioteca, comunidade, clubes, perfil, conversas...)
│       ├── services/            Cliente HTTP, serviços da API, catálogo, SecureStore, AsyncStorage, notificações
│       ├── theme/               Paleta, tema do Paper e espaçamentos
│       ├── types/               Tipos da API
│       └── utils/               Validações, datas e rótulos
├── api/                         API REST (Express)
│   ├── prisma/
│   │   ├── schema.prisma        Modelo do banco
│   │   ├── migrations/          Migrations versionadas
│   │   └── seed.ts              Dados de demonstração
│   ├── src/
│   │   ├── config/              Variáveis de ambiente e injeção de dependências
│   │   ├── controllers/         Controllers e presenters
│   │   ├── docs/                Documento OpenAPI
│   │   ├── domain/              Entidades e regras puras (progresso, métricas, metas, conquistas, calendário)
│   │   ├── errors/              AppError
│   │   ├── middlewares/         Autenticação, erros, segurança, logs
│   │   ├── repositories/        Contratos, implementação Prisma e implementação em memória
│   │   ├── routes/              Rotas /api/v1
│   │   ├── services/            Regras de negócio
│   │   ├── validators/          Schemas Zod
│   │   ├── app.ts               Montagem do Express
│   │   └── server.ts            Inicialização
│   └── tests/                   Testes unitários e de integração (Vitest + Supertest)
├── docs/screenshots/            Capturas das telas
├── docker-compose.yml           MySQL 8 local
└── README.md
```

## Pré-requisitos

- Node.js 20 ou superior e npm.
- MySQL 8 (via Docker Compose ou instalação local).
- Expo Go no celular (Android/iOS) ou um emulador Android / simulador iOS.

## API: instalação e execução

```bash
cd api
npm install
cp .env.example .env            # no Windows (PowerShell): Copy-Item .env.example .env
```

Edite `.env` e defina um `JWT_SECRET` aleatório com pelo menos 32 caracteres. Para gerar um:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Suba o banco e aplique as migrations:

```bash
npm run db:up                   # docker compose up -d (MySQL 8 na porta 3306)
npx prisma migrate deploy       # aplica as migrations versionadas
```

**Sem Docker (MySQL instalado localmente):** qualquer MySQL 8 serve. Crie o banco e um usuário, ajuste `DATABASE_URL` no `.env` e rode `npx prisma migrate deploy`:

```sql
CREATE DATABASE library CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE library_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'library'@'localhost' IDENTIFIED BY 'sua-senha';
GRANT ALL PRIVILEGES ON *.* TO 'library'@'localhost';
```

O privilégio global só é necessário para o `prisma migrate dev`, que cria um banco temporário de comparação. Para apenas aplicar migrations, basta `GRANT ALL PRIVILEGES ON library.* ...`.

O **MySQL Workbench** é apenas um cliente: conecte-o em `127.0.0.1:3306` com o usuário `library` para ver as tabelas e os dados.

Dados de demonstração (opcional, apenas em desenvolvimento). A senha do usuário demo vem de variável de ambiente, nunca do código:

```bash
# bash
SEED_DEMO_PASSWORD="escolha-uma-senha1" npm run db:seed
# PowerShell
$env:SEED_DEMO_PASSWORD="escolha-uma-senha1"; npm run db:seed
```

O seed cria três leitores com a mesma senha: `demo@library.local` (Leitora Demo), `bruno@library.local` e `clara@library.local`. Eles já se seguem, participam do “Clube Dark Academia” (código `DARKACAD`) com uma meta coletiva, têm livros, sessões, conquistas, mensagens e atividades no feed.

Inicie a API:

```bash
npm run dev                     # desenvolvimento com recarga automática
# ou
npm run build && npm start      # build de produção
```

- API: `http://localhost:3333/api/v1`
- Health check: `http://localhost:3333/api/v1/health`
- Swagger: `http://localhost:3333/docs`

Para encerrar o banco: `npm run db:down` (os dados ficam no volume `library-mysql-data`).

**Modo sem banco (somente demonstração local):** com `DATA_STORE=memory` a API usa repositórios em memória, com as mesmas regras de negócio, e dispensa o MySQL. Os dados são perdidos ao reiniciar e o modo é bloqueado quando `NODE_ENV=production`.

## Aplicativo: instalação e execução

```bash
cd app
npm install
cp .env.example .env            # opcional, veja "Endereço da API no Expo"
npx expo start
```

Abra no Expo Go lendo o QR Code, ou pressione `a` (Android) / `i` (iOS) no terminal.

### Endereço da API no Expo

O app resolve o endereço da API nesta ordem:

1. `EXPO_PUBLIC_API_URL`, se definida em `app/.env`.
2. O IP da máquina que está rodando o Metro (detectado pelo Expo), com a porta `3333`.
3. `http://localhost:3333/api/v1`.

`localhost` dentro do celular ou do emulador aponta para o próprio aparelho, não para o seu computador. Por isso:

| Onde o app roda | Endereço recomendado |
| --- | --- |
| Celular físico com Expo Go | IP do computador na rede local, ex.: `http://192.168.0.10:3333/api/v1` (celular e computador na mesma rede Wi-Fi). Normalmente a detecção automática já resolve. |
| Emulador Android | `http://10.0.2.2:3333/api/v1` (alias do host no emulador) ou o IP da rede local. |
| Simulador iOS | `http://localhost:3333/api/v1` funciona, pois o simulador compartilha a rede do Mac. |
| Navegador (`npx expo start --web`) | `http://localhost:3333/api/v1` e inclua `http://localhost:8081` em `CORS_ORIGINS` da API. |

Após alterar `.env`, reinicie o Metro com `npx expo start --clear`. O endereço em uso aparece na tela **Perfil**.

Se o celular não conseguir acessar a API, verifique o firewall do computador (porta 3333 liberada para a rede privada).

### Build

```bash
npx expo export --platform android   # gera o bundle JavaScript de produção
npx eas-cli build -p android --profile preview   # APK/AAB via EAS (requer conta Expo)
```

## Variáveis de ambiente

### API (`api/.env`)

| Variável | Obrigatória | Padrão | Descrição |
| --- | --- | --- | --- |
| `NODE_ENV` | não | `development` | `development`, `test` ou `production`. |
| `PORT` | não | `3333` | Porta HTTP. |
| `DATABASE_URL` | sim (MySQL) | — | `mysql://usuario:senha@host:3306/banco`. |
| `DATA_STORE` | não | `mysql` | `mysql` ou `memory` (somente desenvolvimento). |
| `JWT_SECRET` | sim | — | Segredo do JWT, mínimo de 32 caracteres. |
| `JWT_EXPIRES_IN_HOURS` | não | `168` | Validade do token (máximo 720). |
| `BCRYPT_COST` | não | `12` | Custo do hash de senha. |
| `CORS_ORIGINS` | não | vazio | Origens web permitidas, separadas por vírgula. Apps nativos não enviam `Origin`. |
| `GOOGLE_CLIENT_ID` | não | vazio | Client ID OAuth (tipo Web) do Google. Sem ele, `/auth/google` responde 503. |
| `APP_TIMEZONE` | não | `America/Sao_Paulo` | Fuso usado para agrupar dias, anos e períodos de metas. |
| `RATE_LIMIT_WINDOW_MINUTES` | não | `15` | Janela do rate limit. |
| `RATE_LIMIT_MAX_REQUESTS` | não | `300` | Limite geral por IP na janela. |
| `AUTH_RATE_LIMIT_MAX_REQUESTS` | não | `20` | Tentativas de login/cadastro com falha por IP na janela. |

### App (`app/.env`)

| Variável | Descrição |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | URL base da API, ex.: `http://192.168.0.10:3333/api/v1`. Opcional. |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | Client ID OAuth (tipo Web) do Google. Sem ele, o botão "Continuar com o Google" não aparece. Opcional. |

Arquivos `.env` reais não são versionados. Apenas os `.env.example` entram no Git.

## Deploy

| Parte | Onde | Como |
| --- | --- | --- |
| Banco | Aiven for MySQL (plano Free) | MySQL 8.4 gerenciado. A `DATABASE_URL` usa `?sslaccept=accept_invalid_certs` para conexão TLS. |
| API | Render (plano Free), definida em `render.yaml` | Build com `npm ci --include=dev && npx prisma generate && npm run build`; ao iniciar, aplica as migrations com `prisma migrate deploy`. Variáveis: `DATABASE_URL`, `JWT_SECRET` (gerado pelo Render), `CORS_ORIGINS` e `GOOGLE_CLIENT_ID`. |
| Web | GitHub Pages, via `.github/workflows/pages.yml` | A cada push na `main`, gera a versão web com `expo export` (`baseUrl` `/library-app`) usando as variáveis do repositório `EXPO_PUBLIC_API_URL` e `EXPO_PUBLIC_GOOGLE_CLIENT_ID`. |

No plano gratuito, a API hiberna após 15 minutos sem uso e a primeira requisição seguinte pode levar cerca de 50 segundos. O login com Google usa o Google Identity Services e está disponível apenas na versão web; no app nativo o login é por e-mail e senha.

## Banco de dados e migrations

- Banco: MySQL 8 (Docker Compose em `docker-compose.yml`, imagem `mysql:8.4`).
- ORM: Prisma. Modelo em `api/prisma/schema.prisma`.
- Migration inicial: `api/prisma/migrations/20261013000000_init/migration.sql`, com tabelas, índices, chaves estrangeiras e restrições `CHECK` (página atual dentro do total, avaliação de 1 a 5, página final maior que a inicial, duração entre 1 e 1440 minutos, meta positiva e datas coerentes).
- Migration social: `api/prisma/migrations/20261014000000_social_and_achievements/migration.sql`, com seguidores, clubes, membros, atividades, curtidas, comentários, conquistas, conversas e mensagens. Ela cria `username` para usuários já existentes antes de torná-lo obrigatório, então pode ser aplicada sobre um banco com dados.

Comandos úteis (dentro de `/api`):

```bash
npx prisma migrate deploy        # aplica migrations pendentes
npx prisma migrate dev --name x  # cria uma nova migration a partir do schema (desenvolvimento)
npx prisma studio                # inspeciona os dados
```

O catálogo bibliográfico (`books`) é separado da relação do usuário com o livro (`user_books`). Livros vindos do Open Library são compartilhados entre usuários pela chave única (`external_source`, `external_id`). Se um usuário edita título ou autor de um livro compartilhado, a API cria uma cópia pessoal para não alterar o livro dos outros.

## Testes

### API

```bash
cd api
npm test            # Vitest: unitários (regras de domínio) + integração HTTP com repositórios em memória
npm run test:mysql  # os mesmos testes de integração contra o MySQL (usa TEST_DATABASE_URL do .env)
npm run typecheck
npm run lint
```

Os testes de integração sobem o Express completo, com repositórios em memória (`npm test`) ou com Prisma + MySQL (`npm run test:mysql`, que exige o banco `library_test` com as migrations aplicadas), e cobrem: cadastro, login, `/me`, logout com revogação do token, CRUD da biblioteca, validações do backend, busca/filtro/ordenação, livro compartilhado e cópia pessoal, sessões com recálculo de progresso, páginas sem duplicidade, metas, dashboard e **isolamento entre usuários** (acesso por ID de outro usuário retorna 404).

### Aplicativo

```bash
cd app
npm test            # Jest (jest-expo)
npm run typecheck
npm run lint
npx expo-doctor
```

Cobrem: validação dos formulários, parsing e erros do catálogo externo, `useBookSearch` (ocioso, carregamento, sucesso, vazio, erro e nova tentativa), `AuthContext` (login, token no header `Authorization`, persistência no SecureStore, restauração e logout), `ThemeContext` (persistência no AsyncStorage), agendamento/cancelamento/reconciliação de lembretes (com `expo-notifications` simulado), a biblioteca em FlatList navegando para os detalhes com `bookId` (com estados vazio e de erro com nova tentativa), a tela de detalhes recebendo `bookId` (válido, inválido e inexistente, salvando alterações com feedback de sucesso), o cartão do feed (resenha, curtida, comentários e exaltação de conquistas) e a tela de comemoração de conquistas (exibição e marcação como vista).

Na API, além do núcleo, os testes cobrem: nome de usuário, busca de pessoas, seguir/deixar de seguir, amizade mútua, feed com resenhas e livros concluídos, privacidade do compartilhamento, curtidas, comentários e permissão de exclusão, desbloqueio de conquistas (primeiro acesso, 100 páginas, meta batida, primeiro livro concluído), conclusão de metas, clubes (convite por código, só amigos podem ser adicionados, metas coletivas somando membros, saída e exclusão) e conversas (apenas entre amigos, não lidas, isolamento de quem não participa e chat do clube).

### Resultado da última execução

| Verificação | Resultado |
| --- | --- |
| API — Vitest (memória) | 66 testes passando (12 arquivos) |
| API — Vitest contra MySQL 8.4 (`npm run test:mysql`) | 47 testes de integração passando (8 arquivos) |
| API — `prisma migrate deploy` + `prisma migrate diff` no MySQL 8.4 | 2 migrations aplicadas do zero, sem divergência entre banco e schema, 9 restrições `CHECK` ativas |
| API — `tsc` e ESLint | sem erros |
| App — Jest | 48 testes passando (9 suítes) |
| App — `tsc`, ESLint e `expo-doctor` | sem erros |
| App — `expo export --platform android` | bundle gerado |
| Fluxo ponta a ponta na versão web (Edge headless) contra a API com MySQL | login, dashboard, feed, clubes, metas coletivas, chat, perfil, busca de pessoas, perfil de amigo, conquistas e detalhes do livro, nos temas claro e escuro, sem erros de console |
| Cadastro de usuário novo na versão web | tela de comemoração da conquista “Primeira página” exibida |

Não executado neste ambiente: notificações em aparelho físico. Veja [Limitações conhecidas](#limitações-conhecidas).

### Roteiro de teste manual no dispositivo

1. Suba a API com MySQL e rode o seed.
2. Abra o app no Expo Go e entre com o usuário demo ou crie uma conta.
3. Em **Início**, toque em **Livro**, pesquise um título, adicione e confira os detalhes.
4. Registre uma sessão e veja o progresso e o dashboard mudarem.
5. Crie uma meta em **Metas**.
6. Em **Perfil > Configurações > Lembretes de leitura**, ative os lembretes, conceda a permissão, toque em **Enviar notificação de teste**, minimize o app e aguarde 5 segundos.
7. Altere o horário, salve e confira em "Lembretes agendados". Desative e confira que o número volta a zero.
8. Em **Comunidade**, curta e comente uma resenha, abra o **Clube Dark Academia**, veja a meta coletiva e envie uma mensagem no chat do clube.
9. Entre em outro aparelho (ou navegador) como `bruno@library.local` e confira a mensagem e a curtida.

## Endpoints

Base: `/api/v1`. Rotas marcadas com 🔒 exigem `Authorization: Bearer <token>`. Documentação interativa em `/docs`.

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/health` | Verificação de disponibilidade |
| POST | `/auth/register` | Cria conta e retorna `{ token, expiresAt, user }` |
| POST | `/auth/login` | Autentica e retorna `{ token, expiresAt, user }` |
| POST | `/auth/google` | Valida o ID token do Google, cria ou vincula a conta pelo e-mail e retorna `{ token, expiresAt, user }` |
| GET | `/auth/me` 🔒 | Usuário autenticado |
| POST | `/auth/logout` 🔒 | Revoga a sessão do token atual |
| GET | `/library` 🔒 | Lista livros (`status`, `q`, `favorites`, `sort`, `order`) |
| POST | `/library` 🔒 | Adiciona livro (manual ou do catálogo) |
| GET | `/library/:id` 🔒 | Detalhes |
| PATCH | `/library/:id` 🔒 | Atualiza dados, status, página, favorito, avaliação |
| DELETE | `/library/:id` 🔒 | Remove o livro e suas sessões |
| GET | `/reading-sessions` 🔒 | Histórico (`userBookId`, `limit`) |
| POST | `/reading-sessions` 🔒 | Registra sessão e atualiza o progresso |
| PATCH | `/reading-sessions/:id` 🔒 | Edita sessão e recalcula o progresso |
| DELETE | `/reading-sessions/:id` 🔒 | Remove sessão e recalcula o progresso |
| GET | `/goals` 🔒 | Lista metas com progresso |
| POST | `/goals` 🔒 | Cria meta |
| GET | `/goals/:id` 🔒 | Detalhes da meta |
| PATCH | `/goals/:id` 🔒 | Atualiza meta |
| DELETE | `/goals/:id` 🔒 | Remove meta |
| GET | `/statistics/overview` 🔒 | Dados do dashboard e da tela de estatísticas |
| GET | `/users/search?q=` 🔒 | Busca pessoas por nome ou usuário |
| PATCH | `/users/me` 🔒 | Atualiza nome, usuário, bio e compartilhamento no feed |
| GET | `/users/me/friends` 🔒 | Amigos (seguem um ao outro) |
| GET | `/users/:id` 🔒 | Perfil público: estantes, estatísticas, lendo agora e conquistas |
| POST / DELETE | `/users/:id/follow` 🔒 | Segue / deixa de seguir |
| GET | `/users/:id/followers` · `/users/:id/following` 🔒 | Listas de conexões |
| GET | `/users/:id/activities` · `/users/:id/achievements` 🔒 | Atividades e conquistas da pessoa |
| GET | `/feed` 🔒 | Atividades suas e de quem você segue (`before`, `limit`) |
| POST / DELETE | `/activities/:id/likes` 🔒 | Curte / descurte |
| GET / POST | `/activities/:id/comments` 🔒 | Lista / adiciona comentários |
| DELETE | `/activities/:id/comments/:commentId` 🔒 | Remove comentário (autor do comentário ou da atividade) |
| GET | `/achievements` 🔒 | Catálogo de conquistas com status e progresso |
| GET | `/achievements/pending` 🔒 | Conquistas desbloqueadas ainda não comemoradas |
| POST | `/achievements/seen` 🔒 | Marca conquistas como vistas |
| GET / POST | `/clubs` 🔒 | Lista / cria clubes |
| POST | `/clubs/join` 🔒 | Entra com código de convite |
| GET / PATCH / DELETE | `/clubs/:id` 🔒 | Detalhes (membros, metas coletivas, contribuições) / edita / exclui (dono) |
| POST | `/clubs/:id/members` 🔒 | Adiciona um amigo (dono) |
| DELETE | `/clubs/:id/members/:userId` 🔒 | Remove membro (dono) ou sai do clube |
| POST | `/clubs/:id/goals` 🔒 | Cria meta coletiva (dono) |
| PATCH / DELETE | `/clubs/:id/goals/:goalId` 🔒 | Edita / remove meta coletiva (dono) |
| GET | `/conversations` 🔒 | Conversas com última mensagem e não lidas |
| POST | `/conversations/direct` 🔒 | Abre conversa direta com um amigo |
| GET | `/conversations/:id` 🔒 | Detalhes da conversa |
| GET / POST | `/conversations/:id/messages` 🔒 | Mensagens (`after` para buscar novas) / envia |
| POST | `/conversations/:id/read` 🔒 | Marca como lida |

Erros seguem o formato `{ "error": { "code", "message", "details": [{ "field", "message" }] } }`.

## DER do banco de dados

Reflete exatamente as tabelas das migrations `20261013000000_init` e `20261014000000_social_and_achievements`. O núcleo de leitura e a parte social estão em dois diagramas para facilitar a leitura.

### Núcleo de leitura

```mermaid
erDiagram
    users ||--o{ auth_sessions : "possui"
    users ||--o{ user_books : "mantém"
    users ||--o{ reading_sessions : "registra"
    users ||--o{ reading_goals : "define"
    users |o--o{ books : "cadastra manualmente"
    books ||--o{ user_books : "aparece em"
    user_books ||--o{ reading_sessions : "recebe"
    book_clubs |o--o{ reading_goals : "metas coletivas"

    users {
        CHAR(36) id PK
        VARCHAR(80) name
        VARCHAR(30) username UK
        VARCHAR(160) email UK
        VARCHAR(255) password_hash
        VARCHAR(64) google_id UK "nullable"
        VARCHAR(160) bio
        BOOLEAN share_activity
        DATETIME created_at
        DATETIME updated_at
    }

    auth_sessions {
        CHAR(36) id PK "jti do token"
        CHAR(36) user_id FK
        DATETIME expires_at
        DATETIME revoked_at "nulo enquanto ativa"
        DATETIME created_at
    }

    books {
        CHAR(36) id PK
        VARCHAR(255) title
        VARCHAR(255) authors
        VARCHAR(160) publisher
        INT page_count
        VARCHAR(500) cover_url
        VARCHAR(20) isbn
        TEXT description
        VARCHAR(255) subjects
        VARCHAR(40) external_source "UK composta"
        VARCHAR(120) external_id "UK composta"
        CHAR(36) created_by_user_id FK "nulo para catálogo externo"
        DATETIME created_at
        DATETIME updated_at
    }

    user_books {
        CHAR(36) id PK
        CHAR(36) user_id FK "UK (user_id, book_id)"
        CHAR(36) book_id FK
        ENUM status "WANT_TO_READ, READING, FINISHED, PAUSED, ABANDONED"
        INT total_pages "CHECK > 0"
        INT current_page "CHECK 0..total_pages"
        TINYINT rating "CHECK 1..5"
        BOOLEAN is_favorite
        TEXT review
        DATETIME started_at
        DATETIME finished_at
        DATETIME created_at
        DATETIME updated_at
    }

    reading_sessions {
        CHAR(36) id PK
        CHAR(36) user_id FK
        CHAR(36) user_book_id FK
        INT start_page "CHECK >= 0"
        INT end_page "CHECK > start_page"
        INT duration_minutes "CHECK 1..1440"
        DATETIME read_at
        VARCHAR(1000) note
        DATETIME created_at
        DATETIME updated_at
    }

    reading_goals {
        CHAR(36) id PK
        CHAR(36) user_id FK "quem criou"
        CHAR(36) club_id FK "nulo para meta pessoal"
        VARCHAR(120) title
        ENUM type "BOOKS_FINISHED, PAGES_READ, MINUTES_READ, READING_DAYS"
        ENUM period "DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM"
        INT target_value "CHECK > 0"
        DATETIME start_date
        DATETIME end_date "CHECK >= start_date"
        DATETIME completed_at "primeira vez que a meta foi batida"
        DATETIME created_at
        DATETIME updated_at
    }

    book_clubs {
        CHAR(36) id PK
    }
```

### Social, clubes, conversas e conquistas

```mermaid
erDiagram
    users ||--o{ follows : "segue"
    users ||--o{ follows : "é seguido"
    users ||--o{ book_clubs : "organiza"
    users ||--o{ club_members : "participa"
    book_clubs ||--o{ club_members : "tem"
    books |o--o{ book_clubs : "leitura do momento"
    users ||--o{ activities : "publica"
    user_books |o--o{ activities : "sobre o livro"
    reading_goals |o--o{ activities : "sobre a meta"
    activities ||--o{ activity_likes : "recebe"
    activities ||--o{ activity_comments : "recebe"
    users ||--o{ activity_likes : "curte"
    users ||--o{ activity_comments : "comenta"
    users ||--o{ user_achievements : "desbloqueia"
    book_clubs |o--|| conversations : "chat do clube"
    conversations ||--o{ conversation_participants : "tem"
    users ||--o{ conversation_participants : "participa"
    conversations ||--o{ messages : "contém"
    users ||--o{ messages : "envia"

    follows {
        CHAR(36) follower_id PK "FK users"
        CHAR(36) following_id PK "FK users"
        DATETIME created_at
    }

    book_clubs {
        CHAR(36) id PK
        VARCHAR(80) name
        VARCHAR(500) description
        VARCHAR(12) invite_code UK
        CHAR(36) owner_id FK
        CHAR(36) current_book_id FK
        DATETIME created_at
        DATETIME updated_at
    }

    club_members {
        CHAR(36) club_id PK "FK"
        CHAR(36) user_id PK "FK"
        ENUM role "OWNER, MEMBER"
        DATETIME joined_at
    }

    activities {
        CHAR(36) id PK
        CHAR(36) user_id FK
        ENUM type "BOOK_STARTED, BOOK_FINISHED, REVIEW_POSTED, GOAL_COMPLETED, ACHIEVEMENT_UNLOCKED"
        CHAR(36) user_book_id FK
        CHAR(36) goal_id FK
        VARCHAR(40) achievement_code
        DATETIME created_at
    }

    activity_likes {
        CHAR(36) activity_id PK "FK"
        CHAR(36) user_id PK "FK"
        DATETIME created_at
    }

    activity_comments {
        CHAR(36) id PK
        CHAR(36) activity_id FK
        CHAR(36) user_id FK
        VARCHAR(500) body "CHECK não vazio"
        DATETIME created_at
    }

    user_achievements {
        CHAR(36) user_id PK "FK"
        VARCHAR(40) code PK
        DATETIME unlocked_at
        DATETIME seen_at "nulo até a comemoração"
    }

    conversations {
        CHAR(36) id PK
        ENUM type "DIRECT, CLUB"
        CHAR(36) club_id FK "UK"
        VARCHAR(73) direct_key UK "par de usuários ordenado"
        DATETIME created_at
        DATETIME updated_at
    }

    conversation_participants {
        CHAR(36) conversation_id PK "FK"
        CHAR(36) user_id PK "FK"
        DATETIME last_read_at
        DATETIME joined_at
    }

    messages {
        CHAR(36) id PK
        CHAR(36) conversation_id FK
        CHAR(36) sender_id FK
        VARCHAR(1000) body "CHECK não vazio"
        DATETIME created_at
    }
```

O catálogo de conquistas (nome, descrição, nível e limite) fica no código (`api/src/domain/achievements.ts`); o banco guarda apenas quais conquistas cada usuário desbloqueou e quando foram vistas.

Índices: `user_books(user_id, status)`, `user_books(user_id, finished_at)`, `reading_sessions(user_id, read_at)`, `reading_sessions(user_book_id)`, `reading_goals(user_id, end_date)`, `reading_goals(club_id)`, `books(title)`, `auth_sessions(user_id)`, `follows(following_id)`, `club_members(user_id)`, `activities(user_id, created_at)`, `activities(created_at)`, `activity_comments(activity_id, created_at)`, `conversations(updated_at)`, `conversation_participants(user_id)`, `messages(conversation_id, created_at)`.

Exclusões: remover um usuário remove em cascata seus dados (sessões, livros, metas, seguidores, clubes que organiza, atividades, curtidas, comentários, conquistas, participações e mensagens). Remover um `user_book` remove suas sessões e atividades. Excluir um clube remove membros, metas coletivas e a conversa. Um livro do catálogo não pode ser removido enquanto estiver em alguma biblioteca (`RESTRICT`).

## Telas

Capturas da versão web (viewport 390×844), geradas durante o teste ponta a ponta. No celular a aparência é a mesma, com componentes nativos.

| | | |
| --- | --- | --- |
| ![Início](docs/screenshots/inicio.png) | ![Feed](docs/screenshots/feed.png) | ![Perfil](docs/screenshots/perfil.png) |
| Início: lendo agora, gêneros e desafio | Feed com conquista exaltada e resenhas | Perfil com estantes e desafio anual |
| ![Comemoração](docs/screenshots/comemoracao-conquista.png) | ![Conquistas](docs/screenshots/conquistas.png) | ![Detalhes](docs/screenshots/detalhes-livro.png) |
| Comemoração de conquista | Conquistas por nível com progresso | Detalhes do livro |
| ![Clubes](docs/screenshots/clubes.png) | ![Clube](docs/screenshots/clube-detalhes.png) | ![Conversa](docs/screenshots/conversa.png) |
| Clubes do livro | Clube com meta coletiva e código | Chat do clube |
| ![Encontrar pessoas](docs/screenshots/encontrar-pessoas.png) | ![Perfil de amigo](docs/screenshots/perfil-amigo.png) | ![Início escuro](docs/screenshots/inicio-escuro.png) |
| Encontrar pessoas | Perfil de amigo com seguir e mensagem | Tema escuro |
| ![Login](docs/screenshots/login.png) | ![Busca no catálogo](docs/screenshots/busca-catalogo.png) | ![Formulário](docs/screenshots/formulario-livro.png) |
| Login | Busca no Open Library | Formulário com validação |
| ![Estatísticas](docs/screenshots/estatisticas.png) | ![Lembretes](docs/screenshots/lembretes.png) | ![Perfil escuro](docs/screenshots/perfil-escuro.png) |
| Estatísticas | Lembretes (na web, sem suporte a notificações) | Perfil no tema escuro |

## Mapa dos requisitos acadêmicos

| Requisito | Onde está |
| --- | --- |
| App React Native com Expo | `app/` (Expo SDK 57) |
| API própria em Node.js | `api/` (Express 5) |
| Stack + Bottom Tabs | `app/src/navigation/RootNavigator.tsx`, `MainTabs.tsx` (Início, Biblioteca, Comunidade, Metas e Perfil) |
| Tela recebendo parâmetros | `BookDetailsScreen` (`bookId`), `UserProfileScreen` (`userId`), `ClubDetailsScreen` (`clubId`), `ChatScreen` (`conversationId`), `SessionFormScreen`, `GoalFormScreen` |
| Login integrado à API + token | `app/src/context/AuthContext.tsx`, `app/src/services/authService.ts`, `api/src/services/authService.ts` |
| Token no header | Interceptor em `app/src/services/httpClient.ts` |
| Context API | `AuthContext`, `ThemeContext`, `SnackbarContext` (mensagens de sucesso), `CelebrationContext` (comemoração de conquistas) |
| API externa com loading e erro | `app/src/services/catalogService.ts`, `hooks/useBookSearch.ts`, `screens/CatalogSearchScreen.tsx` |
| FlatList com keyExtractor + detalhes | `screens/LibraryScreen.tsx`, `GoalsScreen.tsx`, `CatalogSearchScreen.tsx`, `community/FeedTab.tsx`, `ChatScreen.tsx` |
| Formulário com TextInput, Switch e Button + validação | `screens/BookFormScreen.tsx`, `utils/validation.ts` (e validação Zod na API) |
| AsyncStorage | `services/preferencesStorage.ts` (tema, visualização, lembretes) |
| Hooks customizados | `useAuth`, `useBookSearch`, `useLibrary`, `useLibraryItem`, `useReadingGoals`, `useStatistics`, `useReminderSettings`, `useStoredPreference`, `useDebouncedValue`, `useAsyncResource`, `useActivityList`, `useChat`, `useProfile`, `useFollowToggle`, `useActionFeedback` |
| React Native Paper + StyleSheet | Todas as telas e componentes |
| Pastas screens, components, hooks, services, context | `app/src/` |
| Recurso de dispositivo | Notificações locais: `services/notificationService.ts`, `services/reminderService.ts`, `screens/ReminderSettingsScreen.tsx` |
| CRUD na API | `/library`, `/reading-sessions`, `/goals`, `/clubs`, `/clubs/:id/goals`, `/activities/:id/comments` |
| Endpoint próprio consumido | Todos os serviços em `app/src/services/*Service.ts` |
| Banco relacional com migrations | `api/prisma/` |
| DER | Seção acima |
| Testes | `api/tests/`, `app/src/__tests__/` |

## Decisões técnicas

- **Token**: JWT HS256 com `jti` registrado em `auth_sessions`. O logout revoga a sessão no servidor e o token deixa de valer imediatamente. No app, o token fica no **Expo SecureStore** (Keychain/Keystore). Na versão web, que não tem SecureStore, é usado o armazenamento do navegador, apenas para desenvolvimento.
- **Respostas 401**: o cliente HTTP central encerra a sessão local e o app volta para o login com a mensagem "Sua sessão expirou". Falhas de rede na restauração não apagam o token salvo.
- **Progresso**: a página atual avança com as sessões. Ao editar ou excluir a sessão que definia a página atual, a API recalcula a partir da maior página final restante. Chegar à última página conclui o livro; voltar a página de um livro concluído o devolve para "Lendo". "Quero ler" com página maior que zero é tratado como "Lendo", e mover um livro de volta para "Quero ler" zera a página atual (o histórico de sessões é preservado).
- **Páginas sem duplicidade**: páginas lidas são a união dos intervalos `(página inicial, página final]` de cada livro dentro do período. Reler um trecho não soma de novo.
- **Datas**: dias, anos e períodos de metas são agrupados no fuso `APP_TIMEZONE`.
- **Repositórios**: a API depende de contratos (`repositories/contracts.ts`). A implementação Prisma é usada com MySQL e a implementação em memória é usada nos testes e no modo de demonstração, sem duplicar regras de negócio.
- **Design**: inspirado em aplicativos como StoryGraph, Fable, Goodreads e no mockup de referência (cartão de “lendo agora”, atalhos por gênero, perfil com estantes em formato de livro e desafio anual), mantendo a paleta Dark Academia, React Native Paper e tipografia Cormorant Garamond + Inter. Seguindo as boas práticas observadas, o registro de leitura fica na tela inicial e o social numa aba própria, com opção de não compartilhar atividades.
- **Engajamento**: livros, sessões, metas, amizades e clubes acionam um serviço de engajamento (`EngagementService`) que registra atividades no feed e avalia conquistas e metas concluídas. Falhas nesse processamento são registradas no log e não impedem a operação principal.
- **Conquistas**: inspiradas no Duolingo, com nomes próprios, três níveis e uma tela de comemoração. A API guarda o desbloqueio e quando a conquista foi vista; o app consulta as pendentes após ações relevantes e ao voltar para o primeiro plano.
- **Metas coletivas**: são metas com `club_id`. O progresso soma o valor de cada membro no período (páginas sem duplicidade por pessoa), e a tela do clube mostra a contribuição de cada um.
- **Privacidade**: perfis são visíveis para usuários autenticados; o feed mostra apenas você e quem você segue; conversas diretas só entre amigos (seguem um ao outro); somente amigos podem ser adicionados a clubes pelo dono, os demais entram com código.
- **Segurança**: senhas com bcrypt (custo 12), mensagem genérica e comparação contra hash fictício no login para não revelar e-mails cadastrados, validação Zod com limites em todas as entradas, `express.json` limitado a 50 kB, Helmet, CORS por lista, rate limit geral e específico para autenticação, consultas sempre filtradas pelo `user_id` do token, erros centralizados e logs só com método, caminho sem query string, status e tempo.

## Limitações conhecidas

- **Notificações não verificadas em aparelho**: agendamento, cancelamento e reconciliação foram testados com `expo-notifications` simulado. A entrega real precisa ser conferida em um dispositivo físico. No Expo Go as notificações **locais** funcionam; notificações push remotas (não usadas) exigiriam development build. A versão web não suporta notificações e mostra um aviso.
- **Fuso dos lembretes**: os lembretes usam o fuso do aparelho; as estatísticas usam o `APP_TIMEZONE` da API.
- **Sem modo offline**: biblioteca, sessões e metas ficam no backend. Sem conexão, as telas exibem erro com opção de tentar novamente; tema e lembretes continuam funcionando localmente.
- **Catálogo externo**: depende da disponibilidade do Open Library. Campos ausentes (capa, editora, páginas) não são inventados e o número de páginas precisa ser preenchido quando não vier do catálogo. O cadastro manual está sempre disponível.
- **Datas digitadas**: data e hora das sessões e datas de metas personalizadas são digitadas (AAAA-MM-DD e HH:MM), sem seletor nativo, para evitar dependências extras.
- **Estatísticas**: são calculadas em memória a partir de todos os registros do usuário, adequado ao volume de uma biblioteca pessoal.
- **Ícones e splash**: o projeto usa os ícones padrão do template do Expo.
- **Chat sem tempo real**: as mensagens são buscadas a cada 4 segundos enquanto a conversa está aberta (polling), sem WebSocket nem notificação push de mensagens novas.
- **Fotos de perfil**: os avatares usam as iniciais com cor derivada do usuário; envio de fotos não foi implementado.
- **Moderação**: não há bloqueio de usuários nem denúncia de conteúdo; desligar o compartilhamento impede apenas novas atividades (as já publicadas continuam no feed).
- **Feed**: atividades criadas diretamente no banco (como no seed) não passam pelas regras de engajamento; no uso normal elas são geradas pela API.

## Integrantes

> Preencher com os nomes e RAs dos integrantes do grupo.

| Nome | RA | Responsabilidades |
| --- | --- | --- |
| | | |
