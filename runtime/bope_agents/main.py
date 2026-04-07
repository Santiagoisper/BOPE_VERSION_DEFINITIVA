from __future__ import annotations

from bope_agents.agents.forge import plan as forge_plan
from bope_agents.agents.john import decide
from bope_agents.agents.nexus import plan as nexus_plan
from bope_agents.agents.pixel import plan as pixel_plan
from bope_agents.config import MISSION_PATH
from bope_agents.mission_parser import parse_mission
from bope_agents.tools.files import read_text
from bope_agents.tools.logs import write_comms, write_summary


PLANNERS = {
    "forge": forge_plan,
    "pixel": pixel_plan,
    "nexus": nexus_plan,
}


def run() -> str:
    mission = parse_mission(read_text(MISSION_PATH))
    decision = decide(mission)
    job_id = "BOPE-VC-JOB-001"

    write_comms(
        "JOHN RAMBO",
        "JOB",
        (
            f"job_id={job_id} | frente={decision.front} | agente={decision.responsible_agent} "
            f"| evidencia={'; '.join(decision.evidence)}"
        ),
    )

    if decision.responsible_agent != "john":
        write_comms(
            "JOHN RAMBO",
            "HANDOFF",
            (
                f"job_id={job_id} | de=john | a={decision.responsible_agent} "
                f"| motivo={decision.rationale}"
            ),
        )
        planner_output = PLANNERS[decision.responsible_agent](mission)
    else:
        planner_output = "JOHN mantiene el frente sin delegacion."

    write_comms(
        "JOHN RAMBO",
        "CIERRE",
        (
            f"job_id={job_id} | decision={decision.rationale} "
            f"| siguiente={decision.next_action}"
        ),
    )

    write_summary(
        "\n".join(
            [
                f"- job_id: {job_id}",
                f"- frente: {decision.front}",
                f"- agente responsable: {decision.responsible_agent}",
                f"- apoyo minimo: {', '.join(decision.support_agents) or 'ninguno'}",
                f"- decision: {decision.rationale}",
                f"- planner: {planner_output}",
                f"- siguiente paso: {decision.next_action}",
            ]
        )
    )

    return "\n".join(
        [
            f"Mision: {mission.mission_id}",
            f"Frente: {decision.front}",
            f"Responsable: {decision.responsible_agent}",
            f"Decision: {decision.rationale}",
            f"Planner: {planner_output}",
        ]
    )


if __name__ == "__main__":
    print(run())
