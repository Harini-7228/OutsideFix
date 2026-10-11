# OutsideFix: One Photo. One Outdoor Action.

*This is a submission for the Hacktoberfest Open-Source AI Challenge: Week 1 — Touch Grass.*

## What I built

OutsideFix helps people turn an outdoor observation into one practical, safe environmental action. A user submits a photo, receives an AI-generated mission, then records their real-world progress and completion.

The goal is to make the screen a short planning step—not the activity itself.

## How it works

- **Gemma:** configured vision-capable Gemma endpoint analyzes the submitted outdoor image and proposes a structured mission.
- **Safety layer:** server-side checks reject clearly dangerous categories and display conservative safety guidance.
- **MongoDB Atlas:** persists mission history and status when configured.
- **Render:** hosts the application when deployed.
- **Evidence:** users can document an action with a reflection; completion is labeled user-reported rather than independently verified.

## Why open innovation matters

An open-weight model gives builders more flexibility to inspect deployment options, customize model use, and choose an inference environment. OutsideFix uses Gemma as a core part of the image-to-action experience rather than as a decorative chatbot.

## Demo

- Live app: [ADD REAL DEPLOYED URL]
- Source code: [ADD REAL REPOSITORY URL]
- Screenshots: [ADD REAL SCREENSHOTS]

## What I tested

[Describe only the real photo, mission, completion flow, database persistence, and deployment checks you actually performed. Add measured results only if measured.]

## What I learned

[Add your genuine implementation lessons and limitations.]

#devchallenge #hf26challenge
