// FITCOACH continua como PWA, mas o botão de instalação foi removido da interface.
// A instalação pode ser feita pelo próprio navegador / menu de compartilhamento.

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service Worker não registrado:', error)
    })
  })
}
