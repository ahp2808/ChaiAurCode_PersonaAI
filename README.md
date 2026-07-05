# PersonaAI with Javascript

A single-page chat UI with two chat interfaces:  
* CHAT 01: Hitesh Sir  
* CHAT 02: Piyush Sir  

Each chat keeps its own conversation history and system prompt.

You can access the deployed project here:
[PersonaAI](https://vercel.com/ahp2808s-projects/chai-aur-code-persona-ai/54a6LVcihj2haSQRvxFdGwZkQGZ5)

This project works with Gemini API. If you do not have Gemini API, change the model here: https://github.com/ahp2808/ChaiAurCode_PersonaAI/blob/fec581a99ec5306c87f36a5ab2d0df52ba0ca455/server.js#L18

And in the .env change the variable. Also, modify API key variable here:
https://github.com/ahp2808/ChaiAurCode_PersonaAI/blob/fec581a99ec5306c87f36a5ab2d0df52ba0ca455/server.js#L108

## Run these commands after cloning the repo.

```bash
npm install
cp .env.example .env
npm start
```

Then open http://localhost:3000.

Without an API key, `/api/chat` runs in demo mode and echoes back a canned
reply so you can see the UI working end to end. Add `GEMINI_API_KEY` to
`.env` to get real Claude responses per channel.

## Structure

```
server.js            Express server + /api/chat endpoint (per-channel system prompts)
public/index.html     Markup: left rail (channels) + right deck (chat)
public/style.css      Layout, theme, and channel color-switching
public/script.js      Channel switching, per-channel history, send/receive logic
```
