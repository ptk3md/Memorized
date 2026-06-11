# CLAUDE.md — Memorizador

Contexto permanente para sessões do Claude Code neste projeto.

---

## Visão geral

**Memorizador** é uma SPA de memorização progressiva (método da escada) em português brasileiro. O usuário cola um texto, o app divide em frases, e o treino vai revelando as frases cumulativamente até o texto inteiro ser memorizado.

**Três modos de treino:**
- **Bloco Simultâneo** — exibe todas as frases de 0 até `currentLevel` de uma vez
- **Serial Acumulativo** — exibe uma frase por vez, avança dentro do nível antes de subir
- **Micro Escadas (Janela Deslizante)** — tamanho de janela `S` configurável (2–6, padrão 4 via `slidingWindowSize`). Sequência: **aquecimento** (1, 12, 123… até `S`) → **deslizamento** (janela de `S` frases desliza até o fim) → **síntese final** (texto completo). Passos construídos por `buildSlidingSteps(S, N)`; sem repetição consecutiva de janelas.

**Stack:** HTML/CSS/JS puros, sem build step, sem framework.  
**Dependências (CDN apenas):** Tailwind CSS, Lucide Icons, Atkinson Hyperlegible (Google Fonts).  
**Persistência:** `localStorage` — chave `memorizador-texts`.

---

## Arquitetura de arquivos

```
index.html   — estrutura de todas as telas, IDs de elementos, modais
style.css    — design system via CSS custom properties, animações, responsividade
script.js    — toda a lógica em um único IIFE; sem módulos, sem bundler
```

**Regra absoluta:** manter exatamente 3 arquivos separados. Nunca usar `<style>` inline no HTML, nunca usar atributos `style=""` para lógica visual, nunca mover JS para HTML.

---

## Fluxo de telas

```
screen-library → screen-input → screen-method → screen-play → screen-complete
     (0)              (1)             (2)             (3)             (4)
```

A navegação é controlada por `showScreen(element)`, que oculta todas as telas e exibe apenas a alvo, recriando os ícones Lucide após cada troca.

**IDs das telas:** `#screen-library`, `#screen-input`, `#screen-method`, `#screen-play`, `#screen-complete`  
**Modais:** `#resume-modal` (retomar progresso), `#fulltext-modal` (ver texto completo)

---

## Design system (style.css)

### Variáveis CSS raiz

```css
--bg-main: #191919          /* fundo da página */
--card-bg: #222222          /* fundo dos cards */
--card-border: #2e2e2e      /* borda dos cards */
--divider-color: #3a3530    /* separadores */
--text-fg: #f5f5f5          /* texto principal */
--text-fg-faint: #b0aca8    /* texto secundário */
--accent: #d97757           /* laranja — cor de destaque primária */
--link-fg: #93c5fd          /* azul — links e badges secundários */
--font-family: 'Atkinson Hyperlegible', system-ui
--font-size-regular: 20px
--font-size-small: 18px
--line-height: 1.6
--card-max-width: 40em
--card-padding: 24px
--anim-time: 0.28s
--anim-curve: cubic-bezier(0.2, 0.8, 0.2, 1)
```

### Melhorias visuais planejadas (roadmap)

Ao implementar melhorias de UI, seguir estas diretrizes:

| Área | Diretriz |
|---|---|
| Texto secundário | Aumentar para `#c0bdb8` (contraste levemente maior) |
| Cor secundária | Usar `#7eb8da` para badges, chips e indicadores informativos |
| Padding geral | 24px em telas ≥768px, 16px em mobile |
| Scrollbar | `thumb: var(--accent)` escurecido, `track: transparent` |

### Animações

- `softEntrance` — fade + scale(0.97→1), usado em cards e telas
- `confettiFall` — queda e rotação, 3s
- Sempre respeitar `@media (prefers-reduced-motion: reduce)` — desabilitar todas as animações

---

## Funções protegidas — NUNCA alterar

Estas funções contêm a lógica de negócio do app. Qualquer alteração de UI deve contorná-las, não modificá-las.

```
parseSentences(text)          — parse inteligente de frases (parágrafos → pontuação → fallback)
formatAnkiMarkup(raw)         — converte sintaxe Anki em HTML (frações, superscript, setas, etc.)
renderBlockMode()             — exibe frases 0..currentLevel, destaque na última
renderSerialMode()            — exibe uma frase com indicadores ✓/▶
renderSlidingMode()           — janela deslizante de tamanho S (via buildSlidingSteps): aquecimento → deslize → síntese
handleNext()                  — avança nível/frase conforme o modo
handlePrev()                  — retrocede
```

`renderCard()` roteia para o render correto e aplica a animação de entrada — pode receber ajustes visuais, mas não lógicos.

---

## localStorage

**Chave:** `memorizador-texts`

**Schema:**
```js
[
  {
    id: string,           // timestamp + random
    title: string,        // primeira linha do texto
    content: string,      // texto completo
    progress: {           // null se não iniciado
      method: 'block' | 'serial' | 'sliding',
      currentLevel: number,
      currentIndexWithinLevel: number
    } | null,
    // campos opcionais que podem ser adicionados:
    createdAt: number,    // Date.now() — para exibir "criado há X dias"
    updatedAt: number
  }
]
```

**Compatibilidade obrigatória:** dados sem `createdAt`/`updatedAt` devem continuar funcionando. Sempre usar `?? fallback` ao ler campos novos. O campo `savedAt` (ISO string) é gravado em novos textos para a data relativa.

**Funções de persistência:**
```
loadLocalTexts()            → lê e parseia localStorage (síncrona, apenas locais)
loadAllTexts()               → async; merge de loadLocalTexts() + loadGitHubTexts()
saveAllTexts(texts)         → serializa e salva
findTextById(id)             → async (usa loadAllTexts())
saveTextToLibrary(...)       → cria/atualiza texto local (usa loadLocalTexts())
updateTextInLibrary(id, updates)  → usa loadLocalTexts()
deleteTextFromLibrary(id)         → usa loadLocalTexts()
saveProgressForCurrentText()
clearProgressForCurrentText()
```

**⚠️ Atenção (async/sync):** `loadAllTexts()` é **assíncrona** (faz fetch ao GitHub). Qualquer função que apenas lê/grava textos **locais** (criar, editar, apagar, salvar progresso) deve usar `loadLocalTexts()` (síncrona). Só use `loadAllTexts()`/`await` em funções que precisam exibir/buscar textos do GitHub também (`renderLibrary`, `findTextById`, `startTraining`, `editText`). Misturar os dois (ex.: chamar `loadAllTexts()` sem `await` numa função síncrona) quebra `texts.push(...)`/`saveAllTexts(texts)` com `TypeError`, pois `texts` vira uma `Promise`.

**Histórico:** essa troca já causou regressão real em `saveTextToLibrary()` (chamava `loadAllTexts()` sem `await`, quebrando os botões "Salvar" e "Começar" — corrigido trocando para `loadLocalTexts()`). Ao tornar uma função `async` ou ao adicionar `await loadAllTexts()`, revisar **todos** os outros usos de `loadAllTexts()`/`loadLocalTexts()` no arquivo para garantir consistência.

### Configurações (chave separada)

**Chave:** `memorizador-settings` — **independente** de `memorizador-texts`.

```js
{
  font: 'atkinson' | 'dyslexic' | 'opensans',  // seletor de fonte
  zen: boolean                                  // modo zen
}
```

- Acessadas via `loadSettings()` / `saveSettings()` / `applySettings()`.
- **Fonte:** aplicada sobrescrevendo a variável CSS `--font-family` em `document.documentElement` (body e cartão já usam `var(--font-family)`). Fontes carregadas por `<link>` no `<head>`: Open Sans (Google Fonts), OpenDyslexic (cdnfonts); Atkinson via `@import` em style.css.
- **Modo Zen:** classe `body.zen-mode` oculta elementos marcados com `.zen-hide` (chrome não-essencial da tela de estudo). Mantidos sempre: barra de progresso, cartão, `#btn-next`, `#btn-back-play`.
- Modal: `#settings-modal`, aberto pela engrenagem `#btn-settings` da navbar. Os atalhos de teclado vivem aqui como ajuda (a legenda fixa foi removida da tela de estudo).

### Sessão de estudo (`#screen-play`)

- A `.app-navbar` fica oculta durante o estudo (classe `body.study-mode`, alternada em `showScreen()`) para liberar espaço vertical. `#screen-play` recebe `padding-top` reduzido nesse estado.
- A porcentagem numérica (`#progress-pct`) foi removida; resta apenas a barra de progresso (`#progress-bar-fill`) + `#mode-badge`.
- Avisos popup (`showToast`) foram removidos da interface — a função existe como no-op para não quebrar chamadas existentes.
- **Micro Escadas (`data-mode="sliding"`):** fonte um pouco menor (`clamp(0.85rem, 3.2vw, 1.2rem)`) e `max-height` maior (`calc(100vh - 230px)`, `calc(100vh - 150px)` no modo Zen), aproveitando o espaço liberado pela navbar oculta. Sem `display:contents`/`overflow:hidden` forçados — o scroll do cartão (`overflow-y:auto`) cobre o excesso sem cortar texto.

### Repetição Espaçada (FSRS)

Camada de revisão espaçada em **JS puro** (sem dependências, sem build), persistida em chave própria.

**Chave:** `memorizador-fsrs` — **independente** de `memorizador-texts` e `memorizador-settings`.

```js
{
  cards: {                       // por id de texto (locais E do GitHub)
    [textId]: {
      state, difficulty, stability, reps, lapses,
      lastReview,  // ms epoch
      due,         // ms epoch da próxima revisão
      scheduledDays
    }
  },
  log: [ { date: 'YYYY-MM-DD', rating, textId } ]   // para heatmap/sequência (1 ano)
}
```

- **Engine:** implementação fiel-simplificada do FSRS v4.5 (`FSRS_W` = pesos padrão publicados). Funções puras: `fsrsReview(card, rating, now)`, `_fsrsRetrievability`, `_fsrsNextStability`, `_fsrsNextDifficulty`, `_fsrsInterval`. `R = exp(ln(0.9)·t/S)`, retenção-alvo 0.9.
- **Nota do usuário:** `1=Perfeitamente … 4=Não lembro` (convertida internamente para grade FSRS `4..1` via `_ratingToGrade`).
- **Fluxo:** ao concluir uma sessão (`showCompleteScreen`), aparece o bloco `#recall-rating` (4 botões). O clique chama `recordReview(textId, rating)`, que atualiza o card e mostra "Próxima revisão em X dias". `resetRecallRating()` prepara o bloco a cada conclusão.
- **Biblioteca:** `#review-panel` mostra vencidos hoje (`#stat-due`), sequência (`#stat-streak`) e retenção prevista (`#stat-retention`), além de um heatmap estilo GitHub (`#heatmap`). Cards vencidos ganham o badge `.lib-card__due`. Funções: `getDueTextIds()`, `getFsrsStats()`, `getReviewCountsByDay()`, `renderReviewPanel()`, `renderHeatmap()`.
- O painel só aparece quando há ≥1 card (após a primeira avaliação). Textos do GitHub também acumulam memória FSRS (a restrição é só de editar/apagar).

### Textos Compartilhados (GitHub)

Os textos podem ser fornecidos de duas formas:

1. **Locais** (localStorage): criados pelo usuário, salvos no navegador
2. **GitHub** (`/texts/`): textos predefinidos no repositório

#### Estrutura de arquivo `/texts/`

Cada arquivo `.txt` é um texto completo. O título é automaticamente extraído do nome do arquivo:

- `poema-classico.txt` → "Poema Clássico"
- `trecho-tecnico.txt` → "Trecho Técnico"
- `conto_curto.txt` → "Conto Curto"

Regra: hífens (`-`) e underscores (`_`) são convertidos para espaços, e a primeira letra de cada palavra é capitalizada.

#### Carregamento e comportamento

- **Função `loadAllTexts()`** (async): carrega textos locais do localStorage e textos do GitHub via GitHub API
- **Função `loadGitHubTexts()`** (async): lista e carrega arquivos `.txt` da pasta `/texts` usando:
  - GitHub API para listar arquivos: `https://api.github.com/repos/ptk3md/Memorized/contents/texts`
  - raw.githubusercontent.com para conteúdo: `https://raw.githubusercontent.com/ptk3md/Memorized/main/texts/{filename}.txt`
- **ID único**: textos do GitHub recebem ID `gh-{sha}` (baseado no SHA do commit)
- **Badge visual**: textos do GitHub aparecem na biblioteca com badge azul "GitHub"; locais com badge laranja "Local"
- **Progresso**: textos do GitHub sempre têm `progress: null` (não salvamos progresso)
- **Flag `isExternal`**: `true` para GitHub, `false` ou undefined para locais

#### Restrições

- Textos do GitHub não podem ser editados (botão desabilitado)
- Textos do GitHub não podem ser deletados (botão desabilitado)
- Apenas o botão "Treinar" funciona normalmente
- Se um arquivo for deletado do GitHub, o app continua funcionando com textos locais

#### Para adicionar novo texto

1. Crie arquivo `.txt` em `/texts/` (ex: `novo-texto.txt`)
2. Escreva o conteúdo (texto puro, sem metadados)
3. Faça commit e push para `main`
4. Recarregue o app (Ctrl+R ou F5) — o novo texto aparecerá na biblioteca

#### Fallback (sem conexão)

Se o GitHub não estiver acessível ou houver erro de conexão:
- `loadGitHubTexts()` retorna array vazio (silenciosamente)
- `loadAllTexts()` faz merge apenas com textos locais
- App continua funcionável com biblioteca local

---

## Acessibilidade — regras obrigatórias

- **Todos os botões:** `aria-label` descritivo (em PT-BR)
- **Modais:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` apontando para o título
- **Cartão de memorização:** `aria-live="polite"` mantido em `#card-content`
- **Focus trap:** usar a função `trapFocus(modalElement)` existente para qualquer modal novo; `removeTrap(modalElement)` no fechamento
- **Escape:** fechar modal ativo; se nenhum modal aberto, voltar à tela anterior
- **Focus automático:** ao entrar na tela de treino, focar em `#btn-next`
- **Tecla B:** atalho para voltar à biblioteca de qualquer tela (exceto quando modal está aberto)

---

## Elementos DOM — referência rápida

### Biblioteca
| ID | Função |
|---|---|
| `#text-list` | Container dos cards de texto |
| `#empty-library` | Mensagem de estado vazio |
| `#btn-new-text` | Botão "Novo texto" |
| `#btn-reset-storage` | Resetar tudo |

### Input
| ID | Função |
|---|---|
| `#text-input` | Textarea principal |
| `#sentence-counter` | Contador de frases detectadas |
| `#sentence-preview` | Preview das frases em chips |
| `#warning-few-sentences` | Aviso de mínimo 2 frases |
| `#btn-start` | Confirmar texto |
| `#btn-back-library` | Voltar |

### Método
| ID/classe | Função |
|---|---|
| `.method-option` | Botões de seleção de método |
| `#btn-confirm-method` | Confirmar método |

### Treino
| ID | Função |
|---|---|
| `#level-indicator` | Badge "Nível X/Y" |
| `#mode-badge` | Badge do modo atual |
| `#progress-bar-fill` | Barra de progresso (width %) |
| `#context-indicator` | Indicador de contexto (serial) |
| `#card-content` | Conteúdo do cartão (aria-live) |
| `#recitation-hint` | Dica de recitação |
| `#btn-next` | Próxima (botão principal) |
| `#btn-prev` | Anterior |
| `#btn-edit-text` | Editar texto |
| `#btn-reset-training` | Reiniciar treino |
| `#btn-view-full-text` | Ver texto completo |

### Conclusão
| ID | Função |
|---|---|
| `#complete-summary` | Resumo do texto completo |
| `#btn-restart` | Refazer |
| `#btn-back-library-complete` | Voltar à biblioteca |

---

## Roadmap de melhorias de UI

As melhorias abaixo estão aprovadas. Implementar sem alterar lógica de negócio.

### 1. Biblioteca (screen-library)
- Cards com título, preview 2 linhas, data ("criado há X dias"), badge "Em andamento" + mini barra de progresso
- Botões por card: Treinar (play), Editar (lápis), Apagar (lixeira) — com ícones Lucide
- Hover: `scale(1.01)` + brilho na borda (`box-shadow` com `--accent`)
- Estado vazio: ícone grande + texto "Nenhum texto salvo ainda. Que tal criar seu primeiro?"
- Botão "Novo texto" proeminente no topo com ícone `+`

### 2. Navegação
- Navbar fixa no topo: `backdrop-filter: blur(10px)`, nome "Memorizador" à esquerda, ícone de engrenagem à direita
- Botão "← Biblioteca" visível em todas as telas (exceto biblioteca)
- Transições entre telas: `fade + translateY(10px)`, respeitando `prefers-reduced-motion`

### 3. Input (screen-input)
- Textarea com mais espaço vertical
- Placeholder: "Cole ou digite o texto que deseja memorizar..."
- Frases em chips coloridos com número e início do texto
- Aviso de mínimo com animação suave

### 4. Método (screen-method)
- Cards visualmente distintos com ícone grande, título, descrição, selo "Recomendado para..."
- Seleção: borda glow (`--accent`) + checkmark no canto superior direito

### 5. Treino (screen-play)
- Barra de progresso com porcentagem numérica e animação de preenchimento
- Cartão: sombras mais suaves, scrollbar estilizada, numerais com círculo, frase atual com borda laranja à esquerda
- Botão "Próxima": grande, com ícone, ripple effect no clique
- Botões secundários: ícones com tooltip, em linha
- Legenda de atalhos no rodapé com `<kbd>` estilizado

### 6. Conclusão (screen-complete)
- Confetes com cores variadas e formatos diferentes
- Resumo em caixa com scroll
- Botões "Biblioteca" e "Refazer" com ícones

### 7. Design system
- Tipografia com melhor hierarquia: títulos maiores, cartão em 20px
- `--text-fg-faint` → `#c0bdb8`; nova cor `#7eb8da` para badges
- Scrollbar temática
- Micro-interações: hover nos ícones com `rotate(10deg)` leve

### 8. UX
- Modal de confirmação estilizado antes de apagar (substituir `confirm()` nativo)
- Toast com ícone (✓ sucesso, ⚠ aviso, ℹ info)
- Tecla Escape: fecha modal → senão, volta tela anterior
- Foco automático em `#btn-next` ao entrar no treino
- Tecla B: voltar à biblioteca

---

## Padrões de desenvolvimento

**Branch de desenvolvimento:** `claude/epic-noether-klf9eq`  
**Nunca fazer push direto para main.**

**Ao adicionar novos métodos de treino:**
1. Adicionar opção HTML com `data-method="novo-metodo"`
2. Criar `renderNovoMetodoMode()` em script.js
3. Adicionar condições em `renderCard()`, `handleNext()`, `handlePrev()`
4. Atualizar `saveProgressForCurrentText()` se necessário
5. Atualizar texto do `#mode-badge`

---

## Verificação / testes

Não há suite de testes automatizados. Testar abrindo `index.html` diretamente no browser (file://).

**Checklist de verificação após alterações:**

- [ ] Fluxo completo: criar texto → selecionar método → treinar → concluir
- [ ] Botões "Salvar" e "Começar" criam um novo texto sem `TypeError` no console (ver nota async/sync de `loadAllTexts`/`loadLocalTexts`)
- [ ] Os 3 modos funcionam: block, serial, sliding
- [ ] Persistência: fechar e reabrir preserva progresso
- [ ] Retomar treino: modal de "Retomar?" aparece com progresso salvo
- [ ] Editar texto: limpa progresso, volta para input
- [ ] Apagar texto: remove da biblioteca
- [ ] Atalhos de teclado: Space/→ (próxima), ← (anterior), R (reiniciar), B (biblioteca), Escape
- [ ] Responsividade: testar em 320px, 768px, 1200px
- [ ] `prefers-reduced-motion`: todas as animações desabilitadas
- [ ] Acessibilidade: navegar apenas com teclado, verificar foco nos modais
