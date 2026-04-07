from dataclasses import dataclass


@dataclass
class MissionContext:
    mission_id: str
    objective: str
    front: str
    restrictions: list[str]
    close_criteria: list[str]
    next_step: str


@dataclass
class CommandDecision:
    can_resolve_alone: bool
    front: str
    responsible_agent: str
    support_agents: list[str]
    evidence: list[str]
    next_action: str
    rationale: str
