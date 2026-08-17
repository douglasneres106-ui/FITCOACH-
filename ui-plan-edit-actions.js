// FITCOACH — ações de edição das fichas de treino.
import { supabase } from './supabase'

(() => {
  const esc = (value = '') => String(value).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]))

  const isLogin = () => !!document.querySelector('input[type="password"], [data-login], .login, .login-screen, #login')
  const findText = (texts) => [...document.querySelectorAll('button,a,[role="button"],h1,h2,h3')]
    .find(el => texts.some(t => el.textContent?.trim().toLowerCase().includes(t)))

  function getWorkoutCards() {
    return [...document.querySelectorAll('button,a,[role="button"]')]
      .filter(el => /^\s*ver ficha\s*$/i.test(el.textContent || ''))
      .map(view => {
        const card = view.closest('article, .item-card, .workout-card, .card') || view.parentElement
        return card && /ficha|treino/i.test(card.textContent || '')
          ? { card, view, workoutId: view.dataset.view || view.getAttribute('data-workout-id') || '' }
          : null
      }).filter(Boolean)
  }

  function addEditButtonsToEveryWorkout() {
    if (isLogin()) return
    getWorkoutCards().forEach(({ card, view, workoutId }) => {
      if (card.querySelector('.fc-edit-workout')) return
      const title = [...card.querySelectorAll('h1,h2,h3,.item-title,strong')].map(el => el.textContent?.trim()).find(Boolean) || 'Ficha de treino'
      const btn = document.createElement('button')
      btn.className = 'btn sec fc-edit-workout'
      btn.type = 'button'
      btn.textContent = '✎ Editar'
      btn.dataset.workoutName = title
      btn.dataset.workoutId = workoutId
      btn.onclick = event => {
        event.preventDefault()
        event.stopPropagation()
        window.FITCOACH_UI?.editWorkout?.({ name: title, id: workoutId, card, view })
      }
      const actions = card.querySelector('.actions, .item-actions, .card-actions')
      if (actions) actions.appendChild(btn)
      else card.appendChild(btn)
    })
  }

  function removeEditFromBottomNav() {
    document.querySelectorAll('nav,footer,[class*="bottom"],[class*="navbar"],[class*="tabbar"]').forEach(nav => {
      nav.querySelectorAll('.fc-edit-workout').forEach(el => el.remove())
    })
  }

  function addEditToStudentWorkoutArea() {
    if (isLogin() || getWorkoutCards().length || document.querySelector('.fc-edit-workout')) return
    const student = findText(['alunos', 'aluno'])
    if (!student) return
    const workout = [...document.querySelectorAll('button,a,[role="button"],h1,h2,h3')].find(el => /ficha de treino|fichas de treino|treinos/i.test(el.textContent || ''))
    if (!workout) return
    const parent = workout.closest('section,article') || workout.parentElement
    if (!parent || !/treino|ficha/i.test(parent.textContent || '')) return
    const btn = document.createElement('button')
    btn.className = 'btn sec fc-edit-workout'
    btn.type = 'button'
    btn.textContent = '✎ Editar treino'
    btn.onclick = () => window.FITCOACH_UI?.editWorkout?.()
    parent.appendChild(btn)
  }

  function addPlansBesideBadge() {
    if (isLogin() || document.querySelector('.fc-plans')) return
    const badge = findText(['minha insígnia', 'insígnia'])
    if (!badge?.parentElement) return
    const btn = document.createElement('button')
    btn.className = 'btn fc-plans'
    btn.type = 'button'
    btn.textContent = '◆ Planos'
    btn.onclick = () => window.FITCOACH_UI?.openPlans?.()
    badge.parentElement.appendChild(btn)
  }

  function wireAIWithWorkoutBuilder() {
    if (isLogin() || document.querySelector('.fc-ai-help')) return
    const anchor = findText(['montar treino'])
    if (!anchor) return
    const parent = anchor.closest('section,article') || anchor.parentElement
    if (!parent) return
    const box = document.createElement('div')
    box.className = 'fc-ai-help'
    box.innerHTML = '<button type="button" class="btn primary fc-ai-chat">✦ Conversar com IA FITCOACH</button>'
    parent.appendChild(box)
    box.querySelector('button').onclick = () => window.FITCOACH_UI?.openAIChat?.()
  }

  function makeExerciseRow(exercise = {}) {
    const row = document.createElement('div')
    row.className = 'exercise fc-edit-exercise'
    row.dataset.exerciseId = exercise.id || ''
    row.innerHTML = `
      <div class="exercise-name"><label>Exercício</label><input data-field="exercise_name" value="${esc(exercise.exercise_name || '')}" placeholder="Ex.: Supino reto"></div>
      <div><label>Séries</label><input data-field="sets" type="number" min="1" value="${exercise.sets ?? 3}" placeholder="3"></div>
      <div><label>Reps</label><input data-field="reps" value="${esc(exercise.reps ?? '10')}" placeholder="10"></div>
      <div><label>Carga</label><input data-field="load" value="${esc(exercise.load || '')}" placeholder="20kg"></div>
      <div><label>Descanso</label><input data-field="rest_seconds" type="number" min="0" value="${exercise.rest_seconds ?? 60}" placeholder="60"></div>
      <button type="button" class="btn ghost fc-remove-exercise" aria-label="Remover exercício">×</button>`
    row.querySelector('.fc-remove-exercise').onclick = () => row.remove()
    return row
  }

  async function openManualWorkoutEditor(workoutId, fallbackName = '') {
    if (!workoutId) {
      alert('Não foi possível identificar esta ficha de treino. Atualize a página e tente novamente.')
      return
    }
    const { data, error } = await supabase.from('workouts').select('id,name,student_id,workout_exercises(*)').eq('id', workoutId).single()
    if (error) {
      alert(error.message || 'Não foi possível carregar a ficha.')
      return
    }

    document.querySelector('#modal')?.remove()
    document.body.insertAdjacentHTML('beforeend', `<div id="modal" class="modal"><div class="card modal-card fc-manual-editor">
      <div class="modal-head"><div><span class="eyebrow">EDIÇÃO MANUAL</span><h2>Editar treino</h2></div><button class="icon-btn" id="fcEditClose" type="button">×</button></div>
      <div class="two"><div><label>Nome do treino</label><input id="fcEditWorkoutName" value="${esc(data.name || fallbackName)}" placeholder="Nome do treino"></div></div>
      <div class="form-section-head"><div><h3>Exercícios</h3><p class="muted">Altere séries, repetições, carga e descanso. Você também pode adicionar ou remover exercícios.</p></div><button class="btn sec compact" id="fcAddExercise" type="button">+ Exercício</button></div>
      <div id="fcExerciseBox" class="exercise-box"></div><div id="fcEditMsg" class="auth-msg"></div>
      <div class="actions modal-actions"><button class="btn sec" id="fcEditCancel" type="button">Cancelar</button><button class="btn" id="fcSaveManual" type="button">Salvar alterações</button></div>
    </div></div>`)

    const box = document.querySelector('#fcExerciseBox')
    const exercises = [...(data.workout_exercises || [])].sort((a,b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    exercises.forEach(exercise => box.appendChild(makeExerciseRow(exercise)))
    if (!exercises.length) box.appendChild(makeExerciseRow())

    const close = () => document.querySelector('#modal')?.remove()
    document.querySelector('#fcEditClose').onclick = close
    document.querySelector('#fcEditCancel').onclick = close
    document.querySelector('#fcAddExercise').onclick = () => box.appendChild(makeExerciseRow())
    document.querySelector('#fcSaveManual').onclick = () => saveManualWorkout(data.id)
  }

  async function saveManualWorkout(workoutId) {
    const button = document.querySelector('#fcSaveManual')
    const msg = document.querySelector('#fcEditMsg')
    const name = document.querySelector('#fcEditWorkoutName')?.value.trim()
    const rows = [...document.querySelectorAll('#fcExerciseBox .fc-edit-exercise')]
    if (!name) { msg.innerHTML = '<div class="notice error">Digite o nome do treino.</div>'; return }
    if (!rows.length) { msg.innerHTML = '<div class="notice error">Adicione pelo menos um exercício.</div>'; return }

    const exercises = rows.map((row, index) => ({
      id: row.dataset.exerciseId || null,
      workout_id: workoutId,
      exercise_name: row.querySelector('[data-field="exercise_name"]').value.trim() || 'Exercício',
      sets: Number(row.querySelector('[data-field="sets"]').value) || 3,
      reps: row.querySelector('[data-field="reps"]').value.trim() || '10',
      load: row.querySelector('[data-field="load"]').value.trim() || null,
      rest_seconds: Number(row.querySelector('[data-field="rest_seconds"]').value) || 60,
      sort_order: index
    }))

    button.disabled = true
    button.textContent = 'Salvando...'
    msg.innerHTML = ''

    try {
      const { data: current, error: currentError } = await supabase.from('workout_exercises').select('id').eq('workout_id', workoutId)
      if (currentError) throw currentError
      const currentIds = (current || []).map(item => item.id)
      const keepExistingIds = exercises.filter(item => item.id).map(item => item.id)
      const idsToDelete = currentIds.filter(id => !keepExistingIds.includes(id))

      const { error: workoutError } = await supabase.from('workouts').update({ name }).eq('id', workoutId)
      if (workoutError) throw workoutError

      for (const exercise of exercises.filter(item => item.id)) {
        const { error } = await supabase.from('workout_exercises').update({
          exercise_name: exercise.exercise_name,
          sets: exercise.sets,
          reps: exercise.reps,
          load: exercise.load,
          rest_seconds: exercise.rest_seconds,
          sort_order: exercise.sort_order
        }).eq('id', exercise.id).eq('workout_id', workoutId)
        if (error) throw error
      }

      const newExercises = exercises.filter(item => !item.id).map(({ id, ...item }) => item)
      if (newExercises.length) {
        const { error } = await supabase.from('workout_exercises').insert(newExercises)
        if (error) throw error
      }

      if (idsToDelete.length) {
        const { error } = await supabase.from('workout_exercises').delete().in('id', idsToDelete).eq('workout_id', workoutId)
        if (error) throw error
      }

      msg.innerHTML = '<div class="notice">Treino atualizado com sucesso.</div>'
      button.textContent = 'Salvo ✓'
      setTimeout(() => window.location.reload(), 350)
    } catch (error) {
      button.disabled = false
      button.textContent = 'Salvar alterações'
      msg.innerHTML = `<div class="notice error">${esc(error?.message || 'Não foi possível salvar as alterações.')}</div>`
    }
  }

  window.FITCOACH_UI = window.FITCOACH_UI || {}
  window.FITCOACH_UI.editWorkout = (workout = {}) => {
    document.querySelector('#modal')?.remove()
    const name = workout.name || 'Ficha de treino'
    document.body.insertAdjacentHTML('beforeend', `<div id="modal" class="modal"><div class="card modal-card">
      <button class="icon-btn" id="fcEditClose" type="button">×</button><span class="eyebrow">EDIÇÃO DE TREINO</span><h2>Editar treino</h2>
      <p class="muted"><strong>${esc(name)}</strong></p><p class="muted">Edite exercícios, séries, repetições, carga e descanso.</p>
      <textarea class="input" rows="4" placeholder="Descreva a alteração..."></textarea>
      <div class="row gap"><button class="btn" id="fcEditManual" type="button">Editar manualmente</button><button class="btn primary" id="fcEditAI" type="button">✦ Editar com IA</button></div>
    </div></div>`)
    document.querySelector('#fcEditClose').onclick = () => document.querySelector('#modal')?.remove()
    document.querySelector('#fcEditManual').onclick = () => openManualWorkoutEditor(workout.id, name)
    document.querySelector('#fcEditAI').onclick = () => window.FITCOACH_UI?.openAIChat ? window.FITCOACH_UI.openAIChat() : alert('A IA FITCOACH ainda não está disponível nesta tela.')
  }

  window.FITCOACH_UI.openPlans = () => {
    document.querySelector('#modal')?.remove()
    document.body.insertAdjacentHTML('beforeend','<div id="modal" class="modal"><div class="card modal-card"><button class="icon-btn" id="fcPlansClose">×</button><h2>Planos</h2><p class="muted">Escolha seu plano mensal ou semestral.</p><div class="grid two"><div class="card"><h3>Mensal</h3><button class="btn primary full">Escolher mensal</button></div><div class="card"><h3>Semestral</h3><button class="btn primary full">Escolher semestral</button></div></div></div></div>')
    document.querySelector('#fcPlansClose').onclick=()=>document.querySelector('#modal')?.remove()
  }

  const sync = () => {
    if (isLogin()) {
      document.querySelectorAll('.fc-edit-workout,.fc-plans,.fc-ai-help').forEach(e=>e.remove())
      return
    }
    removeEditFromBottomNav()
    addEditButtonsToEveryWorkout()
    addEditToStudentWorkoutArea()
    addPlansBesideBadge()
    wireAIWithWorkoutBuilder()
  }

  sync()
  new MutationObserver(sync).observe(document.body,{childList:true,subtree:true})
})()
