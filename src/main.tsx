import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Remover o aria-hidden do root
const rootElement = document.getElementById('root');
if (rootElement && rootElement.hasAttribute('aria-hidden')) {
  rootElement.removeAttribute('aria-hidden');
}

// Criar um observador para remover o aria-hidden sempre que for adicionado
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
      if (rootElement && rootElement.getAttribute('aria-hidden') === 'true') {
        rootElement.removeAttribute('aria-hidden');
      }
    }
  });
});

if (rootElement) {
  observer.observe(rootElement, { attributes: true });
}

ReactDOM.createRoot(rootElement!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
