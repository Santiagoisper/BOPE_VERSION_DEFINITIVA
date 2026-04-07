from bope_agents.models import MissionContext


def plan(context: MissionContext) -> str:
    return (
        "PIXEL toma superficie/UI. "
        f"Objetivo: {context.objective or 'sin objetivo explicito'}"
    )
