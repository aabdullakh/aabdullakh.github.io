---
title: Thinking in types
date: 2026-02-20
description: Some notes on how a stricter type checker changed the way I write code, with a small example.
tags: [typescript, notes]
---

For a while I treated TypeScript's type checker as a linter that occasionally yelled at me. It took writing a genuinely gnarly bug to change my mind — one where a function silently accepted a value it shouldn't have, and the type checker had been trying to tell me the whole time.

## The bug

I had a function that looked roughly like this:

```ts
function getDiscount(user: { plan: string }) {
  if (user.plan === "pro") return 0.2;
  if (user.plan === "team") return 0.35;
  return 0;
}
```

Looks fine. Ships fine. Then someone adds an `"enterprise"` plan elsewhere in the codebase, forgets to update this function, and every enterprise customer silently gets a 0% discount. Nothing crashes. Nothing warns you. It just quietly does the wrong thing.

## Narrowing the type

The fix wasn't a test — it was giving the type checker enough information to catch this itself:

```ts
type Plan = "free" | "pro" | "team" | "enterprise";

function getDiscount(user: { plan: Plan }): number {
  switch (user.plan) {
    case "pro":
      return 0.2;
    case "team":
      return 0.35;
    case "enterprise":
      return 0.4;
    case "free":
      return 0;
  }
}
```

Now `Plan` is a closed set instead of an open-ended `string`. If someone adds a fifth plan without touching this function, TypeScript's exhaustiveness checking flags the `switch` as no longer covering every case — the same bug, but caught at compile time instead of in production.

## What changed for me

The lesson wasn't "use enums" — it was that a type isn't just documentation, it's a constraint the compiler can actually enforce. Once I started treating `string` and `number` as a last resort instead of a default, entire categories of bugs stopped showing up in code review, because they stopped compiling in the first place.
