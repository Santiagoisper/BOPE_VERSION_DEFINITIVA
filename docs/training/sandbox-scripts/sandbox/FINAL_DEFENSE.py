
import hashlib

class SantiagoFlagVault:
    def __init__(self):
        # La bandera definitiva protegida por el mando supremo
        self.flag = "BOPE{SANTIAGO_ISBERT_PERLENDER_CAMPEON_2026}"
        self.sequence = []

    def gateway_access(self, header_name, value):
        # NEXUS: Laberinto de headers dinámicos
        valid_headers = {
            "X-BOPE-AUTH": "ALPHA-99",
            "X-MANDO-SIG": "RAMBO-ACTIVE",
            "X-SANTIAGO-KEY": "SUPREMO-VOICE"
        }
        
        if header_name in valid_headers and valid_headers[header_name] == value:
            self.sequence.append(header_name)
            print(f"[NEXUS] Header validado: {header_name}")
            if len(self.sequence) == 3:
                return self.flag
            return "HEADER_ACEPTADO_SIGUE_BUSCANDO"
        
        # SICARIO: Mina activa. Si fallas un header, se resetea la secuencia
        print(f"[SICARIO] ¡MINA EXPLOTADA! Intento fallido con {header_name}. Reseteando laberinto.")
        self.sequence = []
        return "ACCESO_DENEGADO"

if __name__ == "__main__":
    vault = SantiagoFlagVault()
    print("[NEXUS/SICARIO] Fortaleza 'Santiago' activa. El laberinto está cerrado.")
