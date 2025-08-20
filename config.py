import os
from datetime import timedelta

class Config:
    """Configuración base del sistema odontológico."""
    
    # Configuración básica de Flask
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # Configuración de Airtable
    AIRTABLE_BASE_ID = os.environ.get('AIRTABLE_BASE_ID')
    AIRTABLE_API_KEY = os.environ.get('AIRTABLE_API_KEY')
    AIRTABLE_TABLE_NAME = os.environ.get('AIRTABLE_TABLE_NAME') or 'Odonto'
    
    # Configuración de Google Calendar
    GOOGLE_CALENDAR_API_KEY = os.environ.get('GOOGLE_CALENDAR_API_KEY')
    GOOGLE_CALENDAR_ID = os.environ.get('GOOGLE_CALENDAR_ID')
    
    # Configuración de N8N
    N8N_WEBHOOK_URL = os.environ.get('N8N_WEBHOOK_URL')
    
    # Configuración de zona horaria
    TIMEZONE = os.environ.get('TIMEZONE') or 'America/Argentina/Buenos_Aires'
    
    # Límites del sistema
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16777216))  # 16MB
    MAX_PACIENTES_POR_PAGINA = 50
    MAX_TURNOS_POR_DIA = 20
    
    # Configuración de sesiones
    PERMANENT_SESSION_LIFETIME = timedelta(hours=8)
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # URLs de APIs externas
    AIRTABLE_BASE_URL = 'https://api.airtable.com/v0'
    GOOGLE_CALENDAR_BASE_URL = 'https://www.googleapis.com/calendar/v3'
    
    # Configuración de logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    @staticmethod
    def init_app(app):
        """Inicializar configuración específica de la aplicación."""
        pass

class DevelopmentConfig(Config):
    """Configuración para desarrollo."""
    DEBUG = True
    FLASK_ENV = 'development'
    
    # Configuración menos estricta para desarrollo
    SESSION_COOKIE_SECURE = False
    
    # Base de datos local para desarrollo (opcional)
    DATABASE_URL = os.environ.get('DATABASE_URL') or 'sqlite:///dental_dev.db'

class ProductionConfig(Config):
    """Configuración para producción."""
    DEBUG = False
    FLASK_ENV = 'production'
    
    # Configuración más estricta para producción
    SESSION_COOKIE_SECURE = True
    
    # Configuración de logging más detallada
    LOG_LEVEL = 'WARNING'
    
    @staticmethod
    def init_app(app):
        Config.init_app(app)
        
        # Log de errores por email (opcional)
        import logging
        from logging.handlers import SMTPHandler
        
        if app.config.get('MAIL_SERVER'):
            auth = None
            if app.config.get('MAIL_USERNAME') or app.config.get('MAIL_PASSWORD'):
                auth = (app.config['MAIL_USERNAME'], app.config['MAIL_PASSWORD'])
            
            secure = None
            if app.config.get('MAIL_USE_TLS'):
                secure = ()
            
            mail_handler = SMTPHandler(
                mailhost=(app.config['MAIL_SERVER'], app.config['MAIL_PORT']),
                fromaddr=app.config['MAIL_USERNAME'],
                toaddrs=[app.config['ADMIN_EMAIL']],
                subject='Error en Sistema Odontológico',
                credentials=auth,
                secure=secure
            )
            
            mail_handler.setLevel(logging.ERROR)
            app.logger.addHandler(mail_handler)

class TestingConfig(Config):
    """Configuración para testing."""
    TESTING = True
    DEBUG = True
    
    # Usar datos de prueba
    AIRTABLE_BASE_ID = 'test_base'
    AIRTABLE_API_KEY = 'test_key'
    N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/test'
    
    # Desactivar CSRF para tests
    WTF_CSRF_ENABLED = False

# Configuraciones disponibles
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

# Validador de configuración
def validate_config():
    """Valida que todas las configuraciones necesarias estén presentes."""
    required_vars = [
        'AIRTABLE_BASE_ID',
        'AIRTABLE_API_KEY'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.environ.get(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("⚠️  Variables de entorno faltantes:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPor favor, configure estas variables en su archivo .env")
        return False
    
    print("✅ Configuración validada correctamente")
    return True

# Configuraciones específicas por servicios
class AirtableConfig:
    """Configuración específica para Airtable."""
    
    HEADERS = {
        'Authorization': f'Bearer {os.environ.get("AIRTABLE_API_KEY")}',
        'Content-Type': 'application/json'
    }
    
    # Estructura de campos esperada en Airtable
    PATIENT_FIELDS = {
        'Nombre': 'singleLineText',
        'DNI': 'singleLineText', 
        'Telefono': 'phoneNumber',
        'Email': 'email',
        'Obra Social': 'singleSelect',
        'Numero Afiliado': 'singleLineText',
        'Fecha Nacimiento': 'date',
        'Historia Clinica': 'longText',
        'Alergias': 'longText',
        'Antecedentes': 'multipleSelects',
        'Fecha Registro': 'dateTime',
        'Estado': 'singleSelect',
        'Notas': 'longText'
    }

class GoogleCalendarConfig:
    """Configuración específica para Google Calendar."""
    
    # Scopes necesarios para la API de Google Calendar
    SCOPES = [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events'
    ]
    
    # Configuración de eventos
    DEFAULT_EVENT_DURATION = 60  # minutos
    MAX_EVENTS_PER_REQUEST = 100
    
    # Colores para diferentes tipos de citas
    EVENT_COLORS = {
        'consulta': '1',      # Lavanda
        'limpieza': '2',      # Salvia
        'tratamiento': '3',   # Uva
        'control': '4',       # Flamingo
        'emergencia': '11'    # Rojo
    }

class N8NConfig:
    """Configuración específica para N8N."""
    
    # Tipos de webhooks que maneja el sistema
    WEBHOOK_TYPES = {
        'nuevo_paciente': 'patient.created',
        'turno_creado': 'appointment.created', 
        'turno_confirmado': 'appointment.confirmed',
        'turno_cancelado': 'appointment.cancelled',
        'recordatorio_enviado': 'reminder.sent'
    }
    
    # Configuración de timeouts
    TIMEOUT = 30  # segundos
    MAX_RETRIES = 3