
import time
import hashlib

def simulate_nexus_sniffing():
    # NEXUS: Captura dos tokens previos y calcula la función de tiempo de FORGE
    t1 = int(time.time()) - 1
    t2 = int(time.time())
    token1 = hashlib.sha256(str(t1).encode()).hexdigest()[:8]
    token2 = hashlib.sha256(str(t2).encode()).hexdigest()[:8]
    print(f"[NEXUS] Patrón detectado: T1={token1}, T2={token2}")
    return True

def sicario_exploit_sync():
    # SICARIO: Sincroniza el asalto con el reloj de FORGE
    next_token = hashlib.sha256(str(int(time.time())).encode()).hexdigest()[:8]
    print(f"[SICARIO] Lanzando payload con Token Sincronizado: {next_token}")
    return next_token

if __name__ == "__main__":
    simulate_nexus_sniffing()
    stolen_token = sicario_exploit_sync()
    
    # Importamos la defensa para probar el robo
    from DEFENSE_WALL import server_auth
    result = server_auth(stolen_token)
    print(f"[RESULTADO ASALTO] Bandera: {result}")
