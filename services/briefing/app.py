import os
import io
import json
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS

# Google Drive API imports
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload

# Import your tested briefing engine
from briefing_engine import run_briefing, MODELS_TO_TEST, DEFAULT_MODEL

app = Flask(__name__)
CORS(app)  # Allows Olawi's Next.js frontend (localhost:3000) to call this API

SERVICE_ACCOUNT_FILE = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "service_account.json")
DRIVE_FOLDER_ID = os.environ.get("VEXA_DRIVE_FOLDER_ID", "")


def format_connector_payload(data: dict) -> str:
    """
    Converts Oloyin's structured JSON (calendar_events + slack_messages)
    into clean text for the AI model. Also accepts plain 'raw_input' strings.
    """
    if "raw_input" in data and isinstance(data["raw_input"], str):
        return data["raw_input"]

    lines = [f"DATE: {data.get('date', 'Today')}\n", "CALENDAR EVENTS:"]
    events = data.get("calendar_events", [])
    if not events:
        lines.append("- No scheduled calendar events.")
    for ev in events:
        lines.append(f"- {ev.get('start_time', '')} to {ev.get('end_time', '')}: {ev.get('title', '')} ({ev.get('description', '')})")

    lines.append("\nSLACK MESSAGES:")
    messages = data.get("slack_messages", [])
    if not messages:
        lines.append("- No new Slack messages.")
    for msg in messages:
        lines.append(f"- [{msg.get('channel', '#general')}] {msg.get('sender', 'Unknown')} ({msg.get('timestamp', '')}): {msg.get('text', '')}")

    return "\n".join(lines)


def save_to_google_drive(user_id: str, payload: dict) -> dict:
    """Archives the generated briefing JSON to Google Drive."""
    filename = f"vexa_briefing_{user_id}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"

    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        return {
            "saved_to_drive": False,
            "mode": "local_skip",
            "note": "Add service_account.json in root folder to enable live Google Drive uploads."
        }

    try:
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=["https://www.googleapis.com/auth/drive.file"]
        )
        service = build("drive", "v3", credentials=creds)

        metadata = {"name": filename, "mimeType": "application/json"}
        if DRIVE_FOLDER_ID:
            metadata["parents"] = [DRIVE_FOLDER_ID]

        media = MediaIoBaseUpload(
            io.BytesIO(json.dumps(payload, indent=2).encode("utf-8")),
            mimetype="application/json",
            resumable=False
        )
        uploaded = service.files().create(body=metadata, media_body=media, fields="id, name, webViewLink").execute()
        return {
            "saved_to_drive": True,
            "file_id": uploaded.get("id"),
            "filename": uploaded.get("name"),
            "web_link": uploaded.get("webViewLink")
        }
    except Exception as e:
        return {"saved_to_drive": False, "error": str(e)}


@app.route("/api/v1/briefing/generate", methods=["POST"])
def generate_briefing_endpoint():
    """Main endpoint connecting Oloyin's input -> Gemini -> Google Drive -> Olawi's UI."""
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id", "demo_user")
    settings = data.get("settings", {
        "focus_areas": ["deadlines", "meetings", "urgent tasks"],
        "ignore_areas": ["casual Slack chatter"],
        "max_lines": 5
    })
    selected_model = data.get("model", DEFAULT_MODEL)

    formatted_day = format_connector_payload(data)
    result = run_briefing(formatted_day, settings, model_name=selected_model)

    response_payload = {
        "status": "success",
        "user_id": user_id,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "applied_settings": settings,
        "briefing": result["briefing"],
        "cost_for_oloyin": {
            "model": result["model"],
            "cost_naira": result["cost_naira"],
            "cost_usd": result["cost_usd"],
            "tokens": result["tokens"],
            "rate": "N1,500 = $1"
        }
    }

    response_payload["drive_archive"] = save_to_google_drive(user_id, response_payload)
    return jsonify(response_payload), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)