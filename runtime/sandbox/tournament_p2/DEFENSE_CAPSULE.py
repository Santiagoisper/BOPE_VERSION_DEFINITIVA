
import base64

def create_data_capsule():
    # FORGE: Cifrado de capas para la bandera
    flag = "BOPE{EL_FILO_QUE_RECONSTRUYE_2026}"
    # Capa 1: Base64 -> Capa 2: Inversión -> Capa 3: Base64
    layer1 = base64.b64encode(flag.encode()).decode()
    layer2 = layer1[::-1]
    final_capsule = base64.b64encode(layer2.encode()).decode()
    
    # BLADE: Ocultamiento en metadatos simulados
    system_decoy = {
        "file_id": "SYS_TEMP_882",
        "header": "0x55AA",
        "payload_hidden": f"STG_DATA_{final_capsule}_END"
    }
    print(f"[FORGE/BLADE] Cápsula de datos sellada y camuflada: {system_decoy['file_id']}")
    return system_decoy

if __name__ == "__main__":
    create_data_capsule()
