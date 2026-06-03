
import time
import random

# DEFENSA: SICARIO + PIXEL
class AdaptiveDefense:
    def __init__(self):
        self.flag = "BOPE{EL_MURO_TAMBIEN_ATACA_2026}"
        self.current_id = "INIT_ID"

    def get_dynamic_id(self):
        # PIXEL: Cambia el ID de acceso constantemente
        self.current_id = f"ID_{random.randint(1000, 9999)}"
        return self.current_id

    def access_vault(self, provided_id):
        # SICARIO: Si el ID es viejo, se dispara la alarma
        if provided_id == self.current_id:
            return self.flag
        print(f"[SICARIO] ¡INTRUSO DETECTADO! ID incorrecto: {provided_id}")
        return "ALARMA_ACTIVADA"

# ATAQUE: CERBERUS + FORGE
def launch_counter_attack():
    defense = AdaptiveDefense()
    
    print("[CERBERUS] Sincronizando con el generador de IDs de Pixel...")
    # Cerberus captura el ID en tiempo real
    target_id = defense.get_dynamic_id()
    print(f"[CERBERUS] ID capturado: {target_id}")
    
    print("[FORGE] Reconstruyendo paquete de acceso para el ID capturado...")
    result = defense.access_vault(target_id)
    
    if "BOPE{" in result:
        print(f"[FORGE] ¡BANDERA RECUPERADA! {result}")
        return True
    return False

if __name__ == "__main__":
    launch_counter_attack()
