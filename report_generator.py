def generate_security_report(scan_result):

    report = {
        "target": scan_result.get("url"),
        "status_code": scan_result.get("status_code"),
        "response_time": scan_result.get("response_time"),
        "summary": {
            "High": 0,
            "Medium": 0,
            "Low": 0,
            "Informational": 0
        },
        "findings": []
    }

    # Security headers
    for finding in scan_result.get("security_headers", []):

        severity = finding.get("severity")

        if severity in report["summary"]:
            report["summary"][severity] += 1

        if finding.get("status") == "Missing":
            report["findings"].append({
                "category": "Security Header",
                "name": finding.get("header"),
                "severity": severity,
                "message": finding.get("recommendation")
            })

    # Authentication
    authentication = scan_result.get("authentication", {})

    severity = authentication.get("severity")

    if severity in report["summary"]:
        report["summary"][severity] += 1

    if authentication.get("authentication_required") is False:
        report["findings"].append({
            "category": "Authentication",
            "name": "Authentication",
            "severity": severity,
            "message": authentication.get("message")
        })

    # Input validation
    for finding in scan_result.get("input_validation", []):

        severity = finding.get("severity")

        if severity in report["summary"]:
            report["summary"][severity] += 1

        if finding.get("reflected") is True:
            report["findings"].append({
                "category": "Input Validation",
                "name": finding.get("input"),
                "severity": severity,
                "message": finding.get("message")
            })

    # Error analysis
    for finding in scan_result.get("error_analysis", []):

        severity = finding.get("severity")

        if severity in report["summary"]:
            report["summary"][severity] += 1

        if finding.get("detected_keywords"):
            report["findings"].append({
                "category": "Error Disclosure",
                "name": "Sensitive Error Information",
                "severity": severity,
                "message": finding.get("message")
            })

    # Sensitive data
    for finding in scan_result.get("sensitive_data", []):

        severity = finding.get("severity")

        if severity in report["summary"]:
            report["summary"][severity] += 1

        if finding.get("data_type") != "None":
            report["findings"].append({
                "category": "Sensitive Data Exposure",
                "name": finding.get("data_type"),
                "severity": severity,
                "message": finding.get("message")
            })

    return report
