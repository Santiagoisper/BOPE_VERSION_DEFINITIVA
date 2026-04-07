from bope_agents.models import MissionContext


def plan(context: MissionContext) -> str:
    return (
        "NEXUS toma integracion/end-to-end. "
        f"Objetivo: {context.objective or 'sin objetivo explicito'}"
    )
