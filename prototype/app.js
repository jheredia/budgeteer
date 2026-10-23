'use strict';
// Synthetic structured data only; provisional UI model, never a production schema.
const months=[['2026-10','Octubre 2026'],['2026-09','Septiembre 2026'],['2026-08','Agosto 2026']];
const categories=['Alimentación','Transporte','Compras','Sin categoría'];
const clp = value => new Intl.NumberFormat('es-CL', {
  style: 'currency', currency: 'CLP', maximumFractionDigits: 0
}).format(value);
const date = value => new Intl.DateTimeFormat('es-CL', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Santiago'
}).format(new Date(value));
function monthOf(value) {
  const parts = new Intl.DateTimeFormat('en', {
    year: 'numeric', month: '2-digit', timeZone: 'America/Santiago'
  }).formatToParts(new Date(value));
  return parts.find(part => part.type === 'year').value + '-' +
    parts.find(part => part.type === 'month').value;
}
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=name=>`<img src="assets/${name}.svg" alt="">`;
const element=id=>document.getElementById(id);
const initialState=()=>{
 const ledger=[
  {id:'oct-1',date:'2026-10-02T15:00:00Z',merchant:'Tienda del Centro',amount:190000,category:'Compras'},
  {id:'oct-2',date:'2026-10-14T15:00:00Z',merchant:'Mercado del Barrio',amount:140000,category:'Alimentación'},
  {id:'oct-3',date:'2026-10-20T15:00:00Z',merchant:'Transporte Metropolitano',amount:98500,category:'Transporte'},
  {id:'sep-1',date:'2026-09-03T15:00:00Z',merchant:'Tienda del Centro',amount:160000,category:'Compras'},
  {id:'sep-2',date:'2026-09-12T15:00:00Z',merchant:'Mercado del Barrio',amount:142000,category:'Alimentación'},
  {id:'sep-3',date:'2026-09-25T15:00:00Z',merchant:'Transporte Metropolitano',amount:90000,category:'Transporte'}
 ];
 const proposals=[{id:'proposal-1',date:'2026-10-22T15:00:00Z',merchant:'Almacén del Parque',amount:28500,category:'Alimentación',evidenceId:'evidence-proposal-1'}];
 const evidence=[...ledger,...proposals].map(r=>({id:r.evidenceId||'evidence-'+r.id,merchant:r.merchant,amount:r.amount,date:r.date,source:'Fuente de demostración',accountHint:'•••• 0421',categoryUncertain:r.id==='proposal-1',operationTime:null}));
 return {ledger:ledger.map(r=>({...r,evidenceId:'evidence-'+r.id})),proposals,evidence,ignored:[]};
};
let state=initialState(),overviewMonth='2026-10',comparisonMonth='2026-09',ledgerMonth='2026-10',ledgerCategory='all',lastReview=null;
const recordsFor=month=>state.ledger.filter(r=>month==='all'||monthOf(r.date)===month);
const sum=records=>records.reduce((total,r)=>total+r.amount,0);
const monthLabel=value=>months.find(m=>m[0]===value)?.[1]||'Todos los meses';
const monthOptions=selected=>months.map(([value,label])=>`<option value="${value}" ${value===selected?'selected':''}>${label}</option>`).join('');
const categoryOptions=selected=>categories.map(c=>`<option ${c===selected?'selected':''}>${c}</option>`).join('');
const heading=(title,description)=>`<header class="page-heading">
<div class="intro">
<h1>${title}</h1>
<p>${description}</p>
</div>
</header>`;
function notify(message) {
  element('feedback').textContent = message;
  element('feedback').hidden = false;
}
function overview(){
 const records=recordsFor(overviewMonth),current=sum(records),base=sum(recordsFor(comparisonMonth)),difference=current-base;
 const pct=base===0?'Sin base porcentual':`${difference>0?'+':''}${new Intl.NumberFormat('es-CL',{maximumFractionDigits:1}).format(difference/base*100)} %`;
 return heading('Tus gastos, en perspectiva','Explora los registros confirmados y elige los meses que quieres comparar.')+`<div class="overview-grid">
<section class="surface overview-total">
<label for="overview-month">Mes del resumen</label>
<select id="overview-month">${monthOptions(overviewMonth)}</select>
<p class="eyebrow">Gastos confirmados</p>
<strong class="hero-total" id="overview-total">${clp(current)}</strong>
<p>${records.length} registros confirmados · CLP</p>
<a class="text-link" data-ledger-month="${overviewMonth}" href="#ledger">Ver movimientos de este mes</a>
</section>
<section class="surface comparison">
<h2>Comparación mensual</h2>
<label for="comparison-month">Comparar con</label>
<select id="comparison-month">${monthOptions(comparisonMonth)}</select>
<strong class="comparison-value" id="comparison-value">${pct}</strong>
<p>${difference===0?'Sin diferencia':clp(Math.abs(difference))+' '+(difference>0?'más':'menos')} respecto a ${monthLabel(comparisonMonth).toLocaleLowerCase('es-CL')}.</p>
<p class="comparison-basis">${clp(base)} en el mes de referencia; ${clp(current)} en ${monthLabel(overviewMonth).toLocaleLowerCase('es-CL')}. ${base===0?'No se calcula un porcentaje porque el mes de referencia no tiene gastos confirmados.':'Porcentaje = diferencia dividida por los gastos del mes de referencia.'} ${overviewMonth===comparisonMonth?'Seleccionaste el mismo mes en ambos lados.':''}</p>
<a class="text-link" data-ledger-month="${comparisonMonth}" href="#ledger">Ver registros de referencia</a>
</section>
</div>
<section class="surface">
<h2>Gastos por categoría</h2>${records.length?`<ul class="category-totals">${categories.map(c=>({name:c,total:sum(records.filter(r=>r.category===c))})).filter(c=>c.total>0).map(c=>`<li>
<a href="#ledger" data-ledger-month="${overviewMonth}" data-ledger-category="${c.name}">
<span>${c.name}</span>
<strong>${clp(c.total)}</strong>
</a>
</li>`).join('')}</ul>`:'<p>No hay registros confirmados en este mes.</p>'}<p class="comparison-basis">Solo registros confirmados de esta demostración. Las propuestas pendientes e ignoradas no se incluyen. Esta comparación no predice gastos.</p>
</section>
<section class="review-callout">
<div>
<h2>${state.proposals.length?'Hay una propuesta por revisar':'Tus propuestas están al día'}</h2>
<p>${state.proposals.length?'Comprueba la categoría y la evidencia antes de incluirla.':'Explora tus movimientos y su evidencia.'}</p>
</div>
<a class="primary button-link" href="${state.proposals.length?'#review':'#ledger'}">${state.proposals.length?'Revisar transacción':'Ver movimientos'}</a>
</section>`;
}
function evidenceMarkup(id){
 const e=state.evidence.find(item=>item.id===id);
 if(!e)return '<section class="surface"><h2>Evidencia no disponible</h2><p>No hay evidencia asociada a este registro de demostración.</p></section>';
 const rows=[['store','Comercio',e.merchant],['dollar-sign','Monto',clp(e.amount)+' CLP'],['credit-card','Cuenta',e.accountHint],['file-text','Origen',e.source+' · Simulada']];
 return `<section class="surface evidence" aria-labelledby="evidence-heading">
<h2 id="evidence-heading" tabindex="-1">Evidencia estructurada</h2>
<dl>${rows.map(([i,label,value])=>`<div>
<dt>
<span class="icon-disc">${icon(i)}</span>${label}</dt>
<dd>${escape(value)}</dd>
</div>`).join('')}</dl>
<p class="evidence-note">Hora de operación: <strong>No disponible</strong>. ${e.categoryUncertain?'La categoría de origen es incierta; tu selección se aplica al registro, sin cambiar la evidencia.':'La evidencia respalda el registro y se mantiene separada de sus valores.'}</p>
</section>`;
}
function review(){
 const proposal=state.proposals[0],total=sum(recordsFor('2026-10'));
 const note=proposal?'Esta propuesta aún no está incluida.':lastReview?.action==='approved'?'El registro aprobado ya está incluido.':'La propuesta ignorada no se incluye.';
 const top=`<header class="page-heading review-heading">
<div class="intro">
<h1>Revisa con tranquilidad</h1>
<p>Confirma o ajusta la siguiente propuesta antes de incluirla en tus gastos.</p>
</div>
<section class="monthly-summary" aria-label="Gastos confirmados de octubre">
<div class="summary-value">
<strong id="monthly-total">${clp(total)}</strong>
<span>gastos confirmados en octubre</span>
</div>
<div class="summary-note">${icon('info')}<span>${note}</span>
</div>
</section>
</header>`;
 if(!proposal)return top+`<section class="surface empty-state">
<h2>Todo revisado</h2>
<p>No quedan propuestas pendientes. ${lastReview?.action==='approved'?'Tu registro ya está en los movimientos confirmados.':'La propuesta ignorada no creó un movimiento.'}</p>
<div class="empty-actions">${lastReview?.action==='approved'?`<a class="primary button-link" href="#record/${lastReview.recordId}">Ver registro aprobado</a>`:''}<a class="secondary button-link" href="#overview">Ver resumen</a>
<button class="text-button" data-action="reset">Volver a la demostración</button>
</div>
</section>`;
 return top+`<section class="surface proposal" aria-labelledby="proposal-heading">
<h2 id="proposal-heading">Propuesta de registro</h2>
<div class="transaction-heading">
<h3>${escape(proposal.merchant)}</h3>
<strong class="transaction-amount">${clp(proposal.amount)}</strong>
</div>
<div class="transaction-meta">
<time datetime="${proposal.date}">${date(proposal.date)}</time>
<span class="pending-state">Pendiente de revisión</span>
</div>
<form id="review-form">
<label for="category">Categoría</label>
<div class="select-wrap">${icon('utensils')}<select name="category" id="category" aria-describedby="category-help">${categoryOptions(proposal.category)}</select>
</div>
<p class="field-help" id="category-help">${icon('info')}Categoría sugerida · Por confirmar</p>
<div class="actions">
<button type="submit" class="primary">Aprobar registro</button>
<button type="button" data-action="ignore" class="secondary">Ignorar</button>
</div>
</form>
</section>`+evidenceMarkup(proposal.evidenceId);
}
function ledger(){
 const records=recordsFor(ledgerMonth).filter(r=>ledgerCategory==='all'||r.category===ledgerCategory).sort((a,b)=>b.date.localeCompare(a.date));
 return heading('Movimientos confirmados','Los registros del libro de movimientos, separados de las propuestas y su evidencia.')+`<section class="surface ledger-surface">
<div class="filters">
<div>
<label for="ledger-month">Mes</label>
<select id="ledger-month">
<option value="all" ${ledgerMonth==='all'?'selected':''}>Todos los meses</option>${monthOptions(ledgerMonth)}</select>
</div>
<div>
<label for="ledger-category">Categoría</label>
<select id="ledger-category">
<option value="all">Todas</option>${categoryOptions(ledgerCategory)}</select>
</div>
<button class="text-button" data-action="clear-filters">Limpiar filtros</button>
</div>
<div class="ledger-summary">
<span id="ledger-count">${records.length} ${records.length===1?'registro':'registros'}</span>
<div>
<span>Total visible</span>
<strong id="ledger-total">${clp(sum(records))}</strong>
</div>
</div>${records.length?`<div class="ledger-table" role="table" aria-label="Movimientos confirmados">
<div class="ledger-row table-heading" role="row">
<span role="columnheader">Fecha</span>
<span role="columnheader">Comercio y categoría</span>
<span role="columnheader">Monto</span>
<span role="columnheader">Detalle</span>
</div>${records.map(r=>`<div class="ledger-row" role="row">
<time role="cell" datetime="${r.date}">${date(r.date)}</time>
<div role="cell">
<strong>${escape(r.merchant)}</strong>
<span class="record-category">${escape(r.category)}</span>
</div>
<span role="cell" class="ledger-amount">${clp(r.amount)}</span>
<span role="cell">
<a href="#record/${r.id}" aria-label="Ver detalle de ${escape(r.merchant)}">Ver detalle</a>
</span>
</div>`).join('')}</div>`:`<div class="ledger-empty">
<h2>No hay movimientos con estos filtros</h2>
<p>Prueba otro mes o categoría, o limpia los filtros para ver todos tus registros.</p>
</div>`}<p class="comparison-basis">Las propuestas pendientes e ignoradas nunca aparecen en este libro de movimientos.</p>
</section>`;
}
function detail(id){
 const record=state.ledger.find(r=>r.id===id);
 if(!record)return heading('Registro no disponible','Este registro no existe en el estado actual de la demostración.')+'<a class="text-link" href="#ledger">Volver a movimientos</a>';
 return '<a class="back-link" href="#ledger">Volver a movimientos</a>'+heading('Detalle del registro','Los valores confirmados y la evidencia que los respalda se presentan por separado.')+`<section class="surface record-detail">
<span class="confirmed-state">Registro confirmado</span>
<div class="transaction-heading">
<h2>${escape(record.merchant)}</h2>
<strong class="transaction-amount">${clp(record.amount)}</strong>
</div>
<dl class="record-fields">
<div>
<dt>Fecha</dt>
<dd>${date(record.date)}</dd>
</div>
<div>
<dt>Categoría confirmada</dt>
<dd>${escape(record.category)}</dd>
</div>
<div>
<dt>Moneda</dt>
<dd>CLP</dd>
</div>
</dl>
<a class="text-link" href="#evidence-heading">Ver evidencia de este registro</a>
</section>`+evidenceMarkup(record.evidenceId);
}
function sources(){
 return heading('Fuentes y privacidad','Una demostración clara sobre los datos que ves y su origen.')+`<section class="surface source-status">
<div class="source-title">
<span class="icon-disc">${icon('database')}</span>
<div>
<h2>Fuente de demostración</h2>
<span class="confirmed-state">Simulada</span>
</div>
</div>
<p>Todos los registros y propuestas son datos sintéticos. No hay ningún buzón conectado, sincronización activa ni credenciales guardadas.</p>
<dl class="source-fields">
<div>
<dt>Conexión a buzones</dt>
<dd>No conectada</dd>
</div>
<div>
<dt>Última sincronización</dt>
<dd>No aplica · fuente simulada</dd>
</div>
<div>
<dt>Estado de la demostración</dt>
<dd>Solo en memoria; se reinicia al recargar</dd>
</div>
</dl>
</section>
<section class="surface privacy">
<h2>El origen no es el registro</h2>
<p>La evidencia estructurada respalda una propuesta o un registro. No es, por sí sola, el libro de movimientos. Tú revisas la propuesta antes de confirmarla.</p>
<h2>Sin archivo permanente de correos</h2>
<p>La política de Budgeteer es procesar el correo de forma transitoria y conservar solo información estructurada mínima. Budgeteer no almacena permanentemente el correo sin procesar ni elimina automáticamente mensajes del proveedor.</p>
<h2>En esta demostración</h2>
<p>No se lee ni se procesa ningún correo. No hay archivos de mensajes, servicios de conexión ni almacenamiento de datos. Al recargar se restaura el ejemplo inicial; esto no elimina ningún dato en un proveedor.</p>
<a class="text-link" href="#review">Volver a revisar propuestas</a>
</section>`;
}
function render(focus=false){
 const route=(location.hash.slice(1)||'review').split('/');
 const view=['overview','ledger','sources','record'].includes(route[0])?route[0]:'review';
 element('main').innerHTML=view==='overview'?overview():view==='ledger'?ledger():view==='sources'?sources():view==='record'?detail(route[1]):review();
 document.title=({overview:'Resumen',ledger:'Movimientos',sources:'Fuentes',record:'Detalle',review:'Por revisar'}[view])+' · Budgeteer';
 element('pending-count').textContent=state.proposals.length;
 document.querySelectorAll('[data-nav]').forEach(a=>{const active=a.dataset.nav===(view==='record'?'ledger':view);a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 if(focus){element('main').focus();window.scrollTo(0,0);}
}
document.addEventListener('change', event => {
  const {id, value} = event.target;
  if (id === 'overview-month') overviewMonth = value;
  if (id === 'comparison-month') comparisonMonth = value;
  if (id === 'ledger-month') ledgerMonth = value;
  if (id === 'ledger-category') ledgerCategory = value;
  if (id === 'category' && state.proposals[0]) {
    state.proposals[0].category = value;
    return;
  }
  if (['overview-month', 'comparison-month', 'ledger-month', 'ledger-category'].includes(id)) {
    render();
    element(id).focus();
  }
});

document.addEventListener('click', event => {
  const navLink = event.target.closest('[data-nav]');
  if (navLink) {
    closeMenu();
    if (location.hash === navLink.getAttribute('href')) {
      element('main').focus();
      window.scrollTo(0, 0);
    }
  }
  if (event.target.closest('.skip-link')) {
    event.preventDefault();
    element('main').focus();
    return;
  }
  if (event.target.closest('a[href="#evidence-heading"]')) {
    event.preventDefault();
    element('evidence-heading')?.focus();
    element('evidence-heading')?.scrollIntoView();
    return;
  }
  const drilldown = event.target.closest('[data-ledger-month]');
  if (drilldown) {
    ledgerMonth = drilldown.dataset.ledgerMonth;
    ledgerCategory = drilldown.dataset.ledgerCategory || 'all';
  }
});

const menu = document.querySelector('.menu-toggle');
function closeMenu() {
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Abrir navegación');
  element('navigation').classList.remove('is-open');
  document.querySelector('.demo-tools').classList.remove('is-open');
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Cerrar navegación' : 'Abrir navegación');
  element('navigation').classList.toggle('is-open', open);
  document.querySelector('.demo-tools').classList.toggle('is-open', open);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menu.focus();
  }
});
window.addEventListener('hashchange', () => {
  closeMenu();
  render(true);
});

function reset() {
  state = initialState();
  lastReview = null;
  overviewMonth = '2026-10';
  comparisonMonth = '2026-09';
  ledgerMonth = '2026-10';
  ledgerCategory = 'all';
  notify('Demostración reiniciada. Solo se restauraron los datos sintéticos en memoria.');
  if (location.hash !== '#review') location.hash = 'review';
  else render(true);
}
document.addEventListener('submit', event => {
  if (event.target.id !== 'review-form') return;
  event.preventDefault();
  const proposal = state.proposals[0];
  if (!proposal) return;
  const record = {...proposal, id: 'approved-' + proposal.id, category: element('category').value};
  if (!state.ledger.some(item => item.id === record.id)) state.ledger.push(record);
  state.proposals = [];
  lastReview = {action: 'approved', recordId: record.id};
  notify(`Registro aprobado en ${record.category}. Se agregaron ${clp(record.amount)} a octubre.`);
  render(true);
});
document.addEventListener('click', event => {
  const control = event.target.closest('[data-action], #restart-demo');
  if (!control) return;
  const action = control.dataset.action;
  if (action === 'reset' || control.id === 'restart-demo') {
    reset();
    return;
  }
  if (action === 'clear-filters') {
    ledgerMonth = 'all';
    ledgerCategory = 'all';
    render();
    element('ledger-month').focus();
    return;
  }
  if (action === 'ignore' && state.proposals.length) {
    state.ignored.push(state.proposals[0].id);
    state.proposals = [];
    lastReview = {action: 'ignored'};
    notify('Propuesta ignorada. No se creó un movimiento ni cambiaron los gastos confirmados.');
    render(true);
  }
});
render();
