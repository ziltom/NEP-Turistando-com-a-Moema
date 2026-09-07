const ROTULO_CATEGORIA = {
  attraction: 'Atracao',
  museum: 'Museu',
  monument: 'Monumento',
  memorial: 'Memorial',
  castle: 'Castelo',
  market: 'Mercado',
  theatre: 'Teatro',
  viewpoint: 'Mirante',
  gallery: 'Galeria',
  church: 'Igreja',
  park: 'Parque',
  artwork: 'Obra de arte',
  zoo: 'Zoologico',
  aquarium: 'Aquario',
  theme_park: 'Parque tematico',
}

export default function CardsTuristicos({ destaques }) {
  const { lista, afastadoDemais } = destaques

  return (
    <section className="destaques">
      <h2>Principais pontos desta area</h2>

      {afastadoDemais && (
        <p className="destaques-vazio">Aproxime o zoom para ver os destaques.</p>
      )}

      {!afastadoDemais && lista.length === 0 && (
        <p className="destaques-vazio">
          Nenhum ponto de destaque nesta area. Arraste o mapa.
        </p>
      )}

      <ol className="destaques-lista">
        {lista.map((p, i) => (
          <li key={p.id}>
            <span className="destaque-num">{i + 1}</span>
            <span className="destaque-info">
              <strong>{p.nome}</strong>
              <em>{ROTULO_CATEGORIA[p.categoria] || 'Ponto de interesse'}</em>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
