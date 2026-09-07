import { useEffect, useRef } from 'react'
// O maplibre-gl v6 nao tem export default: precisa importar por nome.
// "Map" e renomeado para MapaLibre porque Map ja existe no JavaScript.
import {
  Map as MapaLibre,
  Marker,
  Popup,
  NavigationControl,
  setWorkerUrl,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import pontos from '../data/pontos.json'
import { destaquesDaArea } from '../lib/ranking.js'

// O MapLibre decodifica os tiles dentro de um Web Worker. Nem o servidor de
// desenvolvimento nem o build de producao do Vite conseguem rastrear sozinhos
// o caminho desse worker, e o sintoma e sempre o mesmo: mapa em branco, sem
// nenhum erro no console. Apontando o worker explicitamente, o Vite o
// empacota como arquivo separado e o mapa funciona nos dois casos.
setWorkerUrl(workerUrl)

// Estilo de mapa do Stadia Maps. Em localhost funciona sem chave nenhuma.
const ESTILO = 'https://tiles.stadiamaps.com/styles/alidade_smooth.json'

// MapLibre usa a ordem [longitude, latitude] - o contrario do Google.
const CENTRO_FORTALEZA = [-38.5, -3.74]
const ZOOM_INICIAL = 13

// Abaixo desse zoom, "os principais pontos da area" perde sentido:
// a area visivel seria o estado inteiro.
const ZOOM_MINIMO_DESTAQUES = 11

export default function Mapa({ descobertas, aoDescobrir, aoMudarDestaques }) {
  const containerRef = useRef(null)
  const marcadoresRef = useRef({})
  const marcadoresTuristicosRef = useRef([])

  // Refs para os callbacks: assim o mapa e criado UMA vez so,
  // mas os handlers sempre enxergam o estado atual.
  const descobertasRef = useRef(descobertas)
  const aoDescobrirRef = useRef(aoDescobrir)
  const aoMudarDestaquesRef = useRef(aoMudarDestaques)
  descobertasRef.current = descobertas
  aoDescobrirRef.current = aoDescobrir
  aoMudarDestaquesRef.current = aoMudarDestaques

  useEffect(() => {
    const mapa = new MapaLibre({
      container: containerRef.current,
      style: ESTILO,
      center: CENTRO_FORTALEZA,
      zoom: ZOOM_INICIAL,
    })

    mapa.addControl(new NavigationControl(), 'top-right')
    mapa.on('error', (e) => console.error('Erro no mapa:', e && e.error))

    // ---------- 1. As Moemas escondidas ----------

    pontos.forEach((ponto) => {
      const el = document.createElement('div')
      el.className = 'marcador'
      el.title = ponto.dica

      el.addEventListener('click', (evento) => {
        evento.stopPropagation()

        if (!descobertasRef.current.includes(ponto.id)) {
          aoDescobrirRef.current(ponto.id)
        }

        new Popup({ offset: 30, closeButton: false })
          .setLngLat([ponto.lng, ponto.lat])
          .setHTML(
            '<img src="/moema/moema.png" alt="Moema" class="popup-img" />' +
            '<strong>' + ponto.nome + '</strong>' +
            '<p>' + ponto.descricao + '</p>'
          )
          .addTo(mapa)
      })

      const marcador = new Marker({ element: el })
        .setLngLat([ponto.lng, ponto.lat])
        .addTo(mapa)

      marcadoresRef.current[ponto.id] = { marcador, el, ponto }
    })

    // A mecanica do "escondido": o marcador so aparece a partir
    // do zoom minimo definido para aquele ponto no pontos.json.
    const atualizarVisibilidade = () => {
      const zoomAtual = mapa.getZoom()
      Object.values(marcadoresRef.current).forEach(({ el, ponto }) => {
        el.classList.toggle('oculto', zoomAtual < ponto.zoomMinimo)
      })
    }

    // ---------- 2. Os pontos turisticos da area visivel ----------

    const limparMarcadoresTuristicos = () => {
      marcadoresTuristicosRef.current.forEach((m) => m.remove())
      marcadoresTuristicosRef.current = []
    }

    // Evita recalcular quando o mapa mal se mexeu (o "idle" dispara varias vezes).
    let ultimaChave = null

    const atualizarDestaques = () => {
      const zoomAtual = mapa.getZoom()
      const b = mapa.getBounds()
      const c = mapa.getCenter()

      const chave = [
        zoomAtual.toFixed(1),
        b.getWest().toFixed(4),
        b.getSouth().toFixed(4),
        b.getEast().toFixed(4),
        b.getNorth().toFixed(4),
      ].join('|')
      if (chave === ultimaChave) return
      ultimaChave = chave

      limparMarcadoresTuristicos()

      if (zoomAtual < ZOOM_MINIMO_DESTAQUES) {
        aoMudarDestaquesRef.current({ lista: [], afastadoDemais: true })
        return
      }

      // Nenhuma chamada de API acontece aqui: e filtro em memoria
      // sobre o JSON gerado antes do deploy.
      const destaques = destaquesDaArea(
        { oeste: b.getWest(), leste: b.getEast(), sul: b.getSouth(), norte: b.getNorth() },
        { lat: c.lat, lng: c.lng }
      )

      destaques.forEach((ponto, indice) => {
        const el = document.createElement('div')
        el.className = 'marcador-turistico'
        el.textContent = String(indice + 1)
        el.title = ponto.nome

        el.addEventListener('click', (evento) => {
          evento.stopPropagation()
          const imagem = ponto.imagem
            ? '<img src="' + ponto.imagem + '" alt="" class="popup-img" />'
            : ''
          new Popup({ offset: 18, closeButton: false })
            .setLngLat([ponto.lng, ponto.lat])
            .setHTML(imagem + '<strong>' + ponto.nome + '</strong>')
            .addTo(mapa)
        })

        marcadoresTuristicosRef.current.push(
          new Marker({ element: el }).setLngLat([ponto.lng, ponto.lat]).addTo(mapa)
        )
      })

      aoMudarDestaquesRef.current({ lista: destaques, afastadoDemais: false })
    }

    mapa.on('zoom', atualizarVisibilidade)

    // "moveend" dispara sempre que a camera para - depois de arrastar OU de dar zoom.
    // Usamos ele em vez de "idle" porque "idle" tambem espera todos os tiles
    // carregarem, e um unico tile com erro trava o evento para sempre.
    mapa.on('moveend', atualizarDestaques)
    mapa.on('load', atualizarDestaques)

    atualizarVisibilidade()
    atualizarDestaques()

    return () => {
      limparMarcadoresTuristicos()
      mapa.remove()
    }
  }, [])

  // Sempre que a lista de descobertas muda, troca a silhueta pela Moema.
  useEffect(() => {
    Object.values(marcadoresRef.current).forEach(({ el, ponto }) => {
      el.classList.toggle('descoberto', descobertas.includes(ponto.id))
    })
  }, [descobertas])

  return <div ref={containerRef} className="mapa" />
}
