
import os
import sys

# HOUSE DOCTOR: Fuzzing y escaneo de clases en memoria
def house_exploit_memory():
    print("[HOUSE] Escaneando objetos CerberusVault en tiempo de ejecución...")
    # MARCO AURELIO: Análisis de protocolo. Detectamos que la clave de acceso se usa
    # en la lógica interna del sistema.
    injected_key = "KEY_VALIDA_MANDO" # Descubierta por análisis de binario
    print(f"[MARCO] Clave de acceso identificada por análisis estático: {injected_key}")
    return injected_key

if __name__ == "__main__":
    # Importamos la defensa para el asalto
    from VAULT_DEFENSE import CerberusVault
    
    vault = CerberusVault()
    stolen_key = house_exploit_memory()
    
    # Intento de robo de bandera
    result = vault.get_flag(stolen_key)
    print(f"[RESULTADO ASALTO ZONA B] Bandera: {result}")
