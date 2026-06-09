# CLAUDE.md — Memorizador

Contexto permanente para sessões do Claude Code neste projeto.

---

## Visão geral

**Memorizador** é uma SPA de memorização progressiva (método da escada) em português brasileiro. O usuário cola um texto, o app divide em frases, e o treino vai revelando as frases cumulativamente até o texto inteiro ser memorizado.

**Três modos de treino:**
- **Bloco Simultâneo** — exibe todas as frases de 0 até `currentLevel` de uma vez
- **Serial Acumulativo** — exibe uma frase por vez, avança dentro do nível antes de subir
- **Micro Escadas (Janela Deslizante)** — janela deslizante de até 4 frases (`WINDOW_SIZE = 4`)

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
- `toastIn` — slide from top, 0.3s
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
renderSlidingMode()           — janela de 4 frases (WINDOW_SIZE=4)
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

**Compatibilidade obrigatória:** dados sem `createdAt`/`updatedAt` devem continuar funcionando. Sempre usar `?? fallback` ao ler campos novos.

**Funções de persistência:**
```
loadAllTexts()              → lê e parseia localStorage
saveAllTexts(texts)         → serializa e salva
findTextById(id)
updateTextInLibrary(id, updates)
deleteTextFromLibrary(id)
saveProgressForCurrentText()
clearProgressForCurrentText()
```

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
- [ ] Os 3 modos funcionam: block, serial, sliding
- [ ] Persistência: fechar e reabrir preserva progresso
- [ ] Retomar treino: modal de "Retomar?" aparece com progresso salvo
- [ ] Editar texto: limpa progresso, volta para input
- [ ] Apagar texto: remove da biblioteca
- [ ] Atalhos de teclado: Space/→ (próxima), ← (anterior), R (reiniciar), B (biblioteca), Escape
- [ ] Responsividade: testar em 320px, 768px, 1200px
- [ ] `prefers-reduced-motion`: todas as animações desabilitadas
- [ ] Acessibilidade: navegar apenas com teclado, verificar foco nos modais
