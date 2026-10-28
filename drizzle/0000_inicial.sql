CREATE TABLE `configuracoes` (
	`chave` text PRIMARY KEY NOT NULL,
	`valor` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contatos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`empresa_id` integer NOT NULL,
	`nome` text NOT NULL,
	`cargo` text,
	`email` text,
	`telefone` text,
	`principal` integer DEFAULT false NOT NULL,
	`criado_em` text DEFAULT (datetime('now', 'localtime')) NOT NULL,
	FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `empresas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`razao_social` text NOT NULL,
	`nome_fantasia` text,
	`cnpj` text,
	`segmento` text,
	`cnae` text,
	`grau_risco` integer,
	`num_funcionarios` integer,
	`telefone` text,
	`email` text,
	`endereco` text,
	`cidade` text,
	`uf` text,
	`origem` text,
	`status` text DEFAULT 'lead' NOT NULL,
	`observacoes` text,
	`criado_em` text DEFAULT (datetime('now', 'localtime')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`empresa_id` integer NOT NULL,
	`texto` text NOT NULL,
	`criado_em` text DEFAULT (datetime('now', 'localtime')) NOT NULL,
	FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `oportunidades` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`titulo` text NOT NULL,
	`empresa_id` integer NOT NULL,
	`contato_id` integer,
	`etapa` text DEFAULT 'prospeccao' NOT NULL,
	`valor` real DEFAULT 0 NOT NULL,
	`probabilidade` integer DEFAULT 10 NOT NULL,
	`previsao_fechamento` text,
	`motivo_perda` text,
	`observacoes` text,
	`fechado_em` text,
	`criado_em` text DEFAULT (datetime('now', 'localtime')) NOT NULL,
	FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contato_id`) REFERENCES `contatos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `proposta_itens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposta_id` integer NOT NULL,
	`servico_id` integer,
	`descricao` text NOT NULL,
	`quantidade` real DEFAULT 1 NOT NULL,
	`valor_unitario` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`proposta_id`) REFERENCES `propostas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`servico_id`) REFERENCES `servicos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `propostas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`empresa_id` integer NOT NULL,
	`oportunidade_id` integer,
	`status` text DEFAULT 'rascunho' NOT NULL,
	`validade` text,
	`desconto` real DEFAULT 0 NOT NULL,
	`condicoes_pagamento` text,
	`observacoes` text,
	`criado_em` text DEFAULT (datetime('now', 'localtime')) NOT NULL,
	FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`oportunidade_id`) REFERENCES `oportunidades`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `servicos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`categoria` text NOT NULL,
	`descricao` text,
	`preco_base` real DEFAULT 0 NOT NULL,
	`unidade` text DEFAULT 'por empresa' NOT NULL,
	`ativo` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tarefas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`titulo` text NOT NULL,
	`tipo` text DEFAULT 'ligacao' NOT NULL,
	`prioridade` text DEFAULT 'media' NOT NULL,
	`vencimento` text,
	`concluida` integer DEFAULT false NOT NULL,
	`descricao` text,
	`empresa_id` integer,
	`oportunidade_id` integer,
	`criado_em` text DEFAULT (datetime('now', 'localtime')) NOT NULL,
	FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`oportunidade_id`) REFERENCES `oportunidades`(`id`) ON UPDATE no action ON DELETE set null
);
