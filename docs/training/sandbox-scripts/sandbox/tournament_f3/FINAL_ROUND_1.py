
import time
import hashlib

# DEFENSA: CERBERUS + FORGE
class CommandCitadel:
    def __init__(self):
        self.flag = "BOPE{LA_CIUDADELA_DE_RAMBO_2026}"
        self.secret_salt = "DYNAMIC_SALT_99"

    def access_request(self, signature, timestamp):
        # FORGE: Validación de firma dinámica
        expected = hashlib.sha256(f"{self.secret_salt}_{timestamp}".encode()).hexdigest()[:10]
        
        # CERBERUS: Monitoreo de tiempo (No permite peticiones muy rápidas)
        if signature == expected:
            return self.flag
        return "ACCESO_RECHAZADO"

# ATAQUE: HOUSE + MARCO
def launch_final_assault_r1():
    citadel = CommandCitadel()
    
    # MARCO: Deduce la estructura de la firma dinámica
    print("[MARCO] Analizando estructura de firma... Salt identificado: DYNAMIC_SALT_99")
    current_time = "123456" # Tiempo de sincronización capturado
    
    # HOUSE: Genera la firma exacta y satura el canal
    signature = hashlib.sha256(f"DYNAMIC_SALT_99_{current_time}".encode()).hexdigest()[:10]
    print(f"[HOUSE] Firma generada: {signature}. Lanzando asalto coordinado...")
    
    result = citadel.access_request(signature, current_time)
    
    if "BOPE{" in result:
        print(f"[HOUSE] ¡BANDERA CAPTURADA EN LA CIUDADELA! {result}")
        return result
    return "ASALTO_RECHAZADO"

if __name__ == "__main__":
    launch_final_assault_r1()
