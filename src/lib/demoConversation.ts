export interface DemoMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: string
}

export const demoConversation: DemoMessage[] = [
  {
    id: 'demo-1',
    role: 'user',
    content: 'What is the current status of VOLTZITE group activity and how does it relate to the new Siemens S7-1500 vulnerability?',
    timestamp: '2026-03-18T08:45:00.000Z',
  },
  {
    id: 'demo-2',
    role: 'agent',
    content: `## VOLTZITE — Current Assessment (2026-03-18)

**Status:** ACTIVE — Elevated threat posture

VOLTZITE (Volt Typhoon) is currently assessed as **actively pre-positioning** within North American electric utility infrastructure. The following intelligence picture supports this assessment:

### CVE-2024-43647 — Critical Nexus

The newly published Siemens SIMATIC S7-1500 authentication bypass (CVSS **9.8**) is operationally significant for VOLTZITE specifically:

| Factor | Assessment |
|--------|-----------|
| Target alignment | VOLTZITE TTPs explicitly include S7-series PLC exploitation |
| Exploitation timeline | Weaponization expected within 72–96 hours of CVE publication |
| Affected deployment base | >40% of US electric utility SCADA uses S7-1500 series |
| IDS detection | Rule match confirmed on SCADA subnet (INV-001) |

### Current ICS ATT&CK Kill Chain Position

VOLTZITE appears to be operating at the **Lateral Movement** stage (T0886 — Remote Services) within the active investigation environment. Observed indicators:

\`\`\`
# IDS Alert Pattern — VOLTZITE S7comm Fingerprint
alert tcp any any -> $OT_NET 102 (
  msg:"VOLTZITE S7comm Anomaly — Unauthenticated PLC Query";
  content:"|03 00|";
  content:"|11 E0|";
  detection_filter: track by_src, count 5, seconds 60;
  sid:9001001; rev:2;
)
\`\`\`

### Recommended Immediate Actions

1. **Patch all S7-1500 PLCs** against CVE-2024-43647 — treat as emergency maintenance
2. **Isolate engineering workstation EW-047** per INV-001 forensic requirements
3. **Block S7comm (TCP/102)** at all IT/OT firewall boundaries
4. **Review VOLTZITE IoC list** from Dragos DRAG-2026-0031 against your environment

The convergence of this zero-day with confirmed VOLTZITE IDS alerting in INV-001 suggests this is not coincidental. VOLTZITE may have had early access to CVE-2024-43647 technical details before public disclosure.`,
    timestamp: '2026-03-18T08:46:00.000Z',
  },
  {
    id: 'demo-3',
    role: 'user',
    content: 'Generate a YARA rule for detecting VOLTZITE S7comm reconnaissance activity that I can deploy on my network monitoring infrastructure.',
    timestamp: '2026-03-18T08:52:00.000Z',
  },
  {
    id: 'demo-4',
    role: 'agent',
    content: `## YARA Rule: VOLTZITE S7comm Reconnaissance

Based on documented VOLTZITE TTPs (Dragos WorldView DRAG-2026-0031) and the observed IDS patterns from INV-001, here is a YARA rule targeting S7comm anomaly patterns consistent with VOLTZITE pre-positioning activity:

\`\`\`yara
rule VOLTZITE_S7comm_Reconnaissance {
    meta:
        description = "Detects S7comm traffic patterns associated with VOLTZITE PLC enumeration activity"
        author = "MindStone Threat Analyst Agent"
        date = "2026-03-18"
        tlp = "TLP:WHITE"
        reference = "Dragos DRAG-2026-0031 / CVE-2024-43647"
        confidence = "MEDIUM"

    strings:
        // S7comm COTP connection request with anomalous src-ref
        $s7_cotp_connect = { 03 00 ?? ?? 11 E0 00 00 ?? ?? 00 C1 02 ?? ?? C2 02 }

        // S7comm read/write SZL (System Status List) — used for PLC enumeration
        $s7_szl_request = { 32 01 00 00 ?? ?? 00 08 00 00 F0 00 00 01 00 01 01 E0 }

        // S7comm download request header — PLC logic modification
        $s7_download = { 32 01 00 00 ?? ?? 00 1C 00 00 F0 00 00 01 00 01 01 E0
                         1A 00 00 28 00 00 00 00 00 00 }

        // VOLTZITE-specific: rapid SZL list enumeration (multiple SZL IDs in sequence)
        $szl_0011 = { 00 11 00 00 }  // SZL ID 0x0011 — module identification
        $szl_001C = { 00 1C 00 00 }  // SZL ID 0x001C — component identification
        $szl_0091 = { 00 91 00 00 }  // SZL ID 0x0091 — module status
        $szl_00B4 = { 00 B4 00 00 }  // SZL ID 0x00B4 — I/O module status

    condition:
        // Match S7comm connection followed by enumeration of multiple SZL IDs
        ($s7_cotp_connect and 2 of ($szl_*)) or
        ($s7_download and any of ($szl_*)) or
        // High-confidence: download request targeting PLC
        $s7_download
}
\`\`\`

### Deployment Notes

**Platform compatibility:** Zeek (Bro), Suricata (with YARA integration), Snort (file-based)

**Recommended deployment points:**
- SCADA DMZ north/south firewall inline sensor
- Engineering workstation network tap
- Historian server network interface

**Expected false positive rate:** LOW in properly segmented OT networks. The SZL enumeration pattern is unusual outside of legitimate engineering software sessions.

> **Caveat:** This rule targets known VOLTZITE patterns from Dragos reporting. Novel TTPs may not be detected. Pair with the Siemens S7 CVE-2024-43647 IDS rule for maximum coverage.`,
    timestamp: '2026-03-18T08:53:00.000Z',
  },
]
