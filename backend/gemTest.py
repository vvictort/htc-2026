import os

# Try to load from .env manually if not set
if "GEMINI_API_KEY" not in os.environ and os.path.exists(".env"):
    with open(".env", "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                key, _, value = line.partition("=")
                if key.strip() == "GEMINI_API_KEY":
                    # Handle quotes if present
                    val = value.strip()
                    if val.startswith(('"', "'")) and val.endswith(('"', "'")):
                        val = val[1:-1]
                    os.environ["GEMINI_API_KEY"] = val
                    break

from google import genai

try:
    # The client gets the API key from the environment variable `GEMINI_API_KEY`.
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

    # List models to verify access without needing a specific model name
    print("Verifying API key by listing available models...")
    for m in client.models.list(config={"page_size": 1}):
        print(f"Found model: {m.name}")
        break
    print("API Key verification successful!")
except Exception as e:
    print(f"Error running Gemini test: {e}")