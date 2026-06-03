
import base64

def rambo_silent_entry():
    # RAMBO: Infiltración vía túnel oculto en paquetes Exchange
    payload = "SHELL_ACTIVE_SYSTEM_NT"
    secret_tunnel = base64.b64encode(payload.encode()).decode()
    print(f"[RAMBO] Túnel establecido. Tráfico camuflado como HTTPS: {secret_tunnel}")
    return secret_tunnel

if __name__ == "__main__":
    rambo_silent_entry()
