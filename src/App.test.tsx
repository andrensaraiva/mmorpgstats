import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { App } from './App'

Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true })

describe('App (smoke)', () => {
  it('renderiza o portal do BuildsWar', () => {
    render(<App />)
    expect(screen.getAllByText('BuildsWar').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'Portal' })).toBeInTheDocument()
  })

  it('navega entre as telas principais', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Equipamento/ }))
    expect(screen.getByRole('heading', { name: 'Equipamento' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Árvore/ }))
    expect(screen.getByRole('heading', { name: 'Árvore Passiva' })).toBeInTheDocument()
  })

  it('exibe estimativa de DPS antes de testar e o valor real após concluir a dungeon', () => {
    vi.useFakeTimers()
    render(<App />)

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
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Equipamento/ }))
    // "Elo Trincado" é o anel comum inicial — selecionável para craft.
    fireEvent.click(screen.getAllByText('Elo Trincado')[0])
    const transBtn = screen.getByRole('button', { name: /Trans/ })
    expect(transBtn).not.toBeDisabled()
    fireEvent.click(transBtn)
    expect(screen.getByText(/agora é mágico|não pode/i)).toBeInTheDocument()
  })
})
