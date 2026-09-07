# Caca a Moema — mapa interativo de Fortaleza

Mapa interativo com pontos escondidos e destaques turisticos por area,
feito sem a API do Google Maps.

## Stack

- **Vite + React** — frontend, sem backend
- **MapLibre GL JS** — biblioteca do mapa (open source, roda no navegador)
- **Stadia Maps** — tiles do mapa. Em `localhost` funciona sem chave
- **OpenStreetMap / Overpass API** — origem dos pontos turisticos
- **Wikidata / Wikimedia Commons** — fotos dos pontos turisticos

Nao ha backend e nao ha banco de dados. O progresso do usuario fica no
`localStorage` do navegador.

## Como rodar

```
npm install
npm run dev
```

## Gerar os dados dos pontos turisticos

O site em producao **nunca** chama a Overpass API. Os dados sao gerados
antes, uma unica vez:

```
npm run dados
```

Isso consulta o OpenStreetMap, calcula os dados e escreve
`src/data/pontos_turisticos.json`. Rode de novo so quando quiser atualizar.

O arquivo ja vem com 8 pontos de exemplo (marcados com `aproximado: true`)
para o site funcionar antes de voce rodar o script.

## As duas mecanicas

### 1. As Moemas escondidas

Cada Moema tem um `zoomMinimo` em `src/data/pontos.json`. Enquanto o zoom
for menor, o marcador fica invisivel. Ao aproximar, aparece uma silhueta;
clicando nela, vira a Moema e o progresso e salvo.

As 6 Moemas estao espalhadas por bairros diferentes de Fortaleza, com
dificuldade crescente (`zoomMinimo` de 12.5 ate 15.5).

### 2. Os 3 principais pontos da area

Sempre que a camera para de se mexer (`moveend`), o app:

1. pega os limites da area visivel;
2. filtra os pontos turisticos que estao dentro dela;
3. ordena por um score calculado em `src/lib/ranking.js`;
4. mostra os 3 primeiros no mapa e no painel.

Como o OpenStreetMap nao tem nota nem ranking de popularidade, o score usa:
presenca na Wikidata (+6), na Wikipedia (+4), peso da categoria, e tags
preenchidas como site e telefone.

Abaixo do zoom 11 a feature desliga: a area visivel seria grande demais
para "principais pontos" significar alguma coisa.

## Estrutura

```
scripts/gerar-pontos-turisticos.mjs   gera o JSON a partir do OpenStreetMap
src/data/pontos.json                  as Moemas (edite a mao)
src/data/pontos_turisticos.json       gerado pelo script
src/lib/ranking.js                    score e filtro por area
src/lib/descobertas.js                localStorage
src/components/Mapa.jsx               o mapa e as duas mecanicas
src/components/PainelProgresso.jsx    contador e dicas
src/components/CardsTuristicos.jsx    lista dos 3 destaques
public/moema/                         silhueta.svg e moema.svg
```

## O que ainda falta

- [ ] Rodar `npm run dados` para trocar os 8 pontos de exemplo pelos reais
- [ ] Ajustar as coordenadas das Moemas em `src/data/pontos.json`
- [ ] Trocar os SVGs de `public/moema/` pela arte real da Moema
- [ ] Deploy na Vercel + cadastrar o dominio no Stadia Maps

## Atribuicao obrigatoria

O mapa exibe automaticamente os creditos do OpenStreetMap e do Stadia Maps.
Nao remova: e exigencia da licenca (ODbL).
