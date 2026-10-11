# OutsideFix 🌱

**One photo. One outdoor action.** OutsideFix helps people turn a real-world outdoor observation into a small, safe, achievable mission, then record what they did.

## What works in this codebase

- React + Vite + TypeScript responsive frontend.
- Express + TypeScript API with request validation and rate limiting.
- Configurable OpenAI-compatible **Gemma** vision endpoint. The model is not silently replaced by a closed model.
- Independent conservative safety checks for dangerous observations and recommendations.
- MongoDB Atlas persistence when `MONGODB_URI` is configured.
- Mission lifecycle: suggested, saved, in progress, completed, cancelled.
- User-reported before/after evidence metadata and reflection.
- Health endpoint and basic automated tests.
- Render deployment configuration and submission documentation.

**Honesty note:** This repository has not been deployed or connected to your API credentials. You must configure a real Gemma vision endpoint and MongoDB Atlas, run the checks, test a real outdoor mission, and deploy before claiming those integrations are live. When credentials are absent, the API returns a clear setup error rather than pretending a model ran.

## Requirements

- Node.js 20+
- npm 10+
- A MongoDB Atlas connection string (optional for local in-memory demo mode; required to demonstrate Atlas use)
- An API endpoint that genuinely serves a vision-capable Gemma model

## Setup (Windows PowerShell)

```powershell
npm install
Copy-Item .env.example .env
```

Edit `.env` and configure `GEMMA_API_URL`, `GEMMA_API_KEY`, `GEMMA_MODEL`, and `MONGODB_URI`.

Then run:

```powershell
npm run dev
```

Frontend: http://localhost:5173  
Backend health: http://localhost:5000/api/health

## Gemma endpoint contract

The server sends an OpenAI-compatible chat completion request with a text prompt and an image data URL. Confirm that your provider supports this format and your selected Gemma model supports image input. Set:
- `GEMMA_API_URL`: full chat-completions endpoint URL
- `GEMMA_API_KEY`: provider API key
- `GEMMA_MODEL`: exact provider model identifier

Do not put the API key in `client/.env` or commit it.

## API endpoints

- `GET /api/health`
- `POST /api/missions/analyze` — multipart form with `image` and optional `description`
- `POST /api/missions` — save a generated mission
- `GET /api/missions` — list recent missions
- `GET /api/missions/:id` — get a mission
- `PATCH /api/missions/:id/status` — update status
- `POST /api/missions/:id/evidence` — submit after-photo metadata and reflection
- `DELETE /api/missions/:id` — delete a mission

Evidence images are not uploaded to persistent object storage in this MVP. The endpoint accepts metadata only; if you need stored images, add a configured storage provider and consent/privacy controls first.

## Scripts

```bash
npm run dev
npm run typecheck
npm test
npm run build
```

## Deployment to Render

A `render.yaml` blueprint is included. Set server environment variables in Render. Configure `CLIENT_ORIGIN` to your deployed frontend URL and `VITE_API_URL` to the deployed backend API URL. For a production deployment, set `MONGODB_URI`, Gemma variables, and a strong origin allowlist. Build and deploy both services separately if you prefer independent service configuration.

Render free-tier availability, cold starts, and provider quotas may change.

## Safety and privacy

- Never handle unknown chemicals, needles, hazardous waste, wildlife, electrical equipment, or traffic infrastructure based on an AI suggestion.
- Ask permission before acting on shared or private property.
- Mission completion is user-reported, not independently verified.
- The app does not publish a location by default.
- Do not upload identifiable people, license plates, or private spaces without permission.
- AI output is untrusted and validated before rendering.

## Testing

The test suite covers core safety policy and mission-state transitions. Run `npm test`. Automated tests do not prove that the configured remote Gemma endpoint works; verify that manually with a real request.

## Contest submission materials

See `SUBMISSION_DRAFT.md`, `DEMO_SCRIPT.md`, and `EVIDENCE_CHECKLIST.md`. Replace all placeholders with real URLs and screenshots, and remove any statement that does not match the final working implementation.
