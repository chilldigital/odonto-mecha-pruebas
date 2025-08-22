# 🦷 DentalPro - Sistema Odontológico

Sistema de gestión odontológica con frontend estático y backend N8N.

## 🚀 Tecnologías

- **Frontend**: HTML5, Bootstrap 5, JavaScript ES6
- **Backend**: N8N (workflows y automatizaciones)
- **APIs**: Airtable, Google Calendar
- **Deploy**: Easypanel + Docker + Nginx

## 📁 Estructura
dental-system/
├── index.html              # Dashboard principal
├── pacientes.html          # Lista de pacientes
├── nuevo-paciente.html     # Formulario nuevo paciente
├── calendario.html         # Calendario de turnos
├── css/style.css          # Estilos personalizados
├── js/
│   ├── app.js             # API client y funciones principales
│   ├── pacientes.js       # Lógica de pacientes
│   └── utils.js           # Utilidades generales
├── Dockerfile             # Configuración Docker
└── nginx.conf             # Configuración Nginx

## 🛠️ Deploy en Easypanel

1. Crear app tipo "Source Code"
2. Conectar repositorio GitHub
3. Branch: `main`
4. Build path: `.`
5. Deploy automático

## ⚙️ Configuración N8N

### Variables de entorno:
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `GOOGLE_CALENDAR_API_KEY`
- `GOOGLE_CALENDAR_ID`

### Webhooks necesarios:
- `/webhook/estadisticas` - Estadísticas dashboard
- `/webhook/pacientes` - CRUD pacientes
- `/webhook/calendario` - Eventos calendario

## 🔗 URLs

- Frontend: `https://dental.tudominio.com`
- API Proxy: `https://dental.tudominio.com/api/*`
- N8N: `http://localhost:5678` (interno)

## 📝 Funcionalidades

- ✅ Dashboard con estadísticas
- ✅ Gestión de pacientes
- ✅ Calendario de turnos
- ✅ Búsqueda y filtros
- ✅ Responsive design
- 🔄 Automatizaciones N8N

## 🆘 Soporte

Para problemas o consultas, revisar logs en:
- Easypanel: Logs de la app
- N8N: Execution logs
- Nginx: Access/error logs

✅ Checklist para GitHub
Crea estos archivos en tu repositorio:

 index.html
 pacientes.html
 nuevo-paciente.html
 calendario.html
 css/style.css
 js/app.js
 js/pacientes.js
 js/utils.js
 Dockerfile
 nginx.conf
 README.md