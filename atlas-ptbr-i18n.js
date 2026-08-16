/* FITCOACH Atlas — PT-BR localization layer */
(() => {
  const translations = {
    'Skeletal':'Sistema esquelético','骨骼系统':'Sistema esquelético',
    'Muscular':'Sistema muscular','肌肉系统':'Sistema muscular',
    'Cardiovascular':'Sistema cardiovascular','心血管系统':'Sistema cardiovascular',
    'Nervous':'Sistema nervoso','神经系统':'Sistema nervoso',
    'Digestive':'Sistema digestivo','消化系统':'Sistema digestivo',
    'Respiratory':'Sistema respiratório','呼吸系统':'Sistema respiratório',
    'Urinary':'Sistema urinário','泌尿系统':'Sistema urinário',
    'Reproductive':'Sistema reprodutor','生殖系统':'Sistema reprodutor',
    'Endocrine':'Sistema endócrino','内分泌系统':'Sistema endócrino',
    'Lymphatic':'Sistema linfático','淋巴系统':'Sistema linfático',
    'Integumentary':'Sistema tegumentar','皮肤系统':'Sistema tegumentar',
    'Model':'Modelo','模型':'Modelo','Models':'Modelos','主页':'Início','首页':'Início',
    '图层':'Camadas','Layers':'Camadas','Full screen':'Tela cheia','Tela cheia':'Tela cheia',
    'Search model name or ID...':'Pesquisar nome ou ID do modelo...','搜索模型名称或ID...':'Pesquisar nome ou ID do modelo...'
  };
  const replaceText = node => {
    if(node.nodeType===Node.TEXT_NODE){let t=node.nodeValue;Object.entries(translations).forEach(([a,b])=>{t=t.split(a).join(b)});node.nodeValue=t;}
    else if(node.nodeType===Node.ELEMENT_NODE && !['SCRIPT','STYLE','NOSCRIPT'].includes(node.tagName)) node.childNodes.forEach(replaceText);
  };
  const run=()=>{document.documentElement.lang='pt-BR';replaceText(document.body);document.querySelectorAll('input,textarea').forEach(el=>{if(el.placeholder) Object.entries(translations).forEach(([a,b])=>el.placeholder=el.placeholder.split(a).join(b));});};
  const observer=new MutationObserver(()=>run());
  if(document.body){run();observer.observe(document.body,{childList:true,subtree:true,characterData:true});}
  else document.addEventListener('DOMContentLoaded',()=>{run();observer.observe(document.body,{childList:true,subtree:true,characterData:true});},{once:true});
})();
