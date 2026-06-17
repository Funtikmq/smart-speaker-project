import anthropic
import config

client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
response = client.messages.create(
    model=config.CLAUDE_MODEL,
    max_tokens=1000,
    tools=[{"type": "web_search_20250305", "name": "web_search"}],
    messages=[{"role": "user", "content": "What weather will be tomorrow in Brasov?"}]
)
print("Content type:", type(response.content))
for b in response.content:
    print(b)
