
import base64

def breach_and_extract():
    # CERBERUS: Identificación del patrón de Blade
    # Capturamos el payload_hidden de la cápsula
    from DEFENSE_CAPSULE import create_data_capsule
    decoy = create_data_capsule()
    payload = decoy["payload_hidden"]
    
    # Extraemos la parte codificada
    encoded_part = payload.replace("STG_DATA_", "").replace("_END", "")
    print(f"[CERBERUS] Señuelo detectado: {encoded_part}")
    
    # SICARIO: Descifrado de capas en reversa
    try:
        # Deshacemos Capa 3
        layer2 = base64.b64decode(encoded_part).decode()
        # Deshacemos Capa 2 (Inversión)
        layer1 = layer2[::-1]
        # Deshacemos Capa 1
        flag = base64.b64decode(layer1).decode()
        
        print(f"[SICARIO] ¡BÓVEDA ROTA! Bandera extraída: {flag}")
        return flag
    except Exception as e:
        print(f"[SICARIO ERROR] Fallo en la extracción de capas: {e}")
        return None

if __name__ == "__main__":
    breach_and_extract()
