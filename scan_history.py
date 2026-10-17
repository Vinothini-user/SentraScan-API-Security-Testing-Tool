import json
import os
from datetime import datetime

REPORT_FOLDER = "reports"


def save_scan_report(report):

    os.makedirs(REPORT_FOLDER, exist_ok=True)

    now = datetime.now()

    timestamp = now.strftime("%Y%m%d_%H%M%S")
    scan_id = now.strftime("SCAN-%Y%m%d-%H%M%S")

    report["scan_id"] = scan_id
    report["timestamp"] = now.strftime("%Y-%m-%d %H:%M:%S")

    filename = f"scan_{timestamp}.json"

    filepath = os.path.join(
        REPORT_FOLDER,
        filename
    )

    with open(filepath, "w") as file:
        json.dump(report, file, indent=4)

    return {
        "scan_id": scan_id,
        "timestamp": report["timestamp"],
        "filename": filepath
    }


def get_scan_history():

    os.makedirs(REPORT_FOLDER, exist_ok=True)

    reports = []

    for filename in sorted(
        os.listdir(REPORT_FOLDER),
        reverse=True
    ):

        if filename.endswith(".json"):

            filepath = os.path.join(
                REPORT_FOLDER,
                filename
            )

            try:

                with open(filepath, "r") as file:
                    report = json.load(file)

                reports.append({
                    "filename": filename,
                    "report": report
                })

            except (json.JSONDecodeError, OSError):
                continue

    return reports


# -------------------------------------------------
# GET ONE REPORT
# -------------------------------------------------

def get_scan_report(filename):

    # Prevent unsafe file paths
    filename = os.path.basename(filename)

    if not filename.endswith(".json"):
        return None

    filepath = os.path.join(
        REPORT_FOLDER,
        filename
    )

    if not os.path.isfile(filepath):
        return None

    try:

        with open(filepath, "r") as file:
            report = json.load(file)

        return {
            "filename": filename,
            "report": report
        }

    except (json.JSONDecodeError, OSError):
        return None


# -------------------------------------------------
# DELETE ONE REPORT
# -------------------------------------------------

def delete_scan_report(filename):

    # Prevent unsafe file paths
    filename = os.path.basename(filename)

    if not filename.endswith(".json"):
        return False

    filepath = os.path.join(
        REPORT_FOLDER,
        filename
    )

    if not os.path.isfile(filepath):
        return False

    try:

        os.remove(filepath)

        return True

    except OSError:
        return False
