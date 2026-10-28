# CRM Comercial — identidade visual v1

Sistema interno para atendimento, propostas e contratos. Nome funcional mantido: CRM Comercial.

## Conceito do ícone
Um documento com canto dobrado contém três pontos conectados por um traço. O documento representa propostas e contratos; os três pontos representam atendimento, proposta e contrato. A posição dos pontos não representa uma métrica ou gráfico real. Sem escudo, joinha ou setas.

Para continuar legível na barra de tarefas, os três pontos são simples. Não há três miniaturas de documentos dentro do ícone. A metáfora comercial está no conjunto.

## Arquivos
- crm-comercial.ico: ícone Windows, com tamanhos de 16 a 256 px.
- icone.svg: original vetorial com fundo azul e cantos arredondados.
- icone-N.png: versões de 16 a 1024 px, com transparência fora do bloco azul.
- simbolo-azul.svg / simbolo-branco.svg e PNG: versões sem bloco de fundo.
- previa-identidade.png: apresentação da direção e comparação dos tamanhos.
- tema.css: tokens e estilos de referência para interface web.

## Paleta
| Papel | Hex |
|---|---|
| Principal e botões | #007FAE |
| Navegação e títulos | #10334A |
| Acento decorativo | #37C7E8 |
| Fundo | #F4F8FB |
| Superfície | #FFFFFF |
| Texto | #243746 |
| Texto secundário | #526779 |
| Bordas | #DCE6ED |
| Sucesso | #18794E |
| Atenção | #8A5700 |
| Erro | #B42318 |

Texto branco sobre o azul principal; texto escuro sobre o ciano. O ciano não deve ser usado para texto pequeno em fundo branco. Estados devem ter texto ou ícone além da cor.

## Direção para dentro do app
Manter a estrutura funcional da tela existente. Sidebar azul profundo, conteúdo em fundo branco azulado e cartões brancos. Botão principal azul oceano com texto branco. Menu ativo com superfície azul e texto branco. Remover o escudo atual e substituir pelo novo símbolo.

Fonte: Segoe UI no Windows; fallback system-ui, sans-serif. Corpo 14 px, auxiliar 12 px, títulos 24–28 px. Pesos 400, 600 e 700. Espaçamento em múltiplos de 4 px. Cartões com raio de 12 px e borda discreta. Botões com raio de 8 px e altura mínima de 40 px. Ícones de interface em traço uniforme; evitar misturar estilos.

Não aplicar efeitos de brilho, gradientes ou sombras pesadas. Usar o ciano apenas em pequenos detalhes. Em indicadores vazios, explicar a ausência de dados em vez de exibir gráficos decorativos.

## Instrução para o Claude
Aplique os tokens de tema.css aos componentes existentes, adaptando à tecnologia do projeto. Preserve funcionalidades, dados e navegação. Substitua o ícone atual pelo crm-comercial.ico na janela e no executável; use icone.svg ou o PNG correspondente dentro da interface. Não recrie o símbolo com outro desenho. Confira o resultado no Windows em escala 100%, 125% e 150%.

## Como aplicar no Windows
Para um atalho: botão direito > Propriedades > Atalho > Alterar ícone > procurar crm-comercial.ico. Guarde o arquivo em uma pasta permanente antes de selecionar.

Para o aplicativo e a barra de tarefas, peça ao Claude para configurar também o ícone da janela e o recurso de ícone do executável no framework utilizado. Alterar apenas o atalho pode não alterar o ícone de uma janela aberta. Depois de recompilar, pode ser necessário remover o atalho fixado antigo e fixar o novo.

## Limite desta entrega
Este pacote fornece arquivos visuais e especificação para a interface. O código do aplicativo não foi enviado e, portanto, a interface ainda não foi modificada ou testada. SVG e PNG são exportações próprias da mesma geometria; podem apresentar pequenas diferenças de suavização.
