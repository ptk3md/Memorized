# Instruções para Agentes de IA

## Objetivo
Este documento orienta agentes de IA que forem modificar, estender ou debugar o código do Memorizador. Siga as regras abaixo para manter a consistência do projeto.

## Regras gerais
- Preserve os três arquivos separados: `index.html`, `style.css`, `script.js`.
- Não reintroduza código inline. Mantenha a separação de responsabilidades.
- Respeite as variáveis CSS definidas em `:root` para cores, fontes e dimensões.
- Mantenha o tema escuro "Claude Dark" em qualquer nova interface.
- Todos os botões devem ter `aria-label`.
- Modais devem usar focus trap e fechar com `Escape`.
- Animações devem ser desabilitadas em `prefers-reduced-motion`.
- O progresso salvo no `localStorage` deve incluir o hash de integridade do texto.

## Ao adicionar um novo método de treino
1. Adicione a opção no HTML dentro de `#screen-method` com `data-method="novo-metodo"`.
2. Crie a função `renderNovoMetodoMode()` em `script.js`.
3. Adicione a condição correspondente em `renderCard()`, `handleNext()` e `handlePrev()`.
4. Atualize `saveProgress()` e `checkResume()` se o novo método precisar de estado adicional.
5. Inclua o novo método no switch de `modeBadge.textContent`.
6. Atualize este documento listando o novo método e seus detalhes.

## Convenções de código
- Use `const` e `let` adequadamente; evite `var`.
- Funções utilitárias no topo, funções de renderização no meio, eventos no final.
- Comentários em português, explicando a intenção de blocos não óbvios.
- Use template literals para HTML dinâmico.
- Mantenha a indentação com 4 espaços.

## Testes manuais sugeridos
- Texto com menos de 2 frases → botão "Começar" desabilitado.
- Texto com abreviações (Dr., Sr.) → frases não quebram indevidamente.
- Modo serial: recitar todas as frases do nível antes de avançar.
- Persistência: fechar e reabrir a página → modal de retomada aparece.
- Editar texto durante o treino → progresso é limpo.
- Atalhos de teclado funcionam em todos os modos.
- Modal de referência abre e fecha corretamente.
- Toast de conclusão de nível aparece nos momentos corretos.

## Modos existentes
| Modo      | Descrição resumida |
|-----------|---------------------|
| block     | Acumula frases em bloco único, destaque na última frase adicionada. |
| serial    | Exibe uma frase por vez, com indicadores de contexto (✓, ▶). |
| sliding   | Janela deslizante de até 4 frases, cada frase aparece no máximo 4 vezes. |