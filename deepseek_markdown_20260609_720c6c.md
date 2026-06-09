# Prompts úteis para interagir com o código

## Para entender o funcionamento
"Explique o fluxo completo do aplicativo Memorizador, desde a colagem do texto até a conclusão do treino."

## Para modificar um modo de treino
"Como alterar o tamanho da janela deslizante no modo Micro Escadas?"
Resposta: Altere a constante `WINDOW_SIZE` no início do `script.js`.

## Para adicionar um novo modo de treino
"Quero adicionar um modo 'Aleatório' que exibe uma frase aleatória do texto. Quais arquivos e funções devo modificar?"
Resposta esperada: adicionar opção no HTML (`screen-method`), incluir renderização em `renderCard()`, lógica em `handleNext()`/`handlePrev()`, e ícone/descrição correspondentes.

## Para debugar problemas de parsing
"O texto 'Dr. João foi ao mercado. Comprou pão.' está quebrando na primeira frase. Como corrigir?"
Resposta: ajustar a regex em `parseSentences()` para ignorar pontos em abreviações comuns.

## Para estilizar um componente específico
"Como mudar a cor do destaque da frase atual no modo Bloco?"
Resposta: alterar a classe `.current-block-phrase` no `style.css` (borda e background).