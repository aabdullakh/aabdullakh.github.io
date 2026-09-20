---
title: Tiny Task Queue
description: A small in-memory job queue with retries and backoff, built to actually understand how job queues work instead of just using one.
date: 2026-01-05
tags: [typescript, systems]
featured: true
repoUrl: https://github.com/PLACEHOLDER/tiny-task-queue
---

## What it does

Tiny Task Queue is exactly what it sounds like: you push jobs onto it, workers pull them off and run them, and if a job fails it gets retried with exponential backoff instead of just vanishing. No dependencies, no server — it's a single TypeScript module you drop into a project.

## Why I built it

I'd used queue libraries like this dozens of times without really knowing what was happening inside them. [PLACEHOLDER — the actual moment that prompted this, e.g. "a bug at an internship where a job silently failed and I had no idea why"] made me want to build one from scratch just to see all the moving parts.

## How it works

The core is a priority queue keyed by "next retry time," plus a small state machine per job: `pending → running → (done | retrying → pending) | failed`.

<svg viewBox="0 0 640 220" role="img" aria-labelledby="queue-diagram-title" class="diagram">
  <title id="queue-diagram-title">Job lifecycle: pending leads to running, which leads to done, or to retrying which loops back to pending, or to failed after too many retries.</title>
  <g fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="20" y="85" width="110" height="50" rx="6" />
    <rect x="210" y="85" width="110" height="50" rx="6" />
    <rect x="400" y="20" width="110" height="50" rx="6" />
    <rect x="400" y="150" width="110" height="50" rx="6" />
    <rect x="590" y="150" width="0" height="0" />

    <path d="M130 110 H210" marker-end="url(#arrow)" />
    <path d="M320 100 L400 55" marker-end="url(#arrow)" />
    <path d="M320 120 L400 165" marker-end="url(#arrow)" />
    <path d="M400 190 C 160 220 60 170 75 135" marker-end="url(#arrow)" />
  </g>
  <g class="diagram-accent" fill="none" stroke-width="1.5">
    <path d="M455 150 V95 C 455 70 380 70 320 100" marker-end="url(#arrow-accent)" stroke-dasharray="4 3" />
  </g>
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
    </marker>
    <marker id="arrow-accent" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" class="diagram-accent-fill" />
    </marker>
  </defs>
  <g font-family="JetBrains Mono, monospace" font-size="13" text-anchor="middle">
    <text x="75" y="115">pending</text>
    <text x="265" y="115">running</text>
    <text x="455" y="50">done</text>
    <text x="455" y="180">retrying</text>
  </g>
  <text x="560" y="185" font-family="JetBrains Mono, monospace" font-size="11" class="diagram-accent-text">too many retries &rarr; failed</text>
</svg>

<style>
.diagram {
  width: 100%;
  height: auto;
  color: var(--color-ink);
  margin: var(--space-4) 0;
}
.diagram-accent {
  color: var(--color-accent);
}
.diagram-accent-fill {
  fill: var(--color-accent);
}
.diagram-accent-text {
  fill: var(--color-accent);
}
</style>

Backoff is the standard `base * 2^attempt` with jitter, capped at a max delay so a flaky job doesn't end up retrying once a day. Workers poll the queue on an interval, but the queue also exposes an event emitter so you can react to jobs immediately instead of waiting for the next poll.

## What I learned

The state machine was the easy part — the hard part was making retries *idempotent-safe* by default. If a worker crashes mid-job, the job needs to come back as `pending`, not get lost, which means the "mark as running" step and the actual work can't be one atomic operation without some kind of lease/heartbeat. That single design decision is most of what real queue systems (SQS, Sidekiq, etc.) spend their complexity budget on, and building a toy version made that click in a way reading about it never did.
