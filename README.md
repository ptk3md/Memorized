# Memorizador · Claude Dark

Aplicativo de memorização progressiva com três modos de treino:
- **Bloco Simultâneo (Clássico):** exibe todas as frases acumuladas até o nível atual em um único bloco.
- **Serial Acumulativo (variante do usuário):** exibe uma frase por vez, seguindo a ordem cumulativa (A, A+B, A+B+C…).
- **Micro Escadas (Janela Deslizante):** ideal para textos longos. Exibe uma janela deslizante de até 4 frases, garantindo que cada frase apareça no máximo 4 vezes.

## Estrutura de arquivos
- `index.html` – estrutura das telas (entrada, seleção de método, memorização, conclusão) e modais.
- `style.css` – variáveis de tema escuro, estilos dos cartões, botões, animações e responsividade.
- `script.js` – lógica completa: parsing de frases, persistência via localStorage, renderização dos três modos, navegação, atalhos de teclado, focus trap e modais.

## Como usar
1. Abra `index.html` em um navegador moderno.
2. Cole um texto com pelo menos 2 frases no campo de entrada.
3. Escolha o método de treino desejado.
4. Pratique com os atalhos: `→` ou `Espaço` (avançar), `←` (voltar), `R` (reiniciar).

## Dependências
- [Tailwind CSS](https://tailwindcss.com/) via CDN
- [Lucide Icons](https://lucide.dev/) via CDN
- Fonte [Atkinson Hyperlegible](https://fonts.google.com/specimen/Atkinson+Hyperlegible)

## Funcionalidades principais
- Parsing inteligente de frases (respeita parágrafos, evita quebra em abreviações)
- Persistência de progresso com hash de integridade
- Feedback visual de nível concluído
- Toast notifications
- Confetes na conclusão
- Modais com focus trap para acessibilidade
- Respeito a `prefers-reduced-motion`
- Legenda de atalhos
- Pré-visualização das frases detectadas
- Modal de referência do texto completo
