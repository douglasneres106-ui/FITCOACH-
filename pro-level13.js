import './pro-level13.css'

(() => {
  const ready = () => {
    if (document.querySelector('.fc13-status')) return
    document.body.classList.add('fc13-focus')

    const status = document.createElement('div')
    status.className = 'fc13-status'
    status.innerHTML = '<span class="fc13-dot"></span><span class="fc13-status-text">Online</span>'
    document.body.appendChild(status)

    const updateStatus = () => {
      const online = navigator.onLine
      status.classList.toggle('offline', !online)
      status.querySelector('.fc13-status-text').textContent = online ? 'Online' : 'Sem conexão'
    }
    addEventListener('online', updateStatus)
    addEventListener('offline', updateStatus)
    updateStatus()

    const toast = document.createElement('div')
    toast.className = 'fc13-toast'
    document.body.appendChild(toast)
    let toastTimer
    window.fitcoachToast = (message) => {
      toast.textContent = message
      toast.classList.add('show')
      clearTimeout(toastTimer)
      toastTimer = setTimeout(() => toast.classList.remove('show'), 2200)
    }

    const launcher = document.createElement('button')
    launcher.className = 'fc13-launcher'
    launcher.type = 'button'
    launcher.title = 'Busca rápida — ⌘K / Ctrl+K'
    launcher.setAttribute('aria-label', 'Abrir busca rápida')
    launcher.textContent = '⌕'
    document.body.appendChild(launcher)

    const palette = document.createElement('div')
    palette.className = 'fc13-palette hidden'
    palette.innerHTML = `<div class="fc13-box" role="dialog" aria-modal="true" aria-label="Busca rápida">
      <input class="fc13-input" placeholder="Buscar uma função, aluno, treino ou página..." autocomplete="off">
      <div class="fc13-results"></div>
    </div>`
    document.body.appendChild(palette)
    const input = palette.querySelector('.fc13-input')
    const results = palette.querySelector('.fc13-results')

    const collect = () => [...document.querySelectorAll('button,[role="button"],a')]
      .filter(el => el.offsetParent !== null && !el.closest('.fc13-palette') && el.textContent.trim())
      .map(el => ({ el, text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 90) }))
      .filter((x, i, a) => a.findIndex(y => y.text === x.text) === i)
      .slice(0, 80)

    const renderResults = (query = '') => {
      const q = query.trim().toLowerCase()
      const items = collect().filter(x => !q || x.text.toLowerCase().includes(q)).slice(0, 12)
      results.innerHTML = items.length ? items.map((x, i) => `<button class="fc13-result" data-result="${i}">${x.text}<small>↵</small></button>`).join('') : '<div style="padding:18px;color:#849087;font-size:12px">Nenhum resultado visível.</div>'
      results.querySelectorAll('[data-result]').forEach(btn => btn.onclick = () => {
        items[Number(btn.dataset.result)].el.click()
        close()
      })
    }
    const open = () => { palette.classList.remove('hidden'); input.value = ''; renderResults(); requestAnimationFrame(() => input.focus()) }
    const close = () => palette.classList.add('hidden')
    launcher.onclick = open
    palette.onclick = e => { if (e.target === palette) close() }
    input.oninput = () => renderResults(input.value)
    input.onkeydown = e => { if (e.key === 'Escape') close() }
    addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open() }
      if (e.key === 'Escape' && !palette.classList.contains('hidden')) close()
    })

    // Touch-friendly feedback without changing application behavior.
    document.addEventListener('click', e => {
      const target = e.target.closest('button,a')
      if (target && target.closest('#app')) target.style.transform = 'scale(.985)'
      if (target) setTimeout(() => { target.style.transform = '' }, 90)
    }, { passive: true })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true })
  else ready()
})()
