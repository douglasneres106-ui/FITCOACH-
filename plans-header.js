import { supabase } from './supabase'

/* FITCOACH — seletor de planos no cabeçalho autenticado.
   O botão fica no canto superior direito, imediatamente antes das iniciais do usuário.
   Nunca aparece na tela de login/cadastro. */
(() => {
  const LIMITS = { free: 10, semiannual: 15, monthly: 30 }
  const PLANS = {
    free: { label: 'Free', price: 'R$ 0', note: 'sem cobrança', period: 'Gratuito' },
    semiannual: { label: 'Pro Semestral', price: 'R$ 29,99', note: 'por ciclo de 6 meses', period: '6 meses' },
    monthly: { label: 'Pro Mensal', price: 'R$ 49,99', note: 'por mês', period: '1 mês' }
  }

  let open = false
  let busy = false
  let profile = null
  let lastUserId = null

  const esc = (v = '') => String(v).replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]))
  const isAuth = () => !!document.querySelector('.auth-screen, .login input[type="password"], .auth-card')

  async function context() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    if (!profile || lastUserId !== session.user.id) {
      const { data } = await supabase.from('profiles').select('id,role,full_name').eq('id', session.user.id).maybeSingle()
      profile = data || null
      lastUserId = session.user.id
    }
    return { session, profile }
  }

  async function state() {
    const ctx = await context()
    if (!ctx || ctx.profile?.role !== 'trainer' || isAuth()) return null
    const [{ data: pref }, { count }] = await Promise.all([
      supabase.from('trainer_plan_preferences').select('billing_cycle').eq('trainer_id', ctx.session.user.id).maybeSingle(),
      supabase.from('students').select('id', { count: 'exact', head: true }).eq('trainer_id', ctx.session.user.id)
    ])
    const cycle = pref?.billing_cycle || 'free'
    return { ...ctx, cycle: PLANS[cycle] ? cycle : 'free', count: count || 0, limit: LIMITS[cycle] || LIMITS.free }
  }

  function installStyles() {
    if (document.getElementById('fc-plans-header-style')) return
    const style = document.createElement('style')
    style.id = 'fc-plans-header-style'
    style.textContent = `
      .fc-plans-header-wrap{display:flex;align-items:center;gap:8px;margin-left:auto;position:relative;z-index:100510}
      #pro10PlansHeader{display:flex;align-items:center;justify-content:center;gap:7px;min-width:86px;height:42px;padding:5px 10px;border:1px solid rgba(128,242,76,.42);border-radius:13px;background:linear-gradient(145deg,rgba(128,242,76,.20),rgba(128,242,76,.07));color:#effff1;font:inherit;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.18),0 0 22px rgba(128,242,76,.08);transition:transform .15s ease,border-color .15s ease,background .15s ease}
      #pro10PlansHeader:hover{transform:translateY(-1px);border-color:rgba(128,242,76,.7);background:linear-gradient(145deg,rgba(128,242,76,.28),rgba(128,242,76,.10))}
      #pro10PlansHeader:active{transform:scale(.97)}
      #pro10PlansHeader .fc-plan-mark{width:25px;height:25px;border-radius:8px;display:grid;place-items:center;background:#80f24c;color:#071006;font-size:11px;font-weight:950;flex:0 0 auto}
      #pro10PlansHeader .fc-plan-copy{display:grid;gap:2px;text-align:left;line-height:1}
      #pro10PlansHeader .fc-plan-copy small{font-size:8px;letter-spacing:.1em;color:#8ca091;font-weight:900;text-transform:uppercase}
      #pro10PlansHeader .fc-plan-copy b{font-size:11px;color:#dfffe3;white-space:nowrap}
      #fc-plans-panel{position:fixed;top:76px;right:18px;width:min(390px,calc(100vw - 28px));z-index:100500;padding:16px;border:1px solid rgba(128,242,76,.24);border-radius:22px;background:linear-gradient(180deg,rgba(15,26,19,.99),rgba(8,15,11,.99));box-shadow:0 28px 80px rgba(0,0,0,.60);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px)}
      #fc-plans-panel .fc-ph{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:13px}
      #fc-plans-panel .fc-ph strong{font-size:17px;letter-spacing:-.03em}#fc-plans-panel .fc-ph span{display:block;margin-top:4px;color:#8f9e93;font-size:11px;line-height:1.4}
      #fc-plans-panel .fc-ph button{border:0;background:transparent;color:#fff;font-size:25px;line-height:1;cursor:pointer}
      #fc-plans-panel .fc-wallet{padding:12px;border-radius:14px;background:rgba(128,242,76,.06);border:1px solid rgba(128,242,76,.12);margin-bottom:12px}.fc-wallet b{display:block;font-size:13px}.fc-wallet span{display:block;margin-top:4px;color:#9dac9f;font-size:11px}
      #fc-plans-panel .fc-plan-grid{display:grid;gap:9px}
      #fc-plans-panel .fc-plan-option{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:12px;border:1px solid rgba(255,255,255,.08);border-radius:15px;background:rgba(255,255,255,.025)}
      #fc-plans-panel .fc-plan-option.active{border-color:rgba(128,242,76,.38);background:rgba(128,242,76,.07)}
      #fc-plans-panel .fc-plan-info strong{display:block;font-size:13px}.fc-plan-info span{display:block;margin-top:3px;color:#8f9e93;font-size:10px}
      #fc-plans-panel .fc-plan-price{text-align:right}.fc-plan-price b{display:block;font-size:12px;color:#f4fff5}.fc-plan-price small{display:block;margin-top:2px;color:#829186;font-size:9px}
      #fc-plans-panel .fc-plan-option button{grid-column:1 / -1;width:100%;border:0;border-radius:10px;padding:9px 10px;background:#80f24c;color:#071006;font-weight:900;cursor:pointer}
      #fc-plans-panel .fc-plan-option button:disabled{cursor:default;opacity:1}.fc-plan-option.active button{background:#18291d;color:#bff8c5;border:1px solid rgba(128,242,76,.2)}
      #fc-plans-panel .fc-note{margin-top:11px;color:#718077;font-size:9px;line-height:1.45;text-align:center}
      @media(max-width:620px){.fc-plans-header-wrap{gap:6px}.fc-plans-header-wrap #pro10PlansHeader{min-width:78px;height:40px;padding:5px 8px}.fc-plans-header-wrap #pro10PlansHeader .fc-plan-copy b{font-size:10px}.fc-plans-header-wrap #pro10PlansHeader .fc-plan-copy small{display:none}#fc-plans-panel{top:68px;right:12px;width:calc(100vw - 24px)}}
      @media(max-width:390px){.fc-plans-header-wrap #pro10PlansHeader{min-width:64px}.fc-plans-header-wrap #pro10PlansHeader .fc-plan-copy{display:none}}
    `
    document.head.appendChild(style)
  }

  function removeLegacyPlans() { document.querySelectorAll('.fc-plans').forEach(el => el.remove()) }

  function ensureHeaderButton(current) {
    if (isAuth()) {
      document.querySelector('.fc-plans-header-wrap')?.remove()
      document.querySelector('#fc-plans-panel')?.remove()
      return
    }
    const header = document.querySelector('.app-header .header-inner')
    const userBox = header?.querySelector('.user-box')
    if (!header || !userBox) return

    let wrap = header.querySelector('.fc-plans-header-wrap')
    if (!wrap) {
      wrap = document.createElement('div')
      wrap.className = 'fc-plans-header-wrap'
      header.insertBefore(wrap, userBox)
    }
    let button = wrap.querySelector('#pro10PlansHeader')
    if (!button) {
      button = document.createElement('button')
      button.id = 'pro10PlansHeader'
      button.type = 'button'
      wrap.appendChild(button)
    }
    button.setAttribute('aria-label', 'Abrir planos FITCOACH')
    button.title = 'Planos FITCOACH'
    button.innerHTML = `<span class="fc-plan-mark">◆</span><span class="fc-plan-copy"><small>Plano</small><b>${esc(current ? PLANS[current.cycle].label : 'Planos')}</b></span>`
    button.onclick = togglePanel
  }

  function renderPanel(s) {
    document.querySelector('#fc-plans-panel')?.remove()
    if (!s || !open) return
    const panel = document.createElement('aside')
    panel.id = 'fc-plans-panel'
    panel.innerHTML = `
      <div class="fc-ph"><div><strong>Planos FITCOACH</strong><span>Escolha o plano e aumente o limite de alunos.</span></div><button id="fcPlansClose" aria-label="Fechar">×</button></div>
      <div class="fc-wallet"><b>${esc(PLANS[s.cycle].label)} · ${s.count}/${s.limit} alunos</b><span>${s.cycle === 'free' ? 'Plano gratuito com até 10 alunos.' : `Plano ativo com até ${s.limit} alunos.`}</span></div>
      <div class="fc-plan-grid">
        ${Object.keys(PLANS).map(key => { const p = PLANS[key]; const active = key === s.cycle; return `<article class="fc-plan-option ${active ? 'active' : ''}"><div class="fc-plan-info"><strong>${p.label}</strong><span>Até ${LIMITS[key]} alunos · ${p.period}</span></div><div class="fc-plan-price"><b>${p.price}</b><small>${p.note}</small></div><button data-fc-cycle="${key}" ${active || busy ? 'disabled' : ''}>${active ? 'Plano atual' : `Escolher ${p.label}`}</button></article>` }).join('')}
      </div>
      <div class="fc-note">A seleção do plano já atualiza o limite da conta. A cobrança online será conectada em uma próxima etapa.</div>`
    document.body.appendChild(panel)
    panel.querySelector('#fcPlansClose').onclick = () => { open = false; panel.remove() }
    panel.querySelectorAll('[data-fc-cycle]').forEach(btn => btn.onclick = () => choose(btn.dataset.fcCycle))
  }

  async function togglePanel() {
    const s = await state()
    if (!s) return
    open = !open
    renderPanel(s)
  }

  async function choose(cycle) {
    if (busy) return
    const s = await state()
    if (!s || !LIMITS[cycle]) return
    busy = true
    const uid = s.session.user.id
    let result
    if (cycle === 'free') {
      result = await supabase.from('trainer_plan_preferences').delete().eq('trainer_id', uid)
    } else {
      const { data: existing } = await supabase.from('trainer_plan_preferences').select('trainer_id').eq('trainer_id', uid).maybeSingle()
      result = existing
        ? await supabase.from('trainer_plan_preferences').update({ billing_cycle: cycle, updated_at: new Date().toISOString() }).eq('trainer_id', uid)
        : await supabase.from('trainer_plan_preferences').insert({ trainer_id: uid, billing_cycle: cycle })
    }
    busy = false
    if (result?.error) { alert(result.error.message); return }
    open = true
    await refresh(true)
  }

  async function refresh(force = false) {
    if (isAuth()) {
      if (force) ensureHeaderButton(null)
      return
    }
    const s = await state()
    if (!s) return
    installStyles()
    removeLegacyPlans()
    const header = document.querySelector('.app-header .header-inner')
    const needsButton = !header?.querySelector('#pro10PlansHeader')
    if (force || needsButton) ensureHeaderButton(s)
    if (force) renderPanel(s)
  }

  // Evita loops: só mexe no DOM quando o cabeçalho ainda não tem o botão.
  const observer = new MutationObserver(() => {
    if (isAuth()) return
    const header = document.querySelector('.app-header .header-inner')
    if (header && !header.querySelector('#pro10PlansHeader')) refresh()
  })

  async function boot() {
    installStyles()
    observer.observe(document.body, { childList: true, subtree: true })
    await refresh()
  }

  window.addEventListener('focus', () => refresh())
  document.addEventListener('click', e => {
    if (!open) return
    const panel = document.querySelector('#fc-plans-panel')
    const button = document.querySelector('#pro10PlansHeader')
    if (panel && !panel.contains(e.target) && !button?.contains(e.target)) { open = false; panel.remove() }
  }, true)

  supabase.auth.onAuthStateChange(() => {
    profile = null
    lastUserId = null
    open = false
    setTimeout(() => refresh(true), 150)
  })

  boot()
})()
