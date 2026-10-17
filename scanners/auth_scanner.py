import requests


def scan_authentication(url, headers=None):

    if headers is None:
        headers = {}

    try:

        response = requests.get(
            url,
            headers=headers,
            timeout=10
        )

        if response.status_code == 401:
            return {
                "authentication_required": True,
                "status_code": response.status_code,
                "severity": "Informational",
                "message": "Authentication is required."
            }

        elif response.status_code == 403:
            return {
                "authentication_required": True,
                "status_code": response.status_code,
                "severity": "Informational",
                "message": "Access is forbidden without authorization."
            }

        elif 200 <= response.status_code < 300:
            return {
                "authentication_required": False,
                "status_code": response.status_code,
                "severity": "Medium",
                "message": "API endpoint is accessible without authentication."
            }

        else:
            return {
                "authentication_required": None,
                "status_code": response.status_code,
                "severity": "Informational",
                "message": "Authentication status could not be determined from this response."
            }

    except requests.exceptions.RequestException as e:

        return {
            "authentication_required": None,
            "status_code": None,
            "severity": "Unknown",
            "message": str(e)
        }
