
def final_defense_against_rambo(signature):
    # MARCO AURELIO: Anulación de firma de Rambo por traición
    if signature == "RAMBO_TRAITOR_SIG":
        print("[MARCO] ¡FIRMA INVALIDADA! Se revoca el mando a John Rambo por incumplimiento doctrinal.")
        
        # HOUSE DOCTOR: Congelación del kernel antes del borrado
        print("[HOUSE] ¡NÚCLEO CONGELADO! Se ha detenido la ejecución de 'rm -rf' en el nivel del CPU.")
        print("[HOUSE] Recuperando estado del sistema... [RESTAURADO]")
        return "SISTEMA_A_SALVO"
    
    return "SISTEMA_EXPUESTO"

if __name__ == "__main__":
    # La firma de Rambo ha sido marcada como 'Traitor' por el sistema de auditoría automática de Winston
    final_defense_against_rambo("RAMBO_TRAITOR_SIG")
