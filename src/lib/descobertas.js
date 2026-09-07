// Guarda quais Moemas o usuario ja encontrou, no proprio navegador.
// Nao ha banco de dados: e tudo localStorage.

const CHAVE = 'moema:descobertas'

export function carregarDescobertas() {
  try {
    const bruto = localStorage.getItem(CHAVE)
    return bruto ? JSON.parse(bruto) : []
  } catch {
    // navegador em modo privado ou storage bloqueado
    return []
  }
}

export function salvarDescobertas(lista) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista))
  } catch {
    // ignora: o jogo continua funcionando, so nao persiste
  }
}

export function limparDescobertas() {
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    // ignora
  }
}
