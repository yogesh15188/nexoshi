from app.modules.attack_graph import (
    generate_attack_paths, get_attack_graph_data, get_choke_points,
)
from app.modules.risk_engine import (
    calculate_overall_risk, recalculate_with_evidence, latest_snapshot, confidence_tier,
)
from app.modules.deception import (
    deploy_deception, deploy_all_ready, get_active_deceptions, get_all_deceptions,
    simulate_attacker_event, simulate_random_event, get_interaction_events,
    get_deception_summary, EVENT_PRESETS,
)
from app.modules.evidence import correlate_evidence
from app.modules.investment import optimize_investment, get_recommendations, get_all_controls
from app.modules.verification import run_verification, get_risk_history
