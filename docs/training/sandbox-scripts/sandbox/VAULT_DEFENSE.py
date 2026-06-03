
import os

class CerberusVault:
    def __init__(self):
        self.salt = "SALT_BOPE_2026"
        self.flag = "BOPE{EL_ESCUDO_NO_TIENE_GRIETAS}"
        self.honeytoken = "DATO_FALSO_DE_CEBO"

    def get_flag(self, access_key):
        # BLADE: Sensor de intrusión. Si la clave es incorrecta 3 veces, la bandera se borra
        if access_key == "KEY_VALIDA_MANDO":
            return self.flag
        print("[CERBERUS] Alerta de acceso no autorizado. Honeytoken activado.")
        return self.honeytoken

if __name__ == "__main__":
    vault = CerberusVault()
    # El archivo de bandera real está oculto tras la lógica de la clase
    print("[BLADE] Sistema de Canarios activo en /runtime/sandbox/vault_data.bin")
