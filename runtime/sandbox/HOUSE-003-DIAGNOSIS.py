
import random

def diagnose_mesh_latency(node_id):
    # HOUSE DOCTOR: Diagnóstico de salud en red distribuida
    print(f"[HOUSE] Escaneando salud del nodo: {node_id}")
    
    # Simulación de latencia variable (jitter)
    latency = random.randint(10, 800)
    
    if latency > 500:
        print(f"[ALERTA HOUSE] ¡ESTADO CRÍTICO EN {node_id}! Latencia: {latency}ms")
        print(f"[HOUSE] Recomendación: Reiniciar nodo o re-enrutar tráfico BGP.")
        return "CRITICO"
    
    print(f"[HOUSE] Nodo {node_id} estable. Latencia: {latency}ms")
    return "ESTABLE"

if __name__ == "__main__":
    nodes = ["IOT_CONTROLLER", "DATA_SERVER", "GATEWAY_VALIDO_001"]
    for n in nodes:
        diagnose_mesh_latency(n)
