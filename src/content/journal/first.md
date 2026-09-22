---
title: Induction, deduction, and learning to build backwards.
date: 2026-09-15
description: ...
tags: ["math", "learning", "ai"]
---
Back in 2019, my friend S. and I walked into Muammer Gul's classroom after
we weren't picked for the math olympiad team. He was our math teacher and a
Guinness World Record holder. We asked him to put us on the team. He asked
for our names, looked up our scores, and said: "You're in." We both had
older brothers at the school, so he already knew us by our last names.

Math olympiads taught me a lot, but the biggest thing wasn't any particular
theorem. It was how I think.

The two ideas I keep coming back to are induction and deduction:

- **Induction**: examples → rule
- **Deduction**: rule → example

(Fun fact: mathematical induction, the n = k → n = k+1 kind, is actually a
*deductive* proof, despite the name.)

I'm only now noticing how much these apply outside of math.

## Building by induction

Take programming, which is my field. A few years ago, everyone learned
deductively: syntax first, then rules, then patterns, and only after all of
that were you allowed to build something.

With AI in the mix, I've flipped it. Ship with AI first, then go back and
understand every step and every function in the code. You don't need to know
every bit of syntax up front. You don't need to understand every line before
you write it. Build the project, then work downward: what is this structure
doing, why this step, what would break if I removed it?

That's induction. You start with one working example and climb toward the
rule.

It works outside of code too. If you want to do something, don't overthink
the preparation. Do it, then look back, find the steps that mattered, and
master them one at a time.

## n = 1

This post is my first example. n = 1 is true.

The next move is yours: go further, and prove it holds for every n.