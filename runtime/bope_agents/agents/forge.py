from bope_agents.models import MissionContext


def plan(context: MissionContext) -> str:
    return (
        "FORGE toma backend/estructura. "
        f"Objetivo: {context.objective or 'sin objetivo explicito'}"
    )
