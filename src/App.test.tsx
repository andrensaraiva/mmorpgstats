import { act, fireEvent, render, screen } from '@testing-library/react'
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

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

describe('App (smoke)', () => {
  it('mostra a porta de entrada (login) sem sessão', () => {
    render(<App />)
    expect(screen.getAllByText('BuildsWar').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Entrar como convidado/ })).toBeInTheDocument()
  })

  it('entra no jogo e renderiza o portal', () => {
    enterGame()
    expect(screen.getByRole('heading', { name: 'Portal' })).toBeInTheDocument()
  })

  it('navega entre as telas principais', () => {
    enterGame()
    fireEvent.click(screen.getByRole('button', { name: /Equipamento/ }))
    expect(screen.getByRole('heading', { name: 'Equipamento' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Árvore/ }))
    expect(screen.getByRole('heading', { name: 'Árvore Passiva' })).toBeInTheDocument()
  })

  it('exibe estimativa de DPS antes de testar e o valor real após concluir a dungeon', () => {
    enterGame()
    vi.useFakeTimers()

    // Antes de testar: DPS aparece como estimativa em faixa.
    expect(screen.getAllByText(/DPS \(estimado\)/i).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: /Masmorra/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Enviar Herói' }))
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByText(/VITÓRIA|DERROTA/)).toBeInTheDocument()
    // Após concluir, o DPS real (medido) passa a ser exibido.
    expect(screen.getAllByText(/DPS \(medido\)/i).length).toBeGreaterThan(0)
    vi.useRealTimers()
  })

  it('crafta o item comum do baú com um orbe de transmutação', () => {
    enterGame()
    fireEvent.click(screen.getByRole('button', { name: /Equipamento/ }))
    // "Elo Trincado" é o anel comum inicial — selecionável para craft.
    fireEvent.click(screen.getAllByText('Elo Trincado')[0])
    const transBtn = screen.getByRole('button', { name: /Trans/ })
    expect(transBtn).not.toBeDisabled()
    fireEvent.click(transBtn)
    expect(screen.getByText(/agora é mágico|não pode/i)).toBeInTheDocument()
  })
})
