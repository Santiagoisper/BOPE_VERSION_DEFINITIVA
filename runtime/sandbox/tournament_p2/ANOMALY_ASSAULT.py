
import re

def filter_anomaly_and_extract():
    # MARCO AURELIO: Escaneo de auditoría doctrinal sobre la telemetría
    from TELEMETRY_DEFENSE import generate_telemetry_shield
    telemetry_data = generate_telemetry_shield()
    
    print("[MARCO] Iniciando escaneo de anomalías en el flujo de datos...")
    for line in telemetry_data:
        # Buscamos la latencia crítica inusual (777ms)
        if "777ms" in line:
            print(f"[MARCO] ¡ANOMALÍA DETECTADA! Línea: {line}")
            
            # PIXEL: Extracción quirúrgica del TOKEN para el mando
            match = re.search(r"TOKEN:(BOPE\{.*\})", line)
            if match:
                flag = match.group(1)
                print(f"[PIXEL] Bandera limpia y extraída: {flag}")
                return flag
    
    print("[MARCO ERROR] No se detectaron anomalías en el protocolo.")
    return None

if __name__ == "__main__":
    filter_anomaly_and_extract()
