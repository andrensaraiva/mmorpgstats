import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true })

/** Passa pela porta (convidado → criar herói) até o jogo em si. */
function enterGame() {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /Entrar como convidado/ }))
  // Sem heróis: cai na seleção com slots vazios → criar (pega o primeiro).
  fireEvent.click(screen.getAllByRole('button', { name: /Criar herói/ })[0])
  fireEvent.change(screen.getByPlaceholderText(/Vheyra/), { target: { value: 'Testa' } })
  fireEvent.click(screen.getByRole('button', { name: /Forjar herói e entrar/ }))
}

/**
 * Joga a campanha avançando enquanto vencer. Os atos finais exigem build melhor
 * (design), então pode parar antes do fim — mas os sistemas iniciais destravam.
 * Devolve quantos marcos foram vencidos.
 */
function completeCampaign(): number {
  let won = 0
  for (let i = 0; i < 8; i++) {
    const send = screen.queryByRole('button', { name: /Enviar Herói|Repetir encontro/ })
    if (!send) break
    fireEvent.click(send)
    const advance = screen.queryByRole('button', { name: 'Continuar' })
    if (advance) {
      won++
      fireEvent.click(advance) // vitória → avança ao próximo marco
    } else {
      break // derrota (só há "Voltar"): o starter chegou ao limite da build
    }
  }
  return won
}

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

describe('App (smoke)', () => {
  it('mostra a porta de entrada (login) sem sessão', () => {
    render(<App />)
    expect(screen.getAllByText('BuildsWar').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Entrar como convidado/ })).toBeInTheDocument()
  })

  it('entra no jogo e abre na Campanha (nova porta de entrada)', () => {
    enterGame()
    expect(screen.getByRole('heading', { name: 'Campanha' })).toBeInTheDocument()
    // Portal e Personagem sempre visíveis; Equipamento começa travado.
    expect(screen.getByRole('button', { name: /Portal/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Equipamento/ })).not.toBeInTheDocument()
  })

  it('a campanha destrava os sistemas e libera a navegação (P1/P2)', () => {
    enterGame()
    const won = completeCampaign()
    expect(won).toBeGreaterThanOrEqual(2) // ao menos prólogo + ato I com o starter
    // Após a campanha, as abas de sistema aparecem na nav.
    const nav = screen.getByRole('navigation', { name: /Navegação principal/ })
    fireEvent.click(within(nav).getByRole('button', { name: /Equipamento/ }))
    expect(screen.getByRole('heading', { name: 'Equipamento' })).toBeInTheDocument()
    fireEvent.click(within(nav).getByRole('button', { name: /Árvore/ }))
    expect(screen.getByRole('heading', { name: 'Árvore Passiva' })).toBeInTheDocument()
  })

  it('roda a Masmorra livre e exibe o relatório + DPS medido', () => {
    enterGame()
    completeCampaign() // desbloqueia a Masmorra (ato II) e já mede o DPS
    vi.useFakeTimers()

    const nav = screen.getByRole('navigation', { name: /Navegação principal/ })
    fireEvent.click(within(nav).getByRole('button', { name: /Masmorra/ }))

    fireEvent.click(screen.getByRole('button', { name: 'Enviar Herói' }))
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByText(/VITÓRIA|DERROTA/)).toBeInTheDocument()
    // O DPS real (medido) é exibido (a campanha já o descobriu).
    expect(screen.getAllByText(/DPS \(medido\)/i).length).toBeGreaterThan(0)
    vi.useRealTimers()
  })

  it('crafta o item comum do baú com um orbe de transmutação', () => {
    enterGame()
    completeCampaign()
    const nav = screen.getByRole('navigation', { name: /Navegação principal/ })
    fireEvent.click(within(nav).getByRole('button', { name: /Equipamento/ }))
    // "Elo Trincado" é o anel comum inicial — selecionável para craft.
    fireEvent.click(screen.getAllByText('Elo Trincado')[0])
    const transBtn = screen.getByRole('button', { name: /Trans/ })
    expect(transBtn).not.toBeDisabled()
    fireEvent.click(transBtn)
    expect(screen.getByText(/agora é mágico|não pode/i)).toBeInTheDocument()
  })
})
