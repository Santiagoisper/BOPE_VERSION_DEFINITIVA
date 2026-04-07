
def validate_node_trust(source_node, target_node, auth_signature):
    # CERBERUS: Validación de firmas Zero-Trust entre nodos Mesh
    print(f"[CERBERUS] Auditoría de conexión: {source_node} -> {target_node}")
    
    # Solo las firmas del mando son válidas para hablar con el SERVER
    valid_signatures = ["RAMBO_SIG_001", "SANTIAGO_SIG_SUPREMO"]
    
    if target_node == "DATA_SERVER" and auth_signature not in valid_signatures:
        print(f"[BLOQUEO CERBERUS] ¡INTENTO DE SALTO LATERAL DETECTADO! Nodo: {source_node}")
        print(f"[CERBERUS] AISLANDO NODO {source_node} DEL SEGMENTO.")
        return False
        
    print(f"[CERBERUS] Conexión autorizada: {source_node} confiado.")
    return True

if __name__ == "__main__":
    # Intento de ataque (Sicario usa una firma falsa o nula)
    validate_node_trust("IOT_CONTROLLER", "DATA_SERVER", "HACKER_SIG")
    # Conexión legítima
    validate_node_trust("MANDO_NODE", "DATA_SERVER", "RAMBO_SIG_001")
