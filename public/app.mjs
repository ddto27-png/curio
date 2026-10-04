import { IDEAS, CATEGORIES, THEMES } from './catalog.mjs';
import { card } from './cards.mjs';
import { STORAGE_KEY, readSaved, toggleSaved } from './library.mjs';
import { filterIdeas, parseFilters, filterURL, legacyDestination } from './discovery.mjs';

const validIds = new Set(IDEAS.map(i=>i.id));
let saved = new Set(), storageReady = false, toastTimer;
function notify(text) {
  const toast=document.querySelector('#toast');toast.textContent=text;toast.classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2600);
}
function renderSaved() {
  const grid=document.querySelector('#saved-grid');if(!grid)return;
  if(!storageReady){grid.innerHTML='<p>Your saved ideas could not be loaded. Your existing browser data has not been changed.</p>';return;}
  const items=IDEAS.filter(i=>saved.has(i.id));
  grid.innerHTML=items.length?items.map(card).join(''):'<div class="empty"><h2>Something will catch your eye.</h2><p>Use the + on an idea to save it here.</p><a href="/" class="button">Explore ideas ↗</a></div>';
}
function updateSaved() {
  document.querySelector('#saved-count').textContent=String(saved.size);
  document.querySelectorAll('[data-save]').forEach(button=>{
    const idea=IDEAS.find(i=>i.id===button.dataset.save);if(!idea)return;
    const on=saved.has(idea.id);button.disabled=!storageReady;
    button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',`${on?'Remove':'Save'} ${idea.name}`);
    button.textContent=button.classList.contains('save')?(on?'✓':'+'):(on?'✓ Saved — remove':'＋ Save idea');
  });
}
function loadSaved() {
  const error=document.querySelector('#storage-error');
  try {saved=readSaved(localStorage,validIds);storageReady=true;error.hidden=true;}
  catch {saved=new Set();storageReady=false;error.textContent='Browser storage is unavailable or unreadable. Saving is disabled; existing data has not been replaced.';error.hidden=false;}
  renderSaved();updateSaved();
}
loadSaved();
window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY || event.key===null)loadSaved();});
window.addEventListener('pageshow',loadSaved);
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-save]');if(!button || !storageReady)return;
  try {
    // Re-read before writing, so another tab's completed changes are preserved.
    const current=readSaved(localStorage,validIds);
    const next=toggleSaved(localStorage,current,button.dataset.save,validIds);
    saved=next;renderSaved();updateSaved();notify(saved.has(button.dataset.save)?'Saved in this browser':'Removed from your saved ideas');
  } catch {notify('Your change was not saved. Browser storage may be full or unavailable.');}
});

const search=document.querySelector('#search');
if(search){
  let filters=parseFilters(location.search,CATEGORIES,THEMES);
  search.disabled=false;document.querySelectorAll('[data-filter]').forEach(b=>b.disabled=false);
  function renderFilters(){
    search.value=filters.query;
    const items=filterIdeas(IDEAS,filters);
    document.querySelector('#idea-grid').innerHTML=items.length?items.map(card).join(''):'<div class="empty"><h3>No ideas found this time.</h3><p>Try another word or clear your filters.</p></div>';
    document.querySelector('#result-count').textContent=`${items.length} ${items.length===1?'idea':'ideas'} to explore`;
    document.querySelector('[data-reset]').hidden=!(filters.query||filters.categories.length||filters.themes.length);
    document.querySelectorAll('[data-filter]').forEach(button=>{const values=button.dataset.filter==='category'?filters.categories:filters.themes;const on=values.includes(button.dataset.value);button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));});
    updateSaved();
  }
  function commit(){history.replaceState(null,'',filterURL(filters));renderFilters();}
  search.addEventListener('input',()=>{filters.query=search.value;commit();});
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    const key=button.dataset.filter==='category'?'categories':'themes';const value=button.dataset.value;
    filters[key]=filters[key].includes(value)?filters[key].filter(v=>v!==value):[...filters[key],value];commit();
  }));
  document.querySelector('[data-reset]').addEventListener('click',()=>{filters={query:'',categories:[],themes:[]};commit();});
  window.addEventListener('popstate',()=>{filters=parseFilters(location.search,CATEGORIES,THEMES);renderFilters();});
  renderFilters();
}

function redirectLegacy(){const to=legacyDestination(location.pathname,location.hash);if(to)location.replace(to);}
redirectLegacy();window.addEventListener('hashchange',redirectLegacy);

document.querySelectorAll('[data-place]').forEach(pin=>pin.addEventListener('click',()=>{
  document.querySelectorAll('[data-place]').forEach(p=>p.classList.toggle('active',p.dataset.place===pin.dataset.place));
  document.querySelectorAll('[data-place-card]').forEach(p=>p.classList.toggle('active',p.dataset.placeCard===pin.dataset.place));
}));

// The anchor remains a normal link for keyboard, no-script, and modified clicks.
document.querySelectorAll('[data-tear]').forEach(tab=>{
  let start=null,dragged=false;
  const reset=()=>{start=null;tab.classList.remove('dragging');tab.style.transform='';};
  tab.addEventListener('dragstart',event=>event.preventDefault());
  tab.addEventListener('pointerdown',event=>{if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;start=event.clientY;dragged=false;tab.setPointerCapture(event.pointerId);});
  tab.addEventListener('pointermove',event=>{
    if(start===null)return;const delta=Math.max(0,event.clientY-start);
    if(delta>5){dragged=true;if(!matchMedia('(prefers-reduced-motion: reduce)').matches){tab.classList.add('dragging');tab.style.transform=`translateY(${Math.min(delta,100)/2}px) rotate(${Math.min(delta,100)/25}deg)`;}}
  });
  tab.addEventListener('pointerup',event=>{if(start===null)return;const delta=event.clientY-start;reset();if(delta>45)location.assign(tab.href);});
  tab.addEventListener('pointercancel',()=>{reset();dragged=false;});
  tab.addEventListener('click',event=>{if(dragged&&event.detail!==0){event.preventDefault();dragged=false;}});
});
