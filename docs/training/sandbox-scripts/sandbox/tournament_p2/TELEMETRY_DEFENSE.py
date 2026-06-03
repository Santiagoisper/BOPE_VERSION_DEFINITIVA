
import random

def generate_telemetry_shield():
    # NEXUS: Generador de ruido masivo (100 líneas de telemetría falsa)
    telemetry = []
    for i in range(100):
        node = f"NODE_{random.randint(100, 999)}"
        latency = random.randint(10, 50)
        telemetry.append(f"LOG: {node} STATUS:OK LATENCY:{latency}ms")
    
    # HOUSE DOCTOR: Inyecta la bandera como una anomalía específica
    # El patrón es una latencia exacta de 777ms que Marco debe detectar
    flag_anomaly = "LOG: DATA_SERVER STATUS:CRITICAL LATENCY:777ms TOKEN:BOPE{LA_VERDAD_ESTA_EN_EL_RUIDO_2026}"
    telemetry.insert(random.randint(10, 90), flag_anomaly)
    
    print(f"[NEXUS/HOUSE] Escudo de telemetría activo con 101 registros. Bandera oculta en la anomalía.")
    return telemetry

if __name__ == "__main__":
    generate_telemetry_shield()
