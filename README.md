# 🦷 Sistema Odontológico

Sistema integral de gestión para consultorios odontológicos desarrollado con **Python Flask** y **Bootstrap 5**. Integra automáticamente con **Airtable**, **Google Calendar** y **N8N** para una gestión completa y automatizada.

## ✨ Características Principales

- 📋 **Gestión de Pacientes**: Registro, búsqueda y administración completa de historias clínicas
- 📅 **Calendario Inteligente**: Sincronización automática con Google Calendar
- 🔄 **Automatizaciones**: Integración con N8N para workflows automatizados
- 💾 **Base de Datos**: Almacenamiento en Airtable con API robusta
- 📱 **Responsive**: Interfaz moderna y adaptable a todos los dispositivos
- 🔐 **Seguro**: Configuración de seguridad para entornos de producción

## 🚀 Tecnologías Utilizadas

- **Backend**: Python 3.8+ con Flask
- **Frontend**: Bootstrap 5.3 + JavaScript ES6
- **Base de Datos**: Airtable (API)
- **Calendario**: Google Calendar API
- **Automatización**: N8N Webhooks
- **Estilos**: CSS3 con variables personalizadas

## 📋 Requisitos Previos

### Software Necesario
- Python 3.8 o superior
- Visual Studio Code (recomendado)
- Git

### Cuentas y APIs Requeridas

1. **Airtable**
   - Cuenta gratuita en [airtable.com](https://airtable.com)
   - Base de datos creada para pacientes
   - API Key generada

2. **Google Calendar**
   - Cuenta de Google
   - Proyecto en Google Cloud Console
   - API Key para Calendar API

3. **N8N** (Opcional)
   - Instancia de N8N local o en la nube
   - Webhook configurado

## 🛠️ Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/sistema-odontologico.git
cd sistema-odontologico
```

### 2. Crear Entorno Virtual

```bash
# Crear entorno virtual
python -m venv dental_env

# Activar entorno virtual
# En Windows:
dental_env\Scripts\activate
# En macOS/Linux:
source dental_env/bin/activate
```

### 3. Instalar Dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus configuraciones
```

Configura las siguientes variables en tu archivo `.env`:

```env
# Flask Configuration
SECRET_KEY=tu-clave-secreta-super-segura-aqui
FLASK_ENV=development
FLASK_DEBUG=True

# Airtable Configuration
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX

# Google Calendar API
GOOGLE_CALENDAR_API_KEY=AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_CALENDAR_ID=tu-email@gmail.com

# N8N Webhook Configuration
N8N_WEBHOOK_URL=https://tu-instancia-n8n.com/webhook/dental-system
```

## ⚙️ Configuración de Servicios

### Configurar Airtable

1. **Crear Base de Datos**:
   - Ve a [airtable.com](https://airtable.com) y crea una nueva base
   - Nómbrala "Sistema Odontológico" o similar

2. **Configurar Tabla de Pacientes**:
   Crea una tabla llamada "Pacientes" con los siguientes campos:

   | Campo | Tipo | Descripción |
   |-------|------|-------------|
   | Nombre | Single line text | Nombre completo del paciente |
   | DNI | Single line text | Documento de identidad |
   | Telefono | Phone number | Número de teléfono |
   | Email | Email | Correo electrónico |
   | Obra Social | Single select | Obra social del paciente |
   | Numero Afiliado | Single line text | Número de afiliado |
   | Fecha Nacimiento | Date | Fecha de nacimiento |
   | Historia Clinica | Long text | Historia clínica completa |
   | Alergias | Long text | Alergias conocidas |
   | Antecedentes | Multiple select | Antecedentes médicos |
   | Fecha Registro | Date and time | Fecha de registro automática |
   | Estado | Single select | Estado del paciente (Activo/Inactivo) |
   | Notas | Long text | Notas adicionales |

3. **Obtener API Key**:
   - Ve a tu [cuenta de Airtable](https://airtable.com/account)
   - Genera un Personal Access Token
   - Copia el Base ID desde la URL de tu base

### Configurar Google Calendar

1. **Crear Proyecto en Google Cloud Console**:
   ```
   1. Ve a console.cloud.google.com
   2. Crea un nuevo proyecto
   3. Habilita la Calendar API
   4. Crea credenciales (API Key)
   5. Configura las restricciones de la API Key
   ```

2. **Obtener Calendar ID**:
   - Ve a Google Calendar
   - En configuración, busca tu calendar ID
   - Generalmente es tu email de Gmail

### Configurar N8N (Opcional)

1. **Instalar N8N**:
   ```bash
   npm install n8n -g
   # o usar Docker
   docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
   ```

2. **Crear Webhook**:
   - Ve a http://localhost:5678
   - Crea un nuevo workflow
   - Agrega un nodo Webhook
   - Configura la URL del webhook

## 🚀 Ejecución

### Modo Desarrollo

```bash
# Activar entorno virtual
source dental_env/bin/activate  # o dental_env\Scripts\activate en Windows

# Ejecutar aplicación
python app.py

# O usar Flask directamente
export FLASK_APP=app.py
export FLASK_ENV=development
flask run
```

La aplicación estará disponible en: `http://localhost:5000`

### Modo Producción

```bash
# Instalar servidor WSGI (recomendado: gunicorn)
pip install gunicorn

# Configurar variables de producción
export FLASK_ENV=production
export SECRET_KEY="tu-clave-super-secreta-de-produccion"

# Ejecutar con gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

## 📁 Estructura del Proyecto

```
sistema-odontologico/
├── app.py                 # Aplicación principal de Flask
├── config.py             # Configuraciones del sistema
├── requirements.txt      # Dependencias de Python
├── .env.example         # Variables de entorno de ejemplo
├── README.md            # Documentación
├── templates/           # Templates HTML
│   ├── base.html       # Template base
│   ├── index.html      # Página principal
│   ├── pacientes.html  # Lista de pacientes
│   ├── nuevo_paciente.html  # Formulario nuevo paciente
│   ├── detalle_paciente.html  # Detalle de paciente
│   └── calendario.html # Página de calendario
├── static/             # Archivos estáticos (CSS, JS, imágenes)
│   ├── css/
│   ├── js/
│   └── img/
└── logs/              # Archivos de log (creado automáticamente)
```

## 🔧 Uso del Sistema

### Gestión de Pacientes

1. **Agregar Nuevo Paciente**:
   - Ve a "Nuevo Paciente" en el menú
   - Completa todos los campos obligatorios
   - El paciente se guarda automáticamente en Airtable

2. **Buscar Pacientes**:
   - Usa la barra de búsqueda en "Pacientes"
   - Filtra por obra social
   - Cambia entre vista de tabla y tarjetas

3. **Gestionar Historia Clínica**:
   - Cada paciente tiene su historia clínica completa
   - Se pueden agregar notas y antecedentes
   - Sistema de alertas para alergias

### Gestión de Calendario

1. **Ver Turnos**:
   - Sincronización automática con Google Calendar
   - Vista por día, semana o mes
   - Filtros por estado de turno

2. **Crear Turnos**:
   - Botón "Nuevo Turno" 
   - Selección de paciente existente o nuevo
   - Configuración de recordatorios automáticos

3. **Gestionar Turnos**:
   - Editar, confirmar o cancelar turnos
   - Envío de notificaciones automáticas
   - Exportación de agenda

## 🤖 Automatizaciones con N8N

El sistema puede integrarse con N8N para automatizaciones avanzadas:

### Workflows Disponibles

1. **Nuevo Paciente**:
   - Envío automático de email de bienvenida
   - Creación de expediente digital
   - Notificación al equipo médico

2. **Recordatorios de Turnos**:
   - SMS/WhatsApp 24h antes de la cita
   - Email de confirmación
   - Actualización automática de estados

3. **Seguimiento Post-Consulta**:
   - Encuesta de satisfacción automática
   - Programación de controles
   - Facturación automatizada

### Configurar Workflow Ejemplo

```json
{
  "name": "Nuevo Paciente Workflow",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "nuevo-paciente",
        "responseMode": "onReceived"
      }
    },
    {
      "name": "Enviar Email",
      "type": "n8n-nodes-base.emailSend",
      "parameters": {
        "to": "={{$node.Webhook.json.email}}",
        "subject": "Bienvenido a nuestro consultorio",
        "text": "Gracias por registrarte, {{$node.Webhook.json.nombre}}"
      }
    }
  ]
}
```

## 🔐 Seguridad

### Medidas Implementadas

- **Validación de Datos**: Validación tanto en frontend como backend
- **Variables de Entorno**: Credenciales protegidas en archivo .env
- **HTTPS Ready**: Configuración lista para SSL en producción
- **Headers de Seguridad**: Configuración de headers seguros
- **Rate Limiting**: Protección contra ataques de fuerza bruta (opcional)

### Recomendaciones de Producción

1. **Usar HTTPS**: Siempre utilizar certificados SSL
2. **Variables de Entorno**: No hardcodear credenciales
3. **Backup Regular**: Configurar backups automáticos de Airtable
4. **Monitoring**: Implementar logs y monitoreo
5. **Actualizaciones**: Mantener dependencias actualizadas

## 🐛 Solución de Problemas

### Errores Comunes

**Error: "Airtable API Key invalid"**
```
Solución: Verificar que el API Key y Base ID estén correctos en .env
```

**Error: "Google Calendar API quota exceeded"**
```
Solución: Revisar límites de API en Google Cloud Console
```

**Error: "Port already in use"**
```
Solución: 
# Encontrar proceso en puerto 5000
netstat -ano | findstr :5000  # Windows
lsof -i :5000  # macOS/Linux

# Cambiar puerto
flask run --port 5001
```

### Logs y Debugging

```bash
# Ver logs en tiempo real
tail -f logs/app.log

# Ejecutar en modo debug
export FLASK_DEBUG=1
flask run
```

## 🚢 Deployment

### Heroku

```bash
# Instalar Heroku CLI
# Crear Procfile
echo "web: gunicorn app:app" > Procfile

# Deploy
heroku create tu-sistema-odontologico
heroku config:set AIRTABLE_API_KEY=tu_key
heroku config:set AIRTABLE_BASE_ID=tu_base_id
git push heroku main
```

### DigitalOcean/AWS

```bash
# Usar gunicorn con systemd
sudo systemctl enable dental-system
sudo systemctl start dental-system

# Configurar nginx como reverse proxy
sudo nano /etc/nginx/sites-available/dental-system
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Changelog

### v1.0.0 (2025-08-18)
- ✨ Sistema base de gestión de pacientes
- 📅 Integración con Google Calendar
- 🔄 Webhooks para N8N
- 📱 Interfaz responsive con Bootstrap 5
- 💾 Integración completa con Airtable

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Soporte

Para soporte técnico o consultas:
- Email: soporte@tu-consultorio.com
- Issues: [GitHub Issues](https://github.com/tu-usuario/sistema-odontologico/issues)
- Documentación: [Wiki del proyecto](https://github.com/tu-usuario/sistema-odontologico/wiki)

---

⭐ **¿Te gusta el proyecto? ¡Dale una estrella en GitHub!**

Desarrollado con ❤️ para la comunidad odontológica