import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './themes/abyssal-anime.css'
import './styles/global.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Elemento raiz não encontrado.')
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
