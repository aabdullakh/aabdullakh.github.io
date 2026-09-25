---
cover: "../../assets/images/pico.w.jpeg"
title: Raspberry Pi Pico W Internet & Wi-Fi Monitor
description: A self-contained, real-time local network telemetry monitor pwered by Pico W running MicroPython. Plug it into your home electricity and track Wi-Fi quality right from your phone.
date: 2026-09-17
tags: [micropython, iot, networking]
featured: true
repoUrl: https://github.com/aabdullakh/pico_internet_monitor
---

## The Problem

When my home internet felt slow, I never knew whether it was really the network, the Wi-Fi signal in my room, or just one website. I wanted to answer not just "is my internet down?", but also "how healthy is it right now, and how has it been behaving?", and to check that from my phone wherever I am.

So I built a small device that lives on an outlet at home and quietly measures my network every 10 seconds: Wi-Fi signal strength (RSSI), latency, jitter, packet loss, and uptime.

## Architecture: How It Works

```
┌──────────────────────┐     every 10s     ┌──────────────────────┐
│   Raspberry Pi       │ ───── HTTPS ────▶ │   Adafruit IO feed   │
│   Pico W (home)      │    POST reading   │   (public, cloud)    │
│                      │                   └──────────┬───────────┘
│ • reads Wi-Fi RSSI   │                              │
│ • TCP connect to     │                              │ polls every 10s
│   1.1.1.1:80 to time │                              ▼
│   latency, jitter,   │                   ┌──────────────────────┐
│   packet loss        │                   │  index.html dashboard│
│ • tracks uptime      │                   │  (GitHub Pages)      │
└──────────────────────┘                   │  → open on any phone │
                                           └──────────────────────┘
```

1. **Measure.** The Pico W runs MicroPython. Every 10 seconds it reads the signal strength from its radio and opens a TCP connection to 1.1.1.1 on port 80, timing each round trip to calculate latency, jitter, and packet loss.
2. **Publish.** It posts each reading to a public Adafruit IO feed.
3. **Display.** The dashboard is a single static `index.html` hosted on GitHub Pages. It polls the feed every 10 seconds and renders the latest numbers. Because the feed is public, the page needs no API key.
4. **Detect outages.** If the internet goes down, the Pico can't post. So if the newest reading is more than 60 seconds old, the dashboard shows **"Offline"**.

My favorite part: there's no backend to run or pay for. Just a device pushing data and a static page pulling it.

## Tech Stack & How I Built It

- **Hardware:** Raspberry Pi Pico W
- **Firmware:** MicroPython
- **Data pipeline:** Adafruit IO (public feed)
- **Dashboard:** HTML, CSS, and vanilla JavaScript on GitHub Pages
- **Tooling:** `mpremote` for flashing and debugging, Git and GitHub

The idea came from my mentor, and curiosity did the rest. I developed it with help from Claude, using it as a pair programmer for network health monitoring: figuring out how to measure latency and jitter on a microcontroller, structuring the firmware loop, and building the dashboard.

Here are some of the prompts I used:

**Choosing the architecture:** After Claude explained that a Pico W can only serve pages on its own Wi-Fi, and suggested either local-only access or a cloud relay, I chose: "Option 2 is good." (Pico → Adafruit IO → GitHub Pages.)


## What I Learned

Secrets management matters, even on a microcontroller. I originally had my Wi-Fi credentials in a committed `config.py`, which is a real security mistake. I fixed it by gitignoring `config.py` and committing a `config.example.py` template instead, so anyone can set up their own device without seeing mine.