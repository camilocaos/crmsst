CREATE TABLE `sessoes` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` integer NOT NULL,
	`expira_em` text NOT NULL,
	`criado_em` text DEFAULT (datetime('now', 'localtime')) NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`usuario` text NOT NULL,
	`nome` text NOT NULL,
	`senha_hash` text NOT NULL,
	`trocar_senha` integer DEFAULT false NOT NULL,
	`criado_em` text DEFAULT (datetime('now', 'localtime')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_usuario_unique` ON `usuarios` (`usuario`);