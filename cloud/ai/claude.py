import logging

import anthropic

import config

logger = logging.getLogger(__name__)


def _extract_text(response: anthropic.types.Message) -> str:
	text_parts = []
	for block in getattr(response, "content", []) or []:
		block_text = getattr(block, "text", None)
		if block_text:
			text_parts.append(block_text)
	return "\n".join(text_parts).strip()


def respond(user_text: str) -> dict:
	if not user_text:
		return {"text": "", "action": None, "action_payload": {}}

	if not config.ANTHROPIC_API_KEY:
		logger.error("ANTHROPIC_API_KEY lipseste in env.")
		return {"text": "Sorry, I cannot access the AI service right now.", "action": None, "action_payload": {}}

	client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)

	tools = [
		{
			"type": "web_search_20250305",
			"name": "web_search"
		},
		{
			"name": "play_youtube",
			"description": "Play a song from YouTube via URL-ul.",
			"input_schema": {
				"type": "object",
				"properties": {
					"youtube_url": {
						"type": "string",
						"description": "URL for YouTube"
					},
					"song_name": {
						"type": "string", 
						"description": "Song name"
					}
				},
				"required": ["youtube_url"]
			}
		}
	]

	try:
		message = client.messages.create(
			model=config.CLAUDE_MODEL,
			max_tokens=config.CLAUDE_MAX_TOKENS,
			system=config.CLAUDE_SYSTEM_PROMPT,
			tools=tools,
			messages=[{"role": "user", "content": user_text}],
		)
	except Exception as exc:
		logger.exception("Claude API error: %s", exc)
		return {"text": "Sorry, there was a technical problem. Please try again.", "action": None, "action_payload": {}}

	result = {
		"text": "",
		"action": None,
		"action_payload": {}
	}

	for block in getattr(message, "content", []):
		if block.type == "text":
			result["text"] += block.text + "\n"
		elif block.type == "tool_use" and block.name == "play_youtube":
			result["action"] = "play_youtube"
			result["action_payload"] = {
				"url": block.input.get("youtube_url"),
				"song_name": block.input.get("song_name")
			}
			if not result["text"]:
				song = block.input.get("song_name", "asked song")
				result["text"] = f"Play {song} on YouTube."

	if config.CLAUDE_MAX_CHARS and len(result["text"]) > config.CLAUDE_MAX_CHARS:
		result["text"] = result["text"][: config.CLAUDE_MAX_CHARS].rstrip()
        
	return result
