'use strict';

const pendingCaseScripts=new Map();
window.supplementCaseLoaded=function(id,payload,script){
  const request=pendingCaseScripts.get(script);
  if(request&&request.id===id)request.finish(null,payload);
};
function loadCasePayload(entry,signal){
  return new Promise((resolve,reject)=>{
    const script=document.createElement('script');let settled=false;
    script.async=true;script.referrerPolicy='no-referrer';
    function finish(error,payload){
      if(settled)return;settled=true;
      pendingCaseScripts.delete(script);signal.removeEventListener('abort',abort);
      script.onload=null;script.onerror=null;script.remove();
      if(error)reject(error);else resolve(payload);
    }
    function abort(){finish(new DOMException('Comparison changed','AbortError'));}
    pendingCaseScripts.set(script,{id:entry.id,finish});
    script.onload=()=>finish(new Error('Comparison data was not provided'));
    script.onerror=()=>finish(new Error('Could not load comparison'));
    signal.addEventListener('abort',abort,{once:true});
    if(signal.aborted){abort();return;}
    script.src=window.supplementAssetUrl(entry.payload.split('/').pop());document.head.append(script);
  });
}

const data=window.OOD_DATA;const cases=data.cases;const sourceSelect=document.getElementById('source-filter');const lightSelect=document.getElementById('light-filter');const status=document.getElementById('gallery-status');const grid=document.getElementById('results');const strip=document.querySelector('.input-strip');const dialog=document.getElementById('image-dialog');const fullImage=document.getElementById('full-image');let active=0;let sequence=0;let controller=null;
function options(select,rows,idKey,labelKey){const seen=new Set();for(const row of rows){if(seen.has(row[idKey]))continue;seen.add(row[idKey]);const option=document.createElement('option');option.value=row[idKey];option.textContent=row[labelKey];select.append(option);}}
options(sourceSelect,cases,'source_id','source');options(lightSelect,cases,'light_id','light');
function imageMode(actual){document.getElementById('image-viewport').classList.toggle('actual',actual);document.getElementById('fit-image').setAttribute('aria-pressed',String(!actual));document.getElementById('actual-image').setAttribute('aria-pressed',String(actual));}
function openImage(src,title,square=false,width=null,height=null){fullImage.src=src;fullImage.alt=title;fullImage.classList.toggle('square-preview',square);if(width){fullImage.width=width;fullImage.height=square?width:height;}else{fullImage.removeAttribute('width');fullImage.removeAttribute('height');}document.getElementById('image-title').textContent=title;imageMode(false);dialog.showModal();}
document.getElementById('close-image').onclick=()=>dialog.close();document.getElementById('fit-image').onclick=()=>imageMode(false);document.getElementById('actual-image').onclick=()=>imageMode(true);dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});dialog.addEventListener('close',()=>{fullImage.removeAttribute('src');});
async function showCase(index){active=(index+cases.length)%cases.length;const entry=cases[active];const token=++sequence;if(controller)controller.abort();controller=new AbortController();sourceSelect.value=entry.source_id;lightSelect.value=entry.light_id;document.getElementById('case-count').textContent=`${active+1} / ${cases.length}`;document.getElementById('case-title').textContent=`${entry.source} · ${entry.light}`;document.getElementById('pdf-page').href=`${window.supplementAssetUrl(data.pdf)}#page=${entry.pdf_page}`;window.supplementReplaceHash(`#${entry.id}`);status.textContent='Loading full-resolution comparison…';grid.classList.add('loading');strip.classList.add('loading');try{const payload=await loadCasePayload(entry,controller.signal);if(token!==sequence)return;const source=document.getElementById('source-image');source.src=payload.source_image;source.alt=`Source photograph: ${entry.source}`;document.getElementById('source-open').onclick=()=>openImage(payload.source_image,`${entry.source} · Source photograph`);const environment=document.getElementById('environment-image');environment.src=payload.environment_image;environment.alt=`Target lighting: ${entry.light}`;document.getElementById('environment-open').onclick=()=>openImage(payload.environment_image,`${entry.light} · Target lighting`);document.getElementById('light-caption').textContent=entry.light;grid.replaceChildren();for(const method of payload.methods){const card=document.createElement('figure');card.className=`result-card${method.name==='Ours'?' ours':''}`;const button=document.createElement('button');button.setAttribute('aria-label',`Enlarge ${method.name}`);const img=document.createElement('img');img.src=method.image;img.alt=`${method.name}: ${entry.source} under ${entry.light}`;img.decoding='async';if(method.display_aspect==='1:1')img.className='pdf-square';button.append(img);button.onclick=()=>openImage(method.image,`${method.name} · ${entry.source} · ${entry.light}`,method.display_aspect==='1:1',method.width,method.height);const caption=document.createElement('figcaption');const name=document.createElement('span');name.textContent=method.name;const hint=document.createElement('small');hint.textContent='Enlarge ↗';caption.append(name,hint);card.append(button,caption);grid.append(card);}status.textContent='';grid.classList.remove('loading');strip.classList.remove('loading');}catch(error){if(error.name==='AbortError'||token!==sequence)return;status.textContent='This comparison could not be loaded. Select another case or use the complete PDF.';grid.replaceChildren();}}
function selectedCase(){const index=cases.findIndex(row=>row.source_id===sourceSelect.value&&row.light_id===lightSelect.value);if(index>=0)showCase(index);}
sourceSelect.onchange=selectedCase;lightSelect.onchange=selectedCase;document.getElementById('prev').onclick=()=>showCase(active-1);document.getElementById('next').onclick=()=>showCase(active+1);document.addEventListener('keydown',event=>{if(dialog.open||['SELECT','INPUT','TEXTAREA'].includes(event.target.tagName))return;if(event.key==='ArrowLeft'){event.preventDefault();showCase(active-1);}if(event.key==='ArrowRight'){event.preventDefault();showCase(active+1);}});
showCase(Math.max(0,cases.findIndex(row=>row.id===location.hash.slice(1))));
