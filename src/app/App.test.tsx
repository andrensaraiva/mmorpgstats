import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { App } from './App'

Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
})

describe('App', () => {
  it('renderiza a estrutura principal do BuildsWar', () => {
    render(<App />)

    expect(screen.getByText('BuildsWar')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /prepare a build/i })).toBeInTheDocument()
    expect(screen.getByText('Personagem ativa')).toBeInTheDocument()
  })

  it('navega para a tela de personagem', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Personagem' }))

    expect(screen.getByRole('heading', { name: 'Personagem e builds' })).toBeInTheDocument()
  })

  it('altera a build selecionada', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Personagem' }))
    fireEvent.click(screen.getByRole('button', { name: /ofensiva/i }))

    expect(screen.getAllByText('Fio Implacável').length).toBeGreaterThan(0)
    expect(screen.getAllByText('16%').length).toBeGreaterThan(0)
  })

  it('conclui uma tentativa demonstrativa e exibe o relatório', () => {
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Dungeon' }))
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar tentativa' }))

    expect(screen.getByRole('heading', { name: 'Simulando encontros' })).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1800)
    })

    expect(screen.getByRole('heading', { name: 'Resultado: Vitória' })).toBeInTheDocument()
    expect(screen.getByText('Anel de Brasa Velada')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('aloca um talento conectado e atualiza os atributos', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Árvore' }))
    fireEvent.click(screen.getByRole('button', { name: /fundamento marcial\. disponível/i }))

    expect(screen.getByText('1 de 8 pontos')).toBeInTheDocument()
    expect(screen.getAllByText('118').length).toBeGreaterThan(0)
  })
})
