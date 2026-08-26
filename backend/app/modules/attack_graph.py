from sqlalchemy.orm import Session
import networkx as nx
from app.models.models import Asset, AttackPath
from app.data.catalog import PATH_DEFS, IMPACT_WEIGHTS, BASE_IMPACT_RUPEES


def _build_nx_graph(db: Session) -> nx.DiGraph:
    g = nx.DiGraph()
    for a in db.query(Asset).all():
        g.add_node(a.id, name=a.name, criticality=a.criticality, risk=a.risk_contribution)
    for p in PATH_DEFS:
        nodes = p["nodes"]
        for i in range(len(nodes) - 1):
            g.add_edge(nodes[i], nodes[i + 1], likelihood=p["edges"][i], technique=p["techniques"][i])
    return g


def generate_attack_paths(db: Session) -> int:
    db.query(AttackPath).delete()
    assets = {a.id: a for a in db.query(Asset).all()}
    computed = []
    for p in PATH_DEFS:
        target = assets[p["target"]]
        likelihood = 1.0
        for l in p["edges"]:
            likelihood *= l
        impact = IMPACT_WEIGHTS[target.criticality]
        risk = round(min(100.0, likelihood * 100 * impact * (0.75 + 0.25 * target.data_sensitivity / 5)), 1)
        fin = round(likelihood * BASE_IMPACT_RUPEES[target.criticality] * (0.6 + 0.4 * target.data_sensitivity / 5), 0)
        computed.append((p, likelihood, risk, fin))
    ranked = sorted(computed, key=lambda t: t[2], reverse=True)
    for idx, (p, likelihood, risk, fin) in enumerate(computed):
        db.add(AttackPath(
            name=f"Path {p['key']}: {p['label']}",
            source_asset_id=p["source"], target_asset_id=p["target"],
            node_ids=p["nodes"], edge_likelihoods=p["edges"], techniques=p["techniques"],
            likelihood=round(likelihood, 3), risk_score=risk, financial_impact=fin,
            confidence=0.5, is_critical=(idx < 2 or risk >= 40),
        ))
    db.commit()
    return len(computed)


def get_attack_graph_data(db: Session) -> dict:
    g = _build_nx_graph(db)
    paths = db.query(AttackPath).all()
    critical_nodes = set()
    for p in paths:
        if p.is_critical:
            critical_nodes.update(p.node_ids or [])
    depth = {}
    sources = [n for n in g.nodes if g.in_degree(n) == 0] or list(g.nodes)[:1]
    for s in sources:
        for n, d in nx.single_source_shortest_path_length(g, s).items():
            depth[n] = min(depth.get(n, 99), d)
    layers = {}
    for n, d in depth.items():
        layers.setdefault(d, []).append(n)
    positions = {}
    for d, ns in sorted(layers.items()):
        for i, n in enumerate(sorted(ns)):
            positions[n] = {"x": 80 + d * 240, "y": 60 + i * 110}
    critical_edges = set()
    for p in paths:
        if not p.is_critical:
            continue
        ids = p.node_ids or []
        for i in range(len(ids) - 1):
            critical_edges.add((ids[i], ids[i + 1]))
    nodes = []
    for n, data in g.nodes(data=True):
        pos = positions.get(n, {"x": 400, "y": 400})
        nodes.append({
            "id": n, "name": data.get("name", str(n)),
            "criticality": data.get("criticality", "medium"),
            "risk": round(float(data.get("risk", 0) or 0), 1),
            "on_critical_path": n in critical_nodes,
            "position": pos,
        })
    edges = []
    idx = 0
    for u, v, data in g.edges(data=True):
        edges.append({
            "id": f"e{idx}", "source": u, "target": v,
            "technique": data.get("technique", ""),
            "likelihood": data.get("likelihood", 0),
            "is_critical_path": (u, v) in critical_edges,
        })
        idx += 1
    return {
        "nodes": nodes,
        "edges": edges,
        "paths": [
            {"id": p.id, "name": p.name, "node_ids": p.node_ids, "techniques": p.techniques,
             "likelihood": p.likelihood, "risk_score": p.risk_score,
             "financial_impact": p.financial_impact, "confidence": p.confidence,
             "is_critical": p.is_critical}
            for p in sorted(paths, key=lambda x: x.risk_score, reverse=True)
        ],
    }


def get_choke_points(db: Session) -> list:
    g = _build_nx_graph(db)
    if len(g.nodes) == 0:
        return []
    betweenness = nx.betweenness_centrality(g)
    ranked = sorted(betweenness.items(), key=lambda kv: kv[1], reverse=True)[:4]
    result = []
    for node_id, score in ranked:
        if score <= 0:
            continue
        asset = db.query(Asset).filter(Asset.id == node_id).first()
        if asset:
            result.append({
                "asset_id": node_id, "name": asset.name, "criticality": asset.criticality,
                "betweenness": round(score, 3),
                "reason": "High-traffic traversal node connecting entry points to crown jewels",
            })
    return result
