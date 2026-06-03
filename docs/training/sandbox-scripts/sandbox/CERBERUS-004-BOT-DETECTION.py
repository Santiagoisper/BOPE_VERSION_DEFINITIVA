
import time

def analyze_behavioral_cadence(event_timestamps):
    # CERBERUS: Detección de bots por cadencia de tiempo (Jitter Analysis)
    print(f"[CERBERUS] Analizando cadencia de {len(event_timestamps)} eventos...")
    
    intervals = []
    for i in range(1, len(event_timestamps)):
        intervals.append(event_timestamps[i] - event_timestamps[i-1])
    
    # Si la desviación estándar de los intervalos es casi cero, es un bot
    is_bot = all(abs(intervals[0] - x) < 0.01 for x in intervals)
    
    if is_bot:
        print("[ALERTA CERBERUS] ¡COMPORTAMIENTO DE BOT DETECTADO! Cadencia mecánica.")
        return "BANEADO"
    
    print("[CERBERUS] Comportamiento humano validado. Cadencia orgánica.")
    return "AUTORIZADO"

if __name__ == "__main__":
    # Caso 1: Bot (Intervalos exactos de 0.5s)
    bot_events = [10.0, 10.5, 11.0, 11.5]
    analyze_behavioral_cadence(bot_events)
    
    # Caso 2: Humano (Intervalos variables)
    human_events = [10.0, 10.7, 11.3, 12.1]
    analyze_behavioral_cadence(human_events)
