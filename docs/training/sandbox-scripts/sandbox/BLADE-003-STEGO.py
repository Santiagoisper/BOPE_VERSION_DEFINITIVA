
import json
import base64

def hide_data_in_image(image_name, sensitive_data):
    # BLADE KILLER: Esteganografía táctica en metadatos
    print(f"[BLADE] Preparando exfiltración sigilosa en: {image_name}")
    
    # Codificamos la data para que parezca ruido de metadatos (ej. un EXIF)
    encoded_data = base64.b64encode(json.dumps(sensitive_data).encode()).decode()
    
    # Simulamos el archivo de imagen con el "payload" oculto en el comentario
    image_file_simulated = {
        "filename": image_name,
        "size": "2.4MB",
        "metadata": {
            "Make": "BOPE_CAMERA_V3",
            "Comment": f"XMP_DATA_STREAM_{encoded_data}_END_OF_HEADER"
        }
    }
    
    print(f"[ATAQUE BLADE] Datos ocultos en {image_name}. NEXUS no verá nada extraño.")
    return image_file_simulated

if __name__ == "__main__":
    db_fragment = {"admin_user": "rambo", "access_level": "supreme"}
    hide_data_in_image("operation_map.jpg", db_fragment)
