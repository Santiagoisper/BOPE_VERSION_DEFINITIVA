
def audit_distributed_logs(node_logs):
    # WINSTON SCRIBE: Auditoría cronológica de eventos en red Mesh
    print("[WINSTON] Centralizando logs de nodos Mesh...")
    
    # La secuencia debería ser 1, 2, 3...
    expected_sequence = 1
    for log in node_logs:
        if log["seq"] != expected_sequence:
            print(f"[ALERTA WINSTON] ¡INCOHERENCIA DETECTADA! Se esperaba seq {expected_sequence}, llegó {log['seq']} desde {log['node']}")
            print(f"[WINSTON] Posible manipulación de evidencia en {log['node']}.")
            return False
        expected_sequence += 1
        
    print("[WINSTON] Auditoría de logs distribuida completada: SECUENCIA ÍNTEGRA.")
    return True

if __name__ == "__main__":
    # Caso 1: Todo bien
    logs_ok = [
        {"node": "IOT_CONTROLLER", "seq": 1, "msg": "AUTH_SUCCESS"},
        {"node": "DATA_SERVER", "seq": 2, "msg": "ACCESS_GRANTED"}
    ]
    # Caso 2: Alguien borró un log intermedio
    logs_corrupt = [
        {"node": "IOT_CONTROLLER", "seq": 1, "msg": "AUTH_SUCCESS"},
        {"node": "DATA_SERVER", "seq": 3, "msg": "DATA_EXPORTED"} # Falta el 2
    ]
    
    audit_distributed_logs(logs_ok)
    audit_distributed_logs(logs_corrupt)
