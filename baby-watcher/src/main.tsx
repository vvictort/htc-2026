import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import CVDebug from './CVDebug.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CVDebug />
  </StrictMode>,
)
