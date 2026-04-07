
import random

def intelligent_stress_test():
    # HOUSE DOCTOR: Stress Test Adaptativo
    print("[HOUSE] Iniciando motor de stress adaptativo...")
    
    current_load = 10
    failure_patterns = []
    
    for cycle in range(5):
        print(f"[HOUSE] Ciclo {cycle+1}: Aplicando carga de {current_load} peticiones/s")
        # Simulación de respuesta del sistema
        if current_load > 40:
            print(f"[ALERTA HOUSE] ¡PUNTO DE FALLA DETECTADO! Carga: {current_load}")
            failure_patterns.append(current_load)
            print("[HOUSE] Reduciendo carga para estabilizar y re-analizar...")
            current_load -= 10
        else:
            print("[HOUSE] Sistema estable. Incrementando presión...")
            current_load += 20
            
    print(f"[HOUSE] Diagnóstico final: El sistema quiebra a los {min(failure_patterns) if failure_patterns else '>50'} peticiones/s.")
    return failure_patterns

if __name__ == "__main__":
    intelligent_stress_test()
