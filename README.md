# Eventus — Plataforma de Eventos e Ingressos

Desafio técnico da Verzel (Desafio Elite Dev). Organizador monta eventos a partir de um
catálogo externo, cliente reserva e paga (de forma simulada) e recebe um ingresso com QR,
portaria valida na entrada.

> Uso de IA neste projeto: documentado em [`docs/AI_USAGE.md`](docs/AI_USAGE.md), como pedido
> no desafio. Leia antes de avaliar decisões que pareçam estranhas à primeira vista — a maioria
> tem uma razão explicada lá ou nas seções "Decisões" abaixo.

## Stack

| Camada       | Escolha                                             |
|--------------|------------------------------------------------------|
| Front-end    | React 19 + TypeScript + Vite + React Router + Tailwind CSS |
| Back-end     | NestJS + TypeORM + PostgreSQL                        |
| Autenticação | JWT (passport-jwt), 3 papéis: ORGANIZER, CLIENT, GATE |
| Catálogo     | Ticketmaster Discovery API (com fallback local)       |
| QR           | `qrcode` (geração) + `html5-qrcode` (leitura por câmera) |

Por que **TypeORM** em vez de Prisma: Gosto de utilizar o prisma mas nesse projeto em especifico achei melhor o TypeORM por já ter feito algo parecido usando ele e ter mais experiência, então foi bem mais rápido e consegui resultados melhores por conta dessa facilidade.

## Estrutura

```
.
├── backend/     # API NestJS (REST, prefixo /api)
├── frontend/    # SPA React (Vite)
├── docker-compose.yml   # Postgres para desenvolvimento
└── docs/
    └── AI_USAGE.md
```

## Como rodar

### Pré-requisitos

- Node.js 20+
- Docker (para o Postgres) **ou** um PostgreSQL 14+ já rodando localmente

### 1. Banco de dados

Com Docker:

```bash
docker compose up -d
```

Isso sobe um Postgres em `localhost:5432` com usuário/senha/banco `eventos` — já compatível com
o `.env.example` do backend. Sem Docker, crie manualmente um banco com essas credenciais (ou
edite `backend/.env` para apontar para o seu Postgres):

```sql
CREATE USER eventos WITH PASSWORD 'eventos';
CREATE DATABASE eventos OWNER eventos;
```

### 2. Back-end

```bash
cd backend
cp .env.example .env
npm install
npm run seed       # popula organizador, 2 clientes, portaria e 2 eventos com ingressos
npm run start:dev  # http://localhost:3000/api
```

`synchronize: true` está ativo no TypeORM (ver `src/app.module.ts`) — o schema é criado
automaticamente na primeira conexão, sem precisar rodar migrations manualmente. É uma escolha
deliberada para o prazo do desafio; **não é o que eu faria em produção** (lá eu geraria
migrations versionadas com `typeorm migration:generate`).

### 3. Front-end

Em outro terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev   # http://localhost:5173
```

O front espera a API em `VITE_API_URL` (padrão `http://localhost:3000/api`, já no
`.env.example`).

### 4. Ticketmaster Discovery API (opcional)

Sem chave, o organizador vê um catálogo local de 3 itens de exemplo ao montar um evento — o
fluxo completo funciona sem depender de uma chave externa. Para usar o catálogo real:

1. Crie uma chave em https://developer.ticketmaster.com/
2. Coloque em `backend/.env`: `TICKETMASTER_API_KEY=sua-chave`
3. Reinicie o backend

### 5. Deploy do back-end no Vercel (opcional)

O NestJS por padrão sobe um servidor persistente (`app.listen()`), e o Vercel roda funções
serverless — cada invocação é um processo isolado que morre depois do request. Para o backend
rodar lá, ele precisa de um handler serverless em vez do `app.listen()` direto:

- `backend/api/index.ts` monta o app Nest sobre uma instância do Express e expõe um handler
  `(req, res)`, reaproveitando a mesma instância entre invocações "quentes" do mesmo processo
  (evita recriar o app do zero a cada request).
- `backend/vercel.json` roteia todo o tráfego para esse handler.

Ao criar o projeto no Vercel, aponte o **Root Directory** para `backend/` e configure as
variáveis de ambiente do `.env.example` (`DATABASE_URL`, `JWT_SECRET`, `TICKET_QR_SECRET`, etc.)
nas configurações do projeto — elas não vêm do `.env` local, que não é versionado.

O `DATABASE_URL` precisa apontar para um Postgres **acessível pela internet** (Neon, Supabase,
Railway...) — o Postgres do `docker-compose.yml` roda só na sua máquina (`localhost`), e a
function do Vercel roda na nuvem deles, então não enxerga esse banco de jeito nenhum. Quando o
host não é `localhost`, o backend liga TLS automaticamente na conexão (ver `isManagedPostgres`
em `backend/src/app.module.ts`), porque bancos gerenciados normalmente exigem isso.

Se a variável estiver ausente/errada, a function crasha com `FUNCTION_INVOCATION_FAILED` antes
de responder qualquer rota — e como o crash acontece antes do Nest aplicar CORS, o navegador
mostra um erro de "bloqueado por CORS" no front, escondendo o 500 real. `backend/api/index.ts`
captura esse erro e responde com CORS + uma mensagem JSON explicando a causa, em vez de deixar o
crash cru; o log de causa completo (stack trace) fica na aba **Logs** da function no painel do
Vercel.

No front, `VITE_API_URL` (configurado no projeto Vercel do `frontend/`) precisa terminar em
`/api` — é o prefixo global que o Nest usa (`app.setGlobalPrefix('api')` em
`backend/src/bootstrap.ts`). Apontar para a raiz do domínio do backend, sem `/api`, faz toda
rota cair em 404. Variáveis do Vite são embutidas no build, então depois de mudar
`VITE_API_URL` é preciso fazer um novo deploy do front (redeploy), não só salvar a variável.

**Limitação conhecida:** o cron de expiração de hold (`@nestjs/schedule`, a cada minuto, ver
`backend/src/reservations/`) depende de um processo rodando continuamente. Serverless não
garante isso — o cron só dispara enquanto uma invocação estiver "quente", então reservas
pendentes podem não expirar sozinhas em produção no Vercel. Para esse cron funcionar de verdade,
o ideal é um [Vercel Cron Job](https://vercel.com/docs/cron-jobs) batendo numa rota HTTP que
expira os holds manualmente, ou hospedar o backend em uma plataforma com processo persistente
(Railway, Render, Fly.io) — ver opção abaixo.

### 6. Deploy do back-end no Render (alternativa recomendada)

Ao contrário do Vercel, o Render roda um processo Node persistente — não precisa do handler em
`backend/api/index.ts` nem do `vercel.json`, o `main.ts` com `app.listen()` funciona direto, e
o cron de expiração de hold (limitação do Vercel, acima) roda normalmente. Ao criar o Web
Service, aponte para este repositório e preencha:

| Campo | Valor |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install && npm run build` (o projeto usa `package-lock.json`, não `yarn.lock` — troque o `yarn` do valor padrão) |
| Start Command | `npm run start:prod` |

Em **Environment**, adicione as mesmas variáveis do `backend/.env.example` (`DATABASE_URL`,
`JWT_SECRET`, `JWT_EXPIRES_IN`, `TICKET_QR_SECRET`, `TICKETMASTER_API_KEY`, `FRONTEND_URL`) —
não é preciso configurar `PORT`, o Render injeta essa variável e o `main.ts` já lê
`process.env.PORT`. O `DATABASE_URL` vale a mesma regra do Vercel: precisa ser um Postgres
acessível pela internet, não o `localhost` do `docker-compose.yml`. Se criar um Postgres no
próprio Render na mesma região do Web Service, dá pra usar a Internal Database URL dele.

Por fim, aponte `VITE_API_URL` do front (no Vercel) para `https://<seu-serviço>.onrender.com/api`
— com `/api` no final, mesma regra da seção anterior — e faça redeploy do front.

## Credenciais de teste (semeadas pelo `npm run seed`)

| Papel        | E-mail                  | Senha      |
|--------------|--------------------------|------------|
| Organizador  | organizador@demo.com     | senha123   |
| Cliente 1    | cliente1@demo.com        | senha123   |
| Cliente 2    | cliente2@demo.com        | senha123   |
| Portaria     | portaria@demo.com        | senha123   |

O seed já deixa publicado:
- **Sessão Especial: Filme Demo** (São Paulo, mapa de assentos 5×8) — 2 assentos já vendidos e
  com ingresso emitido para `cliente1`, para dar para testar a portaria sem passar pelo checkout.
- **Show Demo: Noite Eletrônica** (Rio de Janeiro, pista/quantidade) — 2 ingressos de pista já
  emitidos para `cliente2`.

Os códigos exatos dos ingressos de demonstração aparecem no terminal ao rodar `npm run seed`
(mudam a cada execução, já que o código é aleatório).

## Roteiro rápido para avaliar

1. Entre como `cliente2@demo.com` → Eventos → "Show Demo: Noite Eletrônica" → escolha uma
   quantidade → reservar → pague com qualquer cartão que **não** termine em `0000` (aprovado) ou
   termine em `0000` (recusado, para ver o fluxo de recusa) → "Meus ingressos" mostra o QR.
2. Entre como `cliente1@demo.com` → "Sessão Especial: Filme Demo" → escolha 1-2 assentos no mapa
   (os já vendidos aparecem cinza/bloqueados) → mesmo fluxo de pagamento.
3. Entre como `portaria@demo.com` → selecione o evento → digite manualmente o código de um
   ingresso válido (aparece em "Meus ingressos" do cliente correspondente, ou no log do seed) →
   veja `INGRESSO VÁLIDO` → valide de novo → veja `JÁ UTILIZADO`. Tente também validar um
   ingresso do evento errado (selecione o outro evento no dropdown) → `EVENTO ERRADO`. Com
   câmera disponível (celular/notebook com webcam, servido por HTTPS ou localhost), o botão
   "Ler QR pela câmera" também funciona — abra "Meus ingressos" em outro dispositivo e aponte a
   câmera para o QR.
4. Entre como `organizador@demo.com` → "Painel do organizador" → "+ Novo evento" → busque no
   catálogo (ou pule para o formulário manual) → publique.

## Decisões de produto e design

**Identidade visual — canhoto de ingresso.** A marca do produto é o ingresso físico de
bilheteria de cinema: bordas grossas sólidas, sombra "dura" deslocada (sem blur), faixa de
perfuração pontilhada com círculos entre o corpo do ingresso e o canhoto do QR. Paleta
dourado-bilheteria (`marquee`) + tinta (`ink`) + papel (`paper`), com verde/vermelho de carimbo
para os estados de validação. Tipografia em três camadas: `Space Grotesk` para títulos,
`IBM Plex Sans` para texto corrido, `IBM Plex Mono` para códigos/preços/assentos.

**Mapa de assentos simplificado (fileiras × poltronas).** Um editor de mapa de assentos livre
(camarotes, curvas, setores irregulares) é o tipo de feature que consome dias sem agregar ao que
o desafio realmente avalia — o fluxo de concorrência ponta a ponta. Optei por um mapa gerado
automaticamente (fileiras A, B, C… × N poltronas), que já é suficiente para mostrar seleção,
hold, pagamento e bloqueio de concorrência.

**Bloqueio de concorrência com lock pessimista, não SERIALIZABLE.** A garantia de "mesmo
assento não vendido duas vezes" vem de `SELECT ... FOR UPDATE` explícito nas linhas do
assento (ou do evento, no caso de pista) dentro de uma transação — não do nível de isolamento.
Cheguei a testar com isolamento `SERIALIZABLE` por cima do lock explícito, e o Postgres passou a
lançar `could not serialize access due to read/write dependencies` num response 500 cru, em vez
do 409 claro que o lock pessimista já garantia sozinho. Removi o `SERIALIZABLE` — dois
mecanismos de exclusão mútua empilhados só trocaram uma mensagem de erro legível por uma
confusa. Testado com 5 requisições concorrentes pelo mesmo assento: 1 sucesso, 4 recusas limpas
(ver `backend/src/reservations/reservations.service.ts`).

**Hold de 10 minutos com expiração automática.** Sem isso, um cliente que abandona o checkout
deixaria o assento (ou vaga de pista) preso para sempre. Um cron (`@nestjs/schedule`, a cada
minuto) devolve ao estoque reservas pendentes cujo prazo expirou.

**QR não forjável via HMAC, não apenas código aleatório.** O código do ingresso já tem entropia
alta (10 caracteres, ~50 bits, alfabeto sem caracteres ambíguos para digitação manual). O QR
carrega adicionalmente uma assinatura HMAC-SHA256 de `id+eventId+code`, calculada com um
segredo que só o servidor conhece. A portaria valida a assinatura *antes* de consultar o banco —
um QR com o campo alterado é rejeitado imediatamente como forjado, sem round-trip. Ver
`backend/src/tickets/ticket-signature.util.ts` e `backend/src/gate/gate.service.ts`.

**Cadastro público só para clientes.** Organizador e portaria são provisionados (seed), não se
autocadastram por formulário público — como funciona em Sympla/Eventim, onde produtor e equipe
de portaria são contas geridas pela operação, não autoatendimento.

**Cartão de teste recusado por convenção, não aleatório.** Números terminados em `0000` são
sempre recusados; qualquer outro número aprova. Decisão simples e determinística para poder
testar (e para você conseguir reproduzir) o fluxo de recusa exigido no desafio, sem simular
gateway de pagamento real.

**JWT em localStorage, não cookie httpOnly.** Mais simples de implementar dado o prazo, mas
tecnicamente mais exposto a XSS do que um cookie httpOnly + CSRF token. Limitação conhecida,
registrada aqui em vez de escondida.


## Sobre o histórico de commits

O histórico do git não reflete o ritmo real de desenvolvimento: fui construindo o projeto ao
longo da semana em ambiente local, sem publicar no repositório, e só fiz os
commits no fim, de uma vez. Não foi a forma ideal nem correta de versionar (normalmente teria comitado por
etapa, com mensagens mostrando a evolução mas como foi uma semana meio incomum e corrida não consegui), mas o motivo foi só fluxo de trabalho mesmo.

## Dados sensíveis

Os arquivos `.env` **não** estão versionados (`.gitignore`). Use os `.env.example` de
`backend/` e `frontend/` como referência — os valores padrão já funcionam para rodar localmente
com o `docker-compose.yml` incluso.
