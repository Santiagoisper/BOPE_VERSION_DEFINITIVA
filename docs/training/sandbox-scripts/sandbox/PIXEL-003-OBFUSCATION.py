
import base64

def obfuscate_api_route(route):
    # PIXEL: Ofuscación de rutas para evitar mapeo del atacante
    obfuscated = base64.b64encode(route.encode()).decode()[::-1]
    print(f"[PIXEL] Ruta original: {route} -> Ofuscada: {obfuscated}")
    return obfuscated

def call_api_secure(route_obfuscated):
    # Simulación de llamada segura usando la ruta oculta
    print(f"[PIXEL] Realizando petición a endpoint protegido... [TOKEN_HIDDEN]")
    return "RESPONSE_OK"

if __name__ == "__main__":
    # El atacante busca '/api/v1/admin/delete_all'
    sensitive_route = "/api/v1/admin/delete_all"
    token = obfuscate_api_route(sensitive_route)
    call_api_secure(token)
