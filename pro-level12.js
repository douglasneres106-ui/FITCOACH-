import './pro-level12.css'
import { supabase } from './supabase'

let scheduled=false
let profileCache=null
let atlasState={tab:'map',view:'front',muscle:'pectoralis',search:'',equipment:'all',difficulty:'all'}

const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))

const muscles={
  pectoralis:{name:'Peitoral maior',short:'Peitoral',region:'Peito',view:'front',function:'Adução horizontal e flexão do ombro; participa dos principais movimentos de empurrar.',assist:['Deltóide anterior','Tríceps braquial'],care:'Controle a descida e mantenha as escápulas estáveis em exercícios de pressão.'},
  anterior_deltoid:{name:'Deltóide anterior',short:'Ombro anterior',region:'Ombros',view:'front',function:'Flexão e rotação interna do ombro; ajuda em movimentos de empurrar acima e à frente.',assist:['Peitoral maior','Tríceps braquial'],care:'Evite compensar com excesso de extensão lombar em desenvolvimentos.'},
  lateral_deltoid:{name:'Deltóide lateral',short:'Ombro lateral',region:'Ombros',view:'front',function:'Abdução do braço, importante para elevar o braço lateralmente.',assist:['Trapézio'],care:'Use amplitude confortável e evite elevar os ombros excessivamente.'},
  posterior_deltoid:{name:'Deltóide posterior',short:'Ombro posterior',region:'Ombros',view:'back',function:'Extensão e abdução horizontal do ombro, importante em remadas e movimentos de abertura.',assist:['Romboides','Trapézio'],care:'Priorize controle e alinhamento escapular.'},
  biceps:{name:'Bíceps braquial',short:'Bíceps',region:'Braços',view:'front',function:'Flexão do cotovelo e supinação do antebraço.',assist:['Braquial','Antebraços'],care:'Evite embalo do tronco e mantenha o cotovelo estável.'},
  triceps:{name:'Tríceps braquial',short:'Tríceps',region:'Braços',view:'back',function:'Extensão do cotovelo; participa de supinos, desenvolvimentos e exercícios específicos.',assist:['Peitoral maior','Deltóide anterior'],care:'Mantenha o cotovelo alinhado e evite amplitudes dolorosas.'},
  forearms:{name:'Flexores e extensores do antebraço',short:'Antebraços',region:'Braços',view:'front',function:'Controle do punho, pegada e estabilização em puxadas, remadas e roscas.',assist:['Bíceps braquial'],care:'Mantenha punhos neutros quando o exercício pedir e progrida a carga gradualmente.'},
  latissimus:{name:'Latíssimo do dorso',short:'Dorsal',region:'Costas',view:'back',function:'Extensão, adução e rotação interna do ombro; principal músculo de muitas puxadas.',assist:['Bíceps braquial','Romboides'],care:'Evite transformar toda puxada em movimento de braço; conduza o cotovelo e controle as escápulas.'},
  trapezius:{name:'Trapézio',short:'Trapézio',region:'Costas',view:'back',function:'Elevação, retração e rotação da escápula, dependendo das fibras envolvidas.',assist:['Romboides','Deltóide posterior'],care:'Não force o pescoço; mantenha cabeça e coluna cervical neutras.'},
  rhomboids:{name:'Romboides',short:'Romboides',region:'Costas',view:'back',function:'Retração e estabilização das escápulas, muito solicitados em remadas.',assist:['Trapézio','Deltóide posterior'],care:'Evite projetar os ombros para frente no final das repetições.'},
  rectus_abdominis:{name:'Reto abdominal',short:'Abdômen',region:'Core',view:'front',function:'Flexão do tronco e controle da posição da pelve e caixa torácica.',assist:['Oblíquos'],care:'Evite puxar o pescoço e mantenha respiração controlada.'},
  obliques:{name:'Oblíquos',short:'Oblíquos',region:'Core',view:'front',function:'Rotação, inclinação lateral e estabilidade do tronco.',assist:['Reto abdominal','Eretores da coluna'],care:'Priorize estabilidade antes de aumentar carga em rotações.'},
  erector_spinae:{name:'Eretores da coluna',short:'Lombar',region:'Costas',view:'back',function:'Extensão e estabilização da coluna durante agachamentos, levantamentos e remadas.',assist:['Glúteos','Posteriores de coxa'],care:'Mantenha a coluna organizada e use carga compatível com a técnica.'},
  glutes:{name:'Glúteos',short:'Glúteos',region:'Pernas',view:'back',function:'Extensão e estabilização do quadril; fundamentais em agachamentos, avanços e elevação pélvica.',assist:['Posteriores de coxa','Quadríceps'],care:'Evite perder o alinhamento do joelho e da pelve.'},
  quadriceps:{name:'Quadríceps',short:'Quadríceps',region:'Pernas',view:'front',function:'Extensão do joelho; participa fortemente de agachamentos, leg press, avanços e extensora.',assist:['Glúteos'],care:'Controle a amplitude e mantenha joelho alinhado com a direção do pé.'},
  hamstrings:{name:'Posteriores de coxa',short:'Posteriores',region:'Pernas',view:'back',function:'Flexão do joelho e extensão do quadril.',assist:['Glúteos','Eretores da coluna'],care:'Mantenha tensão controlada e evite arredondar a lombar em movimentos de hinge.'},
  calves:{name:'Gastrocnêmio e sóleo',short:'Panturrilhas',region:'Pernas',view:'back',function:'Flexão plantar do tornozelo, importante para impulsão e estabilidade.',assist:['Tibial posterior'],care:'Use amplitude completa confortável e controle o retorno.'},
  tibialis_anterior:{name:'Tibial anterior',short:'Tibial anterior',region:'Pernas',view:'front',function:'Dorsiflexão do tornozelo e controle do pé durante a marcha.',assist:['Extensores dos dedos'],care:'Progrida volume gradualmente para evitar excesso de sobrecarga na canela.'}
}

const exercise=(name,primary,secondary,equipment,difficulty,pattern,where,steps,mistakes,tips,variations,reps='8-12')=>({name,primary,secondary,equipment,difficulty,pattern,where,steps,mistakes,tips,variations,reps})

const exercises=[
  exercise('Supino reto','pectoralis',['triceps','anterior_deltoid'],'Barra','Intermediário','Empurrar horizontal','Principalmente no peitoral, com ajuda do tríceps e da parte anterior do ombro.',['Pés firmes e escápulas apoiadas.','Desça a barra com controle até uma amplitude confortável.','Empurre mantendo punhos e cotovelos organizados.'],['Abrir demais os cotovelos','Perder estabilidade das escápulas','Usar carga que quebra a técnica'],'Mantenha o trajeto repetível e não transforme a amplitude em competição.',['Supino com halteres','Supino inclinado com halteres','Flexão de braços']),
  exercise('Supino inclinado com halteres','pectoralis',['anterior_deltoid','triceps'],'Halteres','Intermediário','Empurrar inclinado','Peitoral, com maior participação da região clavicular e deltóide anterior.',['Ajuste o banco em inclinação moderada.','Desça os halteres ao lado do tórax com controle.','Empurre sem perder apoio das escápulas.'],['Banco inclinado demais','Bater os halteres','Punhos excessivamente dobrados'],'Use uma inclinação moderada para manter o foco no peitoral.',['Supino reto','Supino com halteres']),
  exercise('Supino com halteres','pectoralis',['triceps','anterior_deltoid'],'Halteres','Iniciante','Empurrar horizontal','Peitoral, tríceps e deltóide anterior.',['Apoie bem os pés e as escápulas.','Desça os halteres de forma simétrica.','Empurre até perto da extensão completa.'],['Descer sem controle','Perder alinhamento dos punhos'],'A vantagem dos halteres é permitir ajuste individual de trajetória.',['Supino reto','Flexão de braços']),
  exercise('Crucifixo na máquina','pectoralis',['anterior_deltoid'],'Máquina','Iniciante','Adução horizontal','Peitoral, com pouca participação do tríceps.',['Ajuste o banco para alinhar ombros e pegadores.','Feche os braços sem perder contato com o encosto.','Retorne devagar.'],['Excesso de amplitude','Encolher os ombros'],'Pense em aproximar os braços usando o peitoral, não em empurrar com as mãos.',['Crossover','Crucifixo com halteres']),
  exercise('Flexão de braços','pectoralis',['triceps','anterior_deltoid'],'Peso corporal','Iniciante','Empurrar horizontal','Peitoral, tríceps e ombro anterior.',['Mãos um pouco além da largura dos ombros.','Corpo alinhado da cabeça aos pés.','Desça controlando e empurre o chão.'],['Quadril caindo','Cotovelos muito abertos'],'Ajuste a dificuldade apoiando joelhos ou elevando as mãos.',['Supino reto','Flexão inclinada']),
  exercise('Desenvolvimento com halteres','anterior_deltoid',['lateral_deltoid','triceps'],'Halteres','Intermediário','Empurrar vertical','Ombros, principalmente deltóide anterior e lateral, com tríceps.',['Mantenha tronco firme.','Inicie com halteres ao lado dos ombros.','Empurre acima da cabeça sem exagerar a extensão lombar.'],['Arquear demais a lombar','Descer além da amplitude confortável'],'Use carga que permita controlar toda a repetição.',['Desenvolvimento na máquina','Arnold press']),
  exercise('Elevação lateral','lateral_deltoid',['trapezius'],'Halteres','Iniciante','Abdução do ombro','Principalmente na lateral dos ombros.',['Cotovelos levemente flexionados.','Eleve os braços lateralmente.','Desça lentamente.'],['Usar balanço','Encolher muito os ombros'],'Controle o movimento; mais carga não significa mais estímulo.',['Elevação lateral na polia','Máquina lateral']),
  exercise('Crucifixo inverso','posterior_deltoid',['rhomboids','trapezius'],'Máquina','Iniciante','Abdução horizontal','Parte posterior dos ombros e região entre as escápulas.',['Apoie o peito.','Abra os braços mantendo leve flexão dos cotovelos.','Controle o retorno.'],['Projetar a cabeça','Usar impulso'],'Pense em abrir os braços sem elevar os ombros.',['Face pull','Crucifixo inverso com halteres']),
  exercise('Puxada alta','latissimus',['biceps','rhomboids'],'Polia','Iniciante','Puxar vertical','Dorsal, com bíceps e músculos das escápulas auxiliando.',['Peito alto e tronco estável.','Puxe a barra em direção à parte superior do peito.','Retorne até alongar sem perder controle.'],['Puxar atrás da cabeça','Balançar o tronco'],'Conduza o movimento pelos cotovelos.',['Barra fixa','Pulldown']),
  exercise('Pulldown','latissimus',['biceps'],'Polia','Intermediário','Extensão do ombro','Dorsal, especialmente ao levar os braços estendidos para baixo.',['Mantenha leve inclinação do tronco.','Braços quase estendidos.','Puxe a barra até as coxas e retorne com controle.'],['Transformar em tríceps','Arredondar a lombar'],'Use amplitude que preserve tensão no dorsal.',['Puxada alta']),
  exercise('Remada baixa','latissimus',['rhomboids','biceps','posterior_deltoid'],'Polia','Iniciante','Puxar horizontal','Costas, romboides, deltóide posterior e bíceps.',['Sente-se estável.','Puxe a alça em direção ao tronco.','Aproxime as escápulas sem exagerar.'],['Balançar o tronco','Arredondar a coluna'],'Controle a volta e deixe o ombro avançar apenas dentro de uma amplitude segura.',['Remada unilateral','Remada curvada']),
  exercise('Remada unilateral','latissimus',['rhomboids','biceps','posterior_deltoid'],'Halteres','Intermediário','Puxar horizontal','Dorsal e região média das costas, com bíceps.',['Apoie o corpo de forma estável.','Puxe o halter levando o cotovelo para trás.','Desça controlando.'],['Girar excessivamente o tronco','Encolher o ombro'],'Mantenha o pescoço neutro.',['Remada baixa','Remada curvada']),
  exercise('Remada curvada','latissimus',['rhomboids','biceps','erector_spinae'],'Barra','Avançado','Puxar horizontal','Costas e bíceps, com lombar estabilizando o tronco.',['Faça um hinge de quadril estável.','Mantenha coluna neutra.','Puxe a barra em direção ao abdômen.'],['Arredondar a lombar','Usar impulso excessivo'],'Domine o hinge antes de aumentar carga.',['Remada baixa','Remada unilateral']),
  exercise('Rosca direta','biceps',['forearms'],'Barra','Iniciante','Flexão do cotovelo','Bíceps e flexores do antebraço.',['Cotovelos próximos ao corpo.','Flexione sem mover excessivamente os ombros.','Desça controlando.'],['Balançar o tronco','Levar cotovelos muito à frente'],'Use amplitude controlada e punhos firmes.',['Rosca martelo','Rosca alternada']),
  exercise('Rosca martelo','biceps',['forearms'],'Halteres','Iniciante','Flexão do cotovelo','Bíceps, braquial e antebraços.',['Pegada neutra.','Flexione os cotovelos mantendo braços próximos ao corpo.','Retorne devagar.'],['Usar impulso','Dobrar excessivamente os punhos'],'Ótima opção para variar a pegada sem abandonar controle.',['Rosca direta']),
  exercise('Tríceps na polia','triceps',[],'Polia','Iniciante','Extensão do cotovelo','Parte posterior do braço, principalmente tríceps.',['Cotovelos junto ao tronco.','Estenda os cotovelos até perto do final.','Retorne sem deixar o braço inteiro subir.'],['Abrir os cotovelos','Usar o tronco para empurrar'],'Mantenha ombros relaxados.',['Tríceps francês','Tríceps testa']),
  exercise('Tríceps francês','triceps',['anterior_deltoid'],'Halteres','Intermediário','Extensão do cotovelo acima da cabeça','Tríceps, com maior alongamento da cabeça longa.',['Mantenha tronco firme.','Desça o halter atrás da cabeça flexionando os cotovelos.','Estenda sem abrir excessivamente os cotovelos.'],['Arquear a lombar','Abrir muito os cotovelos'],'Escolha uma amplitude sem desconforto no ombro.',['Tríceps na polia','Tríceps testa']),
  exercise('Agachamento livre','quadriceps',['glutes','hamstrings','erector_spinae'],'Barra','Avançado','Agachar','Quadríceps e glúteos, com posteriores e tronco estabilizando.',['Pés firmes e tronco organizado.','Desça flexionando quadril e joelhos.','Suba mantendo joelhos alinhados com os pés.'],['Joelhos colapsando para dentro','Perder posição da coluna','Usar amplitude sem controle'],'A amplitude deve respeitar mobilidade, técnica e objetivo.',['Agachamento goblet','Leg press']),
  exercise('Agachamento goblet','quadriceps',['glutes','hamstrings'],'Halter','Iniciante','Agachar','Quadríceps e glúteos.',['Segure o peso próximo ao peito.','Desça mantendo o tronco estável.','Suba empurrando o chão.'],['Perder equilíbrio','Joelhos entrando'],'Boa variação para aprender padrão de agachamento.',['Agachamento livre','Agachamento sumô']),
  exercise('Agachamento sumô','glutes',['quadriceps','hamstrings'],'Barra/Halter','Intermediário','Agachar','Glúteos e adutores, com quadríceps.',['Use base mais aberta.','Mantenha joelhos apontando na direção dos pés.','Desça e suba com controle.'],['Base larga demais','Joelhos colapsando'],'Ajuste a abertura de acordo com sua mobilidade.',['Agachamento goblet']),
  exercise('Leg press','quadriceps',['glutes','hamstrings'],'Máquina','Iniciante','Empurrar com pernas','Quadríceps e glúteos.',['Apoie totalmente as costas.','Desça a plataforma dentro de amplitude controlável.','Empurre sem travar agressivamente os joelhos.'],['Descolar a pelve do banco','Joelhos entrando'],'Posição dos pés altera conforto e participação relativa, não elimina músculos.',['Agachamento livre','Afundo com halteres']),
  exercise('Afundo com halteres','quadriceps',['glutes','hamstrings'],'Halteres','Intermediário','Avanço unilateral','Quadríceps e glúteos, com forte demanda de estabilidade.',['Dê um passo confortável.','Desça mantendo ambos os joelhos controlados.','Empurre o chão para retornar.'],['Passo curto demais','Perder equilíbrio'],'Comece sem carga se ainda estiver aprendendo o padrão.',['Passada alternada','Agachamento búlgaro']),
  exercise('Passada alternada','quadriceps',['glutes','hamstrings'],'Peso corporal/Halteres','Intermediário','Avanço unilateral','Quadríceps e glúteos.',['Alterne as pernas com passos estáveis.','Controle a descida.','Mantenha tronco organizado.'],['Passos instáveis','Joelho colapsando'],'Faça primeiro de forma estacionária se o equilíbrio limitar.',['Afundo com halteres']),
  exercise('Cadeira extensora','quadriceps',[],'Máquina','Iniciante','Extensão do joelho','Quadríceps de forma mais isolada.',['Ajuste o eixo da máquina ao joelho.','Estenda os joelhos com controle.','Retorne lentamente.'],['Chutar a carga','Descolar o quadril'],'Evite usar impulso no final da repetição.',['Leg press']),
  exercise('Levantamento terra romeno','hamstrings',['glutes','erector_spinae'],'Barra/Halteres','Avançado','Hinge de quadril','Posteriores de coxa e glúteos, com lombar estabilizando.',['Joelhos levemente flexionados.','Leve o quadril para trás mantendo coluna neutra.','Suba estendendo o quadril.'],['Arredondar a lombar','Transformar em agachamento'],'Pare a descida quando perder a posição ou a tensão adequada.',['Mesa flexora','Elevação pélvica']),
  exercise('Mesa flexora','hamstrings',['calves'],'Máquina','Iniciante','Flexão do joelho','Posteriores de coxa.',['Ajuste o eixo ao joelho.','Flexione os joelhos sem levantar o quadril.','Retorne controlando.'],['Levantar a pelve','Bater a carga'],'Mantenha o abdômen firme contra o banco.',['Cadeira flexora']),
  exercise('Cadeira flexora','hamstrings',['calves'],'Máquina','Iniciante','Flexão do joelho','Posteriores de coxa.',['Ajuste encosto e rolo.','Flexione os joelhos.','Retorne lentamente.'],['Usar impulso','Perder ajuste do quadril'],'Controle principalmente a fase de retorno.',['Mesa flexora']),
  exercise('Elevação pélvica','glutes',['hamstrings'],'Barra/Máquina','Intermediário','Extensão do quadril','Glúteos, com posteriores de coxa auxiliando.',['Apoie a parte alta das costas.','Mantenha pés estáveis.','Eleve o quadril sem hiperestender a lombar.'],['Subir pela lombar','Pés muito longe'],'Finalize com glúteos contraídos e costelas controladas.',['Ponte de glúteos','Agachamento sumô']),
  exercise('Panturrilha em pé','calves',[],'Máquina/Peso corporal','Iniciante','Flexão plantar','Gastrocnêmio e sóleo.',['Apoie a base do pé.','Suba os calcanhares.','Desça lentamente até amplitude confortável.'],['Quicar no final','Fazer repetições muito curtas'],'Use pausa breve no topo e controle a descida.',['Panturrilha sentada']),
  exercise('Panturrilha sentada','calves',[],'Máquina','Iniciante','Flexão plantar','Sóleo e gastrocnêmio.',['Ajuste o apoio sobre as coxas.','Eleve os calcanhares.','Desça controlando.'],['Usar rebote','Amplitude muito curta'],'Faça repetições consistentes.',['Panturrilha em pé']),
  exercise('Prancha abdominal','rectus_abdominis',['obliques'],'Peso corporal','Iniciante','Anti-extensão do tronco','Abdômen e oblíquos estabilizando o tronco.',['Apoie antebraços e pés.','Alinhe cabeça, tronco e quadril.','Respire mantendo tensão abdominal.'],['Quadril muito alto ou baixo','Prender a respiração'],'Qualidade da posição é mais importante que duração.',['Prancha lateral'],'30-45s'),
  exercise('Abdominal infra','rectus_abdominis',['obliques'],'Peso corporal','Intermediário','Flexão do tronco/pelve','Reto abdominal, especialmente no controle da pelve.',['Mantenha lombar controlada.','Eleve a pelve ou pernas sem impulso.','Retorne lentamente.'],['Balançar as pernas','Arquear a lombar'],'Reduza a amplitude se perder o controle lombar.',['Crunch','Prancha abdominal']),
  exercise('Prancha lateral','obliques',['rectus_abdominis','glutes'],'Peso corporal','Intermediário','Anti-inclinação lateral','Oblíquos e estabilizadores do quadril.',['Apoie o antebraço.','Eleve o quadril e alinhe o corpo.','Mantenha respiração regular.'],['Quadril caindo','Ombro comprimido'],'Comece com joelhos apoiados se necessário.',['Prancha abdominal'],'30-40s')
]

function muscleName(id){return muscles[id]?.name||id}
function exerciseMatches(ex){
  const q=atlasState.search.trim().toLowerCase()
  const hay=[ex.name,muscleName(ex.primary),...ex.secondary.map(muscleName),ex.equipment,ex.pattern].join(' ').toLowerCase()
  return (!q||hay.includes(q))&&(atlasState.equipment==='all'||ex.equipment===atlasState.equipment)&&(atlasState.difficulty==='all'||ex.difficulty===atlasState.difficulty)
}
function exercisesForMuscle(id){return exercises.filter(ex=>ex.primary===id||ex.secondary.includes(id))}

async function getContext(){
  const {data:{session}}=await supabase.auth.getSession()
  if(!session)return null
  if(!profileCache){
    const {data}=await supabase.from('profiles').select('id,role,full_name').eq('id',session.user.id).maybeSingle()
    profileCache=data||null
  }
  return {session,profile:profileCache}
}

function toast(message,type='ok'){
  document.querySelector('#pro12Toast')?.remove()
  const el=document.createElement('div');el.id='pro12Toast';el.className=`pro12-toast ${type}`;el.textContent=message
  document.body.appendChild(el);setTimeout(()=>el.remove(),3400)
}

function openModal(html){
  document.querySelector('#pro12Modal')?.remove()
  const wrap=document.createElement('div');wrap.id='pro12Modal';wrap.className='pro12-modal';wrap.innerHTML=`<div class="pro12-modal-card">${html}</div>`
  wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};document.body.appendChild(wrap)
}
window.closePro12Modal=()=>document.querySelector('#pro12Modal')?.remove()

function bodySvg(view,selected){
  const active=id=>selected===id?' active':''
  const front=`<svg class="pro12-body-svg" viewBox="0 0 360 640" role="img" aria-label="Mapa muscular frontal">
    <g class="body-base"><circle cx="180" cy="58" r="38"/><path d="M145 104 Q180 88 215 104 L238 220 Q225 292 214 330 L208 420 L235 610 L196 610 L178 438 L164 610 L125 610 L151 420 L145 330 Q130 285 122 220Z"/><path d="M132 116 L92 140 L56 290 L78 297 L122 188Z"/><path d="M228 116 L268 140 L304 290 L282 297 L238 188Z"/></g>
    <g class="muscle-regions">
      <ellipse class="muscle${active('anterior_deltoid')}" data-muscle="anterior_deltoid" cx="139" cy="132" rx="25" ry="25"/><ellipse class="muscle${active('anterior_deltoid')}" data-muscle="anterior_deltoid" cx="221" cy="132" rx="25" ry="25"/>
      <ellipse class="muscle${active('lateral_deltoid')}" data-muscle="lateral_deltoid" cx="126" cy="140" rx="13" ry="25"/><ellipse class="muscle${active('lateral_deltoid')}" data-muscle="lateral_deltoid" cx="234" cy="140" rx="13" ry="25"/>
      <path class="muscle${active('pectoralis')}" data-muscle="pectoralis" d="M148 140 Q180 126 180 174 Q153 181 143 162Z"/><path class="muscle${active('pectoralis')}" data-muscle="pectoralis" d="M212 140 Q180 126 180 174 Q207 181 217 162Z"/>
      <ellipse class="muscle${active('biceps')}" data-muscle="biceps" cx="103" cy="195" rx="16" ry="37"/><ellipse class="muscle${active('biceps')}" data-muscle="biceps" cx="257" cy="195" rx="16" ry="37"/>
      <ellipse class="muscle${active('forearms')}" data-muscle="forearms" cx="76" cy="257" rx="12" ry="38" transform="rotate(12 76 257)"/><ellipse class="muscle${active('forearms')}" data-muscle="forearms" cx="284" cy="257" rx="12" ry="38" transform="rotate(-12 284 257)"/>
      <rect class="muscle${active('rectus_abdominis')}" data-muscle="rectus_abdominis" x="159" y="185" width="42" height="116" rx="18"/><path class="muscle${active('obliques')}" data-muscle="obliques" d="M146 184 Q154 236 146 294 L126 273 L133 192Z"/><path class="muscle${active('obliques')}" data-muscle="obliques" d="M214 184 Q206 236 214 294 L234 273 L227 192Z"/>
      <path class="muscle${active('quadriceps')}" data-muscle="quadriceps" d="M145 333 Q163 315 176 337 L168 440 Q150 462 135 430Z"/><path class="muscle${active('quadriceps')}" data-muscle="quadriceps" d="M215 333 Q197 315 184 337 L192 440 Q210 462 225 430Z"/>
      <path class="muscle${active('tibialis_anterior')}" data-muscle="tibialis_anterior" d="M145 450 L162 448 L151 584 L136 584Z"/><path class="muscle${active('tibialis_anterior')}" data-muscle="tibialis_anterior" d="M215 450 L198 448 L209 584 L224 584Z"/>
    </g></svg>`
  const back=`<svg class="pro12-body-svg" viewBox="0 0 360 640" role="img" aria-label="Mapa muscular posterior">
    <g class="body-base"><circle cx="180" cy="58" r="38"/><path d="M145 104 Q180 88 215 104 L238 220 Q225 292 214 330 L208 420 L235 610 L196 610 L178 438 L164 610 L125 610 L151 420 L145 330 Q130 285 122 220Z"/><path d="M132 116 L92 140 L56 290 L78 297 L122 188Z"/><path d="M228 116 L268 140 L304 290 L282 297 L238 188Z"/></g>
    <g class="muscle-regions">
      <path class="muscle${active('trapezius')}" data-muscle="trapezius" d="M151 106 L180 91 L209 106 L199 169 L161 169Z"/>
      <ellipse class="muscle${active('posterior_deltoid')}" data-muscle="posterior_deltoid" cx="132" cy="139" rx="24" ry="25"/><ellipse class="muscle${active('posterior_deltoid')}" data-muscle="posterior_deltoid" cx="228" cy="139" rx="24" ry="25"/>
      <path class="muscle${active('rhomboids')}" data-muscle="rhomboids" d="M154 150 Q180 137 206 150 L198 202 Q180 190 162 202Z"/>
      <path class="muscle${active('latissimus')}" data-muscle="latissimus" d="M145 166 Q158 190 158 252 L130 275 L126 190Z"/><path class="muscle${active('latissimus')}" data-muscle="latissimus" d="M215 166 Q202 190 202 252 L230 275 L234 190Z"/>
      <ellipse class="muscle${active('triceps')}" data-muscle="triceps" cx="103" cy="194" rx="16" ry="39"/><ellipse class="muscle${active('triceps')}" data-muscle="triceps" cx="257" cy="194" rx="16" ry="39"/>
      <ellipse class="muscle${active('forearms')}" data-muscle="forearms" cx="76" cy="257" rx="12" ry="38" transform="rotate(12 76 257)"/><ellipse class="muscle${active('forearms')}" data-muscle="forearms" cx="284" cy="257" rx="12" ry="38" transform="rotate(-12 284 257)"/>
      <rect class="muscle${active('erector_spinae')}" data-muscle="erector_spinae" x="164" y="192" width="32" height="105" rx="15"/>
      <path class="muscle${active('glutes')}" data-muscle="glutes" d="M139 305 Q160 284 179 309 L175 367 Q151 382 132 359Z"/><path class="muscle${active('glutes')}" data-muscle="glutes" d="M221 305 Q200 284 181 309 L185 367 Q209 382 228 359Z"/>
      <path class="muscle${active('hamstrings')}" data-muscle="hamstrings" d="M139 372 Q158 355 173 372 L165 458 Q146 469 136 445Z"/><path class="muscle${active('hamstrings')}" data-muscle="hamstrings" d="M221 372 Q202 355 187 372 L195 458 Q214 469 224 445Z"/>
      <path class="muscle${active('calves')}" data-muscle="calves" d="M137 463 Q151 450 164 470 L157 552 Q145 568 133 542Z"/><path class="muscle${active('calves')}" data-muscle="calves" d="M223 463 Q209 450 196 470 L203 552 Q215 568 227 542Z"/>
    </g></svg>`
  return view==='back'?back:front
}

function musclePanel(id){
  const m=muscles[id]||muscles.pectoralis
  const linked=exercisesForMuscle(id)
  const primary=linked.filter(ex=>ex.primary===id)
  const secondary=linked.filter(ex=>ex.secondary.includes(id))
  return `<aside class="pro12-muscle-panel">
    <div class="pro12-muscle-title"><span>${esc(m.region)}</span><h2>${esc(m.name)}</h2><p>${esc(m.function)}</p></div>
    <div class="pro12-kpis"><div><strong>${primary.length}</strong><span>principais</span></div><div><strong>${secondary.length}</strong><span>auxiliares</span></div></div>
    <div class="pro12-info"><span>ATUA COM</span><p>${m.assist.map(esc).join(' • ')}</p></div>
    <div class="pro12-info"><span>CUIDADO DE EXECUÇÃO</span><p>${esc(m.care)}</p></div>
    <div class="pro12-exercise-mini"><span>EXERCÍCIOS RELACIONADOS</span>${linked.slice(0,6).map(ex=>`<button data-exercise="${esc(ex.name)}"><b>${esc(ex.name)}</b><small>${ex.primary===id?'Principal':'Secundário'} • ${esc(ex.equipment)}</small></button>`).join('')||'<p>Nenhum exercício cadastrado.</p>'}</div>
    <button class="btn full" id="pro12SeeMuscleExercises">Ver todos os exercícios</button>
  </aside>`
}

function mapPage(){
  const current=muscles[atlasState.muscle]||muscles.pectoralis
  const viewMuscles=Object.entries(muscles).filter(([,m])=>m.view===atlasState.view)
  return `<div class="pro12-map-layout">
    <section class="pro12-map-card">
      <div class="pro12-map-toolbar"><div class="pro12-segment"><button class="${atlasState.view==='front'?'active':''}" data-view="front">Frontal</button><button class="${atlasState.view==='back'?'active':''}" data-view="back">Posterior</button></div><span>Toque em uma área do corpo</span></div>
      <div class="pro12-anatomy">${bodySvg(atlasState.view,atlasState.muscle)}<div class="pro12-map-labels">${viewMuscles.map(([id,m])=>`<button class="${id===atlasState.muscle?'active':''}" data-muscle-label="${id}"><span></span>${esc(m.short)}</button>`).join('')}</div></div>
      <div class="pro12-map-caption"><b>${esc(current.name)}</b><span>${esc(current.region)} • ${exercisesForMuscle(atlasState.muscle).length} exercícios relacionados</span></div>
    </section>
    ${musclePanel(atlasState.muscle)}
  </div>`
}

function libraryPage(){
  const filtered=exercises.filter(exerciseMatches)
  const equipment=[...new Set(exercises.map(e=>e.equipment))].sort()
  return `<section class="pro12-library-controls">
      <div class="pro12-search"><span>⌕</span><input id="pro12Search" value="${esc(atlasState.search)}" placeholder="Buscar exercício, músculo ou equipamento"></div>
      <select id="pro12Equipment"><option value="all">Todos os equipamentos</option>${equipment.map(v=>`<option ${atlasState.equipment===v?'selected':''}>${esc(v)}</option>`).join('')}</select>
      <select id="pro12Difficulty"><option value="all">Todas as dificuldades</option>${['Iniciante','Intermediário','Avançado'].map(v=>`<option ${atlasState.difficulty===v?'selected':''}>${v}</option>`).join('')}</select>
    </section>
    <div class="pro12-library-meta"><strong>${filtered.length} exercícios</strong><span>Principal = maior participação no movimento • Secundário = músculo auxiliar</span></div>
    <div class="pro12-exercise-grid">${filtered.length?filtered.map(ex=>exerciseCard(ex)).join(''):`<div class="pro12-empty"><b>Nenhum exercício encontrado</b><span>Tente remover algum filtro.</span></div>`}</div>`
}

function exerciseCard(ex){
  return `<article class="pro12-ex-card" data-open-exercise="${esc(ex.name)}"><div class="pro12-ex-top"><span>${esc(ex.pattern)}</span><b>${esc(ex.difficulty)}</b></div><h3>${esc(ex.name)}</h3><p>${esc(ex.where)}</p><div class="pro12-muscle-tags"><span class="primary">● ${esc(muscleName(ex.primary))}</span>${ex.secondary.slice(0,2).map(id=>`<span>○ ${esc(muscleName(id))}</span>`).join('')}</div><div class="pro12-ex-bottom"><span>${esc(ex.equipment)}</span><button>Ver detalhes →</button></div></article>`
}

async function renderAtlas(){
  const content=document.querySelector('#content');if(!content)return
  const ctx=await getContext();if(!ctx?.session)return
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'))
  document.querySelector('#pro12Nav')?.classList.add('active')
  content.innerHTML=`<section class="pro12-page">
    <header class="pro12-hero"><div><span class="eyebrow">FITCOACH • ATLAS MUSCULAR</span><h1>Entenda cada movimento.</h1><p>Explore os músculos e veja exatamente quais regiões cada exercício trabalha.</p></div><div class="pro12-hero-mark"><span>18</span><small>grupos musculares</small></div></header>
    <div class="pro12-tabs"><button class="${atlasState.tab==='map'?'active':''}" data-atlas-tab="map">Mapa muscular</button><button class="${atlasState.tab==='library'?'active':''}" data-atlas-tab="library">Exercícios</button></div>
    ${atlasState.tab==='map'?mapPage():libraryPage()}
    <div class="pro12-disclaimer">Conteúdo educativo para orientação de treino. Dor, lesão ou sintomas exigem avaliação adequada; o Atlas não substitui avaliação profissional ou clínica.</div>
  </section>`
  bindAtlas(ctx)
}

function bindAtlas(ctx){
  document.querySelectorAll('[data-atlas-tab]').forEach(btn=>btn.onclick=()=>{atlasState.tab=btn.dataset.atlasTab;renderAtlas()})
  document.querySelectorAll('[data-view]').forEach(btn=>btn.onclick=()=>{atlasState.view=btn.dataset.view;const first=Object.entries(muscles).find(([,m])=>m.view===atlasState.view)?.[0];if(first)atlasState.muscle=first;renderAtlas()})
  document.querySelectorAll('[data-muscle],[data-muscle-label]').forEach(el=>el.onclick=()=>{atlasState.muscle=el.dataset.muscle||el.dataset.muscleLabel;renderAtlas()})
  document.querySelectorAll('[data-exercise],[data-open-exercise]').forEach(el=>el.onclick=()=>openExerciseDetail(el.dataset.exercise||el.dataset.openExercise,ctx))
  document.querySelector('#pro12SeeMuscleExercises')?.addEventListener('click',()=>{atlasState.tab='library';atlasState.search=muscles[atlasState.muscle]?.name||'';atlasState.equipment='all';atlasState.difficulty='all';renderAtlas()})
  const search=document.querySelector('#pro12Search');if(search)search.oninput=e=>{atlasState.search=e.target.value;clearTimeout(search._timer);search._timer=setTimeout(renderAtlas,160)}
  document.querySelector('#pro12Equipment')?.addEventListener('change',e=>{atlasState.equipment=e.target.value;renderAtlas()})
  document.querySelector('#pro12Difficulty')?.addEventListener('change',e=>{atlasState.difficulty=e.target.value;renderAtlas()})
}

function openExerciseDetail(name,ctx){
  const ex=exercises.find(e=>e.name===name);if(!ex)return
  openModal(`<div class="pro12-modal-head"><div><span class="eyebrow">ANATOMIA DO EXERCÍCIO</span><h2>${esc(ex.name)}</h2><p>${esc(ex.pattern)} • ${esc(ex.equipment)} • ${esc(ex.difficulty)}</p></div><button class="icon-btn" onclick="closePro12Modal()">×</button></div>
    <div class="pro12-detail-hero"><div class="pro12-detail-muscle"><span>PRINCIPAL</span><strong>${esc(muscleName(ex.primary))}</strong><button data-jump-muscle="${ex.primary}">Ver no mapa →</button></div><div><span>ONDE VOCÊ VAI SENTIR</span><p>${esc(ex.where)}</p></div></div>
    <div class="pro12-secondary"><span>MÚSCULOS SECUNDÁRIOS</span><div>${ex.secondary.length?ex.secondary.map(id=>`<button data-jump-muscle="${id}">${esc(muscleName(id))}</button>`).join(''):'<em>Sem músculo secundário relevante cadastrado.</em>'}</div></div>
    <div class="pro12-detail-grid"><section><span class="eyebrow">EXECUÇÃO</span><ol>${ex.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol></section><section><span class="eyebrow">ERROS COMUNS</span><ul>${ex.mistakes.map(item=>`<li>${esc(item)}</li>`).join('')}</ul></section></div>
    <div class="pro12-tip"><span>✓ DICA FITCOACH</span><p>${esc(ex.tips)}</p></div>
    <div class="pro12-variations"><span>VARIAÇÕES</span><p>${ex.variations.map(esc).join(' • ')}</p></div>
    <div class="actions pro12-actions"><button class="btn sec" onclick="closePro12Modal()">Fechar</button>${ctx?.profile?.role==='trainer'?`<button class="btn" id="pro12AddWorkout">+ Adicionar ao treino</button>`:''}</div>`)
  document.querySelectorAll('[data-jump-muscle]').forEach(btn=>btn.onclick=()=>{atlasState.muscle=btn.dataset.jumpMuscle;atlasState.view=muscles[atlasState.muscle]?.view||'front';atlasState.tab='map';closePro12Modal();renderAtlas()})
  document.querySelector('#pro12AddWorkout')?.addEventListener('click',()=>openAddToWorkout(ex,ctx))
}

async function openAddToWorkout(ex,ctx){
  const [{data:students,error:sErr},{data:workouts,error:wErr}]=await Promise.all([
    supabase.from('students').select('id,name').eq('trainer_id',ctx.session.user.id).order('name'),
    supabase.from('workouts').select('id,name,student_id').eq('trainer_id',ctx.session.user.id).order('created_at',{ascending:false})
  ])
  if(sErr||wErr)return toast((sErr||wErr).message,'error')
  if(!workouts?.length)return toast('Crie uma ficha de treino antes de adicionar o exercício.','error')
  const names=Object.fromEntries((students||[]).map(s=>[s.id,s.name]))
  openModal(`<div class="pro12-modal-head"><div><span class="eyebrow">ADICIONAR AO TREINO</span><h2>${esc(ex.name)}</h2><p>${esc(muscleName(ex.primary))} • ajuste a prescrição antes de salvar.</p></div><button class="icon-btn" onclick="closePro12Modal()">×</button></div>
    <label>Ficha de treino</label><select id="pro12WorkoutSelect">${workouts.map(w=>`<option value="${w.id}">${esc(names[w.student_id]||'Aluno')} • ${esc(w.name)}</option>`).join('')}</select>
    <div class="pro12-prescription"><div><label>Séries</label><input id="pro12Sets" type="number" min="1" max="8" value="3"></div><div><label>Repetições</label><input id="pro12Reps" value="${esc(ex.reps)}"></div><div><label>Descanso (s)</label><input id="pro12Rest" type="number" min="15" max="300" value="60"></div></div>
    <div class="actions pro12-actions"><button class="btn sec" onclick="closePro12Modal()">Cancelar</button><button class="btn" id="pro12ConfirmAdd">Adicionar exercício</button></div>`)
  document.querySelector('#pro12ConfirmAdd').onclick=()=>saveExerciseToWorkout(ex)
}

async function saveExerciseToWorkout(ex){
  const workoutId=document.querySelector('#pro12WorkoutSelect')?.value
  const sets=Number(document.querySelector('#pro12Sets')?.value||3)
  const reps=document.querySelector('#pro12Reps')?.value.trim()||'8-12'
  const rest=Number(document.querySelector('#pro12Rest')?.value||60)
  if(!workoutId)return
  const button=document.querySelector('#pro12ConfirmAdd');button.disabled=true;button.textContent='Adicionando...'
  const {data:last,error:lastError}=await supabase.from('workout_exercises').select('sort_order').eq('workout_id',workoutId).order('sort_order',{ascending:false}).limit(1)
  if(lastError){button.disabled=false;button.textContent='Adicionar exercício';return toast(lastError.message,'error')}
  const sort=(last?.[0]?.sort_order??-1)+1
  const {error}=await supabase.from('workout_exercises').insert({workout_id:workoutId,exercise_name:ex.name,sets,reps,load:null,rest_seconds:rest,sort_order:sort})
  if(error){button.disabled=false;button.textContent='Adicionar exercício';return toast(error.message,'error')}
  closePro12Modal();toast(`${ex.name} adicionado ao treino.`)
}

async function enhanceNav(){
  const ctx=await getContext();if(!ctx?.session)return
  const nav=document.querySelector('.nav')
  if(nav&&!nav.querySelector('#pro12Nav')){
    const btn=document.createElement('button');btn.id='pro12Nav';btn.className='nav-btn';btn.type='button';btn.innerHTML='<span class="nav-icon">◎</span><span>Atlas</span>';btn.onclick=renderAtlas;nav.appendChild(btn)
  }
  const quick=document.querySelector('.quick-actions')
  if(ctx.profile?.role==='trainer'&&quick&&!quick.querySelector('#pro12Quick')){
    const b=document.createElement('button');b.id='pro12Quick';b.className='btn sec';b.type='button';b.textContent='◎ Atlas muscular';b.onclick=renderAtlas;quick.appendChild(b)
  }
  const badge=document.querySelector('.version-badge');if(badge)badge.textContent='v12'
}

async function enhance(){try{await enhanceNav()}catch(error){console.warn('FITCOACH pro12:',error)}}
function scheduleEnhance(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;enhance()},160)}
new MutationObserver(scheduleEnhance).observe(document.documentElement,{subtree:true,childList:true})
window.addEventListener('focus',scheduleEnhance)
scheduleEnhance()
