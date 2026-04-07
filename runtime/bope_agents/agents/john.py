from __future__ import annotations

from bope_agents.models import CommandDecision, MissionContext


FRONT_TO_AGENT = {
    "backend": "forge",
    "frontend": "pixel",
    "integracion": "nexus",
    "integración": "nexus",
}


def decide(context: MissionContext) -> CommandDecision:
    normalized_front = context.front.lower().strip()
    responsible = FRONT_TO_AGENT.get(normalized_front, "john")
    can_resolve_alone = responsible == "john"

    support_agents: list[str] = []
    if responsible == "nexus":
        support_agents = ["john"]
    elif responsible in {"forge", "pixel"}:
        support_agents = ["john", "nexus"]

    rationale = (
        "JOHN resuelve solo por falta de un frente especializado explicito."
        if can_resolve_alone
        else f"JOHN delega el frente principal a {responsible} y mantiene el mando."
    )

    return CommandDecision(
        can_resolve_alone=can_resolve_alone,
        front=normalized_front or "mixto",
        responsible_agent=responsible,
        support_agents=support_agents,
        evidence=context.close_criteria or ["Registro de JOB/HANDOFF/CIERRE en COMMS.log"],
        next_action=context.next_step or "Registrar decision de mando y ejecutar frente minimo.",
        rationale=rationale,
    )
