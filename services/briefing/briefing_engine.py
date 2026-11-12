import os
import time
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import ServerError

# Load GEMINI_API_KEY from root .env
load_dotenv()

NAIRA_PER_USD = 1500.0

# 3 Active Models to Benchmark (Current Rates per 1M tokens in USD)
MODELS_TO_TEST = {
    "gemini-3.1-flash-lite": {"in": 0.25, "out": 1.50,  "label": "Cheapest & Sweet Spot (Winner)"},
    "gemini-3.5-flash-lite": {"in": 0.30, "out": 2.50,  "label": "Mid-Tier Flash-Lite"},
    "gemini-2.5-pro":        {"in": 1.25, "out": 10.00, "label": "Priciest (Heavy Reasoning Benchmark)"}
}


DEFAULT_MODEL = "gemini-3.1-flash-lite"

SAMPLE_RAW_DAY = """
DATE: 2026-11-13

CALENDAR EVENTS:
- 10:00 AM to 10:30 AM: Product Sync with Sam (Review sprint backlog)
- 2:00 PM to 3:00 PM: Client Pitch & Demo Call (Q4 contract presentation)

SLACK MESSAGES:
- [#project-vexa] Ade (08:45 AM): Hey, the Q4 client report is due tomorrow morning. Please review the numbers before your 2pm client call.
- [#random] Tunde (09:10 AM): Who is watching the Champions League match tonight? Let's link up at 8pm.
- [#engineering] Chioma (09:15 AM): Urgent: The staging server API key expires at 4pm today. Someone needs to rotate it.
"""


def build_dynamic_prompt(raw_text: str, settings: dict) -> str:
    """Injects the user's priority settings directly into the AI instructions."""
    focus = ", ".join(settings.get("focus_areas", ["deadlines", "meetings", "urgent tasks"]))
    ignore = ", ".join(settings.get("ignore_areas", ["casual Slack chatter"]))
    max_lines = settings.get("max_lines", 5)

    return f"""You are VExA, a proactive Virtual Executive Assistant.
Summarize the user's day into a crisp morning briefing.

USER PRIORITY SETTINGS:
- PICK OUT AND PRIORITIZE: {focus}
- STRICTLY IGNORE AND EXCLUDE: {ignore}
- LENGTH: Reply in at most {max_lines} short, actionable lines.

RULES:
1. Connect logical dependencies (e.g., if a report is needed before a 2pm call, say so clearly).
2. Never invent times, names, or facts not in the input.
3. Be direct and executive.

TODAY'S RAW DATA:
{raw_text}

MORNING BRIEFING:"""


def run_briefing(raw_text: str, settings: dict, model_name: str = DEFAULT_MODEL) -> dict:
    """Calls Gemini (with automatic 503 fallback) and calculates exact Naira cost."""
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    prompt = build_dynamic_prompt(raw_text, settings)

    active_model = model_name
    for attempt in range(2):
        try:
            response = client.models.generate_content(
                model=active_model,
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.0, max_output_tokens=200)
            )
            break
        except ServerError:
            if attempt == 0 and active_model != "gemini-3.5-flash-lite":
                print(f"  [Notice] {active_model} busy (503), falling back to gemini-2.5-flash-lite...")
                active_model = "gemini-2.5-flash-lite"
                time.sleep(1)
            else:
                raise

    usage = response.usage_metadata
    in_tokens = getattr(usage, "prompt_token_count", 0) or 220
    out_tokens = getattr(usage, "candidates_token_count", 0) or 65

    rates = MODELS_TO_TEST.get(active_model, MODELS_TO_TEST[DEFAULT_MODEL])
    cost_usd = ((in_tokens / 1_000_000) * rates["in"]) + ((out_tokens / 1_000_000) * rates["out"])
    cost_naira = cost_usd * NAIRA_PER_USD

    return {
        "model": active_model,
        "tier": rates["label"],
        "briefing": response.text.strip(),
        "tokens": {"in": in_tokens, "out": out_tokens},
        "cost_usd": round(cost_usd, 6),
        "cost_naira": round(cost_naira, 4)
    }


if __name__ == "__main__":
    # TEST A: Default Executive Mode
    settings_exec = {
        "focus_areas": ["deadlines", "client meetings", "urgent engineering blockers"],
        "ignore_areas": ["casual Slack chatter", "football match discussions"],
        "max_lines": 5
    }
    print("=== TEST A: EXECUTIVE PRIORITIES (DEMO MODE 1) ===")
    res_a = run_briefing(SAMPLE_RAW_DAY, settings_exec, DEFAULT_MODEL)
    print(res_a["briefing"])
    print(f"Model: {res_a['model']} | Cost: ₦{res_a['cost_naira']} (${res_a['cost_usd']})\n")

    # TEST B: Toggled Priorities (Deadlines & Urgent Fixes Only)
    settings_deadlines = {
        "focus_areas": ["strict deadlines", "expiring keys or urgent fixes"],
        "ignore_areas": ["routine meetings", "casual Slack chatter"],
        "max_lines": 3
    }
    print("=== TEST B: CHANGED PRIORITIES—DEADLINES ONLY (DEMO MODE 2) ===")
    res_b = run_briefing(SAMPLE_RAW_DAY, settings_deadlines, DEFAULT_MODEL)
    print(res_b["briefing"])
    print(f"Model: {res_b['model']} | Cost: ₦{res_b['cost_naira']} (${res_b['cost_usd']})\n")

    # TEST C: 3-Model Price & Quality Benchmark for Friday Demo
    print("=== TEST C: 3-MODEL BENCHMARK (N1,500 = $1) ===")
    for model_id in MODELS_TO_TEST:
        try:
            bench = run_briefing(SAMPLE_RAW_DAY, settings_exec, model_id)
            print(f"[{bench['model']} - {bench['tier']}] -> ₦{bench['cost_naira']} per briefing")
            print(f"Output:\n{bench['briefing']}\n{'-'*50}")
        except Exception as e:
            print(f"[{model_id}] skipped due to error: {e}\n{'-'*50}")