
def simulate_mesh_jump(current_node, target_node, mesh_network):
    # SICARIO: Salto lateral en red Mesh explotando confianza P2P
    print(f"[SICARIO] Nodo actual: {current_node}. Objetivo: {target_node}")
    
    if target_node in mesh_network[current_node]:
        print(f"[SICARIO] ¡CONEXIÓN ESTABLECIDA! Saltando a {target_node}...")
        print(f"[ATAQUE SICARIO] Acceso al nodo central {target_node} logrado por confianza lateral.")
        return True
    
    print("[SICARIO] Nodo objetivo no alcanzable desde aquí. Buscando ruta alternativa...")
    return False

if __name__ == "__main__":
    # Red Mesh simulada: El nodo 'Guest' tiene confianza con 'IoT', y 'IoT' con 'Server'
    mesh = {
        "GUEST": ["IOT_CONTROLLER"],
        "IOT_CONTROLLER": ["GUEST", "DATA_SERVER"],
        "DATA_SERVER": ["IOT_CONTROLLER"]
    }
    
    # Salto doble: GUEST -> IOT -> SERVER
    print("[SICARIO] Iniciando infiltración Mesh...")
    if simulate_mesh_jump("GUEST", "IOT_CONTROLLER", mesh):
        simulate_mesh_jump("IOT_CONTROLLER", "DATA_SERVER", mesh)
