import { useState } from 'react'

export default function PainelProgresso({ pontos, descobertas, aoReiniciar }) {
  // Confirmacao em duas etapas em vez de window.confirm(), que trava a pagina
  // e fica feio dentro de um mapa.
  const [confirmando, setConfirmando] = useState(false)

  const naoEncontradas = pontos.filter((p) => !descobertas.includes(p.id))
  const percentual = Math.round((descobertas.length / pontos.length) * 100)
  const completo = descobertas.length === pontos.length

  return (
    <section>
      <h1>Caça à Moema</h1>

      <div className="contador">
        <strong>{descobertas.length}</strong> / {pontos.length} encontradas
      </div>

      <div className="barra">
        <div className="barra-preenchida" style={{ width: percentual + '%' }} />
      </div>

      {naoEncontradas.length > 0 ? (
        <>
          <h2>Dicas</h2>
          <ul className="dicas">
            {naoEncontradas.map((p) => (
              <li key={p.id}>{p.dica}</li>
            ))}
          </ul>
        </>
      ) : (
        <p className="completo">Voce encontrou todas as Moemas.</p>
      )}

      {descobertas.length > 0 && (
        <div className="reiniciar">
          {confirmando ? (
            <>
              <span className="reiniciar-pergunta">Apagar seu progresso?</span>
              <div className="reiniciar-acoes">
                <button
                  type="button"
                  className="botao botao-perigo"
                  onClick={() => {
                    aoReiniciar()
                    setConfirmando(false)
                  }}
                >
                  Sim, recomecar
                </button>
                <button
                  type="button"
                  className="botao botao-neutro"
                  onClick={() => setConfirmando(false)}
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              className={completo ? 'botao botao-destaque' : 'botao botao-discreto'}
              onClick={() => setConfirmando(true)}
            >
              {completo ? 'Jogar de novo' : 'Recomecar'}
            </button>
          )}
        </div>
      )}
    </section>
  )
}
