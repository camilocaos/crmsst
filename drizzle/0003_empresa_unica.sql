-- Junta empresas cadastradas mais de uma vez com o mesmo CNPJ antes de criar a trava.
-- Fica o cadastro mais antigo; campos vazios dele são completados com os dos outros,
-- e contatos, histórico, oportunidades, tarefas e propostas passam para ele.
UPDATE `empresas` SET `cnpj` = NULLIF(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(`cnpj`), '.', ''), '/', ''), '-', ''), ' ', ''), '');
--> statement-breakpoint
CREATE TEMP TABLE `_empresa_dup` AS
  SELECT e.`id` AS `id`, (SELECT MIN(m.`id`) FROM `empresas` m WHERE m.`cnpj` = e.`cnpj`) AS `fica`
  FROM `empresas` e
  WHERE e.`cnpj` IS NOT NULL AND e.`id` > (SELECT MIN(m.`id`) FROM `empresas` m WHERE m.`cnpj` = e.`cnpj`);
--> statement-breakpoint
UPDATE `empresas` SET
  `nome_fantasia` = COALESCE(NULLIF(`nome_fantasia`, ''), (SELECT d.`nome_fantasia` FROM `empresas` d JOIN `_empresa_dup` x ON x.`id` = d.`id` WHERE x.`fica` = `empresas`.`id` AND NULLIF(d.`nome_fantasia`, '') IS NOT NULL ORDER BY d.`id` LIMIT 1)),
  `segmento` = COALESCE(NULLIF(`segmento`, ''), (SELECT d.`segmento` FROM `empresas` d JOIN `_empresa_dup` x ON x.`id` = d.`id` WHERE x.`fica` = `empresas`.`id` AND NULLIF(d.`segmento`, '') IS NOT NULL ORDER BY d.`id` LIMIT 1)),
  `cnae` = COALESCE(NULLIF(`cnae`, ''), (SELECT d.`cnae` FROM `empresas` d JOIN `_empresa_dup` x ON x.`id` = d.`id` WHERE x.`fica` = `empresas`.`id` AND NULLIF(d.`cnae`, '') IS NOT NULL ORDER BY d.`id` LIMIT 1)),
  `grau_risco` = COALESCE(`grau_risco`, (SELECT d.`grau_risco` FROM `empresas` d JOIN `_empresa_dup` x ON x.`id` = d.`id` WHERE x.`fica` = `empresas`.`id` AND d.`grau_risco` IS NOT NULL ORDER BY d.`id` LIMIT 1)),
  `num_funcionarios` = COALESCE(`num_funcionarios`, (SELECT d.`num_funcionarios` FROM `empresas` d JOIN `_empresa_dup` x ON x.`id` = d.`id` WHERE x.`fica` = `empresas`.`id` AND d.`num_funcionarios` IS NOT NULL ORDER BY d.`id` LIMIT 1)),
  `telefone` = COALESCE(NULLIF(`telefone`, ''), (SELECT d.`telefone` FROM `empresas` d JOIN `_empresa_dup` x ON x.`id` = d.`id` WHERE x.`fica` = `empresas`.`id` AND NULLIF(d.`telefone`, '') IS NOT NULL ORDER BY d.`id` LIMIT 1)),
  `email` = COALESCE(NULLIF(`email`, ''), (SELECT d.`email` FROM `empresas` d JOIN `_empresa_dup` x ON x.`id` = d.`id` WHERE x.`fica` = `empresas`.`id` AND NULLIF(d.`email`, '') IS NOT NULL ORDER BY d.`id` LIMIT 1)),
  `endereco` = COALESCE(NULLIF(`endereco`, ''), (SELECT d.`endereco` FROM `empresas` d JOIN `_empresa_dup` x ON x.`id` = d.`id` WHERE x.`fica` = `empresas`.`id` AND NULLIF(d.`endereco`, '') IS NOT NULL ORDER BY d.`id` LIMIT 1)),
  `cidade` = COALESCE(NULLIF(`cidade`, ''), (SELECT d.`cidade` FROM `empresas` d JOIN `_empresa_dup` x ON x.`id` = d.`id` WHERE x.`fica` = `empresas`.`id` AND NULLIF(d.`cidade`, '') IS NOT NULL ORDER BY d.`id` LIMIT 1)),
  `uf` = COALESCE(NULLIF(`uf`, ''), (SELECT d.`uf` FROM `empresas` d JOIN `_empresa_dup` x ON x.`id` = d.`id` WHERE x.`fica` = `empresas`.`id` AND NULLIF(d.`uf`, '') IS NOT NULL ORDER BY d.`id` LIMIT 1)),
  `origem` = COALESCE(NULLIF(`origem`, ''), (SELECT d.`origem` FROM `empresas` d JOIN `_empresa_dup` x ON x.`id` = d.`id` WHERE x.`fica` = `empresas`.`id` AND NULLIF(d.`origem`, '') IS NOT NULL ORDER BY d.`id` LIMIT 1)),
  `observacoes` = COALESCE(NULLIF(`observacoes`, ''), (SELECT d.`observacoes` FROM `empresas` d JOIN `_empresa_dup` x ON x.`id` = d.`id` WHERE x.`fica` = `empresas`.`id` AND NULLIF(d.`observacoes`, '') IS NOT NULL ORDER BY d.`id` LIMIT 1)),
  `status` = CASE
    WHEN `status` = 'cliente' OR EXISTS (SELECT 1 FROM `empresas` d JOIN `_empresa_dup` x ON x.`id` = d.`id` WHERE x.`fica` = `empresas`.`id` AND d.`status` = 'cliente') THEN 'cliente'
    WHEN `status` = 'lead' OR EXISTS (SELECT 1 FROM `empresas` d JOIN `_empresa_dup` x ON x.`id` = d.`id` WHERE x.`fica` = `empresas`.`id` AND d.`status` = 'lead') THEN 'lead'
    ELSE `status` END
WHERE `id` IN (SELECT `fica` FROM `_empresa_dup`);
--> statement-breakpoint
UPDATE `contatos` SET `principal` = 0 WHERE `empresa_id` IN (SELECT `id` FROM `_empresa_dup`) AND EXISTS (SELECT 1 FROM `contatos` c JOIN `_empresa_dup` x ON x.`fica` = c.`empresa_id` WHERE x.`id` = `contatos`.`empresa_id` AND c.`principal` = 1);
--> statement-breakpoint
UPDATE `contatos` SET `empresa_id` = (SELECT `fica` FROM `_empresa_dup` x WHERE x.`id` = `contatos`.`empresa_id`) WHERE `empresa_id` IN (SELECT `id` FROM `_empresa_dup`);
--> statement-breakpoint
UPDATE `notas` SET `empresa_id` = (SELECT `fica` FROM `_empresa_dup` x WHERE x.`id` = `notas`.`empresa_id`) WHERE `empresa_id` IN (SELECT `id` FROM `_empresa_dup`);
--> statement-breakpoint
UPDATE `oportunidades` SET `empresa_id` = (SELECT `fica` FROM `_empresa_dup` x WHERE x.`id` = `oportunidades`.`empresa_id`) WHERE `empresa_id` IN (SELECT `id` FROM `_empresa_dup`);
--> statement-breakpoint
UPDATE `tarefas` SET `empresa_id` = (SELECT `fica` FROM `_empresa_dup` x WHERE x.`id` = `tarefas`.`empresa_id`) WHERE `empresa_id` IN (SELECT `id` FROM `_empresa_dup`);
--> statement-breakpoint
UPDATE `propostas` SET `empresa_id` = (SELECT `fica` FROM `_empresa_dup` x WHERE x.`id` = `propostas`.`empresa_id`) WHERE `empresa_id` IN (SELECT `id` FROM `_empresa_dup`);
--> statement-breakpoint
DELETE FROM `empresas` WHERE `id` IN (SELECT `id` FROM `_empresa_dup`);
--> statement-breakpoint
DROP TABLE `_empresa_dup`;
--> statement-breakpoint
CREATE UNIQUE INDEX `empresas_cnpj_unico` ON `empresas` (`cnpj`) WHERE cnpj is not null;
