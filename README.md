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
- **Login** — acesso com usuário e senha (senhas guardadas com scrypt, nunca em texto). Vários usuários por computador.
- **Configurações** (engrenagem no canto do menu) — dados da sua empresa que saem nas propostas, meta mensal, validade e condições padrão, seu perfil e senha, e cadastro de usuários.

## Primeiro acesso

Não existe login padrão. Na primeira vez que o app abre num computador, aparece a tela **"Bem-vindo ao CRM"**, onde a pessoa cria o próprio usuário de administrador e a senha. Essa tela só existe enquanto não há nenhum usuário.

Para dar acesso a outra pessoa no mesmo computador: Configurações → Usuários → Novo usuário, com uma senha provisória. Ela troca a senha no primeiro login.

(Versões até a 1.2.0 criavam `camilocaos`/`admin`. Se esse acesso nunca teve a senha trocada, a versão nova apaga ele e mostra a tela de primeiro acesso.)

## App para Windows

O CRM roda como um programa de Windows (Electron), com instalador, atalho na Área de Trabalho e menu Iniciar.

- **Dados:** ficam em `Documentos\CRM SST\crm.db`, com um backup automático por dia em `Documentos\CRM SST\backups` (guarda os últimos 30).
- **Configurações → Dados e backup:** "Abrir pasta de dados" e "Salvar backup agora...". A janela não tem barra de menu; atalhos: Ctrl +/− (zoom), Ctrl 0, F5 (recarregar), F11 (tela cheia).
- Desinstalar ou atualizar o app **não apaga** os dados.

### Gerar o instalador

```bash
npm run app:instalador
```

Sai em `instalador/`: o `CRM-SST-Setup-<versão>.exe`, um `LEIA-ME.txt` com instruções para quem for instalar, e o `latest.yml` + `.blockmap` que o atualizador automático usa.

### Lançar uma versão nova (atualização automática)

O app confere as Releases do GitHub ao abrir e a cada 2 horas. Quando acha uma versão nova, mostra uma janelinha no canto da tela com o que mudou, e os botões **Atualizar** e **Agora não**. A pessoa pode ignorar; o aviso volta na próxima vez que abrir o app. Ao atualizar, o app baixa em segundo plano, fecha, instala sem assistente e abre de novo.

1. Aumente `version` em `desktop/package.json` (ex.: `1.2.0` → `1.3.0`).
2. Escreva as novidades em `NOVIDADES.md` (é o texto de "Ver o que mudou").
3. Faça commit das mudanças.
4. Rode:

```bash
npm run app:instalador
```

```bash
npm run app:publicar
```

Versões 1.1.0 ou anteriores não têm o atualizador: quem estiver nelas precisa instalar a 1.2.0 manualmente uma vez.

O instalador não tem assinatura digital, então o Windows mostra o aviso "O Windows protegeu o computador". É só clicar em **Mais informações → Executar assim mesmo**.

### Rodar o app em modo desenvolvimento

```bash
npm run app:dev
```

Abre a janela do app usando o `next dev` (com recarregamento automático) e o banco em `data/crm.db`.

## Como rodar no navegador

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
| `npm run app:dev` | Abre o app desktop em modo desenvolvimento |
| `npm run app:instalador` | Gera o instalador do Windows em `instalador/` |
| `npm run app:publicar` | Publica a versão como Release no GitHub (quem usa o app recebe o aviso de atualização) |
| `npm run app:icone` | Regera os ícones (app, janela, favicon, logo) a partir de `marca/icone-original.png` |

## Estrutura

```
src/
  app/            páginas (empresas, funil, tarefas, propostas, servicos, configuracoes)
  components/     componentes de interface e formulários
  db/             schema do banco, conexão e dados iniciais
  lib/            constantes, formatação, configurações e helpers
drizzle/          migrations do banco
desktop/          processo principal do app Windows (Electron)
build/            ícone do app (gerado)
marca/            identidade visual: ícone original, paleta e especificação
scripts/          dados de demonstração, empacotamento e utilitários
```

Os arquivos do banco (`data/*.db`) ficam fora do Git, então seus dados de clientes nunca vão pro GitHub.

---

by [camilocaos](https://github.com/camilocaos)
