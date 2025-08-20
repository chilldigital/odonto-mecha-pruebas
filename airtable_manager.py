# airtable_manager.py (o dentro de app.py donde tengas tu clase)
import os, requests
from urllib.parse import quote

class AirtableManager:
    def __init__(self, base_id=None, table_name=None, token=None):
        self.base_id = base_id or os.getenv("AIRTABLE_BASE_ID")
        self.table_name = table_name or os.getenv("AIRTABLE_TABLE", "Odonto")
        # Acepta API Key antigua (key_) o PAT (pat_)
        self.token = token or os.getenv("AIRTABLE_ACCESS_TOKEN") or os.getenv("AIRTABLE_API_KEY")
        self.base_url = f"https://api.airtable.com/v0/{self.base_id}/{quote(self.table_name)}"
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    def crear_paciente(self, form):
        # Mapeo de campos desde tu formulario HTML a Airtable
        antecedentes = form.getlist("antecedentes") if hasattr(form, "getlist") else form.get("antecedentes", [])
        if isinstance(antecedentes, str):
            antecedentes = [a.strip() for a in antecedentes.split(",") if a.strip()]

        fields = {
            "Nombre": form.get("nombre", "").strip(),
            "DNI": form.get("dni", "").strip(),
            "Telefono": form.get("telefono", "").strip(),
            "Email": form.get("email", "").strip(),
            "Obra Social": (form.get("otra_obra_social").strip() 
                            if form.get("obra_social") == "Otra" and form.get("otra_obra_social") 
                            else form.get("obra_social", "").strip()),
            "Numero Afiliado": form.get("numero_afiliado", "").strip(),
            "Fecha Nacimiento": form.get("fecha_nacimiento") or None,
            "Historia Clinica": form.get("historia_clinica", "").strip(),
            "Alergias": form.get("alergias", "").strip(),
            "Antecedentes": antecedentes,  # si es multiselect, Airtable lo toma como array de strings
        }

        payload = {"fields": fields}

        try:
            resp = requests.post(self.base_url, headers=self.headers, json=payload, timeout=20)
        except requests.RequestException as e:
            # Log fuerte para ver el problema de red
            print(f"[Airtable] Error de conexión: {e}")
            return None, {"error": "conexion", "detalle": str(e)}

        # Aceptar 200/201 y loguear si no
        if resp.status_code in (200, 201):
            return resp.json(), None

        # LOG de error con detalle del body
        print(f"[Airtable] Error {resp.status_code}: {resp.text}")
        try:
            return None, resp.json()
        except Exception:
            return None, {"error": "desconocido", "raw": resp.text, "status": resp.status_code}
