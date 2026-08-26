CRITICALITY_SCORES = {"low": 0.25, "medium": 0.5, "high": 0.75, "critical": 1.0}

IMPACT_WEIGHTS = {"critical": 1.0, "high": 0.8, "medium": 0.6, "low": 0.4}
BASE_IMPACT_RUPEES = {"critical": 2500000, "high": 1200000, "medium": 600000, "low": 250000}

ASSETS = [
    {"id": 1, "name": "Web Server DMZ", "asset_type": "web-server", "ip_address": "10.0.1.10", "business_function": "Customer Portal", "criticality": "high", "internet_exposed": True, "data_sensitivity": 4},
    {"id": 2, "name": "Mail Server", "asset_type": "mail-server", "ip_address": "10.0.1.20", "business_function": "Email", "criticality": "high", "internet_exposed": True, "data_sensitivity": 4},
    {"id": 3, "name": "Customer Database", "asset_type": "database", "ip_address": "10.0.2.30", "business_function": "Customer Data", "criticality": "critical", "internet_exposed": False, "data_sensitivity": 5},
    {"id": 4, "name": "Domain Controller", "asset_type": "identity", "ip_address": "10.0.2.40", "business_function": "Identity & Access", "criticality": "critical", "internet_exposed": False, "data_sensitivity": 5},
    {"id": 5, "name": "File Server", "asset_type": "file-server", "ip_address": "10.0.2.50", "business_function": "Document Storage", "criticality": "medium", "internet_exposed": False, "data_sensitivity": 3},
    {"id": 6, "name": "HR Portal", "asset_type": "web-app", "ip_address": "10.0.2.60", "business_function": "HR Operations", "criticality": "medium", "internet_exposed": False, "data_sensitivity": 4},
    {"id": 7, "name": "Internal App Server", "asset_type": "app-server", "ip_address": "10.0.2.70", "business_function": "Business Apps", "criticality": "high", "internet_exposed": False, "data_sensitivity": 4},
    {"id": 8, "name": "Firewall", "asset_type": "network", "ip_address": "10.0.0.1", "business_function": "Perimeter Defense", "criticality": "high", "internet_exposed": True, "data_sensitivity": 2},
    {"id": 9, "name": "Core Switch", "asset_type": "network", "ip_address": "10.0.0.2", "business_function": "Internal Routing", "criticality": "medium", "internet_exposed": False, "data_sensitivity": 2},
    {"id": 10, "name": "Backup Server", "asset_type": "backup", "ip_address": "10.0.2.80", "business_function": "Backup & Recovery", "criticality": "high", "internet_exposed": False, "data_sensitivity": 5},
    {"id": 11, "name": "Cloud ERP", "asset_type": "saas", "ip_address": "erp.novatech-demo.in", "business_function": "Finance & Production Planning", "criticality": "critical", "internet_exposed": True, "data_sensitivity": 5},
    {"id": 12, "name": "IoT Sensor Gateway", "asset_type": "iot-gateway", "ip_address": "10.0.40.5", "business_function": "Shop-Floor Telemetry", "criticality": "medium", "internet_exposed": True, "data_sensitivity": 2},
    {"id": 13, "name": "Workstations Pool", "asset_type": "endpoint-group", "ip_address": "10.0.3.0/24", "business_function": "Staff Computing", "criticality": "low", "internet_exposed": False, "data_sensitivity": 2},
    {"id": 14, "name": "Admin Workstation", "asset_type": "endpoint", "ip_address": "10.0.3.14", "business_function": "IT Administration", "criticality": "medium", "internet_exposed": False, "data_sensitivity": 4},
    {"id": 15, "name": "VPN Gateway", "asset_type": "vpn", "ip_address": "10.0.1.30", "business_function": "Remote Access", "criticality": "high", "internet_exposed": True, "data_sensitivity": 4},
    {"id": 16, "name": "SIEM / Log Server", "asset_type": "logging", "ip_address": "10.0.2.90", "business_function": "Security Monitoring", "criticality": "medium", "internet_exposed": False, "data_sensitivity": 3},
    {"id": 17, "name": "Dev/Test Server", "asset_type": "app-server", "ip_address": "10.0.50.10", "business_function": "Development", "criticality": "low", "internet_exposed": False, "data_sensitivity": 1},
    {"id": 18, "name": "Printer Fleet", "asset_type": "peripheral", "ip_address": "10.0.6.0/24", "business_function": "Printing", "criticality": "low", "internet_exposed": False, "data_sensitivity": 1},
    {"id": 19, "name": "Wi-Fi Access Points", "asset_type": "network", "ip_address": "10.0.7.1", "business_function": "Wireless Access", "criticality": "medium", "internet_exposed": False, "data_sensitivity": 2},
    {"id": 20, "name": "Payment Gateway Interface", "asset_type": "payment", "ip_address": "10.0.8.20", "business_function": "Payments", "criticality": "high", "internet_exposed": True, "data_sensitivity": 5},
    {"id": 21, "name": "QA Mock Payment API", "asset_type": "mock-api", "ip_address": "10.0.99.21", "business_function": "Automated Testing", "criticality": "medium", "internet_exposed": True, "data_sensitivity": 3},
]

VULNERABILITIES = [
    {"asset_id": 1, "cve_id": "CVE-2024-1001", "severity": 9.8, "exploitability": 0.9, "mitre_technique": "T1190", "description": "Unauthenticated RCE in web framework"},
    {"asset_id": 2, "cve_id": "CVE-2024-1002", "severity": 8.1, "exploitability": 0.7, "mitre_technique": "T1566", "description": "Malicious attachment payload execution"},
    {"asset_id": 15, "cve_id": "CVE-2024-1003", "severity": 9.1, "exploitability": 0.85, "mitre_technique": "T1133", "description": "VPN gateway authentication bypass"},
    {"asset_id": 12, "cve_id": "CVE-2024-1004", "severity": 7.5, "exploitability": 0.75, "mitre_technique": "T1078", "description": "Default credentials on IoT gateway"},
    {"asset_id": 4, "cve_id": "CVE-2024-1005", "severity": 8.8, "exploitability": 0.6, "mitre_technique": "T1068", "description": "Local privilege escalation to DOMAIN ADMIN"},
    {"asset_id": 11, "cve_id": "CVE-2024-1006", "severity": 8.6, "exploitability": 0.7, "mitre_technique": "T1190", "description": "SQL injection in ERP reporting module"},
    {"asset_id": 20, "cve_id": "CVE-2024-1007", "severity": 7.2, "exploitability": 0.65, "mitre_technique": "T1539", "description": "Session token theft via stored XSS"},
    {"asset_id": 10, "cve_id": "CVE-2024-1008", "severity": 6.5, "exploitability": 0.5, "mitre_technique": "T1530", "description": "Over-permissive backup share access"},
    {"asset_id": 21, "cve_id": "CVE-MOCK-0001", "severity": 6.8, "exploitability": 0.6, "mitre_technique": "T1190", "description": "Synthetic API authorization gap for QA testing"},
]

THREATS = [
    {"name": "Exploit Public-Facing Application", "technique": "T1190", "likelihood": 0.7},
    {"name": "Phishing", "technique": "T1566", "likelihood": 0.65},
    {"name": "Valid Accounts", "technique": "T1078", "likelihood": 0.6},
    {"name": "Privilege Escalation Exploit", "technique": "T1068", "likelihood": 0.5},
    {"name": "Network Service Scanning", "technique": "T1046", "likelihood": 0.55},
]

PATH_DEFS = [
    {"key": "A", "source": 1, "target": 3, "nodes": [1, 7, 3], "edges": [0.7, 0.6], "techniques": ["T1190", "T1078"], "label": "Web RCE to Customer DB"},
    {"key": "B", "source": 15, "target": 4, "nodes": [15, 14, 4], "edges": [0.65, 0.6], "techniques": ["T1133", "T1078"], "label": "VPN bypass to Domain Admin"},
    {"key": "C", "source": 2, "target": 20, "nodes": [2, 13, 20], "edges": [0.65, 0.6], "techniques": ["T1566", "T1539"], "label": "Phishing to Payment Fraud"},
    {"key": "D", "source": 12, "target": 10, "nodes": [12, 9, 10], "edges": [0.55, 0.6], "techniques": ["T1078", "T1046"], "label": "IoT foothold to Backup Theft"},
]

DECOYS = [
    {"name": "DEC-01 Finance Decoy Server", "deception_type": "decoy_server", "location": "Finance VLAN near Cloud ERP sync", "status": "ready"},
    {"name": "DEC-02 Fake Admin Portal", "deception_type": "fake_portal", "location": "DMZ segment", "status": "ready"},
    {"name": "DEC-03 Honeytoken Credentials", "deception_type": "honeytoken", "location": "ERP authentication path", "status": "ready"},
]

CONTROLS = [
    {"name": "Multi-Factor Authentication (MFA)", "category": "Identity", "cost": 150000, "expected_reduction": 0.15, "effort": "low", "paths_affected": ["B", "C"], "description": "Blocks stolen-credential reuse on VPN and admin access"},
    {"name": "Network Segmentation", "category": "Network", "cost": 300000, "expected_reduction": 0.2, "effort": "medium", "paths_affected": ["A", "D"], "description": "Isolates DMZ, IoT and crown-jewel VLANs"},
    {"name": "Endpoint Detection & Response (EDR)", "category": "Endpoint", "cost": 250000, "expected_reduction": 0.18, "effort": "medium", "paths_affected": ["B", "C"], "description": "Detects lateral movement and payload execution"},
    {"name": "Patch Management System", "category": "Vulnerability", "cost": 100000, "expected_reduction": 0.12, "effort": "low", "paths_affected": ["A", "D"], "description": "Closes known CVEs on web, ERP and IoT assets"},
    {"name": "Privileged Access Management (PAM)", "category": "Identity", "cost": 200000, "expected_reduction": 0.16, "effort": "medium", "paths_affected": ["B"], "description": "Vaults domain-admin credentials, just-in-time elevation"},
    {"name": "Backup Hardening", "category": "Resilience", "cost": 120000, "expected_reduction": 0.1, "effort": "low", "paths_affected": ["D"], "description": "Immutable off-domain backups with MFA deletes"},
    {"name": "Email Security Gateway", "category": "Email", "cost": 80000, "expected_reduction": 0.09, "effort": "low", "paths_affected": ["C"], "description": "Attachment sandboxing and phishing URL rewrite"},
    {"name": "Web Application Firewall (WAF)", "category": "Network", "cost": 180000, "expected_reduction": 0.14, "effort": "medium", "paths_affected": ["A"], "description": "Virtual patching for web RCE and injection"},
]
