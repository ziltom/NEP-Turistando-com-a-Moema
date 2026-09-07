import { useEffect, useRef, useState } from 'react'
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

// O MapLibre desenha o mapa via WebGL. Se o navegador nao tiver WebGL
// disponivel (aceleracao de hardware desligada, driver de video bloqueado),
// o mapa fica branco sem erro nenhum. Melhor detectar e avisar.
function webglDisponivel() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function Mapa({ descobertas, aoDescobrir, aoMudarDestaques }) {
  const [erro, setErro] = useState(null)
  const containerRef = useRef(null)
  const marcadoresRef = useRef({})
  const marcadoresTuristicosRef = useRef([])
  const popupRef = useRef(null)

  // Refs para os callbacks: assim o mapa e criado UMA vez so,
  // mas os handlers sempre enxergam o estado atual.
  const descobertasRef = useRef(descobertas)
  const aoDescobrirRef = useRef(aoDescobrir)
  const aoMudarDestaquesRef = useRef(aoMudarDestaques)
  descobertasRef.current = descobertas
  aoDescobrirRef.current = aoDescobrir
  aoMudarDestaquesRef.current = aoMudarDestaques

  useEffect(() => {
    if (!webglDisponivel()) {
      setErro('webgl')
      return
    }

    const mapa = new MapaLibre({
      container: containerRef.current,
      style: ESTILO,
      center: CENTRO_FORTALEZA,
      zoom: ZOOM_INICIAL,
    })

    // Um popup por vez: sem isso, cada clique deixa mais um aberto na tela.
    const abrirPopup = (lngLat, html, offset) => {
      if (popupRef.current) popupRef.current.remove()
      popupRef.current = new Popup({ offset, closeButton: false })
        .setLngLat(lngLat)
        .setHTML(html)
        .addTo(mapa)
    }

    mapa.addControl(new NavigationControl(), 'top-right')
    mapa.on('error', (e) => {
      console.error('Erro no mapa:', e && e.error)
      // Falha ao buscar o estilo = tiles bloqueados ou sem internet.
      if (e && e.error && /style|fetch|network/i.test(String(e.error.message || ''))) {
        setErro('rede')
      }
    })

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

        abrirPopup(
          [ponto.lng, ponto.lat],
          '<img src="/moema/moema.png" alt="Moema" class="popup-img" />' +
            '<strong>' + ponto.nome + '</strong>' +
            '<p>' + ponto.descricao + '</p>',
          30
        )
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
          abrirPopup(
            [ponto.lng, ponto.lat],
            imagem + '<strong>' + ponto.nome + '</strong>',
            18
          )
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
      if (popupRef.current) popupRef.current.remove()
      limparMarcadoresTuristicos()
      mapa.remove()
    }
  }, [])

  // Sempre que a lista de descobertas muda, troca a silhueta pela Moema.
  useEffect(() => {
    Object.values(marcadoresRef.current).forEach(({ el, ponto }) => {
      el.classList.toggle('descoberto', descobertas.includes(ponto.id))
    })

    // Ao reiniciar o jogo, fecha o popup que ficou aberto de uma descoberta
    // que acabou de ser desfeita.
    if (descobertas.length === 0 && popupRef.current) {
      popupRef.current.remove()
      popupRef.current = null
    }
  }, [descobertas])

  return (
    <>
      <div ref={containerRef} className="mapa" />
      {erro && (
        <div className="mapa-erro">
          <h2>O mapa nao pode ser exibido</h2>
          {erro === 'webgl' ? (
            <>
              <p>
                Seu navegador esta sem WebGL, que e o recurso usado para desenhar
                o mapa. O resto do site continua funcionando.
              </p>
              <p className="mapa-erro-dica">
                Normalmente resolve ligando a aceleracao de hardware:
                <br />
                <strong>Configuracoes &gt; Sistema &gt; Usar aceleracao de
                hardware quando disponivel</strong>, e reiniciar o navegador.
              </p>
            </>
          ) : (
            <p>
              Nao foi possivel carregar os dados do mapa. Verifique sua conexao
              ou se alguma extensao esta bloqueando o site.
            </p>
          )}
        </div>
      )}
    </>
  )
}
