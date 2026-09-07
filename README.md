# Turistando com a Moema

Mapa interativo de Fortaleza com pontos escondidos e destaques turísticos por
área — construído **sem** a API do Google Maps.

- **Site:** https://turistandocommoema.vercel.app
- **Repositório:** https://github.com/ziltom/NEP-Turistando-com-a-Moema

---

## O que o site faz

**1. Caça à Moema.** Seis Moemas estão escondidas em bairros diferentes de
Fortaleza. Cada uma só aparece a partir de um nível de zoom próprio — quanto
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

## Como funciona o ranking

O OpenStreetMap não tem nota nem ranking de popularidade como o Google. A
relevância é calculada em `src/lib/ranking.js`.

**O problema principal:** 329 dos 520 pontos (63%) vêm com a tag
`leisure=park`, porque no mapeamento brasileiro toda pracinha de bairro recebe
essa tag. Sem tratamento, os "3 principais pontos" de qualquer bairro
residencial seriam três praças anônimas.

**Como é resolvido:**

- `park` tem peso baixo (1) por padrão. O nome desempata: começa com "Parque"
  sobe para 3; começa com "Praça" cai para 0,5.
- Ponto mapeado como área (`way`/`relation`) ganha +0,5 sobre um ponto solto
  (`node`) — quem desenhou o contorno estava mapeando algo grande.
- Presença na Wikidata vale +6 e na Wikipédia +4. É o melhor indicador de
  notoriedade que o OSM oferece: lugar famoso tem, pracinha não.
- Tags preenchidas (foto, site, telefone) somam pontos menores.
- Abaixo de `SCORE_MINIMO` (3,5) o ponto nem entra na disputa.

`SCORE_MINIMO` está no topo do arquivo. Baixe para 2 se quiser que o mapa quase
sempre mostre 3 itens; suba para 6 para ver só os pontos realmente famosos.

Amostra do resultado:

| Área | Top 3 |
|---|---|
| Centro | Museu do Ceará · Theatro José de Alencar · Fortaleza de N. S. da Assunção |
| Beira-Mar | Museu da Imagem e do Som · Jardim Japonês Jusaku Fujita · Museu da Fotografia |
| Entorno da Unifor | Museu do Automóvel · Teatro Celina Queiroz · Parque do Perfurador |
| Messejana | Mercado de Messejana · Centro Administrativo · Parque da Lagoa de Messejana |

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

## Deploy

O deploy é automático: todo `git push` para a `main` dispara um novo build na
Vercel. O plano Hobby permite 100 deploys por dia.

**Passo obrigatório uma única vez:** cadastrar o domínio de produção no Stadia
Maps, em client.stadiamaps.com/dashboard → Manage Properties → Authentication
Configuration. Sem isso o limite de requisições é bem mais apertado. Não é
preciso chave de API nem variável de ambiente — só o domínio.


---

## Atribuição

O mapa exibe automaticamente os créditos do MapLibre, Stadia Maps, OpenMapTiles
e OpenStreetMap. **Não remova** — é exigência da licença ODbL.

A imagem da Moema é a mascote da Universidade de Fortaleza e pertence à Unifor.
