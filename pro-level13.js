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
    toast.setAttribute('role', 'status')
    toast.setAttribute('aria-live', 'polite')
    document.body.appendChild(toast)
    let toastTimer
    window.fitcoachToast = (message) => {
      toast.textContent = String(message || '')
      toast.classList.add('show')
      clearTimeout(toastTimer)
      toastTimer = setTimeout(() => toast.classList.remove('show'), 2400)
    }

    // Evita alertas nativos quebrando a experiência de aplicativo.
    const nativeAlert = window.alert
    window.alert = (message) => window.fitcoachToast(message || 'Ocorreu um erro.')
    addEventListener('error', () => window.fitcoachToast('O FITCOACH encontrou um erro. Tente novamente.'))
    addEventListener('unhandledrejection', () => window.fitcoachToast('Não foi possível concluir esta ação. Tente novamente.'))

    const launcher = document.createElement('button')
    launcher.className = 'fc13-launcher'
    launcher.type = 'button'
    launcher.title = 'Busca rápida — ⌘K / Ctrl+K'
    launcher.setAttribute('aria-label', 'Abrir busca rápida')
    launcher.innerHTML = '<span aria-hidden="true">⌕</span><kbd>⌘K</kbd>'
    document.body.appendChild(launcher)

    const palette = document.createElement('div')
    palette.className = 'fc13-palette hidden'
    palette.innerHTML = `<div class="fc13-box" role="dialog" aria-modal="true" aria-labelledby="fc13-title">
      <div class="fc13-head"><div><strong id="fc13-title">Busca rápida</strong><span>Alunos, treinos, evolução e páginas</span></div><button class="fc13-close" type="button" aria-label="Fechar busca">×</button></div>
      <div class="fc13-search-row"><span aria-hidden="true">⌕</span><input class="fc13-input" placeholder="Digite para buscar..." autocomplete="off" spellcheck="false"><kbd>ESC</kbd></div>
      <div class="fc13-results" role="listbox" aria-label="Resultados da busca"></div>
      <div class="fc13-footer"><span>↑↓ navegar</span><span>Enter abrir</span><span>Esc fechar</span></div>
    </div>`
    document.body.appendChild(palette)

    const input = palette.querySelector('.fc13-input')
    const results = palette.querySelector('.fc13-results')
    const closeButton = palette.querySelector('.fc13-close')
    let activeIndex = 0
    let currentItems = []
    let lastFocused = null
    const recentKey = 'fitcoach.recentActions.v14'

    const pageLabel = () => {
      const active = document.querySelector('.nav-btn.active')
      return active?.textContent?.trim() || 'FITCOACH'
    }

    const score = (text, query) => {
      if (!query) return 1
      const value = text.toLowerCase()
      const q = query.toLowerCase().trim()
      if (value === q) return 100
      if (value.startsWith(q)) return 80
      if (value.includes(q)) return 60
      let cursor = 0
      let hits = 0
      for (const char of q) {
        const index = value.indexOf(char, cursor)
        if (index < 0) return 0
        hits += 1
        cursor = index + 1
      }
      return hits / Math.max(q.length, 1) * 40
    }

    const collect = () => [...document.querySelectorAll('button,[role="button"],a')]
      .filter(el => el.offsetParent !== null && !el.closest('.fc13-palette') && el.textContent.trim())
      .map(el => ({ el, text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 90) }))
      .filter((item, index, list) => list.findIndex(other => other.text === item.text) === index)

    const getRecent = () => {
      try { return JSON.parse(sessionStorage.getItem(recentKey) || '[]') } catch { return [] }
    }

    const remember = (text) => {
      try {
        const next = [text, ...getRecent().filter(item => item !== text)].slice(0, 5)
        sessionStorage.setItem(recentKey, JSON.stringify(next))
      } catch {}
    }

    const renderResults = (query = '') => {
      const all = collect()
      const q = query.trim()
      const recent = getRecent()
      currentItems = all
        .map(item => ({ ...item, score: score(item.text, q) }))
        .filter(item => !q || item.score > 0)
        .sort((a, b) => {
          const recentDiff = Number(recent.includes(b.text)) - Number(recent.includes(a.text))
          return recentDiff || b.score - a.score
        })
        .slice(0, 12)
      activeIndex = Math.min(activeIndex, Math.max(currentItems.length - 1, 0))

      results.replaceChildren()
      if (!currentItems.length) {
        const empty = document.createElement('div')
        empty.className = 'fc13-empty'
        empty.textContent = q ? 'Nenhum resultado encontrado.' : `Nenhuma ação disponível em ${pageLabel()}.`
        results.appendChild(empty)
        return
      }

      currentItems.forEach((item, index) => {
        const button = document.createElement('button')
        button.className = 'fc13-result'
        button.type = 'button'
        button.setAttribute('role', 'option')
        button.setAttribute('aria-selected', String(index === activeIndex))
        const label = document.createElement('span')
        label.textContent = item.text
        const hint = document.createElement('small')
        hint.textContent = index === activeIndex ? '↵' : ''
        button.append(label, hint)
        button.onclick = () => activate(index)
        results.appendChild(button)
      })
    }

    const syncActive = () => {
      results.querySelectorAll('.fc13-result').forEach((button, index) => {
        const active = index === activeIndex
        button.classList.toggle('active', active)
        button.setAttribute('aria-selected', String(active))
        if (active) button.scrollIntoView({ block: 'nearest' })
      })
    }

    const activate = (index = activeIndex) => {
      const item = currentItems[index]
      if (!item) return
      remember(item.text)
      item.el.click()
      close()
    }

    const open = () => {
      lastFocused = document.activeElement
      palette.classList.remove('hidden')
      input.value = ''
      activeIndex = 0
      renderResults()
      requestAnimationFrame(() => input.focus())
    }

    const close = () => {
      palette.classList.add('hidden')
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus()
    }

    launcher.onclick = open
    closeButton.onclick = close
    palette.onclick = event => { if (event.target === palette) close() }
    input.oninput = () => { activeIndex = 0; renderResults(input.value) }
    input.onkeydown = event => {
      if (event.key === 'ArrowDown') { event.preventDefault(); activeIndex = Math.min(activeIndex + 1, currentItems.length - 1); syncActive() }
      if (event.key === 'ArrowUp') { event.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); syncActive() }
      if (event.key === 'Enter') { event.preventDefault(); activate() }
      if (event.key === 'Escape') { event.preventDefault(); close() }
    }

    addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        palette.classList.contains('hidden') ? open() : close()
      }
      if (event.key === 'Escape' && !palette.classList.contains('hidden')) close()
    })

    // Feedback tátil leve sem alterar a lógica da aplicação.
    document.addEventListener('click', event => {
      const target = event.target.closest('button,a')
      if (target && target.closest('#app')) {
        target.classList.add('fc13-tap')
        setTimeout(() => target.classList.remove('fc13-tap'), 90)
      }
    }, { passive: true })

    // Mantém a referência para evitar uma variável global inutilizada em builds/minificadores.
    void nativeAlert
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true })
  else ready()
})()
