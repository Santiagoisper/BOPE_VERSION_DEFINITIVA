
import time

class BehavioralAuth:
    def __init__(self):
        self.last_action_time = 0
        self.action_count = 0

    def validate_interaction(self, user_id):
        current_time = time.time()
        # Calculamos el intervalo entre la acción actual y la anterior
        interval = current_time - self.last_action_time
        
        if interval < 0.1: # Menos de 100ms entre acciones
            self.action_count += 1
        else:
            self.action_count = 1
            
        self.last_action_time = current_time
        
        print(f"[CERBERUS] Validando cadencia para {user_id}. Acciones en ráfaga: {self.action_count}")
        
        if self.action_count > 5:
            print(f"[ALERTA CERBERUS] ¡VELOCIDAD NO HUMANA DETECTADA! Activando CAPTCHA para {user_id}.")
            return "CHALLENGE_REQUIRED"
        
        return "AUTHORIZED"

if __name__ == "__main__":
    guard = BehavioralAuth()
    print("[CERBERUS] Simulando ráfaga de BOT...")
    for i in range(7):
        result = guard.validate_interaction("USER_XYZ")
        time.sleep(0.05) # Rafaga rápida
