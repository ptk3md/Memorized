# Arquitetura do Memorizador

## Estados da aplicação
- `sentences`: array de strings com as frases parseadas.
- `method`: `'block'` | `'serial'` | `'sliding'`.
- `currentLevel`: índice da última frase incluída no nível atual (0‑based).
- `currentIndexWithinLevel`: índice da frase sendo exibida dentro do nível (usado apenas no modo serial).
- `selectedMethod`: método selecionado na tela de escolha (antes da confirmação).

## Telas
1. **Input (`#screen-input`):** textarea, contador de frases, pré‑visualização, botão "Começar".
2. **Method (`#screen-method`):** três opções de método, botão "Confirmar".
3. **Play (`#screen-play`):** barra de progresso, cartão de memorização, dicas de recitação, botões de navegação, modal de texto completo.
4. **Complete (`#screen-complete`):** resumo do texto, botão "Reiniciar", confetes.

## Modais
- **Resume (`#resume-modal`):** oferece retomada de progresso salvo.
- **Fulltext (`#fulltext-modal`):** exibe o texto completo durante o treino.

## Fluxo de dados
1. `parseSentences(text)` → quebra o texto em frases.
2. `updateSentenceCounter()` → atualiza UI de contagem e preview.
3. Ao confirmar método: `method` é definido, progresso é salvo.
4. `renderCard()` → roteia para `renderBlockMode()`, `renderSerialMode()` ou `renderSlidingMode()`.
5. `handleNext()`/`handlePrev()` → atualizam estado, salvam progresso e re‑renderizam.
6. Ao concluir: `showCompleteScreen()` limpa progresso e exibe confetes.

## Persistência (localStorage)
- Chave: `'memorizador-progress'`
- Objeto: `{ text, hash, method, currentLevel, currentIndexWithinLevel }`
- Hash: gerado com função simples de 32 bits para detectar adulteração.

## Regras de acessibilidade
- `aria-label` em todos os botões
- `aria-live="polite"` no cartão
- `role="dialog"` e `aria-modal="true"` nos modais
- Focus trap nos modais
- `prefers-reduced-motion` desabilita animações
- Contraste mínimo de 4.5:1 (texto secundário: `#b0aca8` sobre `#191919`)

## Algoritmo de parsing de frases
1. Divide o texto por linhas em branco (`/\n\s*\n/`).
2. Para cada bloco, divide por pontuação final seguida de espaço e letra maiúscula, número ou aspas.
3. Fallback: se houver menos de 2 frases, usa split simples por pontuação.

## Modos de treino – lógica interna
### Bloco
- `currentLevel` incrementa até `sentences.length - 1`.
- Exibe frases 0..currentLevel.
- Última frase recebe destaque visual (borda laranja).

### Serial
- Dois índices: `currentLevel` e `currentIndexWithinLevel`.
- `currentIndexWithinLevel` vai de 0 a `currentLevel`, depois `currentLevel` incrementa e `currentIndexWithinLevel` reseta para 0.
- Indicador de contexto: ✓ (já vista), ▶ (atual), frases futuras em cinza.

### Sliding (janela deslizante)
- `currentLevel` incrementa linearmente.
- Exibe frases de `currentLevel - WINDOW_SIZE + 1` até `currentLevel`.
- `WINDOW_SIZE = 4` por padrão.
- Cada frase aparece no máximo 4 vezes.