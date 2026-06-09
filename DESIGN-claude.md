# DESIGN-claude.md — Sistema de Design do Memorizador

Referência visual completa para sessões do Claude Code neste projeto.

---

## Tokens de Cor

| Variável CSS | Valor | Uso semântico |
|---|---|---|
| `--bg-main` | `#191919` | Fundo da página |
| `--card-bg` | `#222222` | Fundo dos cards e modais |
| `--card-border` | `#2e2e2e` | Borda padrão dos cards |
| `--divider-color` | `#3a3530` | Separadores internos |
| `--text-fg` | `#f5f5f5` | Texto principal |
| `--text-fg-faint` | `#c0bdb8` | Texto secundário, labels, dicas |
| `--accent` | `#d97757` | CTA primário, destaques, frases ativas, borda seleção |
| `--accent-secondary` | `#7eb8da` | Badges informativos, chips pares, cor do modo Serial |
| `--accent-glow` | `rgba(217,119,87,0.25)` | Box-shadow de itens selecionados |
| `--link-fg` | `#93c5fd` | Links e referências azuis |
| `--bold-fg` | `var(--accent)` | Texto bold em markup Anki |
| `--italic-fg` | `var(--text-fg-faint)` | Texto italic em markup Anki |
| `--ripple-color` | `rgba(255,255,255,0.18)` | Ripple effect no btn-next |

**Cores de confete (não variáveis, definidas em `spawnConfetti()`):**
`#d97757` `#7eb8da` `#81c784` `#ce93d8` `#ffb74d` `#e57373` `#f5c6a0` `#aecbfa`

**Cores semânticas de feedback (usadas em toast e modal de delete):**
- Sucesso: fundo `#1e3a2f`, borda `#2e6048`, texto `#81c784`
- Aviso: fundo `#3a2a1a`, borda `#6b4224`, texto `#ffb74d`
- Info: fundo `#1a2a3a`, borda `#244a6b`, texto `var(--accent-secondary)`
- Perigo/delete: `#c62828` (botão confirmar)

**Chip colors (4 cores alternadas por índice de frase):**
- índice % 4 === 0: borda `var(--accent)` (laranja)
- índice % 4 === 1: borda `var(--accent-secondary)` (azul)
- índice % 4 === 2: borda `#81c784` (verde)
- índice % 4 === 3: borda `#ce93d8` (roxo)

---

## Tipografia

| Contexto | Tamanho | Peso | Classe/var |
|---|---|---|---|
| Título do card da biblioteca | 14px | 700 | `.lib-card__title` |
| Preview do card da biblioteca | 12px | 400 | `.lib-card__preview` |
| Meta (data relativa) | 11px | 400 | `.lib-card__meta` |
| Badge "Em andamento" | 10px | 700 | `.lib-card__badge` |
| Texto principal do flashcard | 20px | 400 | `--font-size-regular` |
| Texto mobile do flashcard | 18px | 400 | `--font-size-small` |
| Indicador de nível | 12px | 400 | `#level-indicator` |
| Badge de modo | 10px | 700 | `#mode-badge` |
| Dica de recitação | 12px | 400 | `#recitation-hint` |
| Botão primário | 12px | 700 | `.btn-claude-primary` |
| Atalho de teclado | 10px | 400 | `.shortcuts-legend` |
| Toast | 14px | 500 | `#toast` |
| Navbar | 13px | 700 | `.app-navbar__title` |
| Chip de frase | 11px | 500 | `.sentence-preview span` |
| Botão de ação do card | 11px | 700 | `.lib-card__action-btn` |

**Família:** `'Atkinson Hyperlegible', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`  
**Line-height padrão:** `1.6`  
**Letter-spacing de labels:** `0.08–0.12em` (uppercase)

---

## Espaçamentos

| Elemento | Padding | Gap | Border-radius |
|---|---|---|---|
| Telas (geral) | `24px` / `16px mobile` | — | — |
| Offset de telas (navbar) | `calc(52px + 1rem)` top | — | — |
| Card da biblioteca | `14px 16px` | `8px` (flex col) | `10px` |
| Flashcard | `24px` / `16px mobile` | — | `8px` |
| Modal | `24px` | `16px` (space-y-4) | `12px` |
| Botão primário | `h-14` (56px altura) | — | `8px` |
| Botões de ação do card | `5px 10px` | `6px` | `6px` |
| Badge "Em andamento" | `2px 7px` | — | `20px` |
| Chips de frase | `3px 8px` | `3px 2px` (margin) | `4px` |
| Navbar | `0 1.25rem` | — | — |

---

## Componentes

### `.lib-card`
Card da biblioteca. Flex coluna com gap 8px. Hover: `translateY(-1px)` + shadow.
- `.lib-card__header` — row: título + data
- `.lib-card__title` — font-bold 14px
- `.lib-card__meta` — data relativa, 11px, faint
- `.lib-card__preview` — 2 linhas clamp, 12px, faint
- `.lib-card__progress-row` — badge + mini-barra + % (só se progress != null)
- `.lib-card__badge` — pill laranja "Em andamento"
- `.lib-card__mini-progress` — barra 3px de altura
- `.lib-card__actions` — row com 3 botões: play, edit, delete

### `.method-option`
Card de seleção de método. Full-width, border arredondada. 
- Estado normal: border `#333333`
- Hover: border `#555`
- Selecionado: border `var(--accent)` + box-shadow glow
- `.method-option__check` — círculo laranja com ícone check, `display:none` por padrão, `display:flex` quando `.selected`
- `.method-option__badge` — selo colorido por método

### `.app-navbar`
Navbar fixa no topo. `height: 52px`, backdrop-blur, z-index 150.
- `.app-navbar__title` — nome do app à esquerda
- `.app-navbar__gear` — ícone de configurações à direita, rotaciona 45° no hover

### `#toast`
Toast flutuante. Flex row com ícone + mensagem. Animação `toastIn` (slide from top).
- `showToast(msg)` — tipo padrão (cinza)
- `showToast(msg, 'success')` — verde escuro, ícone ✓
- `showToast(msg, 'warning')` — laranja escuro, ícone ⚠
- `showToast(msg, 'info')` — azul escuro, ícone ℹ

### `.btn-claude-primary`
Botão CTA laranja. Hover: `#c56546`. Active: `#b05437`.
Quando usado no `#btn-next`: adicionar `.btn-ripple` para ripple effect.

### `.btn-claude-secondary`
Botão secundário escuro. Border `#333`. Hover: background `#2a2a2a`.

### `.lib-card__action-btn--play/edit/delete`
Botões de ação dos cards da biblioteca.
- `--play`: laranja (primário inline)
- `--edit`: cinza escuro com borda
- `--delete`: transparente, fica vermelho no hover

### `#delete-modal`
Modal multi-função para confirmações destrutivas. Recebe título/desc/callback via `openConfirmModal()`.
- `.delete-modal-icon` — círculo vermelho com ícone
- `#delete-modal-title` — título da ação
- `#delete-modal-desc` — descrição do impacto
- `#delete-modal-cancel` — cancela (`.btn-claude-secondary`)
- `#delete-modal-confirm` — confirma (vermelho por padrão, laranja para ações não-destrutivas)

---

## Estados por Componente

### Cards da biblioteca
| Estado | Aparência |
|---|---|
| Normal | border `#2e2e2e`, fundo `#222` |
| Hover | border `#3a3a3a`, `translateY(-1px)`, shadow |
| Focus-visible | outline laranja 2px |

### Método option
| Estado | Aparência |
|---|---|
| Normal | border `#333` |
| Hover | border `#555` |
| Selecionado | border `var(--accent)`, glow, checkmark visível |
| Focus-visible | outline laranja 2px |

### Botão primário (btn-next)
| Estado | Aparência |
|---|---|
| Normal | fundo `#d97757` |
| Hover | fundo `#c56546` |
| Active | fundo `#b05437` |
| Focus-visible | outline laranja 2px |
| Click | ripple branco translúcido a partir do ponto de toque |

### Botão secundário
| Estado | Aparência |
|---|---|
| Normal | fundo `#222`, border `#333` |
| Hover | fundo `#2a2a2a`, border `#444` |
| Active | fundo `#1e1e1e` |
| Disabled | opacity `0.4`, cursor `not-allowed` |

### Textarea
| Estado | Aparência |
|---|---|
| Normal | fundo `#222`, border `#333` |
| Focus | border `var(--accent)`, sem outline nativo |

---

## Animações

| Keyframe | Duração | Curva | Usado em |
|---|---|---|---|
| `softEntrance` | `0.28s` | `cubic-bezier(0.2,0.8,0.2,1)` | Flashcard a cada nível |
| `screenEnter` | `0.22s` | `ease` | Transição entre telas (classe `.screen-transition-enter`) |
| `toastIn` | `0.3s` | `ease` | Aparecimento do toast |
| `confettiFall` | `2–4s` (random) | `linear` | Confetes na conclusão |
| `warningPulse` | `0.4s` | `ease` | Shake no aviso de frases insuficientes |
| Hover gear | `0.4s` | `ease` | Rotação do ícone de engrenagem da navbar |
| Ripple | `0.6s` | `ease` | Click no btn-next |

**prefers-reduced-motion:** todas as animações são desabilitadas via media query. Regras em `style.css` cobrem `softEntrance`, `screenEnter`, `toastIn`, `confettiFall`, `warningPulse`, e qualquer `transition-duration`.

---

## Acessibilidade

### aria-labels obrigatórios
Todo botão deve ter `aria-label` descritivo em PT-BR.

| Elemento | aria-label |
|---|---|
| `#btn-new-text` | "Criar novo texto" |
| `#btn-new-text-empty` | "Criar primeiro texto" |
| `#btn-back-library` | "Voltar para biblioteca" |
| `#btn-reset-storage` | "Resetar todo o progresso" |
| `#btn-start` | "Começar treino" |
| `#btn-confirm-method` | "Confirmar método" |
| `#btn-next` | "Próximo passo" |
| `#btn-prev` | "Voltar" |
| `#btn-edit-text` | "Editar texto" |
| `#btn-reset-training` | "Reiniciar treino" |
| `#btn-view-full-text` | "Ver texto completo" |
| `#btn-close-fulltext` | "Fechar" |
| `.train-btn` | "Treinar: {título}" |
| `.edit-btn` | "Editar: {título}" |
| `.delete-btn` | "Apagar: {título}" |
| `#delete-modal-cancel` | "Cancelar" |
| `#delete-modal-confirm` | "Confirmar ação" |
| `#btn-settings` | "Configurações" |
| `#btn-back-library-complete` | "Voltar para biblioteca" |
| `#btn-restart` | "Reiniciar treino" |

### Modais
Todos os modais exigem:
- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby` apontando para o elemento de título do modal

### Live regions
- `#toast`: `aria-live="polite"` + `aria-atomic="true"`
- `.prettify-flashcard`: `aria-live="polite"` + `aria-atomic="true"`

### Focus trap
Todos os modais usam `trapFocus(modal)` ao abrir e `removeTrap(modal)` ao fechar.  
A tecla Escape fecha o modal ativo via o handler interno do trap.

### Foco automático
- Modal de retomada: foco em `#resume-yes`
- Modal de texto completo: foco em `#btn-close-fulltext`
- Modal de confirmação: foco em `#delete-modal-cancel`
- Tela de treino: foco em `#btn-next` (setTimeout 80ms após `showScreen`)

### Teclas de atalho (tela de treino)
| Tecla | Ação |
|---|---|
| `→` / `Espaço` | Próxima frase |
| `←` | Frase anterior |
| `R` | Abre modal "Reiniciar treino?" |
| `B` | Volta à biblioteca |
| `Escape` | Fecha modal ativo / volta tela anterior |

---

## Scrollbar Temática

Aplicada em: `.prettify-flashcard`, `.modal-content`, `.sentence-preview`, `#complete-summary`

```css
scrollbar-width: thin;
scrollbar-color: var(--accent) transparent;
/* webkit */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 2px; }
```

---

## Responsividade

| Breakpoint | Comportamento |
|---|---|
| `≤ 480px` | Flashcard: padding 16px, fonte 18px; method-option: padding 12px; shortcuts: 9px |
| `≥ 768px` | Telas com padding horizontal 24px |
| `320px` | Layout não quebra — testar navbar, cards e botões |
| `1200px+` | Card max-width 40em centralizado |
