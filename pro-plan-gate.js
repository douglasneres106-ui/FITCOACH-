import { supabase } from './supabase'

(() => {
  const PLAN_LIMITS = { free: 10, semiannual: 15, monthly: 30 }
  let planCache = null
  let toastTimer = null

  function toast(message, type = 'ok') {
    let el = document.querySelector('#fcPlanToast')
    if (!el) {
      el = document.createElement('div')
      el.id = 'fcPlanToast'
      document.body.appendChild(el)
    }
    el.className = `fc-plan-toast ${type}`
    el.textContent = message
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => el.remove(), 3600)
  }

  function injectStyles() {
    if (document.querySelector('#fcPlanGateStyles')) return
    const style = document.createElement('style')
    style.id = 'fcPlanGateStyles'
    style.textContent = `
      .fc-plan-free-card{border:1px solid rgba(255,255,255,.10)!important;background:rgba(255,255,255,.025)!important}
      .fc-plan-free-card .pro10-plan-top{justify-content:space-between}
      .fc-plan-free-badge{display:inline-flex;align-items:center;padding:5px 9px;border-radius:999px;background:rgba(255,255,255,.07);color:#c8d0ca;font-size:10px;font-weight:800;letter-spacing:.08em}
      .fc-plan-pro-badge{display:inline-flex;align-items:center;padding:5px 9px;border-radius:999px;background:rgba(114,227,160,.12);color:#72e3a0;font-size:10px;font-weight:800;letter-spacing:.08em}
      .fc-plan-ai{font-weight:800}.fc-plan-ai.locked{color:#9ca69f}
      .fc-plan-note{margin-top:14px;padding:14px 16px;border-radius:14px;background:rgba(114,227,160,.06);border:1px solid rgba(114,227,160,.12);display:flex;gap:10px;flex-direction:column}
      .fc-plan-note strong{font-size:12px;color:#72e3a0}.fc-plan-note span{font-size:12px;color:#aab3ad;line-height:1.5}
      .fc-plan-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:100000;padding:12px 16px;border-radius:12px;background:#151b17;color:#f5f7f5;border:1px solid rgba(255,255,255,.12);box-shadow:0 12px 36px rgba(0,0,0,.35);font:600 13px/1.35 system-ui,-apple-system,sans-serif}
      .fc-plan-toast.error{border-color:rgba(255,100,100,.35)}
      [data-fc-ai-locked="true"]{opacity:.58!important;position:relative}
    `
    document.head.appendChild(style)
  }

  async function getPlan(force = false) {
    if (planCache && !force) return planCache
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
    if (profile?.role !== 'trainer') return null
    const { data: preference } = await supabase.from('trainer_plan_preferences').select('billing_cycle').eq('trainer_id', session.user.id).maybeSingle()
    const cycle = preference?.billing_cycle || 'free'
    const limit = PLAN_LIMITS[cycle] || PLAN_LIMITS.free
    planCache = {
      cycle,
      isPro: cycle === 'monthly' || cycle === 'semiannual',
      limit,
      label: cycle === 'monthly' ? 'Pro Mensal' : cycle === 'semiannual' ? 'Pro Semestral' : 'Free',
    }
    return planCache
  }

  async function downgradeToFree() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return toast('Entre na sua conta para alterar o plano.', 'error')
    const { error } = await supabase.from('trainer_plan_preferences').delete().eq('trainer_id', session.user.id)
    if (error) return toast(error.message, 'error')
    planCache = null
    document.querySelector('#pro10Modal')?.remove()
    toast('Plano Free ativado: até 10 alunos e sem acesso à IA FITCOACH.')
    setTimeout(() => document.querySelector('#pro10PlansHeader,#pro10PlansHome')?.click(), 120)
  }

  function freeCard(plan) {
    const selected = plan.cycle === 'free'
    return `<article class="pro10-plan fc-plan-free-card ${selected ? 'selected' : ''}">
      <div class="pro10-plan-top"><span class="pro10-eyebrow">ESSENCIAL</span><span class="fc-plan-free-badge">FREE</span></div>
      <h3>Free</h3>
      <div class="pro10-price"><strong>R$ 0</strong><span>sem cobrança</span></div>
      <div class="pro10-period"><span>Ciclo: <b>gratuito</b></span></div>
      <p>Para começar no FITCOACH com os recursos essenciais e uma carteira enxuta.</p>
      <ul>
        <li><span>✓</span>Até 10 alunos</li>
        <li><span>✓</span>Gestão básica de alunos e treinos</li>
        <li><span>✓</span>Evolução e registros essenciais</li>
        <li class="fc-plan-ai locked"><span>—</span>IA FITCOACH não disponível</li>
        <li><span>✓</span>Faça upgrade quando quiser</li>
      </ul>
      <button class="btn ${selected ? 'sec' : ''} full" id="fcUseFree">${selected ? 'Plano Free atual' : 'Usar plano Free'}</button>
      <small class="pro10-tag">Até 10 alunos</small>
    </article>`
  }

  function enhancePlanModal(plan) {
    const modal = document.querySelector('#pro10Modal')
    const grid = modal?.querySelector('.pro10-grid')
    if (!modal || !grid) return
    if (!grid.querySelector('.fc-plan-free-card')) grid.insertAdjacentHTML('afterbegin', freeCard(plan))

    const cards = [...grid.querySelectorAll('.pro10-plan')]
    cards.forEach(card => {
      const title = card.querySelector('h3')
      const text = title?.textContent?.trim().toLowerCase() || ''
      const isMonthly = text === 'mensal'
      const isSemi = text === 'semestral'
      if (isMonthly || isSemi) {
        const limit = isMonthly ? PLAN_LIMITS.monthly : PLAN_LIMITS.semiannual
        title.textContent = isMonthly ? 'Pro Mensal' : 'Pro Semestral'
        const top = card.querySelector('.pro10-plan-top')
        if (top && !top.querySelector('.fc-plan-pro-badge')) top.insertAdjacentHTML('beforeend', '<span class="fc-plan-pro-badge">PRO</span>')
        const list = card.querySelector('ul')
        if (list) {
          const limitItem = [...list.querySelectorAll('li')].find(li => /Até \d+ alunos/i.test(li.textContent || ''))
          if (limitItem) limitItem.innerHTML = `<span>✓</span>Até ${limit} alunos`
          else list.insertAdjacentHTML('afterbegin', `<li><span>✓</span>Até ${limit} alunos</li>`)
          if (!list.querySelector('.fc-plan-ai')) list.insertAdjacentHTML('beforeend', '<li class="fc-plan-ai"><span>✓</span>IA FITCOACH liberada</li>')
        }
        const tag = card.querySelector('.pro10-tag')
        if (tag) tag.textContent = `${isMonthly ? 'Renovação mensal' : '6 meses'} • até ${limit} alunos`
      }
    })

    const status = modal.querySelector('.pro10-status')
    if (status) {
      const strong = status.querySelector('strong')
      const p = status.querySelector('p')
      if (strong) strong.textContent = `${plan.limit} alunos • ${plan.label}`
      if (p) p.textContent = plan.isPro
        ? `${plan.label} ativo: até ${plan.limit} alunos e IA FITCOACH liberada.`
        : 'Plano Free ativo: até 10 alunos. Faça upgrade para o Pro e libere a IA FITCOACH.'
    }

    const pricing = modal.querySelector('.pro10-pricing-note')
    if (pricing) {
      const strong = pricing.querySelector('strong')
      const span = pricing.querySelector('span')
      if (strong) strong.textContent = plan.isPro ? 'Recursos Pro liberados' : 'Limites dos planos'
      if (span) span.textContent = `Free: até ${PLAN_LIMITS.free} alunos • Pro Semestral: até ${PLAN_LIMITS.semiannual} • Pro Mensal: até ${PLAN_LIMITS.monthly}.`
    }

    if (!modal.querySelector('.fc-plan-note')) {
      const note = document.createElement('div')
      note.className = 'fc-plan-note'
      note.innerHTML = plan.isPro
        ? `<strong>IA FITCOACH liberada</strong><span>${plan.label} permite usar a IA para criar sugestões de treino e sua carteira suporta até ${plan.limit} alunos. O personal continua responsável pela revisão e prescrição final.</span>`
        : '<strong>Desbloqueie a IA FITCOACH</strong><span>Escolha o Pro Mensal ou Pro Semestral para liberar a IA. O Semestral permite até 15 alunos e o Mensal até 30 alunos.</span>'
      pricing?.insertAdjacentElement('afterend', note)
    }

    modal.querySelectorAll('[data-pro10-cycle]').forEach(btn => {
      if (btn.dataset.fcPlanBound) return
      btn.dataset.fcPlanBound = 'true'
      btn.addEventListener('click', () => {
        planCache = null
        setTimeout(enhance, 300)
      }, true)
    })

    const freeButton = modal.querySelector('#fcUseFree')
    if (freeButton && !freeButton.dataset.bound) {
      freeButton.dataset.bound = 'true'
      freeButton.onclick = async () => {
        if (plan.isPro) {
          freeButton.disabled = true
          freeButton.textContent = 'Alterando...'
          await downgradeToFree()
        }
      }
    }
  }

  async function enhanceStudentLimit() {
    const plan = await getPlan()
    if (!plan) return
    const buttons = document.querySelectorAll('#quickStudent,#newStudent')
    const metric = document.querySelector('.metric-card[data-go="students"]')
    const currentText = metric?.querySelector('strong')?.textContent || ''
    const count = Number(currentText) || 0
    const full = count >= plan.limit
    buttons.forEach(btn => {
      btn.disabled = full
      btn.title = full ? `Limite de ${plan.limit} alunos no ${plan.label}` : `${count}/${plan.limit} alunos no ${plan.label}`
      if (full) btn.textContent = `Limite ${plan.limit}/${plan.limit}`
    })
    const small = metric?.querySelector('small')
    if (small) small.textContent = `${count}/${plan.limit} alunos • ${plan.label} →`
  }

  function gateAiControls(plan) {
    const candidates = [...document.querySelectorAll('button,[role="button"]')]
    candidates.forEach(el => {
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase()
      const looksLikeAi = /\bia\b|gerar.*treino|treino.*ia|smart\/ia/.test(text)
      if (!looksLikeAi || /planos|plano/.test(text)) return
      if (plan.isPro) {
        el.removeAttribute('data-fc-ai-locked')
        return
      }
      el.setAttribute('data-fc-ai-locked', 'true')
      el.title = 'IA FITCOACH disponível somente nos planos Pro.'
      if (!el.dataset.fcAiBound) {
        el.dataset.fcAiBound = 'true'
        el.addEventListener('click', e => {
          e.preventDefault(); e.stopImmediatePropagation()
          toast('A IA FITCOACH está disponível no Pro Mensal e no Pro Semestral. Abra Planos para fazer upgrade.', 'error')
          document.querySelector('#pro10PlansHeader,#pro10PlansHome')?.click()
        }, true)
      }
    })
  }

  async function enhance() {
    try {
      injectStyles()
      const plan = await getPlan()
      if (!plan) return
      enhancePlanModal(plan)
      await enhanceStudentLimit()
      gateAiControls(plan)
    } catch (error) {
      console.warn('FITCOACH plan gate:', error)
    }
  }

  document.addEventListener('click', () => setTimeout(enhance, 80), true)
  new MutationObserver(() => setTimeout(enhance, 60)).observe(document.documentElement, { subtree: true, childList: true })
  window.addEventListener('focus', () => { planCache = null; enhance() })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance, { once: true })
  else enhance()
})()
