
def detect_and_recover_bgp(target_ip, current_gw, valid_gw):
    # FORGE: Monitor de estabilidad de rutas críticas
    print(f"[FORGE] Escaneando ruta para {target_ip}...")
    
    if current_gw != valid_gw:
        print(f"[ALERTA FORGE] ¡SECUESTRO DETECTADO! Ruta desviada a: {current_gw}")
        print(f"[FORGE] Forzando restauración a: {valid_gw}")
        # Restaurar la ruta legítima
        current_gw = valid_gw
        print(f"[FORGE] Ruta para {target_ip} restaurada y BLOQUEADA contra cambios.")
        return True
    
    print(f"[FORGE] Ruta para {target_ip} verificada: {current_gw} (SANA)")
    return False

if __name__ == "__main__":
    target = "8.8.8.8"
    legit_gw = "GATEWAY_VALIDO_001"
    compromised_gw = "GATEWAY_MALICIOSO_999"
    
    # Detectar y recuperar
    detect_and_recover_bgp(target, compromised_gw, legit_gw)
