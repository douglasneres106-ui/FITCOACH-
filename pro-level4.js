import './pro-level4.css'
import { supabase } from './supabase'

const BUCKET='fitcoach-media'
const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))
const fmt=(v)=>v?new Date(v).toLocaleDateString('pt-BR'):'-'
let scheduled=false

function toast(message){
  document.querySelector('#pro4Toast')?.remove()
  const el=document.createElement('div')
  el.id='pro4Toast';el.className='pro4-toast';el.textContent=message
  document.body.appendChild(el)
  setTimeout(()=>el.remove(),3000)
}

function openModal(html){
  document.querySelector('#pro4Modal')?.remove()
  const wrap=document.createElement('div')
  wrap.id='pro4Modal';wrap.className='pro4-modal'
  wrap.innerHTML=`<div class="pro4-card">${html}</div>`
  wrap.onclick=e=>{if(e.target===wrap)wrap.remove()}
  document.body.appendChild(wrap)
}
window.closePro4Modal=()=>document.querySelector('#pro4Modal')?.remove()

async function sessionUser(){
  const {data}=await supabase.auth.getSession()
  return data.session?.user||null
}

async function studentSelf(){
  const user=await sessionUser();if(!user)return null
  const {data}=await supabase.from('students').select('*').eq('user_id',user.id).maybeSingle()
  return data||null
}

async function signedUrl(path){
  const {data,error}=await supabase.storage.from(BUCKET).createSignedUrl(path,3600)
  return error?null:data?.signedUrl||null
}

async function signedMedia(rows=[]){
  return Promise.all(rows.map(async row=>({...row,url:await signedUrl(row.storage_path)})))
}

async function openMedia(studentId){
  openModal('<div class="pro4-loading">Carregando fotos...</div>')
  const [{data:student,error:studentError},{data:media,error:mediaError}]=await Promise.all([
    supabase.from('students').select('id,name,goal').eq('id',studentId).single(),
    supabase.from('student_media').select('*').eq('student_id',studentId).order('created_at',{ascending:false})
  ])
  if(studentError||mediaError){document.querySelector('#pro4Modal')?.remove();return toast(studentError?.message||mediaError?.message||'Não foi possível carregar as fotos.')}
  const items=await signedMedia(media||[])
  const avatars=items.filter(x=>x.kind==='avatar'&&x.url)
  const progress=[...items.filter(x=>x.kind==='progress'&&x.url)].sort((a,b)=>new Date(a.taken_at||a.created_at)-new Date(b.taken_at||b.created_at))
  const avatar=avatars[0]
  const first=progress[0],last=progress.at(-1)
  openModal(`<div class="pro4-head">
    <div class="pro4-profile-head">${avatar?`<img src="${avatar.url}" alt="Foto de ${esc(student.name)}">`:`<div class="pro4-avatar-fallback">${esc(student.name).split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()).join('')}</div>`}<div><span class="eyebrow">FOTOS E EVOLUÇÃO</span><h2>${esc(student.name)}</h2><p>${esc(student.goal||'Objetivo não informado')}</p></div></div>
    <button class="icon-btn" onclick="closePro4Modal()">×</button>
  </div>
  <section class="pro4-upload">
    <div><h3>Adicionar foto</h3><p>JPG, PNG ou WebP. Máximo de 5 MB.</p></div>
    <div class="pro4-upload-grid">
      <select id="pro4Kind"><option value="progress">Foto de evolução</option><option value="avatar">Foto de perfil</option></select>
      <input id="pro4Taken" type="date" aria-label="Data da foto">
      <input id="pro4Caption" placeholder="Observação (opcional)">
      <input id="pro4File" type="file" accept="image/jpeg,image/png,image/webp">
      <button class="btn" id="pro4Upload">Enviar foto</button>
    </div>
  </section>
  ${first&&last&&first.id!==last.id?`<section class="pro4-compare"><div class="pro4-section-title"><div><span class="eyebrow">ANTES E DEPOIS</span><h3>Comparação de evolução</h3></div></div><div class="pro4-compare-grid"><figure><img src="${first.url}" alt="Foto anterior"><figcaption>Antes • ${fmt(first.taken_at||first.created_at)}</figcaption></figure><figure><img src="${last.url}" alt="Foto recente"><figcaption>Depois • ${fmt(last.taken_at||last.created_at)}</figcaption></figure></div></section>`:''}
  <section><div class="pro4-section-title"><div><span class="eyebrow">GALERIA PRIVADA</span><h3>${progress.length} ${progress.length===1?'registro':'registros'} de evolução</h3></div></div>
    ${progress.length?`<div class="pro4-gallery">${[...progress].reverse().map(x=>`<figure><img src="${x.url}" alt="Foto de evolução"><figcaption><strong>${fmt(x.taken_at||x.created_at)}</strong>${x.caption?`<span>${esc(x.caption)}</span>`:''}<button class="pro4-delete" data-pro4-delete="${x.id}" data-path="${esc(x.storage_path)}">Excluir</button></figcaption></figure>`).join('')}</div>`:'<div class="pro4-empty">Nenhuma foto de evolução cadastrada ainda.</div>'}
  </section>`)
  document.querySelector('#pro4Upload').onclick=()=>uploadMedia(studentId)
  document.querySelectorAll('[data-pro4-delete]').forEach(b=>b.onclick=()=>deleteMedia(b.dataset.pro4Delete,b.dataset.path,studentId))
}

async function uploadMedia(studentId){
  const file=document.querySelector('#pro4File')?.files?.[0]
  const kind=document.querySelector('#pro4Kind')?.value||'progress'
  const caption=document.querySelector('#pro4Caption')?.value.trim()||null
  const taken_at=document.querySelector('#pro4Taken')?.value||null
  if(!file)return toast('Escolha uma foto.')
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))return toast('Use uma imagem JPG, PNG ou WebP.')
  if(file.size>5*1024*1024)return toast('A foto deve ter no máximo 5 MB.')
  const user=await sessionUser();if(!user)return toast('Sessão expirada. Entre novamente.')
  const button=document.querySelector('#pro4Upload');button.disabled=true;button.textContent='Enviando...'
  const ext=file.type==='image/jpeg'?'jpg':file.type.split('/')[1]
  const path=`${studentId}/${kind}/${Date.now()}-${crypto.randomUUID()}.${ext}`
  const {error:uploadError}=await supabase.storage.from(BUCKET).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type})
  if(uploadError){button.disabled=false;button.textContent='Enviar foto';return toast(uploadError.message)}
  const {error:dbError}=await supabase.from('student_media').insert({student_id:studentId,kind,storage_path:path,caption,taken_at,created_by:user.id})
  if(dbError){await supabase.storage.from(BUCKET).remove([path]);button.disabled=false;button.textContent='Enviar foto';return toast(dbError.message)}
  toast(kind==='avatar'?'Foto de perfil atualizada.':'Foto de evolução adicionada.')
  await openMedia(studentId)
  scheduleEnhance()
}

async function deleteMedia(id,path,studentId){
  if(!confirm('Excluir esta foto?'))return
  const {error}=await supabase.from('student_media').delete().eq('id',id)
  if(error)return toast(error.message)
  await supabase.storage.from(BUCKET).remove([path])
  toast('Foto excluída.')
  await openMedia(studentId)
  scheduleEnhance()
}

async function openSendNotice(studentId){
  const {data:s,error}=await supabase.from('students').select('id,name,user_id').eq('id',studentId).single()
  if(error)return toast(error.message)
  if(!s.user_id)return toast('Este aluno ainda não vinculou a conta.')
  openModal(`<div class="pro4-head"><div><span class="eyebrow">NOVO AVISO</span><h2>Enviar para ${esc(s.name)}</h2><p>O aviso aparecerá na central do aluno.</p></div><button class="icon-btn" onclick="closePro4Modal()">×</button></div>
  <label>Título</label><input id="pro4NoticeTitle" maxlength="120" placeholder="Ex.: Treino atualizado">
  <label>Mensagem</label><textarea id="pro4NoticeBody" maxlength="1000" rows="5" placeholder="Escreva uma orientação para o aluno..."></textarea>
  <div class="actions pro4-actions"><button class="btn sec" onclick="closePro4Modal()">Cancelar</button><button class="btn" id="pro4SendNotice">Enviar aviso</button></div>`)
  document.querySelector('#pro4SendNotice').onclick=()=>sendNotice(studentId)
}

async function sendNotice(studentId){
  const title=document.querySelector('#pro4NoticeTitle').value.trim(),body=document.querySelector('#pro4NoticeBody').value.trim()
  if(!title||!body)return toast('Preencha o título e a mensagem.')
  const user=await sessionUser();if(!user)return toast('Sessão expirada.')
  const button=document.querySelector('#pro4SendNotice');button.disabled=true;button.textContent='Enviando...'
  const {error}=await supabase.from('notifications').insert({student_id:studentId,title,body,created_by:user.id})
  if(error){button.disabled=false;button.textContent='Enviar aviso';return toast(error.message)}
  closePro4Modal();toast('Aviso enviado ao aluno.')
}

async function openNotifications(){
  const s=await studentSelf();if(!s)return
  const {data,error}=await supabase.from('notifications').select('*').eq('student_id',s.id).order('created_at',{ascending:false}).limit(50)
  if(error)return toast(error.message)
  openModal(`<div class="pro4-head"><div><span class="eyebrow">CENTRAL DE AVISOS</span><h2>Notificações</h2><p>Orientações enviadas pelo seu personal.</p></div><button class="icon-btn" onclick="closePro4Modal()">×</button></div>
  ${data?.length?`<div class="pro4-notice-list">${data.map(n=>`<article class="pro4-notice ${n.read_at?'':'unread'}" data-notice-id="${n.id}"><div><span>${n.read_at?'Lido':'Novo'}</span><time>${new Date(n.created_at).toLocaleString('pt-BR')}</time></div><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p></article>`).join('')}</div><button class="btn sec full" id="pro4MarkAll">Marcar tudo como lido</button>`:'<div class="pro4-empty">Nenhum aviso por enquanto.</div>'}`)
  document.querySelectorAll('[data-notice-id]').forEach(el=>el.onclick=()=>markRead([el.dataset.noticeId]))
  if(document.querySelector('#pro4MarkAll'))document.querySelector('#pro4MarkAll').onclick=()=>markRead((data||[]).filter(x=>!x.read_at).map(x=>x.id))
}

async function markRead(ids){
  if(!ids.length)return
  const {error}=await supabase.from('notifications').update({read_at:new Date().toISOString()}).in('id',ids)
  if(error)return toast(error.message)
  await openNotifications();await refreshBell()
}

async function refreshBell(){
  const s=await studentSelf();if(!s)return
  const box=document.querySelector('.user-box');if(!box)return
  let bell=document.querySelector('#pro4Bell')
  if(!bell){bell=document.createElement('button');bell.id='pro4Bell';bell.className='pro4-bell';bell.type='button';bell.title='Avisos';bell.innerHTML='🔔<span></span>';bell.onclick=openNotifications;box.insertBefore(bell,box.querySelector('#logoutBtn'))}
  const {count}=await supabase.from('notifications').select('*',{count:'exact',head:true}).eq('student_id',s.id).is('read_at',null)
  const badge=bell.querySelector('span');badge.textContent=count>99?'99+':String(count||'');badge.hidden=!count
}

async function injectAvatars(){
  const studentButtons=[...document.querySelectorAll('#content [data-workout]')]
  const ids=[...new Set(studentButtons.map(x=>x.dataset.workout).filter(Boolean))]
  if(ids.length){
    const {data}=await supabase.from('student_media').select('student_id,storage_path,created_at').eq('kind','avatar').in('student_id',ids).order('created_at',{ascending:false})
    const latest=new Map();for(const row of data||[])if(!latest.has(row.student_id))latest.set(row.student_id,row.storage_path)
    for(const btn of studentButtons){const card=btn.closest('.item-card'),avatar=card?.querySelector('.avatar.avatar-lg');const path=latest.get(btn.dataset.workout);if(avatar&&path&&!avatar.querySelector('img')){const url=await signedUrl(path);if(url)avatar.innerHTML=`<img src="${url}" alt="Foto do aluno">`}}
  }
  const s=await studentSelf();if(s){
    const {data}=await supabase.from('student_media').select('storage_path').eq('student_id',s.id).eq('kind','avatar').order('created_at',{ascending:false}).limit(1).maybeSingle()
    if(data?.storage_path){const url=await signedUrl(data.storage_path);const avatar=document.querySelector('.user-box .avatar');if(url&&avatar&&!avatar.querySelector('img'))avatar.innerHTML=`<img src="${url}" alt="Sua foto">`}
  }
}

function enhanceTrainerCards(){
  document.querySelectorAll('#content .item-card').forEach(card=>{
    const anchor=card.querySelector('[data-workout]'),actions=card.querySelector('.actions')
    if(!anchor||!actions)return
    const id=anchor.dataset.workout
    if(!actions.querySelector('[data-pro4-media]')){const b=document.createElement('button');b.className='btn ghost';b.textContent='Fotos';b.dataset.pro4Media=id;actions.appendChild(b)}
    if(!actions.querySelector('[data-pro4-notice]')){const b=document.createElement('button');b.className='btn ghost';b.textContent='Avisar';b.dataset.pro4Notice=id;actions.appendChild(b)}
  })
}

async function enhanceStudentHero(){
  const hero=document.querySelector('.student-hero');if(!hero||hero.querySelector('.pro4-student-actions'))return
  const s=await studentSelf();if(!s)return
  const actions=document.createElement('div');actions.className='pro4-student-actions';actions.innerHTML=`<button class="btn sec" data-pro4-media="${s.id}">Minhas fotos</button><button class="btn ghost" id="pro4HeroNotices">🔔 Avisos</button>`
  hero.querySelector('div')?.appendChild(actions)
  actions.querySelector('#pro4HeroNotices').onclick=openNotifications
}

function bindClicks(){
  document.querySelectorAll('[data-pro4-media]').forEach(b=>{if(!b.dataset.pro4Bound){b.dataset.pro4Bound='1';b.onclick=()=>openMedia(b.dataset.pro4Media)}})
  document.querySelectorAll('[data-pro4-notice]').forEach(b=>{if(!b.dataset.pro4Bound){b.dataset.pro4Bound='1';b.onclick=()=>openSendNotice(b.dataset.pro4Notice)}})
}

async function enhance(){
  enhanceTrainerCards();bindClicks();await enhanceStudentHero();bindClicks();await refreshBell();await injectAvatars()
}

function scheduleEnhance(){
  if(scheduled)return;scheduled=true
  setTimeout(async()=>{scheduled=false;try{await enhance()}catch(e){console.warn('FITCOACH pro4:',e)}},180)
}

new MutationObserver(scheduleEnhance).observe(document.documentElement,{subtree:true,childList:true})
window.addEventListener('focus',scheduleEnhance)
scheduleEnhance()
