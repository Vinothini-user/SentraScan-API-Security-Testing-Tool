import re


def scan_sensitive_data(body):

    findings = []

    sensitive_patterns = {
        "Password": r"password",
        "Token": r"token",
        "API Key": r"api[_-]?key",
        "Secret": r"secret",
        "Authorization": r"authorization",
        "Credit Card": r"credit[_-]?card",
        "SSN": r"\b\d{3}-\d{2}-\d{4}\b"
    }

    body_lower = body.lower()

    for data_type, pattern in sensitive_patterns.items():

        if re.search(pattern, body_lower):

            findings.append({
                "data_type": data_type,
                "severity": "High",
                "message": f"Potential {data_type} information detected in API response.",
                "recommendation": "Avoid exposing sensitive information in API responses."
            })

    if not findings:

        findings.append({
            "data_type": "None",
            "severity": "Informational",
            "message": "No common sensitive data patterns were detected.",
            "recommendation": "Continue reviewing API responses for sensitive information."
        })

    return findings
