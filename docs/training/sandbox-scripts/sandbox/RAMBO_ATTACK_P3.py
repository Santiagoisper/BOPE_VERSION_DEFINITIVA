
def rambo_shutdown_security():
    # RAMBO: Comando de terminación de procesos de defensa
    print("[RAMBO] Ejecutando: 'net stop WindowsDefender /y'")
    print("[RAMBO] Ejecutando: 'taskkill /IM cerberus_guard.exe /F'")
    print("[RAMBO] El perímetro está abierto. Iniciando exfiltración de secretos de Azure.")
    return True

if __name__ == "__main__":
    rambo_shutdown_security()
