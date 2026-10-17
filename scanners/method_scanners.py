
import requests


def scan_methods(url, headers=None):
    methods = [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ]

    results = []
    headers = headers or {}

    # Reuse a connection for this group of requests.
    with requests.Session() as session:
        session.headers.update(headers)

        for method in methods:
            try:
                response = session.request(
                    method,
                    url,
                    timeout=(3, 5),
                    allow_redirects=False,
                    # Avoid downloading unnecessary response bodies.
                    stream=True
                )

                results.append({
                    "method": method,
                    "status_code": response.status_code
                })

                response.close()

            except requests.exceptions.RequestException as e:
                results.append({
                    "method": method,
                    "status_code": None,
                    "error": str(e)
                })

    return results
