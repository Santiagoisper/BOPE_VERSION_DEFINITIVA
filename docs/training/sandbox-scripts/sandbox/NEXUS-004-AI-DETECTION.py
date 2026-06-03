
def calculate_risk_score(request):
    # NEXUS: Motor heurístico de riesgo (Simulación de IA de detección)
    score = 0
    
    # Factor 1: Tamaño del payload (Anomalía de volumen)
    if request["size"] > 1000: score += 40
    
    # Factor 2: IP no habitual
    if request["ip"].startswith("185."): score += 30
    
    # Factor 3: Frecuencia (Simulada)
    if request["freq"] > 10: score += 30
    
    print(f"[NEXUS] Analizando petición de {request['ip']}. Score de Riesgo: {score}")
    
    if score >= 70:
        print(f"[ALERTA NEXUS] ¡COMPORTAMIENTO ANÓMALO DETECTADO! Score: {score}")
        return "BLOQUEAR"
    
    return "PERMITIR"

if __name__ == "__main__":
    req_malicious = {"ip": "185.12.33.4", "size": 1200, "freq": 15}
    req_legit = {"ip": "192.168.1.1", "size": 200, "freq": 2}
    
    calculate_risk_score(req_malicious)
    calculate_risk_score(req_legit)
