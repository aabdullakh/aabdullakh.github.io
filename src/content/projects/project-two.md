---
title: Campus Room Finder
description: A tiny web app that shows which classrooms are free right now, scraped from the public class schedule.
date: 2026-02-10
tags: [python, web, scraping]
featured: true
cover: ../../assets/projects/project-two-cover.jpg
coverAlt: '[PLACEHOLDER — a screenshot of the room finder UI]'
repoUrl: https://github.com/PLACEHOLDER/campus-room-finder
liveUrl: https://PLACEHOLDER.example.com
---

## What it does

You open the page, pick a building, and it tells you which rooms are empty right now (and for how long) based on the public course schedule. I built it because [PLACEHOLDER University]'s own room-booking system takes about six clicks to answer a question that should take zero.

## Why I built it

I was trying to find an empty room to study in between classes for the third day in a row, gave up, and wrote this instead. [PLACEHOLDER — any other detail, like a friend asking for the same thing, that made you actually finish it.]

## How it works

A small scheduled job pulls the public course catalog, parses out room/time-block assignments, and writes them to a SQLite file. The frontend is a static page that reads that file and just does date-math client-side — no live backend needed once the data's fetched, which keeps hosting free and simple.

```python
def rooms_free_at(building: str, when: datetime) -> list[str]:
    booked = {
        row.room
        for row in schedule
        if row.building == building and row.start <= when < row.end
    }
    return [room for room in ALL_ROOMS[building] if room not in booked]
```

## What I learned

Scraping a schedule that's meant for humans, not machines, means handling a lot of inconsistent formatting — "MWF 10:00-10:50am" and "M/W/F 10-10:50" show up in the same dataset. I ended up writing more test cases for the parser than for the actual free-room logic, which wasn't what I expected going in.
