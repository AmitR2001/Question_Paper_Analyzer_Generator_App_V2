import os
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

# OpenRouter Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o")
OPENROUTER_SITE_URL = os.getenv("OPENROUTER_SITE_URL", "https://questiondifficulty.app")
OPENROUTER_SITE_NAME = os.getenv("OPENROUTER_SITE_NAME", "Question Difficulty Analyzer")

def test_openrouter():
    try:
        # Initialize OpenRouter client
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=OPENROUTER_API_KEY,
        )
        
        # Test request
        completion = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": OPENROUTER_SITE_URL,
                "X-Title": OPENROUTER_SITE_NAME,
            },
            model=OPENROUTER_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": "Say 'OpenRouter is working!' in exactly those words."
                }
            ],
            max_tokens=50
        )
        
        print("✅ OpenRouter Test Successful!")
        print(f"Response: {completion.choices[0].message.content}")
        return True
        
    except Exception as e:
        print(f"❌ OpenRouter Test Failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_openrouter()
