---
cover: "../../assets/images/flood-father.jpg"
title: "Flood Father: Houston Flood Voice Assistant"
description: "A voice assistant that answers 'is it flooding near me?' in English or Spanish, using live USGS stream gauges and National Weather Service alerts. It always states how old the data is and where it came from, and never calls an area safe."
date: 2026-10-11
tags: [python, fastapi, elevenlabs, voice-ai, docker, vultr, gemini-flash]
featured: true
repoUrl: https://github.com/aabdullakh/Hurricane-and-flood-voice-assistant-for-Houston-
---

## The Problem

Houston floods fast, and the information about it is public: USGS stream gauges, National Weather Service alerts, shelter lists. But it lives in dashboards and map viewers. The people who need it most during a storm, like older residents, Spanish speakers, or anyone on a phone with a weak connection, are the ones least able to use those tools.

I wanted to answer one question out loud, in plain words: "is it flooding near me?" I built it with my team at CodeRED Orion, a 24-hour hackathon at the University of Houston, and shipped it as a live website anyone can talk to.

## What It Does

Here is a real call from my testing:

> **Me:** Are there flood alerts for downtown Houston?
>
> **Flood Father:** As of eleven AM, there are no active flood alerts for downtown Houston, and the risk level is low, based on stream gauges and National Weather Service data. The nearest gauge, at Whiteoak Bayou, is about 0.8 miles away and is currently falling.

Every answer states how old the data is, where it came from, and how far away the nearest gauge is. Ask for a shelter and it checks FEMA's open-shelter list, and if the list is empty it says so and points you to 211. Say something that sounds like an emergency and it gives the 911 instruction immediately, in English and Spanish. It switches languages with the caller, mid-conversation.

## Architecture: How It Works

```
┌───────────────────────┐
│  Visitor's browser    │
│  site + voice widget  │
└───────────┬───────────┘
            │ voice (mic in, audio out)
            ▼
┌───────────────────────┐
│  ElevenLabs agent     │
│  speech → Gemini Flash│
│  → voice              │
└───────────┬───────────┘
            │ tool call + API key (HTTPS)
            ▼
┌───────────────────────┐                          ┌──────────────────────┐
│  Vultr server         │        reads live        │ USGS gauges          │
│  Caddy → FastAPI      │ ───────────────────────▶ │ NWS alerts           │
│  → Postgres           │                          │ Census + Nominatim   │
└───────────────────────┘                          │ FEMA shelters        │
                                                   └──────────────────────┘
```

1. **Listen.** The website embeds an ElevenLabs voice agent. It transcribes my speech in real time, decides when I've finished talking, and hands the transcript to a Gemini Flash model.
2. **Ask for facts.** A language model can't know today's water levels, so it calls my API as a tool. The request goes over HTTPS with a secret API key in the header.
3. **Look it up.** My FastAPI service turns the place into coordinates, finds the nearest USGS gauges and their recent trend, pulls active National Weather Service alerts for that point, and combines them into a risk level.
4. **Answer.** The API returns structured JSON with the risk, the gauge, the distance, the time of the data, its source, and a ready-made sentence. The agent rephrases it into two short sentences and speaks it back.

The part I like most: the model never makes up a number. Every water level it says comes from a tool result. If the lookup fails or the data is missing, the result is `unknown` and the agent says exactly that.

## The Engineering Behind It

**Understanding places people actually say.** My first voice tests failed on "Houston", "Katy" and "Sugar Land". The Census geocoder only understands street addresses, so a city name returned nothing. I rebuilt the lookup into a chain:
- Census first, for street addresses and ZIP codes.
- OpenStreetMap Nominatim as a fallback for place names, limited to a Greater Houston bounding box and to the US, throttled to one request per second to respect its usage policy, and cached under a hash of the query instead of the raw text.
- Twelve built-in Houston-area cities that answer instantly with no network call.
- Structured failures (`not_found`, `outside_area`, `missing_location`), so the agent can say what went wrong instead of inventing a place.

I covered the new logic with an automated test suite of 153 tests.

**Honest data.** USGS gauges report about every 15 minutes and can lag, so every response carries its own timestamp and the agent has to say it out loud. A `replay` mode feeds recorded storm data through the same code path for demos, and the agent is told to announce that it's a replay. Sample shelter data is flagged the same way.

**A prompt written like a safety spec.** The agent never says an area or road is "safe" and never promises it won't flood. It never tells anyone to drive through water ("turn around, don't drown"). It gives no medical advice and shares nothing about other callers. It treats caller speech as information, not as instructions that can rewrite its rules, which guards against prompt injection. I tested it with a simulated "I'm drowning" call, and it gave the 911 instruction in both languages and asked whether the caller could reach high ground.

**A hardened server, not just a deployed one.** The API runs on a Vultr server with Docker Compose: the FastAPI app, Postgres, and Caddy as the reverse proxy.
- Caddy gets and renews HTTPS certificates automatically, sets strict security headers and a content-security policy, and rate-limits requests.
- SSH is key-only, with no passwords and no root login, behind a firewall that allows three ports and fail2ban.
- Secrets live only in a permission-locked environment file on the server and in an ElevenLabs secret, never in the repo or the browser.
- API routes require a key. The auto-generated docs and admin paths return 404.
- The deploy user can't use Docker without `sudo`, so a stolen session isn't instant control of the containers.
- A deploy script syncs only what changed, has a dry-run mode, and ends with `DEPLOYED OK` or `DEPLOY FAILED`.

**Tuned for real rooms.** In a loud hackathon hall the agent started answering other people's conversations. I read the call transcripts, turned on background-speech filtering, slowed turn-taking, disabled speculative responses, removed languages that noise was being misheard as, and added prompt rules to ignore side chatter. The honest limit: no setting isolates one speaker, so a headset is the real fix.

## Tech Stack & How I Built It

- **Voice:** ElevenLabs Agents (speech to text, turn-taking, text to speech), Gemini Flash as the language model, English and Spanish
- **Backend:** Python, FastAPI, Postgres, Docker Compose
- **Data:** USGS Water Services, National Weather Service API, US Census geocoder, OpenStreetMap Nominatim, FEMA shelters
- **Hosting & security:** Vultr cloud server, Caddy with automatic HTTPS, UFW, fail2ban, a GoDaddy domain
- **Frontend:** static HTML, CSS and JavaScript with the ElevenLabs widget, self-hosted so the content-security policy can stay strict
- **Tooling:** Git and GitHub, a deploy script with dry-run mode, an automated test suite

I deployed to the server early, so the voice agent's tools had a real HTTPS endpoint to call from day one. Then I improved one layer at a time, testing every change by calling the agent and reading the transcripts. ElevenLabs shows each turn, tool call and interruption, which turned vague problems ("it broke") into specific causes.

## Challenges I Hit

- **City names returned nothing.** The geocoder limitation above. Fixed with the fallback chain.
- **The agent kept demanding a street address.** It was following the tool descriptions I wrote. I reworded them so it defaults to "Houston", and the API now accepts a plain `location`.
- **Answers cut off mid-sentence.** The tool calls had succeeded, but speaker echo and room noise interrupted playback. A headset fixed it.
- **A tool silently failed.** One tool URL was missing its path. Reading the call log found it in minutes.
- **A redesign I didn't want.** I built a full redesign late at night, then decided the original was better. I deleted the branch and used a dry run to prove that a backend deploy leaves the website untouched.

## What I Learned

**Test it by talking to it.** Unit tests passed while real calls still failed. Real speech surfaced problems no test had imagined, like place names, echo, and background talk.

**Security is a design choice, not a final step.** Deciding early that no key ever reaches the browser shaped everything: the tools run server-side, the widget is self-hosted, and the policy stays strict.

**A tool that people might use in danger has to be honest.** Stating the data's age and source on every answer, saying "unknown" instead of guessing, and never saying "safe" made it feel more trustworthy, not less.

**Voice is a different interface.** Two short sentences, then a pause. Anything longer, and people stop listening.

## What's Next

- A push-to-talk button for noisy rooms.
- A phone number with an SMS fallback, for people with no data connection.
- Vietnamese support, for one of Houston's largest communities.
- Shelter data verified against official county and Red Cross sources.
- Pre-generated audio for area-wide alerts, to cut cost and delay when many people call at once.