from flask import Flask, request, jsonify, render_template 
from scanners.api_scanner import scan_api 
from report_generator import generate_security_report 
from scan_history import save_scan_report, get_scan_history,get_scan_report,delete_scan_report 
import os

app = Flask(__name__)


# ==========================================
# HOME PAGE
# ==========================================

@app.route("/")
def home():
    return render_template("index.html")

# ==========================================
# SCAN API
# ==========================================

@app.route("/scan", methods=["POST"])
def scan():
    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "error": "Request body is required."
        }), 400

    url = data.get("url", "").strip()

    if not url:
        return jsonify({
            "success": False,
            "error": "API URL is required."
        }), 400

    # -----------------------------------------
    # Authentication Settings
    # -----------------------------------------

    authentication = data.get(
        "authentication",
        {"type": "none"}
    )

    if not isinstance(authentication, dict):
        authentication = {
            "type": "none"
        }

    auth_type = authentication.get(
        "type",
        "none"
    )

    # -----------------------------------------
    # Scanner Settings
    # -----------------------------------------

    settings = data.get(
        "settings",
        {}
    )

    if not isinstance(settings, dict):
        settings = {}

    # -----------------------------------------
    # Validate Authentication
    # -----------------------------------------

    if auth_type == "bearer":

        token = authentication.get(
            "token",
            ""
        ).strip()

        if not token:
            return jsonify({
                "success": False,
                "error": "Bearer token is required."
            }), 400

    elif auth_type == "api_key":

        api_key = authentication.get(
            "key",
            ""
        ).strip()

        if not api_key:
            return jsonify({
                "success": False,
                "error": "API key is required."
            }), 400

    elif auth_type != "none":

        return jsonify({
            "success": False,
            "error": "Unsupported authentication type."
        }), 400

    # -----------------------------------------
    # Run API Security Scan
    # -----------------------------------------

    result = scan_api(
        url,
        authentication,
        settings
    )

    if not result.get("success"):
        return jsonify(result), 500

    # -----------------------------------------
    # Generate Security Report
    # -----------------------------------------

    report = generate_security_report(
        result
    )

    # -----------------------------------------
    # Save Scan Report
    # -----------------------------------------

    saved_file = save_scan_report(
        report
    )

    # -----------------------------------------
    # Return Result
    # -----------------------------------------

    return jsonify({
        "success": True,
        "scan_result": result,
        "security_report": report,
        "report_file": saved_file
    })
# -------------------------------------------------
# VIEW ONE SCAN REPORT
# -------------------------------------------------

@app.route("/history/<filename>", methods=["GET"])
def view_history_report(filename):

    report = get_scan_report(filename)

    if report is None:
        return jsonify({
            "success": False,
            "error": "Scan report not found"
        }), 404

    return jsonify({
        "success": True,
        "report": report
    })


# -------------------------------------------------
# DELETE ONE SCAN REPORT
# -------------------------------------------------

@app.route("/history/<filename>", methods=["DELETE"])
def delete_history_report(filename):

    deleted = delete_scan_report(filename)

    if not deleted:
        return jsonify({
            "success": False,
            "error": "Scan report not found"
        }), 404

    return jsonify({
        "success": True,
        "message": "Scan report deleted successfully",
        "filename": filename
    })

# ==========================================
# GET SCAN HISTORY
# ==========================================

@app.route("/history", methods=["GET"])
def history():

    reports = get_scan_history()

    return jsonify({

        "success": True,

        "total_scans": len(reports),

        "reports": reports

    })


# ==========================================
# DELETE SCAN HISTORY
# ==========================================

@app.route("/history/<filename>", methods=["DELETE"])
def delete_history(filename):

    # Prevent directory traversal
    filename = os.path.basename(filename)

    reports_folder = "reports"

    filepath = os.path.join(
        reports_folder,
        filename
    )

    # Check if file exists
    if not os.path.isfile(filepath):

        return jsonify({

            "success": False,

            "error": "Scan report not found"

        }), 404

    try:

        os.remove(filepath)

        return jsonify({

            "success": True,

            "message": "Scan report deleted successfully",

            "filename": filename

        })

    except OSError as e:

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


# ==========================================
# RUN FLASK
# ==========================================

if __name__ == "__main__":

    app.run(

        host="0.0.0.0",

        port=5000,

        debug=True

    )
