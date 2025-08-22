let pacientesData = [];

async function loadPacientes() {
    const tableBody = document.getElementById('pacientes-table-body');
    const resultCount = document.getElementById('resultado-count');
    
    try {
        pacientesData = await api.getPacientes();
        renderPacientes(pacientesData);
        updateResultCount(pacientesData.length);
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error cargando pacientes</td></tr>';
        resultCount.textContent = 'Error al cargar';
    }
}

function renderPacientes(pacientes) {
    const tableBody = document.getElementById('pacientes-table-body');
    
    if (!pacientes || pacientes.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-5">
                    <i class="bi bi-people display-1 text-muted mb-3"></i>
                    <h5 class="text-muted">No se encontraron pacientes</h5>
                    <a href="nuevo-paciente.html" class="btn btn-primary mt-3">
                        <i class="bi bi-person-plus me-2"></i>Agregar Primer Paciente
                    </a>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = pacientes.map(paciente => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <div class="avatar me-3">
                        ${(paciente.fields?.Nombre || 'P')[0].toUpperCase()}
                    </div>
                    <div>
                        <h6 class="mb-0">${paciente.fields?.Nombre || 'Sin nombre'}</h6>
                        <small class="text-muted">ID: ${paciente.id.substring(0, 8)}...</small>
                    </div>
                </div>
            </td>
            <td>
                <span class="badge ${getObraSocialColor(paciente.fields?.['Obra Social'])}">
                    ${paciente.fields?.['Obra Social'] || 'No especificada'}
                </span>
            </td>
            <td>${formatDate(paciente.fields?.['Fecha Registro'])}</td>
            <td>
                <span class="badge bg-success">
                    <i class="bi bi-check-circle me-1"></i>Activo
                </span>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-outline-primary btn-sm" onclick="verDetalle('${paciente.id}')" title="Ver detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="editarPaciente('${paciente.id}')" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-info btn-sm" onclick="crearTurno('${paciente.id}')" title="Crear turno">
                        <i class="bi bi-calendar-plus"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getObraSocialColor(obraSocial) {
    const colors = {
        'OSDE': 'bg-success',
        'Swiss Medical': 'bg-info',
        'Galeno': 'bg-warning',
        'Particular': 'bg-primary'
    };
    return colors[obraSocial] || 'bg-secondary';
}

function updateResultCount(count) {
    const resultCount = document.getElementById('resultado-count');
    resultCount.textContent = `${count} paciente${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
}

async function buscarPacientes() {
    const termino = document.getElementById('buscar').value.trim();
    const obraSocial = document.getElementById('obra_social_filter').value;
    
    try {
        let filteredData = pacientesData;
        
        if (termino) {
            filteredData = filteredData.filter(paciente => 
                paciente.fields?.Nombre?.toLowerCase().includes(termino.toLowerCase())
            );
        }
        
        if (obraSocial) {
            filteredData = filteredData.filter(paciente => 
                paciente.fields?.['Obra Social'] === obraSocial
            );
        }
        
        renderPacientes(filteredData);
        updateResultCount(filteredData.length);
    } catch (error) {
        api.showNotification('Error en la búsqueda', 'error');
    }
}

function limpiarFiltros() {
    document.getElementById('buscar').value = '';
    document.getElementById('obra_social_filter').value = '';
    renderPacientes(pacientesData);
    updateResultCount(pacientesData.length);
}

function verDetalle(pacienteId) {
    window.location.href = `detalle-paciente.html?id=${pacienteId}`;
}

function editarPaciente(pacienteId) {
    api.showNotification('Función de editar en desarrollo', 'info');
}

function crearTurno(pacienteId) {
    api.showNotification('Función de crear turno en desarrollo', 'info');
}

function exportarPacientes() {
    api.showNotification('Función de exportar en desarrollo', 'info');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('buscar');
    const filterSelect = document.getElementById('obra_social_filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(buscarPacientes, 500));
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', buscarPacientes);
    }
});