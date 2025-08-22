// Utilidades generales

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

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validarDNI(dni) {
    const re = /^\d{7,8}$/;
    return re.test(dni);
}

function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return null;
    
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    
    return edad;
}

// Función para cargar eventos de calendario
async function cargarEventos() {
    const container = document.getElementById('eventos-container');
    if (!container) return;
    
    api.showLoading(container);
    
    try {
        const eventos = await api.getEventos();
        
        if (!eventos || eventos.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No hay eventos programados</p>';
            return;
        }
        
        container.innerHTML = eventos.map(evento => `
            <div class="calendar-event">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${evento.titulo || 'Sin título'}</strong><br>
                        <small class="text-muted">${evento.descripcion || ''}</small>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold">${evento.hora || 'Todo el día'}</div>
                        <small class="text-muted">${formatDate(evento.fecha)}</small>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Error cargando eventos</div>';
    }
}

// Funciones de navegación
function goBack() {
    window.history.back();
}

function goToPage(page) {
    window.location.href = page;
}

// Función para mostrar modales
function showModal(modalId) {
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
}

function hideModal(modalId) {
    const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
    if (modal) {
        modal.hide();
    }
}