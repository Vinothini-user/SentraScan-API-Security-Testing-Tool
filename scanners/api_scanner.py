import requests
import time

from scanners.header_scanner import scan_headers
from scanners.method_scanners import scan_methods
from scanners.auth_scanner import scan_authentication
from scanners.input_scanner import scan_input_validation
from scanners.error_scanner import scan_error_messages
from scanners.exposure_scanner import scan_sensitive_data


# =====================================================
# AUTHENTICATION HEADERS
# =====================================================

def build_auth_headers(authentication):

    headers = {}

    if not authentication:
        return headers

    auth_type = authentication.get("type", "none")

    # -----------------------------------------
    # Bearer Token
    # -----------------------------------------

    if auth_type == "bearer":

        token = authentication.get(
            "token",
            ""
        ).strip()

        if token:
            headers["Authorization"] = (
                f"Bearer {token}"
            )

    # -----------------------------------------
    # API Key
    # -----------------------------------------

    elif auth_type == "api_key":

        api_key = authentication.get(
            "key",
            ""
        ).strip()

        if api_key:
            headers["X-API-Key"] = api_key

    return headers


# =====================================================
# API SECURITY SCANNER
# =====================================================

def scan_api(
    url,
    authentication=None,
    settings=None
):

    result = {}
    scan_start = time.perf_counter()
    try:

        # -----------------------------------------
        # Default settings
        # -----------------------------------------

        if settings is None:
            settings = {}

        security_headers_enabled = settings.get(
            "securityHeaders",
            True
        )

        authentication_enabled = settings.get(
            "authentication",
            True
        )

        http_methods_enabled = settings.get(
            "httpMethods",
            True
        )

        input_validation_enabled = settings.get(
            "inputValidation",
            True
        )

        error_disclosure_enabled = settings.get(
            "errorDisclosure",
            True
        )

        sensitive_data_enabled = settings.get(
            "sensitiveData",
            True
        )


        # -----------------------------------------
        # Authentication headers
        # -----------------------------------------

        auth_headers = build_auth_headers(
            authentication
        )


        # -----------------------------------------
        # Main API request
        # -----------------------------------------

        start_time = time.time()

        response = requests.get(
            url,
            headers=auth_headers,
            timeout=10
        )

        end_time = time.time()

        response_time = round(
            end_time - start_time,
            3
        )


        # -----------------------------------------
        # Basic response information
        # -----------------------------------------

        result["success"] = True

        result["url"] = url

        result["status_code"] = (
            response.status_code
        )

        result["response_time"] = (
            response_time
        )

        result["headers"] = (
            dict(response.headers)
        )

        result["body"] = response.text


        # =================================================
        # SECURITY HEADER SCAN
        # =================================================

        if security_headers_enabled:

            result["security_headers"] = (
                scan_headers(
                    dict(response.headers)
                )
            )

        else:

            result["security_headers"] = []


        
        # =================================================
        # HTTP METHOD SCAN
        # =================================================

        if http_methods_enabled:
            check_start = time.perf_counter()

            result["http_methods"] = scan_methods(
                url,
                headers=auth_headers
            )

            print(
                f"[TIMING] HTTP methods: "
                f"{time.perf_counter() - check_start:.2f}s"
            )
        else:
            result["http_methods"] = []

        # =================================================
        # AUTHENTICATION SCAN
        # =================================================

        if authentication_enabled:

            # IMPORTANT:
            # This check intentionally runs
            # WITHOUT credentials to determine
            # whether authentication is required.

            result["authentication"] = (
                scan_authentication(url)
            )

        else:

            result["authentication"] = {}


        # =================================================
        # INPUT VALIDATION
        # =================================================

        if input_validation_enabled:

            result["input_validation"] = (
                scan_input_validation(
                    url,
                    headers=auth_headers
                )
            )

        else:

            result["input_validation"] = []


        # =================================================
        # ERROR DISCLOSURE
        # =================================================

        if error_disclosure_enabled:

            result["error_analysis"] = (
                scan_error_messages(
                    url,
                    headers=auth_headers
                )
            )

        else:

            result["error_analysis"] = []


        # =================================================
        # SENSITIVE DATA
        # =================================================

        if sensitive_data_enabled:

            result["sensitive_data"] = (
                scan_sensitive_data(
                    response.text
                )
            )

        else:

            result["sensitive_data"] = []


        # -----------------------------------------
        # Authentication information
        # -----------------------------------------

        result["authentication_type"] = (
            authentication.get(
                "type",
                "none"
            )
            if authentication
            else "none"
        )


        # -----------------------------------------
        # Scanner settings used
        # -----------------------------------------

        result["scanner_settings"] = {
            "securityHeaders":
                security_headers_enabled,

            "authentication":
                authentication_enabled,

            "httpMethods":
                http_methods_enabled,

            "inputValidation":
                input_validation_enabled,

            "errorDisclosure":
                error_disclosure_enabled,

            "sensitiveData":
                sensitive_data_enabled
        }


    except requests.exceptions.Timeout:

        result["success"] = False

        result["error"] = (
            "Request timed out. "
            "The API did not respond within 10 seconds."
        )


    except requests.exceptions.ConnectionError:

        result["success"] = False

        result["error"] = (
            "Could not connect to the API. "
            "Check the URL and make sure the API server is running."
        )


    except requests.exceptions.RequestException as e:

        result["success"] = False

        result["error"] = str(e)


    except Exception as e:

        result["success"] = False

        result["error"] = str(e)


    return result
