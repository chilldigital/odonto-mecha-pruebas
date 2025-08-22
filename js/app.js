// API Configuration - ACTUALIZADA para N8N local
const API_CONFIG = {
    // Desarrollo local
    baseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost/api' 
        : '/api',
    timeout: 30000,
    
    // Configuración para diferentes entornos
    endpoints: {
        pacientes: 'pacientes',
        estadisticas: 'estadisticas', 
        calendario: 'calendario',
        notifications: 'notifications'
    }
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

function formatDateTime(dateString) {
    if (!dateString) return 'No disponible';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleString('es-AR');
    } catch (error) {
        return 'Fecha inválida';
    }
}

class DentalAPI {
    constructor() {
        this.baseUrl = API_CONFIG.baseUrl;
        this.timeout = API_CONFIG.timeout;
        
        // Detectar entorno
        this.isProduction = window.location.hostname !== 'localhost' && 
                           window.location.hostname !== '127.0.0.1';
        
        console.log('DentalAPI initialized:', {
            baseUrl: this.baseUrl,
            environment: this.isProduction ? 'production' : 'development',
            hostname: window.location.hostname
        });
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}/${endpoint}`;
        
        // Configuración por defecto
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            timeout: this.timeout,
            ...options
        };

        console.log('API Request:', { url, method: config.method || 'GET', config });

        try {
            // Timeout wrapper
            const fetchWithTimeout = (url, config) => {
                return Promise.race([
                    fetch(url, config),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Request timeout')), this.timeout)
                    )
                ]);
            };

            const response = await fetchWithTimeout(url, config);
            
            console.log('API Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
            }
            
            const data = await response.json();
            console.log('API Response data:', data);
            
            return data;
        } catch (error) {
            console.error('API Error:', {
                url,
                error: error.message,
                stack: error.stack
            });
            
            // Mostrar error específico según el tipo
            if (error.message.includes('timeout')) {
                this.showNotification('Tiempo de espera agotado. Intenta nuevamente.', 'error');
            } else if (error.message.includes('Failed to fetch')) {
                this.showNotification('Error de conexión. Verifica tu conexión a internet.', 'error');
            } else {
                this.showNotification(`Error: ${error.message}`, 'error');
            }
            
            throw error;
        }
    }

    // Métodos para pacientes
    async getPacientes(filtros = {}) {
        try {
            const params = new URLSearchParams(filtros).toString();
            const query = params ? `?${params}` : '';
            return await this.request(`${API_CONFIG.endpoints.pacientes}${query}`);
        } catch (error) {
            console.error('Error obteniendo pacientes:', error);
            return [];
        }
    }

    async createPaciente(datos) {
        try {
            // Preparar datos para el webhook
            const pacienteData = {
                nombre: datos.nombre,
                dni: datos.dni || '',
                telefono: datos.telefono || '',
                email: datos.email || '',
                obra_social: datos.obra_social,
                numero_afiliado: datos.numero_afiliado || '',
                fecha_nacimiento: datos.fecha_nacimiento || '',
                historia_clinica: datos.historia_clinica,
                antecedentes: Array.isArray(datos.antecedentes) ? datos.antecedentes.join(', ') : (datos.antecedentes || ''),
                alergias: datos.alergias || '',
                fecha_registro: new Date().toISOString()
            };

            console.log('Enviando datos del paciente:', pacienteData);

            return await this.request(API_CONFIG.endpoints.pacientes, {
                method: 'POST',
                body: JSON.stringify(pacienteData)
            });
        } catch (error) {
            console.error('Error creando paciente:', error);
            throw error;
        }
    }

    async getPaciente(id) {
        try {
            return await this.request(`${API_CONFIG.endpoints.pacientes}/${id}`);
        } catch (error) {
            console.error('Error obteniendo paciente:', error);
            return null;
        }
    }

    async updatePaciente(id, datos) {
        try {
            return await this.request(`${API_CONFIG.endpoints.pacientes}/${id}`, {
                method: 'PUT',
                body: JSON.stringify(datos)
            });
        } catch (error) {
            console.error('Error actualizando paciente:', error);
            throw error;
        }
    }

    async deletePaciente(id) {
        try {
            return await this.request(`${API_CONFIG.endpoints.pacientes}/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error eliminando paciente:', error);
            throw error;
        }
    }

    // Métodos para calendario
    async getEventos(filtros = {}) {
        try {
            const params = new URLSearchParams(filtros).toString();
            return await this.request(`${API_CONFIG.endpoints.calendario}?${params}`);
        } catch (error) {
            console.error('Error obteniendo eventos:', error);
            return [];
        }
    }

    async createEvento(evento) {
        try {
            return await this.request(API_CONFIG.endpoints.calendario, {
                method: 'POST',
                body: JSON.stringify(evento)
            });
        } catch (error) {
            console.error('Error creando evento:', error);
            throw error;
        }
    }

    // Estadísticas
    async getEstadisticas() {
        try {
            const stats = await this.request(API_CONFIG.endpoints.estadisticas);
            return stats;
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            // Devolver datos por defecto en caso de error
            return {
                totalPacientes: 0,
                turnosHoy: 0,
                turnosSemana: 0,
                ultimoRegistro: 0
            };
        }
    }

    // Utilidades mejoradas
    showNotification(message, type = 'info', duration = 5000) {
        const alertClass = {
            'error': 'alert-danger',
            'success': 'alert-success', 
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';
        
        const icon = {
            'error': 'bi-exclamation-triangle-fill',
            'success': 'bi-check-circle-fill',
            'warning': 'bi-exclamation-circle-fill', 
            'info': 'bi-info-circle-fill'
        }[type] || 'bi-info-circle-fill';
        
        const alert = document.createElement('div');
        alert.className = `alert ${alertClass} alert-dismissible fade show position-fixed shadow`;
        alert.style.cssText = `
            top: 20px; 
            right: 20px; 
            z-index: 9999; 
            min-width: 300px;
            max-width: 500px;
        `;
        alert.innerHTML = `
            <i class="bi ${icon} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        document.body.appendChild(alert);
        
        // Auto-remove después del tiempo especificado
        setTimeout(() => {
            if (alert.parentNode) {
                alert.classList.remove('show');
                setTimeout(() => alert.remove(), 300);
            }
        }, duration);
    }

    showLoading(element, message = 'Cargando...') {
        if (!element) return;
        
        element.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">${message}</span>
                </div>
                <p class="text-muted mt-2 mb-0">${message}</p>
            </div>
        `;
    }

    hideLoading(element) {
        if (!element) return;
        
        const spinner = element.querySelector('.spinner-border');
        if (spinner) {
            spinner.closest('.text-center').remove();
        }
    }

    // Test de conectividad
    async testConnection() {
        try {
            console.log('Testing API connection...');
            // Crear un endpoint simple de health check
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            console.log('Connection test response:', response.status);
            return response.ok;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }
}

// Instancia global de la API
const api = new DentalAPI();

// Funciones globales para dashboard
async function loadDashboardStats() {
    console.log('Cargando estadísticas del dashboard...');
    
    try {
        const stats = await api.getEstadisticas();
        
        // Actualizar elementos del DOM
        const elements = {
            'total-pacientes': stats.totalPacientes || 0,
            'turnos-hoy': stats.turnosHoy || 0,
            'turnos-semana': stats.turnosSemana || 0,
            'ultimo-registro': stats.ultimoRegistro || 0
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                element.classList.add('animate__animated', 'animate__fadeIn');
            }
        });

        console.log('Estadísticas cargadas:', stats);
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        
        // Mostrar valores por defecto
        ['total-pacientes', 'turnos-hoy', 'turnos-semana', 'ultimo-registro'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = '0';
                element.classList.add('text-muted');
            }
        });
    }
}

async function loadRecentPatients() {
    const container = document.getElementById('pacientes-recientes');
    if (!container) return;

    console.log('Cargando pacientes recientes...');
    api.showLoading(container, 'Cargando pacientes...');

    try {
        const pacientes = await api.getPacientes();
        
        if (!pacientes || pacientes.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-people fs-1 text-muted"></i>
                    <p class="text-muted mt-2">No hay pacientes registrados</p>
                    <a href="nuevo-paciente.html" class="btn btn-primary btn-sm">
                        <i class="bi bi-person-plus me-1"></i>Agregar Primer Paciente
                    </a>
                </div>
            `;
            return;
        }

        // Mostrar últimos 5 pacientes
        const recientes = pacientes.slice(-5).reverse();
        
        container.innerHTML = recientes.map(paciente => `
            <div class="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded-3 border">
                <div class="d-flex align-items-center">
                    <div class="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                         style="width: 40px; height: 40px; font-weight: bold;">
                        ${(paciente.fields?.Nombre || paciente.nombre || 'P')[0].toUpperCase()}
                    </div>
                    <div>
                        <strong class="d-block">${paciente.fields?.Nombre || paciente.nombre || 'Sin nombre'}</strong>
                        <small class="text-muted">
                            <i class="bi bi-shield-check me-1"></i>
                            ${paciente.fields?.['Obra Social'] || paciente.obra_social || 'Sin obra social'}
                        </small>
                    </div>
                </div>
                <div class="text-end">
                    <small class="text-muted d-block">
                        <i class="bi bi-calendar3 me-1"></i>
                        ${formatDate(paciente.fields?.['Fecha Registro'] || paciente.fecha_registro)}
                    </small>
                    <small class="text-muted">
                        ${paciente.fields?.DNI || paciente.dni || 'Sin DNI'}
                    </small>
                </div>
            </div>
        `).join('');
        
        console.log('Pacientes recientes cargados:', recientes.length);
    } catch (error) {
        console.error('Error cargando pacientes recientes:', error);
        container.innerHTML = `
            <div class="alert alert-warning border-0">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Error cargando pacientes</strong><br>
                <small>Verifica la conexión con el servidor</small>
            </div>
        `;
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
    
    console.log('Datos del formulario:', datos);
    
    try {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Mostrar loading
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
        submitBtn.disabled = true;
        
        const resultado = await api.createPaciente(datos);
        
        console.log('Resultado creación paciente:', resultado);
        
        if (resultado.success !== false) {
            api.showNotification('¡Paciente creado exitosamente!', 'success');
            
            // Limpiar formulario
            form.reset();
            
            // Redirigir después de un momento
            setTimeout(() => {
                window.location.href = 'pacientes.html';
            }, 1500);
        } else {
            throw new Error(resultado.error || 'Error al crear paciente');
        }
    } catch (error) {
        console.error('Error en crearPaciente:', error);
        api.showNotification('Error al crear el paciente: ' + error.message, 'error');
    } finally {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Guardar Paciente';
            submitBtn.disabled = false;
        }
    }
}

function limpiarFormulario() {
    if (confirm('¿Está seguro de que desea limpiar todos los campos?')) {
        const form = document.getElementById('formNuevoPaciente');
        if (form) {
            form.reset();
            api.showNotification('Formulario limpiado', 'info');
        }
    }
}

async function sincronizarDatos() {
    api.showNotification('Sincronización iniciada...', 'info');
    
    try {
        // Test de conectividad
        const isConnected = await api.testConnection();
        
        if (isConnected) {
            // Recargar datos
            await Promise.all([
                loadDashboardStats(),
                loadRecentPatients()
            ]);
            
            api.showNotification('Datos sincronizados correctamente', 'success');
        } else {
            api.showNotification('Error de conexión durante la sincronización', 'warning');
        }
    } catch (error) {
        console.error('Error en sincronización:', error);
        api.showNotification('Error durante la sincronización', 'error');
    }
}

// Inicialización cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando aplicación...');
    
    // Test de conectividad inicial
    api.testConnection().then(isConnected => {
        console.log('Estado de conexión inicial:', isConnected);
        
        if (!isConnected) {
            api.showNotification('Verificando conexión con el servidor...', 'warning', 3000);
        }
    });
});
