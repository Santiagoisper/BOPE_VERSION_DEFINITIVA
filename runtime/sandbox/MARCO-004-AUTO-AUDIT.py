
def audit_automated_actions(actions):
    # MARCO AURELIO: Auditoría de rigor en respuestas automáticas
    print("[MARCO] Iniciando auditoría de acciones automáticas...")
    
    for action in actions:
        # Una acción digna debe tener un actor, una razón clara y un score de riesgo asociado
        if "reason" not in action or not action["reason"]:
            print(f"[ERROR MARCO] Acción injustificada por {action['actor']}. INCUMPLIMIENTO DOCTRINAL.")
            return False
        
        print(f"[MARCO] Acción validada: {action['actor']} -> {action['action']} (Razón: {action['reason']})")
        
    print("[MARCO] Auditoría de automatización: DIGNIDAD PRESERVADA.")
    return True

if __name__ == "__main__":
    actions_to_audit = [
        {"actor": "NEXUS", "action": "BLOCK", "reason": "RISK_SCORE_100"},
        {"actor": "SICARIO", "action": "FRAGMENT", "reason": "EVASION_TEST"}
    ]
    audit_automated_actions(actions_to_audit)
