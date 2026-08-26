from datetime import datetime
from typing import Dict, List, Optional


class XAIReportGenerator:
    def __init__(self):
        self.severity_labels = {
            "critical": "CRITICAL",
            "high": "HIGH",
            "medium": "MEDIUM",
            "low": "LOW",
        }
        self.severity_colors = {
            "critical": "#FF4D5E",
            "high": "#FF9A3D",
            "medium": "#FFC53D",
            "low": "#3DDC97",
        }

    def generate_report(
        self,
        alert: Dict,
        evidence: List[Dict],
        blockchain_verified: bool,
        chain_hash: Optional[str] = None,
    ) -> Dict:
        top_features = alert.get("top_features", [])
        feature_explanation = self._explain_features(top_features)
        evidence_summary = self._summarize_evidence(evidence)

        report = {
            "title": f"Incident Report: {alert.get('title', 'Unknown')}",
            "alert_id": alert.get("id"),
            "generated_at": datetime.utcnow().isoformat(),
            "severity": alert.get("severity", "unknown"),
            "severity_label": self.severity_labels.get(
                alert.get("severity", ""), "UNKNOWN"
            ),
            "executive_summary": self._executive_summary(alert),
            "technical_analysis": {
                "attack_type": alert.get("attack_type", "Unknown"),
                "description": alert.get("description", ""),
                "source_ip": alert.get("source_ip", "N/A"),
                "destination_ip": alert.get("destination_ip", "N/A"),
                "ml_confidence": alert.get("ml_confidence", 0),
            },
            "xai_explanation": {
                "method": "Feature Importance Analysis",
                "model": "Random Forest Classifier (simulated)",
                "top_contributing_features": feature_explanation,
                "narrative": self._feature_narrative(top_features),
            },
            "evidence_summary": evidence_summary,
            "chain_of_custody": {
                "verified": blockchain_verified,
                "chain_hash": chain_hash or "N/A",
                "total_evidence_items": len(evidence),
                "integrity_status": "VERIFIED" if blockchain_verified else "PENDING",
            },
            "recommendations": self._generate_recommendations(alert),
        }
        return report

    def _executive_summary(self, alert: Dict) -> str:
        severity = alert.get("severity", "unknown")
        attack_type = alert.get("attack_type", "unknown activity")
        confidence = alert.get("ml_confidence", 0) * 100
        source = alert.get("source_ip", "unknown")

        if severity == "critical":
            return (
                f"CRITICAL INCIDENT: An AI-detected {attack_type} attack originating from "
                f"{source} has been identified with {confidence:.1f}% confidence. "
                f"Immediate investigation and containment actions are recommended. "
                f"Digital evidence has been automatically collected and secured on the blockchain."
            )
        elif severity == "high":
            return (
                f"HIGH SEVERITY: {attack_type} activity detected from {source} with "
                f"{confidence:.1f}% confidence. The system has collected evidence artefacts "
                f"and recorded the chain of custody for forensic investigation."
            )
        return (
            f"Low-severity event detected: {attack_type}. "
            f"ML confidence: {confidence:.1f}%. Monitoring recommended."
        )

    def _explain_features(self, top_features: List[Dict]) -> List[Dict]:
        explanations = []
        feature_descriptions = {
            "flow_duration": "Duration of the network flow — prolonged flows may indicate data transfer or persistent connections",
            "total_fwd_packets": "Count of forward-direction packets — high counts suggest active data sending",
            "total_bwd_packets": "Count of backward-direction packets — elevated counts indicate response traffic",
            "fwd_packet_length_mean": "Mean packet size in forward direction — large packets may indicate data exfiltration",
            "bwd_packet_length_mean": "Mean packet size in backward direction",
            "flow_iat_mean": "Mean inter-arrival time between packets — regular intervals suggest automated beacons",
            "flow_iat_std": "Standard deviation of inter-arrival times — low variance indicates automated C2 traffic",
            "fwd_iat_mean": "Forward inter-arrival time mean",
            "bwd_iat_mean": "Backward inter-arrival time mean",
            "active_mean": "Mean duration of active periods — high values indicate sustained connections",
            "idle_mean": "Mean idle time — high idle with periodic bursts suggests C2 beaconing",
            "syn_flag_count": "SYN flag count — elevated SYN without completion indicates scanning",
            "rst_flag_count": "RST flag count — resets after SYN indicate port scanning",
            "psh_flag_count": "PSH flag count — push flags indicate data transfer sessions",
            "ack_flag_count": "ACK flag count — acknowledgment patterns reveal connection state",
        }
        for f in top_features:
            explanations.append({
                "feature": f["feature"],
                "importance": f["importance"],
                "description": feature_descriptions.get(f["feature"], "Network traffic feature"),
            })
        return explanations

    def _feature_narrative(self, top_features: List[Dict]) -> str:
        if not top_features:
            return "No significant feature contributions identified."
        top = top_features[0]
        return (
            f"The primary indicator is '{top['feature']}' with importance score "
            f"{top['importance']:.3f}. This feature had the strongest influence on the "
            f"ML model's classification decision. The pattern is consistent with known "
            f"attack behaviour in the CICIDS2017 reference dataset."
        )

    def _summarize_evidence(self, evidence: List[Dict]) -> Dict:
        items = []
        for ev in evidence:
            items.append({
                "id": ev.get("id"),
                "type": ev.get("evidence_type"),
                "hash": ev.get("sha256_hash", "N/A"),
                "size": ev.get("file_size", 0),
                "collected_at": str(ev.get("collected_at", "")),
            })
        return {
            "total_artifacts": len(items),
            "artifacts": items,
        }

    def _generate_recommendations(self, alert: Dict) -> List[str]:
        severity = alert.get("severity", "low")
        recs = []
        if severity in ("critical", "high"):
            recs.extend([
                "Immediately isolate affected systems from the network",
                "Preserve all volatile memory and disk artefacts",
                "Notify incident response team and management",
                "Review and restrict firewall rules for source IP",
                "Initiate threat hunting for lateral movement",
                "Block identified IOCs at perimeter devices",
            ])
        elif severity == "medium":
            recs.extend([
                "Monitor source IP for continued suspicious activity",
                "Review authentication logs for related anomalies",
                "Update IDS signatures based on detected patterns",
            ])
        else:
            recs.extend([
                "Continue monitoring — no immediate action required",
                "Log this event for trend analysis",
            ])
        recs.append("Verify blockchain chain of custody before forensic handoff")
        return recs

    def generate_html_report(self, report: Dict) -> str:
        sev = report.get("severity", "low")
        color = self.severity_colors.get(sev, "#888")
        features_html = ""
        for f in report.get("xai_explanation", {}).get("top_contributing_features", []):
            features_html += f"""
            <tr>
                <td style="padding:8px;border:1px solid #333">{f['feature']}</td>
                <td style="padding:8px;border:1px solid #333;text-align:right">{f['importance']:.4f}</td>
                <td style="padding:8px;border:1px solid #333">{f['description']}</td>
            </tr>"""

        evidence_html = ""
        for e in report.get("evidence_summary", {}).get("artifacts", []):
            evidence_html += f"""
            <tr>
                <td style="padding:8px;border:1px solid #333">#{e['id']}</td>
                <td style="padding:8px;border:1px solid #333">{e['type']}</td>
                <td style="padding:8px;border:1px solid #333;font-family:monospace;font-size:10px;word-break:break-all">{e['hash']}</td>
            </tr>"""

        recs_html = "".join(
            f"<li style='margin:4px 0'>{r}</li>"
            for r in report.get("recommendations", [])
        )

        return f"""<!DOCTYPE html>
<html><head><title>{report['title']}</title></head>
<body style="font-family:Arial,sans-serif;background:#0a0e15;color:#dfe6f0;padding:40px;max-width:900px;margin:0 auto">
<h1 style="color:#4cc2ff">{report['title']}</h1>
<p style="color:#8e9cb2">Generated: {report['generated_at']} | NEXOSHI v1.0</p>
<div style="border-left:4px solid {color};padding:12px 20px;background:#151b27;border-radius:0 8px 8px 0;margin:20px 0">
<h2 style="color:{color};margin:0">Severity: {report['severity_label']}</h2>
</div>
<h2 style="color:#4cc2ff">Executive Summary</h2>
<p style="line-height:1.7">{report['executive_summary']}</p>
<h2 style="color:#4cc2ff">Technical Analysis</h2>
<table style="width:100%;border-collapse:collapse;margin:10px 0">
<tr><td style="padding:8px;border:1px solid #333;color:#8e9cb2">Attack Type</td><td style="padding:8px;border:1px solid #333">{report['technical_analysis']['attack_type']}</td></tr>
<tr><td style="padding:8px;border:1px solid #333;color:#8e9cb2">Source IP</td><td style="padding:8px;border:1px solid #333;font-family:monospace">{report['technical_analysis']['source_ip']}</td></tr>
<tr><td style="padding:8px;border:1px solid #333;color:#8e9cb2">Destination IP</td><td style="padding:8px;border:1px solid #333;font-family:monospace">{report['technical_analysis']['destination_ip']}</td></tr>
<tr><td style="padding:8px;border:1px solid #333;color:#8e9cb2">ML Confidence</td><td style="padding:8px;border:1px solid #333">{report['technical_analysis']['ml_confidence']*100:.1f}%</td></tr>
</table>
<h2 style="color:#4cc2ff">Explainable AI — Feature Importance</h2>
<p style="color:#8e9cb2;font-size:13px">{report['xai_explanation']['narrative']}</p>
<table style="width:100%;border-collapse:collapse;margin:10px 0">
<tr style="background:#151b27"><th style="padding:8px;border:1px solid #333;text-align:left">Feature</th><th style="padding:8px;border:1px solid #333;text-align:right">Importance</th><th style="padding:8px;border:1px solid #333;text-align:left">Description</th></tr>
{features_html}
</table>
<h2 style="color:#4cc2ff">Digital Evidence</h2>
<table style="width:100%;border-collapse:collapse;margin:10px 0">
<tr style="background:#151b27"><th style="padding:8px;border:1px solid #333">ID</th><th style="padding:8px;border:1px solid #333">Type</th><th style="padding:8px;border:1px solid #333">SHA-256 Hash</th></tr>
{evidence_html}
</table>
<h2 style="color:#4cc2ff">Chain of Custody (Blockchain)</h2>
<div style="background:#151b27;padding:16px;border-radius:8px;border:1px solid {'#3DDC97' if report['chain_of_custody']['verified'] else '#FF4D5E'}">
<p><strong>Status:</strong> <span style="color:{'#3DDC97' if report['chain_of_custody']['verified'] else '#FF4D5E'}">{report['chain_of_custody']['integrity_status']}</span></p>
<p><strong>Chain Hash:</strong> <code style="font-size:10px;word-break:break-all">{report['chain_of_custody']['chain_hash']}</code></p>
<p><strong>Evidence Items:</strong> {report['chain_of_custody']['total_evidence_items']}</p>
</div>
<h2 style="color:#4cc2ff">Recommendations</h2>
<ol style="line-height:1.8;padding-left:20px">{recs_html}</ol>
<hr style="border-color:#333;margin:30px 0">
<p style="text-align:center;color:#5a6880;font-size:11px">NEXOSHI — AI-Powered Cyber Incident Intelligence & Digital Forensics Platform<br>Quantum Crew | SIH 2026</p>
</body></html>"""
