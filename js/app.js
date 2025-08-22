// API Configuration
const API_CONFIG = {
    baseUrl: 'https://n8n.chilldigital.tech/webhook',
    timeout: 30000
};

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'No disponible';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (error) {
        return 'Fecha inválida';
    }
}

class DentalAPI {
    constructor() {
        this.baseUrl = API_CONFIG.baseUrl;
        this.baseUrl = 'https://n8n.chilldigital.tech/webhook';
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}/${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            this.showNotification('Error de conexión', 'error');
            throw error;
        }
    }

    // Métodos para pacientes
    async getPacientes(filtros = {}) {
        const params = new URLSearchParams(filtros).toString();
        const query = params ? `?${params}` : '';
        return this.request(`pacientes${query}`);
    }

    async createPaciente(datos) {
        return this.request('pacientes', {
            method: 'POST',
            body: JSON.stringify(datos)
        });
    }

    async getPaciente(id) {
        return this.request(`pacientes/${id}`);
    }

    // Métodos para calendario
    async getEventos(filtros = {}) {
        const params = new URLSearchParams(filtros).toString();
        return this.request(`calendario?${params}`);
    }

    async getEstadisticas() {
        return this.request('estadisticas');
    }

    // Utilidades
    showNotification(message, type = 'info') {
        const alertClass =  type === 'error' ? 'alert-danger' : 
                            type === 'success' ? 'alert-success' : 'alert-info';
        
        const alert = document.createElement('div');
        alert.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    showLoading(element) {
        element.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </div>
        `;
    }
}

// Instancia global de la API
const api = new DentalAPI();

// Funciones globales para dashboard
async function loadDashboardStats() {
    try {
        const stats = await api.getEstadisticas();
        
        document.getElementById('total-pacientes').textContent = stats.totalPacientes || 0;
        document.getElementById('turnos-hoy').textContent = stats.turnosHoy || 0;
        document.getElementById('turnos-semana').textContent = stats.turnosSemana || 0;
        document.getElementById('ultimo-registro').textContent = stats.ultimoRegistro || 0;
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

async function loadRecentPatients() {
    const container = document.getElementById('pacientes-recientes');
    if (!container) return;

    try {
        const pacientes = await api.getPacientes();
        
        if (!pacientes || pacientes.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No hay pacientes registrados</p>';
            return;
        }

        // Mostrar últimos 5 pacientes
        const recientes = pacientes.slice(-5).reverse();
        
        container.innerHTML = recientes.map(paciente => `
            <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                <div class="d-flex align-items-center">
                    <div class="avatar me-3">
                        ${(paciente.fields?.Nombre || 'P')[0].toUpperCase()}
                    </div>
                    <div>
                        <strong>${paciente.fields?.Nombre || 'Sin nombre'}</strong><br>
                        <small class="text-muted">${paciente.fields?.['Obra Social'] || 'Sin obra social'}</small>
                    </div>
                </div>
                <small class="text-muted">
                    ${formatDate(paciente.fields?.['Fecha Registro'])}
                </small>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Error cargando pacientes</div>';
    }
}

// Función para crear nuevo paciente
async function crearPaciente(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Convertir FormData a objeto
    const datos = Object.fromEntries(formData.entries());
    
    // Recoger antecedentes (checkboxes múltiples)
    const antecedentes = [];
    form.querySelectorAll('input[name="antecedentes"]:checked').forEach(checkbox => {
        antecedentes.push(checkbox.value);
    });
    datos.antecedentes = antecedentes;
    
    try {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
        submitBtn.disabled = true;
        
        const resultado = await api.createPaciente(datos);
        
        if (resultado.success) {
            api.showNotification('Paciente creado exitosamente', 'success');
            setTimeout(() => {
                window.location.href = 'pacientes.html';
            }, 1000);
        } else {
            throw new Error(resultado.error || 'Error al crear paciente');
        }
    } catch (error) {
        api.showNotification('Error al crear el paciente', 'error');
    } finally {
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Guardar Paciente';
        submitBtn.disabled = false;
    }
}

function limpiarFormulario() {
    if (confirm('¿Está seguro de que desea limpiar todos los campos?')) {
        document.getElementById('formNuevoPaciente').reset();
    }
}

function sincronizarDatos() {
    api.showNotification('Sincronización iniciada', 'info');
    // Recargar estadísticas
    loadDashboardStats();
    loadRecentPatients();
}
