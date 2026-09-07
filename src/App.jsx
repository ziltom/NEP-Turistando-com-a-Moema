import { useCallback, useState } from 'react'
import Mapa from './components/Mapa.jsx'
import PainelProgresso from './components/PainelProgresso.jsx'
import CardsTuristicos from './components/CardsTuristicos.jsx'
import pontos from './data/pontos.json'
import {
  carregarDescobertas,
  salvarDescobertas,
  limparDescobertas,
} from './lib/descobertas.js'

export default function App() {
  // Filtra ids que nao existem mais no pontos.json. Sem isso, uma descoberta
  // antiga guardada no navegador continuaria contando no placar.
  const [descobertas, setDescobertas] = useState(() =>
    carregarDescobertas().filter((id) => pontos.some((p) => p.id === id))
  )
  const [destaques, setDestaques] = useState({ lista: [], afastadoDemais: false })

  const aoDescobrir = useCallback((id) => {
    setDescobertas((atuais) => {
      if (atuais.includes(id)) return atuais
      const novas = [...atuais, id]
      salvarDescobertas(novas)
      return novas
    })
  }, [])

  const aoReiniciar = useCallback(() => {
    limparDescobertas()
    setDescobertas([])
  }, [])

  const aoMudarDestaques = useCallback((novos) => {
    setDestaques(novos)
  }, [])

  return (
    <div className="app">
      <Mapa
        descobertas={descobertas}
        aoDescobrir={aoDescobrir}
        aoMudarDestaques={aoMudarDestaques}
      />

      <div className="painel">
        <PainelProgresso
          pontos={pontos}
          descobertas={descobertas}
          aoReiniciar={aoReiniciar}
        />
        <CardsTuristicos destaques={destaques} />
      </div>
    </div>
  )
}
