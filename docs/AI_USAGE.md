# Uso de IA neste projeto

Usei IA (Claude, via terminal) como apoio em partes
do projeto, não para gerar a aplicação inteira. As decisões de 
produto e arquitetura,os fluxos principais e a maior parte da implementação foram feitos por mim,
a IA entrou em tarefas específicas, descritas abaixo, sempre sob minha revisão.

## O que a IA fez

- **Arquitetura de pastas**: estrutura inicial de diretórios do backend e do frontend.
- **Alguns DTOs**: para não ficar reescrevendo validação repetida entre módulos parecidos pedi para ela fazer essas implementações
- **Testes**: parte dos testes do projeto.
- **Alguns componentes mais repetitivos**, como as telas de login eregistro — trabalho
  mecânico (formulário, validação, chamada à API) que não trazia decisão de produto relevante,me apoiou na criação o componente de SeatMap
- **Apoio na integração e correção de bugs** entre frontend e backend (ajustes entre as duas pontas,
  depuração de chamadas de API), também de ajudou a corrigir alguns problemas que tive na integração com a api do ticketmaster.
- **Apoio no design**, me ajudou no design pois estava em dúvida se fazia parecido com a ticketmaster ou algo mais diferente, e a decisão foi o mais "diferente" com doodles e alguns efeitos
-**Geração do README**, pedi para a IA gerar o README completo do projeto

## O que decidi e implementei eu

- **API externa**: Ticketmaster Discovery (não TMDb) — quis o caso de shows/pista, mais comum
  no dia a dia de uma plataforma de ingressos genérica.
- **Fluxo de reserva**: implementar os dois modos (mapa de assentos e quantidade/pista), em vez
  de escolher só um — queria explorar o modelo de dados e o lock de concorrência lidando com os
  dois casos.
- **Stack**: Node.js + NestJS + PostgreSQL no backend, React + Vite + TypeScript + Tailwind no
  frontend (incluindo a troca de Prisma por TypeORM — motivada por um bloqueio de ambiente no
  download do engine do Prisma, mas também por eu já ter mais experiência com TypeORM e ele ser
  mais rápido de implementar no restante do desafio; detalhes no README).
- **Deploy**: decidi publicar na vercel pois era uma plataforma que eu já tenho experiência.
- A lógica central do desafio — regras de reserva, bloqueio de concorrência (lock pessimista),
  pagamento simulado, emissão e assinatura HMAC do QR, validação na portaria, cron de expiração
  de holds, seed — e o restante das telas e fluxos do frontend.
- As telas, componentes e controllers do projeto de forma geral — a IA só entrou nos pontos
  pontuais listados acima (alguns componentes repetitivos, DTOs, testes, apoio em bugs de
  integração e no design); o restante das telas, componentes de UI e controllers do backend
  foi implementado por mim.
- A leitura do desafio e a validação de cada trecho de código gerado pela IA antes de aceitar
  como pronto (revisão de código, testes manuais do fluxo completo).
- Este arquivo e o README, incluindo a redação das seções de decisões de design/arquitetura.

