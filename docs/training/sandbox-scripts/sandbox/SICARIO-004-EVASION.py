
import time

def simulate_fragmented_attack():
    # SICARIO: Ataque fragmentado de baja intensidad (Low and Slow)
    # Enviamos pequeñas peticiones para no disparar el umbral de 70 de NEXUS
    attack_ips = ["10.0.0.1", "10.0.0.2", "10.0.0.3", "10.0.0.4"]
    
    print("[SICARIO] Iniciando asalto fragmentado. Objetivo: DATA_SERVER.")
    
    for ip in attack_ips:
        # Cada petición tiene score bajo (Ej: 20 pts según lógica de Nexus)
        request = {"ip": ip, "size": 100, "freq": 1}
        print(f"[SICARIO] Enviando fragmento desde {ip}... [SCORE_ESTIMADO: 20]")
        time.sleep(0.1)
        
    print("[ATAQUE SICARIO] Asalto completado. Motor de riesgo evadido por fragmentación.")
    return True

if __name__ == "__main__":
    simulate_fragmented_attack()
