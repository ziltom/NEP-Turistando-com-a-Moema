export default function PainelProgresso({ pontos, descobertas }) {
  const naoEncontradas = pontos.filter((p) => !descobertas.includes(p.id))
  const percentual = Math.round((descobertas.length / pontos.length) * 100)

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
    </section>
  )
}
