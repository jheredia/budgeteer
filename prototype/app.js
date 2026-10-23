'use strict';
// Synthetic structured state only; these are UI hypotheses, not a canonical production schema.
const initialState = () => ({
  ledger: [
    { id: 'demo-ledger-1', date: '2026-10-02T15:00:00Z', amount: 190000, category: 'Compras' },
    { id: 'demo-ledger-2', date: '2026-10-14T15:00:00Z', amount: 140000, category: 'Alimentación' },
    { id: 'demo-ledger-3', date: '2026-10-20T15:00:00Z', amount: 98500, category: 'Transporte' }
  ],
  proposals: [{ id: 'demo-proposal-1', evidenceId: 'demo-evidence-1', merchant: 'Almacén del Parque', amount: 28500, date: '2026-10-22T15:00:00Z', category: 'Alimentación' }],
  evidence: [{ id: 'demo-evidence-1', source: 'Fuente simulada', accountHint: '•••• 0421', categoryUncertain: true }],
  ignored: []
});
let state = initialState();
const element = id => document.getElementById(id);
const clp = value => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
const date = value => new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Santiago' }).format(new Date(value));
function render() {
  element('monthly-total').textContent = clp(state.ledger.reduce((total, record) => total + record.amount, 0));
  element('pending-count').textContent = state.proposals.length;
  const proposal = state.proposals[0];
  element('proposal-surface').hidden = !proposal;
  element('empty-state').hidden = Boolean(proposal);
  if (proposal) {
    element('merchant').textContent = proposal.merchant;
    element('amount').textContent = clp(proposal.amount);
    element('date').textContent = date(proposal.date);
    element('date').dateTime = proposal.date;
    element('category').value = proposal.category;
  }
}
element('review-form').addEventListener('submit', event => {
  event.preventDefault();
  const proposal = state.proposals[0];
  if (!proposal) return;
  const category = element('category').value;
  state.ledger.push({ ...proposal, id: 'demo-approved-' + proposal.id, category });
  state.proposals = [];
  element('feedback').textContent = `Registro aprobado en ${category}. Se agregaron ${clp(proposal.amount)} a tus gastos confirmados.`;
  element('feedback').hidden = false;
  element('total-note').textContent = 'El registro aprobado ya está incluido.';
  render();
  element('reset').focus();
});
element('ignore').addEventListener('click', () => {
  if (!state.proposals.length) return;
  state.ignored.push(state.proposals[0].id);
  state.proposals = [];
  element('feedback').textContent = 'Propuesta ignorada. No se agregó ningún registro a tus gastos confirmados.';
  element('feedback').hidden = false;
  element('total-note').textContent = 'La propuesta ignorada no se incluye.';
  render();
  element('reset').focus();
});
element('category').addEventListener('change', event => {
  if (state.proposals[0]) state.proposals[0].category = event.target.value;
});
element('reset').addEventListener('click', () => {
  state = initialState();
  element('feedback').hidden = true;
  element('total-note').textContent = 'Esta propuesta aún no está incluida.';
  render();
  element('category').focus();
});
document.querySelector('.menu-toggle').addEventListener('click', event => {
  const button = event.currentTarget;
  const open = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(open));
  button.setAttribute('aria-label', open ? 'Cerrar navegación' : 'Abrir navegación');
  element('navigation').classList.toggle('is-open', open);
});
render();
