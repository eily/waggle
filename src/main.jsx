import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Trends from './Trends.jsx'

const path = window.location.pathname;
const isTrends = path === '/trends';

// Mobile app needs overflow:hidden to prevent body scroll
// Trends page needs normal document scroll
if (!isTrends) {
  document.body.classList.add('app-mode');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isTrends ? <Trends /> : <App />}
  </StrictMode>,
)
