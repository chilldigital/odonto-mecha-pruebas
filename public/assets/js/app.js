/* =========================================================
   Configuración Global
   - Seguridad: todas las requests agregan X-API-KEY
   - HTTPS: usamos dominio https de n8n
   - CORS: habilitar en n8n solo para odonto-prueba.chilldigital.tech
   ========================================================= */
window.N8N_BASE = 'https://n8n.chilldigital.tech/webhook';
window.API_KEY  = 'secret-clinica-123'; // <-- CAMBIAR EN PRODUCCIÓN

// HTMX: inyectar headers globalmente (JSON limpio + API key)
document.addEventListener('htmx:configRequest', (evt) => {
  evt.detail.headers['X-API-KEY'] = window.API_KEY;
  evt.detail.headers['Accept']    = 'application/json';
});

// Helpers
const $ = (id) => document.getElementById(id);
const fmt = (n) => (n ?? 0).toLocaleString('es-AR');

// Toasts
window.toastOk = (msg) => showToast(msg, 'ok');
window.toastWarn = (msg) => showToast(msg, 'warn');
window.toastErr = (msg) => showToast(msg, 'err');

function showToast(msg, type='ok'){
  const area = $('toastArea'); if(!area) return;
  const base = 'px-4 py-2 rounded-lg shadow text-sm flex items-center gap-2';
  const cls = type==='ok' ? 'bg-emerald-600 text-white' : type==='warn' ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white';
  const icon = type==='ok' ? 'fa-check-circle' : type==='warn' ? 'fa-triangle-exclamation' : 'fa-circle-xmark';
  const el = document.createElement('div');
  el.className = `${base} ${cls}`;
  el.innerHTML = `<i class="fa-solid ${icon}"></i><div>${msg}</div>`;
  area.appendChild(el);
  setTimeout(()=>{ el.classList.add('opacity-0'); setTimeout(()=>el.remove(), 300); }, 3500);
}

// Parse JSON de una respuesta HTMX
function getJSON(event){
  try { return JSON.parse(event.detail.xhr.responseText); }
  catch { return null; }
}

/* =========================================================
   RENDER: Dashboard (estadísticas + chart + recientes)
   ========================================================= */
window.renderStats = (event) => {
  const j = getJSON(event); if(!j){ toastErr('Error al leer métricas'); return; }
  const d = j.datos || j; // soporta {datos:{...}} o plano
  $('stat-total') && ($('stat-total').textContent   = fmt(d.totalPacientes));
  $('stat-hoy') && ($('stat-hoy').textContent       = fmt(d.turnosHoy));
  $('stat-semana') && ($('stat-semana').textContent = fmt(d.turnosSemana));
  $('stat-ultimo') && ($('stat-ultimo').textContent = fmt(d.ultimoRegistro));
};

let turnosChart;
window.renderTurnosChart = (event) => {
  const j = getJSON(event); if(!j){ toastErr('Error al leer datos del gráfico'); return; }
  // Estructuras aceptadas:
  // 1) { labels:[...], data:[...] }
  // 2) [ { semana:"2025-34", total: 12 }, ... ]
  let labels = j.labels, data = j.data;
  if(!labels || !data){
    labels = (j || []).map(r=>r.semana || r.label);
    data   = (j || []).map(r=>r.total  || r.value);
  }
  const ctx = $('turnosChart'); if(!ctx) return;
  if(turnosChart){ turnosChart.destroy(); }
  turnosChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label: 'Turnos', data, tension: .35 }] },
    options: { responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } }
  });
  $('chart-meta') && ($('chart-meta').textContent = `Muestras: ${labels.length}`);
};

window.renderRecentPatients = (event) => {
  const j = getJSON(event) || [];
  const box = $('recent-list'); if(!box) return;
  if(!Array.isArray(j) || j.length===0){
    box.innerHTML = `<div class="text-slate-500 text-sm">No hay pacientes registrados.</div>`;
    return;
  }
  // Permitir tanto {nombre, dni, obra_social, fecha_registro} como Airtable-like
  const items = j.slice(-5).reverse().map(p=>{
    const nombre = p.nombre || p.fields?.Nombre || 'Sin nombre';
    const obra   = p.obra_social || p.fields?.['Obra Social'] || '—';
    const dni    = p.dni || p.fields?.DNI || '—';
    const fecha  = p.fecha_registro || p.fields?.['Fecha Registro'];
    return `
      <div class="flex items-center justify-between p-3 rounded-xl border border-slate-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-cyan-600 text-white grid place-items-center font-semibold">${(nombre[0]||'P').toUpperCase()}</div>
          <div>
            <div class="font-medium">${nombre}</div>
            <div class="text-xs text-slate-500"><i class="fa-solid fa-shield-heart"></i> ${obra}</div>
          </div>
        </div>
        <div class="text-right text-xs text-slate-500">
          <div><i class="fa-solid fa-id-card"></i> ${dni}</div>
          <div>${fecha ? new Date(fecha).toLocaleDateString('es-AR') : ''}</div>
        </div>
      </div>`;
  }).join('');
  box.innerHTML = items;
};

/* =========================================================
   RENDER: Pacientes (tabla) + Alta
   ========================================================= */
window.renderPatients = (event) => {
  const j = getJSON(event) || [];
  const body = $('pac-body'), count = $('pac-count');
  if(!body) return;
  if(!Array.isArray(j) || j.length===0){
    body.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-slate-500">Sin resultados</td></tr>`;
    count && (count.textContent = '0 pacientes');
    return;
  }
  const rows = j.map(p=>{
    const id     = p.id || p.recordId || '';
    const nombre = p.nombre || p.fields?.Nombre || '—';
    const dni    = p.dni || p.fields?.DNI || '—';
    const tel    = p.telefono || p.fields?.Tel || p.fields?.Telefono || '—';
    const mail   = p.email || p.fields?.Email || '—';
    const obra   = p.obra_social || p.fields?.['Obra Social'] || '—';
    return `<tr class="hover:bg-slate-50">
      <td class="px-4 py-3 font-medium">${nombre}</td>
      <td class="px-4 py-3">${dni}</td>
      <td class="px-4 py-3 text-sm text-slate-600">${tel} · ${mail}</td>
      <td class="px-4 py-3"><span class="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs">${obra}</span></td>
      <td class="px-4 py-3 text-right">
        <button class="px-2 py-1 text-slate-600 hover:text-cyan-700" title="Ver"><i class="fa-solid fa-eye"></i></button>
      </td>
    </tr>`;
  }).join('');
  body.innerHTML = rows;
  count && (count.textContent = `${j.length} paciente${j.length!==1?'s':''}`);
};

window.afterCreatePatient = (event) => {
  const j = getJSON(event);
  if(j && j.success!==false){ toastOk('Paciente creado'); }
  else { toastErr(j?.message || 'Error al crear paciente'); }
  // refrescar listado
  htmx.trigger($('pac-body'), 'load');
};

/* =========================================================
   RENDER: Agenda (tabla simple por día/hora)
   Estructura aceptada: [{ fecha:"2025-08-22", hora:"10:00", paciente:"...", estado:"confirmado" }, ...]
   ========================================================= */
window.renderAgenda = (event) => {
  const j = getJSON(event) || [];
  const box = $('agenda-grid'); if(!box) return;
  if(!Array.isArray(j) || j.length===0){
    box.innerHTML = `<div class="text-slate-500 text-sm">No hay turnos en el período.</div>`;
    return;
  }
  // Agrupar por fecha
  const byDate = {};
  j.forEach(t => {
    const f = t.fecha || t.date; byDate[f] = byDate[f] || []; byDate[f].push(t);
  });
  const days = Object.keys(byDate).sort();
  const html = days.map(d=>{
    const rows = byDate[d].sort((a,b)=>(a.hora||'').localeCompare(b.hora||''))
      .map(t=>`<tr class="border-b">
        <td class="px-3 py-2">${t.hora || '—'}</td>
        <td class="px-3 py-2">${t.paciente || t.paciente_nombre || '—'}</td>
        <td class="px-3 py-2">${t.motivo || ''}</td>
        <td class="px-3 py-2">
          <span class="px-2 py-1 rounded text-xs ${badgeEstado(t.estado)}">${t.estado || 'pendiente'}</span>
        </td>
      </tr>`).join('');
    return `<div class="mb-5">
      <div class="text-sm font-semibold mb-2">${new Date(d).toLocaleDateString('es-AR')}</div>
      <div class="overflow-x-auto border border-slate-200 rounded-xl">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50"><tr class="text-left"><th class="px-3 py-2">Hora</th><th class="px-3 py-2">Paciente</th><th class="px-3 py-2">Motivo</th><th class="px-3 py-2">Estado</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
  }).join('');
  box.innerHTML = html;
};

function badgeEstado(e){
  const map = { confirmado:'bg-emerald-100 text-emerald-700', pendiente:'bg-amber-100 text-amber-700', completado:'bg-cyan-100 text-cyan-700' };
  return map[(e||'').toLowerCase()] || 'bg-slate-100 text-slate-700';
}

/* =========================================================
   RENDER: Turnos (listado) + Alta
   ========================================================= */
window.renderTurnos = (event) => {
  const j = getJSON(event) || [];
  const box = $('turnos-body'), count = $('turnos-count'); if(!box) return;
  if(!Array.isArray(j) || j.length===0){
    box.innerHTML = `<div class="p-6 text-sm text-slate-500">No hay turnos.</div>`;
    count && (count.textContent = '0 turnos');
    return;
  }
  const cards = j.map(t=>{
    const fecha = t.fecha ? new Date(`${t.fecha}T${t.hora||'00:00'}`) : null;
    return `<div class="border-b border-slate-100 p-4 flex items-center justify-between">
      <div>
        <div class="font-medium">${t.paciente || t.paciente_nombre || 'Paciente'}</div>
        <div class="text-xs text-slate-500">${t.motivo || ''}</div>
      </div>
      <div class="text-right">
        <div class="text-sm">${fecha ? fecha.toLocaleDateString('es-AR') : '—'} · ${t.hora || '—'}</div>
        <div class="text-xs"><span class="px-2 py-1 rounded ${badgeEstado(t.estado)}">${t.estado || 'pendiente'}</span></div>
      </div>
    </div>`;
  }).join('');
  box.innerHTML = cards;
  count && (count.textContent = `${j.length} turno${j.length!==1?'s':''}`);
};

window.afterCreateTurno = (event) => {
  const j = getJSON(event);
  if(j && j.success!==false){ toastOk('Turno creado'); }
  else { toastErr(j?.message || 'Error al crear turno'); }
  // refrescar
  const list = $('turnos-body'); list && htmx.trigger(list, 'load');
};

/* =========================================================
   Notas de backend (n8n)
   - Aceptar y devolver JSON limpio.
   - Habilitar CORS SOLO para https://odonto-prueba.chilldigital.tech
   - Endpoints de ejemplo usados:
     GET  /webhook/estadisticas
     GET  /webhook/turnos-por-semana
     GET  /webhook/listar-pacientes
     POST /webhook/agregar-paciente
     GET  /webhook/agenda
     GET  /webhook/listar-turnos
     POST /webhook/crear-turno
     POST /webhook/configuracion
   - Siempre verificar header X-API-KEY server-side (primer nodo).
========================================================= */
