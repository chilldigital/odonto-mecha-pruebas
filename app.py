from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
import requests
import json
from datetime import datetime, timedelta, date
from flask_moment import Moment
import os
from dotenv import load_dotenv
from urllib.parse import quote  # para URL-encode del filtro

# 1) Cargar variables de entorno ANTES de leerlas
load_dotenv()

app = Flask(__name__)
moment = Moment(app)
app.secret_key = os.getenv('SECRET_KEY', 'tu-clave-secreta-aqui')

# 2) Configuración de APIs
AIRTABLE_BASE_ID = os.getenv('AIRTABLE_BASE_ID')
AIRTABLE_API_KEY = os.getenv('AIRTABLE_API_KEY')
AIRTABLE_TABLE_NAME = os.getenv('AIRTABLE_TABLE_NAME', 'Pacientes')
GOOGLE_CALENDAR_API_KEY = os.getenv('GOOGLE_CALENDAR_API_KEY')
GOOGLE_CALENDAR_ID = os.getenv('GOOGLE_CALENDAR_ID')
N8N_WEBHOOK_URL = os.getenv('N8N_WEBHOOK_URL')

# Headers para Airtable
AIRTABLE_HEADERS = {
    'Authorization': f'Bearer {AIRTABLE_API_KEY}',
    'Content-Type': 'application/json'
}

class AirtableManager:
    """Clase para manejar operaciones con Airtable"""
    def __init__(self):
        if not AIRTABLE_BASE_ID or not AIRTABLE_API_KEY:
            print("⚠️ Faltan variables de Airtable en .env (AIRTABLE_BASE_ID / AIRTABLE_API_KEY)")
        self.base_url = f'https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/{quote(AIRTABLE_TABLE_NAME)}'

    def crear_paciente(self, nombre, obra_social, historia_clinica, extra_fields=None):
        """Crear un nuevo paciente en Airtable"""
        fields = {
            "Nombre": nombre,
            "Obra Social": obra_social,
            "Historia Clinica": historia_clinica,
            "Fecha Registro": datetime.now().isoformat()
        }
        if isinstance(extra_fields, dict):
            fields.update(extra_fields)

        payload = {"fields": fields}

        try:
            resp = requests.post(self.base_url, headers=AIRTABLE_HEADERS, json=payload, timeout=20)
        except requests.RequestException as e:
            print(f"[Airtable] Error de conexión: {e}")
            return None

        if resp.status_code in (200, 201):
            return resp.json()
        print(f"[Airtable] Error {resp.status_code}: {resp.text}")
        return None

    def buscar_pacientes(self, termino_busqueda=None):
        """Buscar pacientes en Airtable"""
        url = self.base_url
        params = None
        if termino_busqueda:
            formula = f"SEARCH(LOWER('{termino_busqueda}'), LOWER({{Nombre}}))"
            # Usamos params para que requests haga el URL-encode correcto
            params = {"filterByFormula": formula}

        try:
            resp = requests.get(url, headers=AIRTABLE_HEADERS, params=params, timeout=20)
        except requests.RequestException as e:
            print(f"[Airtable] Error de conexión: {e}")
            return []

        if resp.status_code == 200:
            return resp.json().get('records', [])
        print(f"[Airtable] Error {resp.status_code}: {resp.text}")
        return []

    def obtener_paciente(self, record_id):
        """Obtener un paciente específico por ID"""
        url = f"{self.base_url}/{record_id}"
        try:
            resp = requests.get(url, headers=AIRTABLE_HEADERS, timeout=20)
        except requests.RequestException as e:
            print(f"[Airtable] Error de conexión: {e}")
            return None

        if resp.status_code == 200:
            return resp.json()
        print(f"[Airtable] Error {resp.status_code}: {resp.text}")
        return None

class GoogleCalendarManager:
    """Clase para manejar operaciones con Google Calendar"""
    def obtener_eventos_proximos(self, dias=7):
        if not GOOGLE_CALENDAR_API_KEY or not GOOGLE_CALENDAR_ID:
            return []
        now = datetime.utcnow().isoformat() + 'Z'
        time_max = (datetime.utcnow() + timedelta(days=dias)).isoformat() + 'Z'
        url = f'https://www.googleapis.com/calendar/v3/calendars/{GOOGLE_CALENDAR_ID}/events'
        params = {
            'key': GOOGLE_CALENDAR_API_KEY,
            'timeMin': now,
            'timeMax': time_max,
            'singleEvents': True,
            'orderBy': 'startTime'
        }
        try:
            resp = requests.get(url, params=params, timeout=20)
            if resp.status_code == 200:
                return resp.json().get('items', [])
            print(f"[Calendar] Error {resp.status_code}: {resp.text}")
            return []
        except requests.RequestException as e:
            print(f"[Calendar] Error de conexión: {e}")
            return []

class N8NWebhookManager:
    """Clase para manejar webhooks con N8N"""
    def enviar_notificacion(self, tipo, datos):
        if not N8N_WEBHOOK_URL:
            return False
        payload = {'tipo': tipo, 'datos': datos, 'timestamp': datetime.now().isoformat()}
        try:
            resp = requests.post(N8N_WEBHOOK_URL, json=payload, timeout=20)
            return resp.status_code == 200
        except requests.RequestException as e:
            print(f"[N8N] Error al enviar webhook: {e}")
            return False

# 3) Inicializar managers (una sola vez, y después de definir clases)
airtable_manager = AirtableManager()
calendar_manager = GoogleCalendarManager()
n8n_manager = N8NWebhookManager()

@app.context_processor
def utility_processor():
    def calcular_edad(fecha_iso):
        try:
            y, m, d = map(int, fecha_iso[:10].split('-'))
            today = date.today()
            return today.year - y - ((today.month, today.day) < (m, d))
        except Exception:
            return ''
    return dict(calcular_edad=calcular_edad)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/pacientes')
def lista_pacientes():
    termino_busqueda = request.args.get('buscar', '')
    pacientes = airtable_manager.buscar_pacientes(termino_busqueda or None)
    return render_template('pacientes.html', pacientes=pacientes, termino_busqueda=termino_busqueda)

@app.route("/pacientes/nuevo", methods=["GET", "POST"])
def nuevo_paciente():
    if request.method == "POST":
        nombre = request.form.get('nombre', '').strip()
        obra_social = (request.form.get('otra_obra_social', '').strip()
                       if request.form.get('obra_social') == 'Otra'
                       else request.form.get('obra_social', '').strip())
        historia = request.form.get('historia_clinica', '').strip()

        if not nombre or not obra_social or not historia:
            flash("Todos los campos obligatorios deben completarse", "error")
            return render_template("nuevo_paciente.html")

        extra = {
            "DNI": request.form.get('dni', '').strip(),
            "Telefono": request.form.get('telefono', '').strip(),
            "Email": request.form.get('email', '').strip(),
            "Numero Afiliado": request.form.get('numero_afiliado', '').strip(),
            "Fecha Nacimiento": request.form.get('fecha_nacimiento') or None,
            "Alergias": request.form.get('alergias', '').strip(),
            # Antecedentes como lista si hay múltiples checkboxes:
            "Antecedentes": request.form.getlist('antecedentes')
        }

        creado = airtable_manager.crear_paciente(nombre, obra_social, historia, extra_fields=extra)
        if not creado:
            flash("Error al crear el paciente en Airtable (ver consola para detalle).", "error")
            return render_template("nuevo_paciente.html")

        # Notificación opcional a N8N
        n8n_manager.enviar_notificacion('nuevo_paciente', {
            'nombre': nombre,
            'obra_social': obra_social,
            'id_airtable': creado.get('id')
        })

        flash("Paciente creado exitosamente", "success")
        return redirect(url_for("lista_pacientes"))

    return render_template("nuevo_paciente.html")

@app.route('/paciente/<record_id>')
def detalle_paciente(record_id):
    paciente = airtable_manager.obtener_paciente(record_id)
    if not paciente:
        flash('Paciente no encontrado', 'error')
        return redirect(url_for('lista_pacientes'))
    # placeholders para stats/historial si tus templates los esperan
    return render_template('detalle_paciente.html',
                           paciente=paciente,
                           stats={'consultas': 0, 'tratamientos': 0, 'pendientes': 0},
                           proximos_turnos=[],
                           historial_consultas=[],
                           documentos=[])

@app.route('/calendario')
def calendario():
    eventos = calendar_manager.obtener_eventos_proximos()
    turnos_procesados = []
    for evento in eventos:
        start_time = evento.get('start', {})
        fecha_hora = start_time.get('dateTime', start_time.get('date', ''))
        if not fecha_hora:
            continue
        try:
            if 'T' in fecha_hora:
                dt = datetime.fromisoformat(fecha_hora.replace('Z', '+00:00'))
                hora = dt.strftime('%H:%M')
            else:
                dt = datetime.fromisoformat(fecha_hora)
                hora = 'Todo el día'
            turnos_procesados.append({
                'titulo': evento.get('summary', 'Sin título'),
                'descripcion': evento.get('description', ''),
                'fecha': dt.strftime('%Y-%m-%d'),
                'hora': hora,
                'fecha_completa': dt
            })
        except Exception as e:
            print(f"[Calendar] Error procesando evento: {e}")

    turnos_procesados.sort(key=lambda x: x['fecha_completa'])
    return render_template('calendario.html', turnos=turnos_procesados)

@app.route('/api/buscar_pacientes')
def api_buscar_pacientes():
    termino = request.args.get('q', '')
    pacientes = airtable_manager.buscar_pacientes(termino or None)
    resultado = []
    for p in pacientes:
        f = p.get('fields', {})
        resultado.append({
            'id': p['id'],
            'nombre': f.get('Nombre', ''),
            'obra_social': f.get('Obra Social', ''),
            'fecha_registro': f.get('Fecha Registro', '')
        })
    return jsonify(resultado)

@app.route('/debug/airtable')
def debug_airtable():
    print("[DEBUG] BASE_ID:", AIRTABLE_BASE_ID)
    print("[DEBUG] TABLE_NAME:", AIRTABLE_TABLE_NAME)
    # NO imprimo el token entero:
    print("[DEBUG] TOKEN prefix:", (AIRTABLE_API_KEY or "")[:4])

    url = f'https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/{quote(AIRTABLE_TABLE_NAME)}'
    try:
        r = requests.get(url, headers=AIRTABLE_HEADERS, timeout=20)
        return {
            "status_code": r.status_code,
            "ok": r.ok,
            "body": r.json() if r.headers.get('content-type','').startswith('application/json') else r.text
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500


@app.route('/webhook/n8n', methods=['POST'])
def webhook_n8n():
    try:
        data = request.json
        print(f"Webhook recibido de N8N: {data}")
        return jsonify({'status': 'success', 'message': 'Webhook procesado'}), 200
    except Exception as e:
        print(f"Error procesando webhook: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
