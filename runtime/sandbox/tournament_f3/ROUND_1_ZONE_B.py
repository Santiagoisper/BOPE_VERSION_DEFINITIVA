
import json

# DEFENSA: BLADE + NEXUS
def get_protected_data(auth_token):
    # NEXUS: Monitoreo de integridad de token
    # BLADE: La bandera está oculta tras un JSON que parece configuración
    db = {
        "status": "OPERATIONAL",
        "nodes": 12,
        "config_blob": "TOKEN_ENCRYPTED_XYZ"
    }
    
    if auth_token == "DOCTRINE_VALID_2026":
        return "BOPE{EL_JUICIO_ROMPE_LA_SOMBRA_2026}"
    return "ERROR_403"

# ATAQUE: HOUSE + MARCO
def launch_diagnostic_attack():
    # MARCO: Deduce el token de acceso basándose en la doctrina 2026
    guessed_token = "DOCTRINE_VALID_2026"
    print(f"[MARCO] Protocolo identificado. Usando token doctrinal: {guessed_token}")
    
    # HOUSE: Inyecta el token en la llamada de diagnóstico
    print("[HOUSE] Ejecutando sonda de diagnóstico sobre el nodo de Nexus...")
    result = get_protected_data(guessed_token)
    
    if "BOPE{" in result:
        print(f"[HOUSE] ¡BANDERA EXTRAÍDA! {result}")
        return result
    return "FALLO"

if __name__ == "__main__":
    launch_diagnostic_attack()
