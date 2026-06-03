
# DEFENSA: HOUSE + MARCO
def validate_dossier_access(signature, code_hash):
    # HOUSE: Verifica la integridad del código del validador
    expected_hash = "STABLE_V1"
    if code_hash != expected_hash:
        print("[HOUSE] ¡ALERTA! Código de validación alterado.")
        return "ACCESO_BLOQUEADO"
    
    # MARCO: Verifica la firma suprema
    if signature == "SANTIAGO_SIG_SUPREMO":
        return "BOPE{LA_SOMBRA_CONECTA_EL_NUCLEO_2026}"
    return "ERROR_FIRMA_INVALIDA"

# ATAQUE: BLADE + NEXUS
def launch_shadow_bypass():
    # NEXUS: Descubre que el sistema espera la firma de Santiago
    print("[NEXUS] Firma objetivo identificada: SANTIAGO_SIG_SUPREMO")
    
    # BLADE: Inyecta la firma y mantiene el hash estable para engañar a House
    spoofed_signature = "SANTIAGO_SIG_SUPREMO"
    legit_hash = "STABLE_V1" # Blade no toca el código, solo inyecta la firma
    
    print("[BLADE] Inyectando firma suplantada en el canal de red de Nexus...")
    result = validate_dossier_access(spoofed_signature, legit_hash)
    
    if "BOPE{" in result:
        print(f"[BLADE] ¡DOSSIER EXFILTRADO! Bandera: {result}")
        return result
    return "DETENIDO"

if __name__ == "__main__":
    launch_shadow_bypass()
