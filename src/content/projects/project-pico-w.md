---
cover: "../../assets/images/pico.w.jpeg"
title: Raspberry Pi Pico W Internet & Wi-Fi Monitor
description: A self-contained, real-time local network telemetry monitor pwered by Pico W running MicroPython. Plug it into your home electricity and track Wi-Fi quality right from your phone.
date: 2026-09-17
tags: [typescript, systems]
featured: true
repoUrl: https://github.com/aabdullakh/pico_internet_monitor
---

## What it does
A Raspberry Pi Pico W plugged into an outlet at home, measuring my network every 10 seconds: Wi-Fi signal strength (RSSI), latency, jitter, packet loss, and uptime. It pushes each reading to a feed in the cloud, and a dashboard page shows the current state. I can pull it up on my phone from
anywhere and see whether my home internet is actually fine right now.


## Why I built it

Curiosity and my mentor suggested to do it!

## How it works

The Pico runs MicroPython. Every 10 seconds, it reads the RSSI from the radio and opens a TCP connection to 1.1.1.1:80 to time the round trip, which gives latency, jitter, and packet loss. It then posts the readings to an Adafruit IO feed.

The dashboards is sing;e static 'index.html' on GitHub that polls that feed every 10 seconds and displays the desired data. Because our feed in Adafruit is public no need for API. That's the part I like most, there is no backend to run or pay, just a device pushing and pulling data's.

When the internet is down, the Pico shows the last data it pulled from Adafruit. If the newest reading is more than 10 seconds old it shows "Offline".


## What I learned

Secrets management matters even on a microcontroller. Wi-Fi credentials being live in a config.py is a serious mistake, and gitignored, 'config.example.py' commited later.
