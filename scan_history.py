import os
import json
from datetime import datetime

# -------------------------------------------------
# CONFIG
# -------------------------------------------------
BLOB_TOKEN = os.environ.get("BLOB_READ_WRITE_TOKEN")

# Local fallback (works on Vercel because /tmp is writable)
REPORT_FOLDER = os.path.join("/tmp", "reports")


def _use_blob():
    return bool(BLOB_TOKEN)


# -------------------------------------------------
# SAVE REPORT
# -------------------------------------------------
def save_scan_report(report):
    now = datetime.now()
    timestamp = now.strftime("%Y%m%d_%H%M%S")
    scan_id = now.strftime("SCAN-%Y%m%d-%H%M%S")

    report["scan_id"] = scan_id
    report["timestamp"] = now.strftime("%Y-%m-%d %H:%M:%S")

    filename = f"scan_{timestamp}.json"
    payload = json.dumps(report, indent=4)

    if _use_blob():
        import vercel_blob
        blob_path = f"reports/{filename}"
        # put(pathname, data, options)
        vercel_blob.put(
            blob_path,
            payload.encode("utf-8"),
            {"token": BLOB_TOKEN, "addRandomSuffix": "false"}
        )
        filepath = blob_path
    else:
        os.makedirs(REPORT_FOLDER, exist_ok=True)
        filepath = os.path.join(REPORT_FOLDER, filename)
        with open(filepath, "w") as f:
            f.write(payload)

    return {
        "scan_id": scan_id,
        "timestamp": report["timestamp"],
        "filename": filepath
    }


# -------------------------------------------------
# GET ALL REPORTS
# -------------------------------------------------
def get_scan_history():
    reports = []

    if _use_blob():
        import vercel_blob
        try:
            result = vercel_blob.list({
                "prefix": "reports/",
                "token": BLOB_TOKEN
            })
            blobs = result.get("blobs", [])

            # newest first
            blobs = sorted(
                blobs,
                key=lambda b: b.get("uploadedAt", ""),
                reverse=True
            )

            for blob in blobs:
                pathname = blob.get("pathname", "")
                if not pathname.endswith(".json"):
                    continue

                try:
                    # Use downloadUrl directly
                    download_url = blob.get("downloadUrl")
                    if not download_url:
                        continue

                    import urllib.request
                    with urllib.request.urlopen(download_url) as resp:
                        report = json.loads(resp.read().decode("utf-8"))

                    reports.append({
                        "filename": os.path.basename(pathname),
                        "report": report
                    })
                except Exception:
                    continue

            return reports
        except Exception as e:
            # If Blob fails, fall back to local
            print(f"Blob list error: {e}")

    # --- local fallback ---
    os.makedirs(REPORT_FOLDER, exist_ok=True)
    for filename in sorted(os.listdir(REPORT_FOLDER), reverse=True):
        if filename.endswith(".json"):
            filepath = os.path.join(REPORT_FOLDER, filename)
            try:
                with open(filepath, "r") as f:
                    report = json.load(f)
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
    filename = os.path.basename(filename)
    if not filename.endswith(".json"):
        return None

    if _use_blob():
        import vercel_blob
        blob_path = f"reports/{filename}"
        try:
            info = vercel_blob.head(blob_path, {"token": BLOB_TOKEN})
            download_url = info.get("downloadUrl")
            if not download_url:
                return None

            import urllib.request
            with urllib.request.urlopen(download_url) as resp:
                report = json.loads(resp.read().decode("utf-8"))

            return {
                "filename": filename,
                "report": report
            }
        except Exception:
            return None

    # --- local fallback ---
    filepath = os.path.join(REPORT_FOLDER, filename)
    if not os.path.isfile(filepath):
        return None

    try:
        with open(filepath, "r") as f:
            report = json.load(f)
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
    filename = os.path.basename(filename)
    if not filename.endswith(".json"):
        return False

    if _use_blob():
        import vercel_blob
        try:
            # delete accepts URL or pathname
            vercel_blob.delete(
                f"reports/{filename}",
                {"token": BLOB_TOKEN}
            )
            return True
        except Exception:
            return False

    # --- local fallback ---
    filepath = os.path.join(REPORT_FOLDER, filename)
    if not os.path.isfile(filepath):
        return False

    try:
        os.remove(filepath)
        return True
    except OSError:
        return False
