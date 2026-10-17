import requests


def scan_error_messages(
    url,
    headers=None
):

    test_urls = [

        f"{url}?id=invalid",

        f"{url}?id='",

        f"{url}?id=<invalid>"

    ]


    suspicious_keywords = [

        "traceback",

        "stack trace",

        "sql syntax",

        "database error",

        "mysql",

        "postgresql",

        "sqlite",

        "exception",

        'file "',

        "line "

    ]


    results = []


    if headers is None:
        headers = {}


    for test_url in test_urls:

        try:

            response = requests.get(
                test_url,
                headers=headers,
                timeout=10
            )


            body = response.text.lower()


            detected = [

                keyword

                for keyword in suspicious_keywords

                if keyword in body

            ]


            if detected:

                severity = "High"

                message = (
                    "Potential sensitive error "
                    "information was found "
                    "in the response."
                )

            else:

                severity = "Informational"

                message = (
                    "No common sensitive error "
                    "information was detected."
                )


            results.append({

                "url": test_url,

                "status_code":
                    response.status_code,

                "severity":
                    severity,

                "detected_keywords":
                    detected,

                "message":
                    message

            })


        except requests.exceptions.RequestException as e:

            results.append({

                "url": test_url,

                "status_code": None,

                "severity": "Unknown",

                "detected_keywords": [],

                "message": str(e)

            })


    return results
