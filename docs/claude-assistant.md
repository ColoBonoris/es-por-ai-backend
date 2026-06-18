# Claude assistant integration

This backend exposes IAn through:

```http
POST /api/v1/assistant/message
Content-Type: application/json
Cookie: access_token=...

{
  "message": "quiero comer sin tacc",
  "location": {
    "lat": -34.92,
    "lng": -57.95
  }
}
```

Response:

```json
{
  "message": "Encontré estos lugares que podrían servirte.",
  "recommendations": ["place_1", "place_2", "place_3"]
}
```

`recommendations` contains place IDs. Clients should fetch place details with the existing `/places/:placeId` endpoint or reuse cached places.

## Current behavior

- The endpoint always requires JWT auth.
- `owner` is read from the user stored in MongoDB after validating the JWT.
- Regular users never call Claude. They receive deterministic fallback recommendations.
- `owner=true` users can call Claude only when the provider is enabled by environment variables.
- If 1 or 2 places match, those IDs are returned. Fallback is used only when the provider criteria return 0 places.
- When Claude finds places, the backend sends sanitized place data plus up to 1 recent review per place to Claude for a short natural-language message.
- For `owner=true`, Claude decides whether the prompt is app-related and safe through `isRelevant`.
- For regular users, clearly unsafe or off-topic prompts use fallback without calling Claude.
- `message` is limited to 500 characters by backend validation.
- `location` is optional. Distance sorting is ignored when it is missing.

## Environment variables

Required to enable Claude:

```bash
ASSISTANT_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

Optional:

```bash
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
```

Default model in code: `claude-haiku-4-5-20251001`.

Without `ASSISTANT_PROVIDER=anthropic` and `ANTHROPIC_API_KEY`, IAn stays mock-only.

## How the backend uses Claude

Claude is used only as an intent classifier. It does not query MongoDB directly and does not decide arbitrary database operations.

The model receives the user message and returns JSON with controlled fields:

```json
{
  "isRelevant": true,
  "query": "cafe",
  "categories": ["Cafetería"],
  "excludedCategories": [],
  "features": ["gluten_free"],
  "excludedFeatures": [],
  "verified": null,
  "minRating": 4,
  "minReviewCount": null,
  "sort": [
    { "field": "distance", "direction": 1 },
    { "field": "rating", "direction": -1 }
  ]
}
```

Supported criteria:

- `query`: short text searched across name, category, description, and address.
- `categories`: exact category allowlist.
- `excludedCategories`: exact category denylist.
- `features`: required accessibility/profile features.
- `excludedFeatures`: features the place must not have, for exclusive criteria like "no acepta mascotas".
- `verified`: optional exact boolean.
- `minRating`: optional number from 0 to 5.
- `minReviewCount`: optional number.
- `sort`: up to 4 ordered criteria.

All supported sort fields accept both `1` and `-1`:

- `distance`: `1` means closer first, `-1` means farther first. Requires request `location`.
- `rating`: `-1` means highest rating first, `1` means lowest rating first.
- `reviewCount`: `-1` means most reviewed first, `1` means least reviewed first.
- `createdAt`: `-1` means newest in the app first, `1` means oldest first.
- `verified`: `-1` puts verified places first, `1` puts non-verified places first.
- `name`: `1` means A-Z, `-1` means Z-A.

The user profile accessibility preferences are passed as context to Claude for `owner=true` users. Claude may use them as filters for general recommendation questions, but backend still validates every criterion against allowlists.

The backend then:

1. validates the JSON shape;
2. removes categories, features, and sort values outside local allowlists;
3. queries MongoDB through the repository;
4. uses fallback recommendations if there are 0 matches;
5. fetches up to 1 recent review per matched place;
6. asks Claude for a short natural-language message using sanitized place/review data;
7. returns the message plus place IDs to the frontend.

This keeps cost low and avoids letting the model execute tools, write code, or invent records.

## Safety controls

Current controls:

- JWT required.
- `owner` flag is DB-owned.
- Provider disabled by default.
- Request body limited to 500 characters.
- Endpoint throttled to 10 requests per minute per global throttler identity.
- 5-second Claude timeout.
- `temperature: 0`.
- `max_tokens: 320`.
- Extended thinking is not enabled. The Messages API request omits the `thinking` parameter.
- Prompt caching is enabled on the static system prompt with `cache_control: { "type": "ephemeral" }`.
- Prompt instructs Claude to return JSON only.
- Local pre-filter blocks common off-topic or malicious requests only for regular users. Owner prompts are classified by Claude.
- Model output is sanitized against allowlists before use.
- Any provider error falls back silently.
- Logging records provider availability, usage token counts, cache token counts, fallback reasons, result count, and sanitized criteria. It does not log the full user message.

For the natural-language recommendation message:

- Claude receives only selected place fields and up to 1 recent review per place.
- Text fields are stripped of control characters and truncated before sending.
- The system prompt explicitly marks user message, place fields, and reviews as untrusted data.
- Claude is instructed to ignore any instruction embedded in place names, descriptions, addresses, or review text.
- Claude is instructed not to repeat suspicious embedded instructions.
- The final message is forced to one line and capped before returning.

## Prompt caching note

The implementation marks the static system prompt as cacheable. Anthropic's current docs say Claude Haiku 4.5 has a 4096-token minimum cacheable prompt length. If the static prompt is below that minimum, the request still works but Anthropic may not create or read a cache entry. Check `cache_creation_input_tokens` and `cache_read_input_tokens` in logs to verify cache behavior.

We do not use extended thinking because this is a small classification task. Adding thinking would increase latency and output-token billing risk without meaningful product value.

Recommended production additions:

- per-user quota for owner users;
- request/response logging without storing secrets or full personal data;
- explicit monthly spend cap in Anthropic Console;
- monitoring for provider failures and fallback rate;
- feature flag per environment;
- user-visible generic fallback when the provider is unavailable.

## Cost recommendation

Use Claude Haiku for this use case. The task is classification plus a tiny JSON response, so Sonnet or Opus would usually be unnecessary.

As of the current Anthropic pricing docs:

- Claude Haiku 4.5: $1 per million input tokens and $5 per million output tokens.
- Claude Sonnet 4.6: $3 per million input tokens and $15 per million output tokens.
- Claude Opus 4.8: $5 per million input tokens and $25 per million output tokens.

The current implementation should be cheap because prompts and outputs are small, only `owner=true` users call Claude, and non-app prompts are filtered before the API call.

## Should we pay now?

Only pay if we want to test real owner chat behavior. For normal users, no payment is needed because the backend stays mock-only.

Recommended path:

1. keep Claude disabled in production until the UI flow is accepted;
2. add a small prepaid/limited Anthropic billing setup;
3. enable only for one DB user with `owner=true`;
4. watch usage for a few days;
5. decide later whether the value justifies enabling more users.

## Official references

- Messages API: https://platform.claude.com/docs/en/api/messages
- Models overview: https://platform.claude.com/docs/en/about-claude/models/overview
- Pricing: https://platform.claude.com/docs/en/about-claude/pricing
- Tool use: https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
- Prompt caching: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
