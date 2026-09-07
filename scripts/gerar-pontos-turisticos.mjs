/**
 * Gera src/data/pontos_turisticos.json a partir do OpenStreetMap.
 *
 * Rode UMA VEZ (ou quando quiser atualizar os dados):
 *   npm run dados
 *
 * O site em producao NUNCA chama a Overpass API: ele so le o JSON
 * que este script produz. Isso deixa o site instantaneo, sem limite
 * de uso e sem depender de nenhum servico de terceiro no ar.
 */

import { writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SAIDA = resolve(__dirname, '../src/data/pontos_turisticos.json')

// Area de Fortaleza: sul, oeste, norte, leste
const BBOX = '-3.90,-38.65,-3.68,-38.40'

const OVERPASS = 'https://overpass-api.de/api/interpreter'

const CONSULTA = `
[out:json][timeout:120];
(
  nwr["tourism"~"^(attraction|museum|viewpoint|artwork|gallery|zoo|aquarium|theme_park)$"]["name"](${BBOX});
  nwr["historic"~"^(monument|memorial|castle|church|building)$"]["name"](${BBOX});
  nwr["leisure"="park"]["name"](${BBOX});
  nwr["amenity"~"^(theatre|marketplace)$"]["name"](${BBOX});
);
out center tags;
`

// Descobre a categoria a partir das tags do OSM.
function categoriaDe(tags) {
  if (tags.tourism) return tags.tourism
  if (tags.historic) return tags.historic
  if (tags.leisure === 'park') return 'park'
  if (tags.amenity === 'theatre') return 'theatre'
  if (tags.amenity === 'marketplace') return 'market'
  return 'outro'
}

// Busca a imagem (propriedade P18) de varios itens da Wikidata de uma vez.
async function buscarImagens(ids) {
  const mapa = {}
  const lotes = []
  for (let i = 0; i < ids.length; i += 45) lotes.push(ids.slice(i, i + 45))

  for (const lote of lotes) {
    const url =
      'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*' +
      '&props=claims&languages=pt&ids=' + lote.join('|')
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'mapa-moema/1.0 (projeto academico)' } })
      if (!r.ok) continue
      const json = await r.json()
      for (const [id, entidade] of Object.entries(json.entities || {})) {
        const p18 = entidade?.claims?.P18?.[0]?.mainsnak?.datavalue?.value
        if (p18) {
          mapa[id] =
            'https://commons.wikimedia.org/wiki/Special:FilePath/' +
            encodeURIComponent(p18) + '?width=400'
        }
      }
    } catch (e) {
      console.warn('  aviso: falha ao buscar um lote de imagens -', e.message)
    }
    await new Promise((r) => setTimeout(r, 300)) // gentileza com a API
  }
  return mapa
}

// A Overpass e um servico publico e gratuito: quando esta cheia, responde
// 429 (fila lotada) ou 504 (demorou demais). Nesses casos vale esperar e tentar
// de novo, em vez de desistir.
async function consultarOverpass(tentativas = 4) {
  for (let n = 1; n <= tentativas; n++) {
    console.log('     tentativa ' + n + ' de ' + tentativas + '...')

    let resposta
    try {
      resposta = await fetch(OVERPASS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'mapa-moema/1.0 (projeto academico)',
        },
        body: 'data=' + encodeURIComponent(CONSULTA),
      })
    } catch (e) {
      console.warn('     falha de rede: ' + e.message)
      if (n === tentativas) throw new Error('Sem resposta da Overpass. Verifique sua internet.')
      await new Promise((r) => setTimeout(r, 15000))
      continue
    }

    if (resposta.ok) return resposta.json()

    if (resposta.status === 429 || resposta.status === 504) {
      const espera = 20 * n
      console.warn('     servidor ocupado (' + resposta.status + '). Esperando ' + espera + 's...')
      if (n === tentativas) {
        throw new Error(
          'A Overpass esta sobrecarregada agora. Espere uns 10 minutos e rode "npm run dados" de novo.'
        )
      }
      await new Promise((r) => setTimeout(r, espera * 1000))
      continue
    }

    const corpo = await resposta.text().catch(() => '')
    throw new Error('Overpass respondeu ' + resposta.status + '. ' + corpo.slice(0, 200))
  }
}

async function principal() {
  console.log('1/3  Consultando a Overpass API (pode levar ate 2 minutos)...')

  const dados = await consultarOverpass()
  console.log('     ' + dados.elements.length + ' elementos brutos recebidos.')

  console.log('2/3  Limpando e formatando...')

  const vistos = new Set()
  const pontos = []

  for (const el of dados.elements) {
    const tags = el.tags || {}
    if (!tags.name) continue

    // "nwr" devolve nos (lat/lon direto) e areas (centro calculado).
    const lat = el.lat ?? el.center?.lat
    const lng = el.lon ?? el.center?.lon
    if (lat == null || lng == null) continue

    // Evita o mesmo lugar mapeado como no e como area.
    const chave = tags.name.toLowerCase() + '|' + lat.toFixed(3) + '|' + lng.toFixed(3)
    if (vistos.has(chave)) continue
    vistos.add(chave)

    pontos.push({
      id: el.type + '-' + el.id,
      nome: tags.name,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      categoria: categoriaDe(tags),
      wikidata: tags.wikidata || undefined,
      wikipedia: tags.wikipedia ? true : undefined,
      site: tags.website ? true : undefined,
      telefone: tags.phone ? true : undefined,
    })
  }

  console.log('     ' + pontos.length + ' pontos apos limpeza.')

  console.log('3/3  Buscando imagens na Wikidata...')
  const ids = [...new Set(pontos.filter((p) => p.wikidata).map((p) => p.wikidata))]
  const imagens = ids.length ? await buscarImagens(ids) : {}

  let comImagem = 0
  for (const p of pontos) {
    if (p.wikidata && imagens[p.wikidata]) {
      p.imagem = imagens[p.wikidata]
      comImagem++
    }
    // O ranking so precisa saber SE existe wikidata, nao qual e o id.
    if (p.wikidata) p.wikidata = true
  }
  console.log('     ' + comImagem + ' pontos com foto.')

  await writeFile(SAIDA, JSON.stringify(pontos, null, 1), 'utf8')
  console.log('\nPronto: ' + SAIDA)
  console.log('Rode "npm run dev" e arraste o mapa.')
}

principal().catch((e) => {
  console.error('\nFalhou:', e.message)
  console.error('O site continua funcionando com os dados que ja existem.')
  process.exit(1)
})
