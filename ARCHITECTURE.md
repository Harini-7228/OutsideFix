# Architecture

Browser (React/Vite) -> Express API -> configured Gemma vision endpoint for analysis.

Express API -> MongoDB Atlas when `MONGODB_URI` is configured; otherwise in-memory demo mode is explicitly reported. AI endpoint and database are configured independently. No API secrets belong in the browser.

The current evidence endpoint stores evidence metadata only, not photo bytes. Persistent image hosting is intentionally not implied by this MVP.
