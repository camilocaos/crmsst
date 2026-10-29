CREATE TABLE `contratos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposta_id` integer NOT NULL,
	`area` text NOT NULL,
	`tipo` text DEFAULT 'pontual' NOT NULL,
	`formalizacao_posterior` integer DEFAULT false NOT NULL,
	`data_execucao` text,
	`valor_mensal` real,
	`vigencia` text,
	`forma_pagamento` text,
	`vencimento` text,
	`pagamentos_realizados` text,
	`endereco_cliente` text,
	`representante` text,
	`testemunha1` text,
	`testemunha2` text,
	`data_assinatura` text,
	`status` text DEFAULT 'rascunho' NOT NULL,
	`observacoes` text,
	`criado_em` text DEFAULT (datetime('now', 'localtime')) NOT NULL,
	FOREIGN KEY (`proposta_id`) REFERENCES `propostas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `proposta_itens` ADD `area` text DEFAULT 'seguranca' NOT NULL;--> statement-breakpoint
ALTER TABLE `proposta_itens` ADD `cobranca` text DEFAULT 'fixo' NOT NULL;--> statement-breakpoint
ALTER TABLE `proposta_itens` ADD `natureza` text;--> statement-breakpoint
ALTER TABLE `proposta_itens` ADD `periodo` text;--> statement-breakpoint
ALTER TABLE `proposta_itens` ADD `detalhe` text;--> statement-breakpoint
ALTER TABLE `proposta_itens` ADD `incluso` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `proposta_itens` ADD `opcional` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `propostas` ADD `prazo_entrega` text;--> statement-breakpoint
ALTER TABLE `propostas` ADD `mostrar_medicoes` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `servicos` ADD `area` text DEFAULT 'seguranca' NOT NULL;--> statement-breakpoint
ALTER TABLE `servicos` ADD `cobranca` text DEFAULT 'fixo' NOT NULL;