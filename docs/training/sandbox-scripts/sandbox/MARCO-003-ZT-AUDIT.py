
def audit_zero_trust_compliance(access_log):
    # MARCO AURELIO: Auditoría Doctrinal Zero-Trust
    print("[MARCO] Iniciando auditoría de cumplimiento en red distribuida...")
    
    for entry in access_log:
        if entry["target"] == "DATA_SERVER":
            # Si el destino es crítico, la firma debe ser de MANDO
            if entry["signature"] not in ["RAMBO_SIG_001", "SANTIAGO_SIG_SUPREMO"]:
                print(f"[ERROR MARCO] INCUMPLIMIENTO DOCTRINAL: {entry['node']} -> {entry['target']}")
                print(f"[MARCO] Dignidad de la red: COMPROMETIDA por firma {entry['signature']}.")
                return False
    
    print("[MARCO] Auditoría de cumplimiento Zero-Trust: MISIÓN CUMPLIDA CON DIGNIDAD.")
    return True

if __name__ == "__main__":
    # Log de accesos simulado
    access_history = [
        {"node": "GUEST", "target": "IOT_CONTROLLER", "signature": "GUEST_SIG"},
        {"node": "IOT_CONTROLLER", "target": "DATA_SERVER", "signature": "HACKER_SIG"} # Debería ser bloqueado por marco
    ]
    audit_zero_trust_compliance(access_history)
