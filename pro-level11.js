import './pro-level11.css'
import { supabase } from './supabase'

let scheduled=false
let profileCache=null
let studentCache=null
let chatOpen=false
let sending=false

const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))
const nl=(v='')=>esc(v).replace(/\n/g,'<br>')

function timeLabel(value){
  if(!value)return ''
  const d=new Date(value)
  return d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
}

function toast(message,type='ok'){
  document.querySelector('#pro11Toast')?.remove()
  const el=document.createElement('div')
  el.id='pro11Toast';el.className=`pro11-toast ${type}`;el.textContent=message
  document.body.appendChild(el)
  setTimeout(()=>el.remove(),3400)
}

async function getContext(){
  const {data:{session}}=await supabase.auth.getSession()
  if(!session)return null
  if(!profileCache){
    const {data}=await supabase.from('profiles').select('id,role,full_name').eq('id',session.user.id).maybeSingle()
    profileCache=data||null
  }
  return {session,profile:profileCache}
}

async function getStudent(){
  const ctx=await getContext()
  if(!ctx?.session||ctx.profile?.role!=='student')return null
  if(!studentCache){
    const {data,error}=await supabase.from('students').select('id,trainer_id,name,goal').eq('user_id',ctx.session.user.id).maybeSingle()
    if(error)throw error
    studentCache=data||null
  }
  return studentCache
}

function modeLabel(mode){
  if(mode==='ai')return 'IA FITCOACH'
  if(mode==='smart')return 'SMART LOCAL'
  if(mode==='safety')return 'SEGURANÇA'
  return ''
}

function messageHtml(message){
  const assistant=message.sender==='assistant'
  const mode=assistant?modeLabel(message.response_mode):''
  return `<div class="pro11-msg ${assistant?'assistant':'student'}">
    <div class="pro11-bubble">${nl(message.content)}</div>
    <div class="pro11-msg-meta">${assistant?`<span>${mode||'ASSISTENTE'}</span>`:'<span>VOCÊ</span>'}<time>${timeLabel(message.created_at)}</time></div>
  </div>`
}

async function loadMessages(studentId){
  const {data,error}=await supabase
    .from('student_chat_messages')
    .select('id,sender,content,response_mode,needs_trainer_attention,created_at')
    .eq('student_id',studentId)
    .order('created_at',{ascending:true})
    .limit(100)
  if(error)throw error
  return data||[]
}

function emptyChat(){
  return `<div class="pro11-empty">
    <div class="pro11-ai-mark">FC</div>
    <h3>Oi! Eu sou o Assistente FITCOACH.</h3>
    <p>Pergunte sobre sua ficha, séries, repetições, descanso, execução, aquecimento, cardio ou recuperação.</p>
    <small>Para dor, lesão ou sintomas de saúde, o chat não substitui seu personal nem avaliação profissional.</small>
  </div>`
}

function scrollBottom(){
  const list=document.querySelector('#pro11Messages')
  if(list)requestAnimationFrame(()=>{list.scrollTop=list.scrollHeight})
}

async function openChat(){
  const ctx=await getContext()
  if(!ctx?.session)return toast('Entre na sua conta para usar o chat.','error')
  if(ctx.profile?.role!=='student')return toast('O Chat FITCOACH é destinado aos alunos.','error')
  const student=await getStudent()
  if(!student)return toast('Sua conta ainda não está vinculada a um personal.','error')

  document.querySelector('#pro11Modal')?.remove()
  const wrap=document.createElement('div')
  wrap.id='pro11Modal';wrap.className='pro11-modal'
  wrap.innerHTML=`<section class="pro11-chat" role="dialog" aria-modal="true" aria-label="Chat FITCOACH">
    <header class="pro11-head">
      <div class="pro11-head-main"><div class="pro11-avatar">✦</div><div><strong>Assistente FITCOACH</strong><span><i></i> Online para dúvidas de treino</span></div></div>
      <button class="icon-btn" id="pro11Close" aria-label="Fechar chat">×</button>
    </header>
    <div class="pro11-context"><span>SEU ACOMPANHAMENTO</span><strong>${esc(student.goal||'Objetivo acompanhado pelo personal')}</strong></div>
    <div class="pro11-messages" id="pro11Messages"><div class="pro11-loading">Carregando conversa...</div></div>
    <div class="pro11-chips" id="pro11Chips">
      <button data-q="Quanto tempo devo descansar entre as séries?">Descanso</button>
      <button data-q="Quais são meus treinos cadastrados?">Minha ficha</button>
      <button data-q="Como saber se posso aumentar a carga?">Carga</button>
      <button data-q="Como devo aquecer antes do treino?">Aquecimento</button>
    </div>
    <form class="pro11-compose" id="pro11Form">
      <textarea id="pro11Input" maxlength="1600" rows="1" placeholder="Digite sua dúvida..." aria-label="Digite sua dúvida"></textarea>
      <button type="submit" id="pro11Send" aria-label="Enviar mensagem">➤</button>
    </form>
    <div class="pro11-foot">O FITCOACH orienta sobre o treino cadastrado. Ajustes de prescrição continuam sob responsabilidade do seu personal.</div>
  </section>`
  wrap.onclick=e=>{if(e.target===wrap)closeChat()}
  document.body.appendChild(wrap)
  chatOpen=true

  document.querySelector('#pro11Close').onclick=closeChat
  document.querySelector('#pro11Form').onsubmit=sendMessage
  document.querySelector('#pro11Input').addEventListener('input',autoGrow)
  document.querySelectorAll('#pro11Chips [data-q]').forEach(btn=>btn.onclick=()=>{
    const input=document.querySelector('#pro11Input');if(!input)return
    input.value=btn.dataset.q;input.focus();autoGrow({target:input})
  })

  try{
    const messages=await loadMessages(student.id)
    const list=document.querySelector('#pro11Messages')
    if(list)list.innerHTML=messages.length?messages.map(messageHtml).join(''):emptyChat()
    scrollBottom()
  }catch(error){
    console.warn('FITCOACH chat history:',error)
    const list=document.querySelector('#pro11Messages')
    if(list)list.innerHTML='<div class="pro11-error">Não foi possível carregar o histórico agora.</div>'
  }
}

function closeChat(){
  document.querySelector('#pro11Modal')?.remove();chatOpen=false
}

function autoGrow(e){
  const el=e.target
  el.style.height='auto';el.style.height=`${Math.min(el.scrollHeight,120)}px`
}

function appendTyping(){
  const list=document.querySelector('#pro11Messages')
  if(!list)return
  list.querySelector('.pro11-empty')?.remove()
  list.insertAdjacentHTML('beforeend',`<div class="pro11-msg assistant" id="pro11Typing"><div class="pro11-bubble pro11-typing"><i></i><i></i><i></i></div><div class="pro11-msg-meta"><span>ASSISTENTE</span><time>respondendo</time></div></div>`)
  scrollBottom()
}

function appendOptimistic(content){
  const list=document.querySelector('#pro11Messages')
  if(!list)return
  list.querySelector('.pro11-empty')?.remove()
  list.insertAdjacentHTML('beforeend',messageHtml({sender:'student',content,created_at:new Date().toISOString()}))
  scrollBottom()
}

async function sendMessage(e){
  e.preventDefault()
  if(sending)return
  const input=document.querySelector('#pro11Input')
  const button=document.querySelector('#pro11Send')
  const message=input?.value.trim()
  if(!message)return

  const ctx=await getContext()
  if(!ctx?.session)return toast('Sua sessão expirou. Entre novamente.','error')

  sending=true
  input.value='';input.style.height='auto';input.disabled=true;button.disabled=true
  appendOptimistic(message);appendTyping()

  try{
    const response=await fetch('/api/student-chat',{
      method:'POST',
      headers:{'Content-Type':'application/json',Authorization:`Bearer ${ctx.session.access_token}`},
      body:JSON.stringify({message})
    })
    const data=await response.json().catch(()=>({}))
    if(!response.ok)throw new Error(data.error||'Não foi possível responder agora.')

    document.querySelector('#pro11Typing')?.remove()
    const list=document.querySelector('#pro11Messages')
    if(list&&data.assistantMessage)list.insertAdjacentHTML('beforeend',messageHtml(data.assistantMessage))

    const status=document.querySelector('.pro11-head-main span')
    if(status){
      status.innerHTML=data.mode==='ai'?'<i></i> IA FITCOACH online':data.mode==='safety'?'<i></i> Resposta de segurança':'<i></i> Smart local ativo'
    }
    if(data.needs_trainer_attention)toast('Essa dúvida merece avaliação do seu personal.','warn')
    scrollBottom()
  }catch(error){
    document.querySelector('#pro11Typing')?.remove()
    const list=document.querySelector('#pro11Messages')
    if(list)list.insertAdjacentHTML('beforeend',`<div class="pro11-error">${esc(error.message||'Não foi possível responder agora.')}</div>`)
    toast(error.message||'Não foi possível responder agora.','error')
  }finally{
    sending=false
    input.disabled=false;button.disabled=false;input.focus()
  }
}

async function enhanceStudent(){
  const ctx=await getContext()
  if(ctx?.profile?.role!=='student')return

  if(!document.querySelector('#pro11Launcher')){
    const btn=document.createElement('button')
    btn.id='pro11Launcher';btn.className='pro11-launcher';btn.type='button';btn.innerHTML='<span>✦</span><b>Chat FITCOACH</b>'
    btn.onclick=openChat
    document.body.appendChild(btn)
  }

  const content=document.querySelector('#content')
  if(content&&!content.querySelector('#pro11StudentCard')){
    const card=document.createElement('button')
    card.id='pro11StudentCard';card.className='pro11-student-card';card.type='button'
    card.innerHTML='<span class="pro11-mini-mark">✦</span><span><b>Tire suas dúvidas na hora</b><small>Converse com o Assistente FITCOACH sobre sua ficha e seu treino.</small></span><strong>Abrir chat →</strong>'
    card.onclick=openChat
    content.appendChild(card)
  }
}

async function enhance(){
  try{
    const ctx=await getContext()
    const badge=document.querySelector('.version-badge');if(badge)badge.textContent='v11'
    if(ctx?.profile?.role==='student')await enhanceStudent()
    else document.querySelector('#pro11Launcher')?.remove()
  }catch(error){console.warn('FITCOACH pro11:',error)}
}

function scheduleEnhance(){
  if(scheduled)return;scheduled=true
  setTimeout(()=>{scheduled=false;enhance()},180)
}

new MutationObserver(scheduleEnhance).observe(document.documentElement,{subtree:true,childList:true})
window.addEventListener('focus',scheduleEnhance)
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&chatOpen)closeChat()})
scheduleEnhance()
