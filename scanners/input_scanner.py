import requests


def scan_input_validation(
    url,
    headers=None
):

    test_inputs = [
        "test",
        "123",
        "<test>",
        "' OR '1'='1"
    ]

    results = []

    if headers is None:
        headers = {}


    for test_input in test_inputs:

        try:

            response = requests.get(
                url,
                params={
                    "input": test_input
                },
                headers=headers,
                timeout=10
            )


            response_text = response.text


            reflected = (
                test_input in response_text
            )


            if reflected:

                severity = "Medium"

                message = (
                    "Test input was reflected "
                    "in the API response. "
                    "Review output encoding "
                    "and input handling."
                )

            else:

                severity = "Informational"

                message = (
                    "Test input was not "
                    "reflected in the API response."
                )


            results.append({

                "input": test_input,

                "status_code":
                    response.status_code,

                "response_length":
                    len(response_text),

                "reflected":
                    reflected,

                "severity":
                    severity,

                "message":
                    message

            })


        except requests.exceptions.RequestException as e:

            results.append({

                "input": test_input,

                "status_code": None,

                "response_length": 0,

                "reflected": False,

                "severity": "Unknown",

                "message": str(e)

            })


    return results
