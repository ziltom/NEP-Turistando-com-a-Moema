# Turistando com a Moema

Mapa interativo de Fortaleza com pontos escondidos e destaques turísticos por
área

- **Site:** https://turistandocommoema.vercel.app
- **Repositório:** https://github.com/ziltom/NEP-Turistando-com-a-Moema

---

## O que o site faz

O principal objetivo é conhecer os pontos turísticos de Fortaleza com
gamificação.

**1. Caça à Moema.** Seis Moemas estão escondidas em bairros diferentes de
Fortaleza. Cada uma só aparece a partir de um nível de zoom próprio. Quanto
mais escondida, mais é preciso explorar o mapa. Ao encontrar uma silhueta e
clicar nela, a Moema é revelada e o progresso fica salvo no navegador.

**2. Principais pontos da área.** Sempre que o mapa para de se mexer, o site
mostra os 3 pontos turísticos mais relevantes da região visível, com marcadores
numerados no mapa e uma lista no painel.



---

## Como rodar

```bash
npm install
npm run dev
```

Em `localhost` o Stadia Maps funciona sem chave de API. Nada para configurar.

Para gerar a versão de produção:

```bash
npm run build
```

---

## Gerando os dados turísticos

```bash
npm run dados
```

O script consulta a Overpass API, filtra e pontua os resultados, busca imagens
na Wikidata e escreve `src/data/pontos_turisticos.json`. Rode de novo só quando
quiser atualizar os dados.

Resultado da última execução para Fortaleza:

| | |
|---|---|
| Elementos brutos recebidos | 523 |
| Pontos após limpeza | 520 |
| Com ligação à Wikidata | 15 |
| Com foto do Wikimedia | 13 |
| Aprovados pelo corte de score | 186 |
| Tamanho do arquivo | 72 KB |

---

## Estrutura

```
scripts/gerar-pontos-turisticos.mjs   gera o JSON a partir do OpenStreetMap
src/data/pontos.json                  as 6 Moemas (editar à mão)
src/data/pontos_turisticos.json       gerado pelo script — não editar
src/lib/ranking.js                    score e filtro por área
src/lib/descobertas.js                persistência no localStorage
src/components/Mapa.jsx               o mapa e as duas mecânicas
src/components/PainelProgresso.jsx    contador e dicas
src/components/CardsTuristicos.jsx    lista dos 3 destaques
public/moema/moema-pin.png            a Moema revelada
public/moema/moema-silhueta.png       o estado "não descoberto"
public/moema/moema.png                imagem completa, usada no popup
```

Para mudar uma Moema, edite `src/data/pontos.json`:

| Campo | O que é |
|---|---|
| `nome` | título do popup |
| `descricao` | texto do popup |
| `dica` | texto na lista lateral enquanto não foi encontrada |
| `zoomMinimo` | a partir de qual zoom a silhueta aparece (12,5 = fácil, 15,5 = difícil) |
| `lat` / `lng` | posição no mapa |





---

## GABARITO
Confira onde estão as emas:

01 - Parque do Cocó
02 - Beira-mar
03 - Praça do Ferreira
04 - Unifor
05 - Praia do Futuro
06 - Dragão do Mar

---

## Atribuição

O mapa exibe automaticamente os créditos do MapLibre, Stadia Maps, OpenMapTiles
e OpenStreetMap. — é exigência da licença ODbL.

A imagem da Moema é a mascote da Universidade de Fortaleza e pertence à Unifor.
