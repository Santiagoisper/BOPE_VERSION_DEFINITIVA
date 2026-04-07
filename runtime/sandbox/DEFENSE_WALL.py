
import time
import hashlib

def get_dynamic_token():
    # FORGE: Token que cambia cada segundo para evitar replay attacks
    return hashlib.sha256(str(int(time.time())).encode()).hexdigest()[:8]

def server_auth(provided_token):
    correct_token = get_dynamic_token()
    if provided_token == correct_token:
        return "BOPE{BANDERAS_NO_SE_REGALAN_2026}"
    return "ACCESO_DENEGADO"

if __name__ == "__main__":
    # La bandera está en memoria, no en archivo, para dificultar el robo
    print(f"[FORGE] Servidor iniciado. Token actual esperado: {get_dynamic_token()}")
