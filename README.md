# CRM Comercial SST

CRM para empresas de **Saúde e Segurança do Trabalho**: cadastro de clientes, funil de vendas em Kanban, follow-ups, propostas comerciais e dashboard de metas.

Feito com **Next.js 16**, **React 19**, **Tailwind CSS 4** e **SQLite** (better-sqlite3 + Drizzle ORM). Tudo roda localmente, sem serviço externo.

## Funcionalidades

- **Empresas e contatos** — razão social, CNPJ, CNAE, grau de risco (NR-04), nº de funcionários, status (lead/cliente/inativo), vários contatos com link direto pro WhatsApp e histórico de interações.
- **Funil de vendas (Kanban)** — arraste oportunidades entre as etapas (Prospecção → Qualificação → Visita técnica → Proposta → Negociação → Ganho/Perdido). Mostra total por etapa e valor ponderado pela probabilidade. Ao ganhar, a empresa vira cliente automaticamente.
- **Tarefas e follow-ups** — ligações, WhatsApp, visitas, com vencimento e prioridade, agrupadas em atrasadas / hoje / próximos dias. Botão de adiar 1 dia.
- **Catálogo de serviços SST** — PGR, PCMSO, LTCAT, AET, ASO, eSocial, treinamentos de NRs e mais, com preço base e unidade (por empresa, por funcionário, por turma...).
- **Propostas** — monte com itens do catálogo, ajuste quantidades e desconto, imprima ou salve em PDF, envie pelo WhatsApp. Marcar como *enviada* ou *aceita* atualiza a oportunidade no funil.
- **Dashboard** — vendido no mês x meta, funil em aberto, conversão, vendas dos últimos 6 meses, tarefas do dia e propostas aguardando resposta.

## Como rodar

Requisitos: Node.js 20.9 ou mais recente.

```bash
npm install
npm run dev
```

Abra http://localhost:3000. O banco é criado sozinho em `data/crm.db` na primeira execução (com o catálogo de serviços já preenchido).

### Modo demonstração

Para ver o CRM com dados fictícios, sem mexer no seu banco:

```bash
npm run demo
npm run dev:demo
```

Isso cria `data/crm-demo.db` com empresas, oportunidades, tarefas e uma proposta de exemplo.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e servidor de produção |
| `npm run typecheck` | Checagem de tipos |
| `npm run lint` | ESLint |
| `npm run db:generate` | Gera migration depois de mudar `src/db/schema.ts` |
| `npm run demo` | Cria o banco de demonstração |
| `npm run dev:demo` | Roda o app usando o banco de demonstração |

## Estrutura

```
src/
  app/            páginas (empresas, funil, tarefas, propostas, servicos, configuracoes)
  components/     componentes de interface e formulários
  db/             schema do banco, conexão e dados iniciais
  lib/            constantes, formatação, configurações e helpers
drizzle/          migrations do banco
scripts/          dados de demonstração
```

Os arquivos do banco (`data/*.db`) ficam fora do Git, então seus dados de clientes nunca vão pro GitHub.

---

by [camilocaos](https://github.com/camilocaos)
