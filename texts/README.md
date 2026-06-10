# Textos Compartilhados — Memorizador

Esta pasta contém textos que aparecem automaticamente na biblioteca do Memorizador quando o app carrega.

## Formato

Cada arquivo `.txt` é um texto completo para memorização. O título é automaticamente derivado do nome do arquivo:

- `poema-classico.txt` → "Poema Clássico"
- `trecho-tecnico.txt` → "Trecho Técnico"
- `conto_curto.txt` → "Conto Curto"

**Regra:** hífens (`-`) e underscores (`_`) são convertidos para espaços, e a primeira letra de cada palavra é capitalizada.

## Adicionar um novo texto

1. Crie um arquivo `.txt` com nome descritivo (ex: `meu-texto.txt`)
2. Escreva o conteúdo do texto (sem metadados, apenas o texto puro)
3. Faça commit e push para `main`
4. Recarregue o app (F5) — o novo texto aparecerá na biblioteca

## Características

- **Origem:** Textos desta pasta aparecem com um badge azul "GitHub"
- **Modo leitura:** Apenas para treino; não podem ser editados ou deletados no app
- **Sincronização:** Atualizações no GitHub aparecem automaticamente na próxima carga

## Exemplos inclusos

- **poema-classico.txt**: Poema moderno sobre identidade
- **trecho-tecnico.txt**: Texto sobre boas práticas em programação
- **conto-curto.txt**: Conto sobre uma biblioteca mágica
