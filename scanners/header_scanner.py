
def scan_headers(headers):
    findings = []

    # HTTP header names are case-insensitive.
    normalized_headers = {
        str(name).lower(): value
        for name, value in headers.items()
    }

    security_headers = {
        "Strict-Transport-Security": {
            "severity": "Medium",
            "recommendation": (
                "HSTS was not observed. Consider whether HSTS "
                "is appropriate for this HTTPS service."
            )
        },
        "X-Content-Type-Options": {
            "severity": "Low",
            "recommendation": (
                "Set X-Content-Type-Options to nosniff."
            )
        },
        "Content-Security-Policy": {
            "severity": "Low",
            "recommendation": (
                "Assess whether a Content-Security-Policy "
                "is appropriate for this service."
            )
        },
        "Cache-Control": {
            "severity": "Low",
            "recommendation": (
                "Review caching directives, especially for "
                "responses containing sensitive information."
            )
        }
    }

    for header, details in security_headers.items():
        value = normalized_headers.get(header.lower())

        if value is None:
            findings.append({
                "header": header,
                "status": "Missing",
                "severity": details["severity"],
                "recommendation": details["recommendation"]
            })
        else:
            findings.append({
                "header": header,
                "status": "Present",
                "value": str(value),
                "severity": "Informational",
                "recommendation": "Header is present."
            })

    return findings
