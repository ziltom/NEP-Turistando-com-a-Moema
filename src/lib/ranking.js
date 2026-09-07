import pontosTuristicos from '../data/pontos_turisticos.json'

// O OpenStreetMap nao tem nota nem ranking de popularidade como o Google.
// Entao a "importancia" de um ponto e calculada aqui, por heuristica.

// Peso base por categoria.
// Atencao ao "park": no OSM brasileiro, praticamente toda pracinha de bairro
// e mapeada como leisure=park. Por isso ele comeca baixo e so sobe quando o
// nome ou as outras tags mostram que e um parque de verdade.
const PESO_CATEGORIA = {
  attraction: 6,
  museum: 6,
  monument: 5,
  castle: 5,
  market: 5,
  theatre: 5,
  viewpoint: 4,
  zoo: 4,
  aquarium: 4,
  theme_park: 4,
  gallery: 3,
  memorial: 3,
  building: 3,
  church: 3,
  park: 1,
  artwork: 1,
}

const PESO_PADRAO = 1

// Abaixo disso, o ponto nao e "principal" o suficiente para virar destaque.
// Baixe para 2 se quiser que o mapa quase sempre mostre 3 itens;
// suba para 6 se quiser so os pontos realmente famosos.
export const SCORE_MINIMO = 3.5

function pesoBase(ponto) {
  let peso = PESO_CATEGORIA[ponto.categoria] ?? PESO_PADRAO

  if (ponto.categoria === 'park') {
    const nome = (ponto.nome || '').toLowerCase()
    if (nome.startsWith('parque')) peso = 3          // parque de verdade
    else if (nome.startsWith('praca') || nome.startsWith('praça')) peso = 0.5
  }

  // Lugar mapeado como area (way/relation) costuma ser maior e mais relevante
  // que um simples ponto solto (node).
  if (ponto.id && !ponto.id.startsWith('node-')) peso += 0.5

  return peso
}

export function calcularScore(ponto) {
  let score = pesoBase(ponto)

  // Estar na Wikidata / Wikipedia e o melhor indicador de notoriedade
  // que o OpenStreetMap oferece. Lugar famoso tem; pracinha de bairro nao.
  if (ponto.wikidata) score += 6
  if (ponto.wikipedia) score += 4

  // Tags preenchidas sugerem um lugar real e estabelecido.
  if (ponto.imagem) score += 2
  if (ponto.site) score += 1
  if (ponto.telefone) score += 1

  return score
}

// Distancia aproximada em metros (suficiente para desempate).
function distancia(a, b) {
  const mLat = 111320
  const mLng = 111320 * Math.cos((a.lat * Math.PI) / 180)
  const dLat = (a.lat - b.lat) * mLat
  const dLng = (a.lng - b.lng) * mLng
  return Math.sqrt(dLat * dLat + dLng * dLng)
}

/**
 * Devolve os pontos turisticos mais relevantes dentro da area visivel.
 * bounds: { oeste, leste, sul, norte }
 * centro: { lat, lng }
 */
export function destaquesDaArea(bounds, centro, limite = 3) {
  const dentro = pontosTuristicos.filter(
    (p) =>
      p.lng >= bounds.oeste &&
      p.lng <= bounds.leste &&
      p.lat >= bounds.sul &&
      p.lat <= bounds.norte
  )

  return dentro
    .map((p) => ({ ...p, score: calcularScore(p), dist: distancia(p, centro) }))
    .filter((p) => p.score >= SCORE_MINIMO)
    .sort((a, b) => b.score - a.score || a.dist - b.dist)
    .slice(0, limite)
}
