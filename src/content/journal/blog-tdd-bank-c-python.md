---
title: "I wrote the tests for a bank before I wrote the bank"
description: "What building the same bank in C and Python taught me about testing, and what happened when I let three AI models split the work."
date: 2026-11-10
tags: [tdd, learning, ai]
---

For the last few weeks I've been building a bank. It isn't a real one. It's a small program that opens accounts, moves money and follows the rules a bank follows. The strange part is the order I did it in: for every piece, I wrote the test first and the code second.

## Why a bank

A bank is a great place to learn about mistakes. The rules are exact. You can overdraw an account up to a limit but not past it. A frozen account can't move money. A transfer either happens completely or not at all. If one comparison is off by a single cent, the bank is wrong.

I built it twice, once in C and once in Python, so I could see how the same idea feels in a low-level language and a high-level one. The details are on the [project page](/projects/tdd-bank-c-python/). This post is about what I learned.

## Tests first feels backwards

The method is called test-driven development. You write a small check for something the program should do, run it, and watch it fail, because the code doesn't exist yet. Then you write just enough code to make it pass.

It sounds like extra work, and at first it is. But it makes you decide what "correct" means before you start. Most of my hardest moments weren't about code. They were questions like: is "12." a valid amount of money? What happens when someone withdraws exactly zero?

## The moment it clicked

Once the money part of my bank passed all 35 of its tests, I did something that felt wrong: I broke it on purpose. I changed one character in one line of the code.

One test out of 35 turned red. It was the test that asks whether 10.00 is greater than 10.00. The other 34 only compare different numbers, so they didn't care. That one tiny question was the only thing standing between my bank and a bug.

After that I understood what tests are for. They aren't there to prove the code works. They're there to notice when it stops.

## Three AI models, three jobs

I also tried an experiment: use different AI models for different jobs, so the one writing the tests isn't the one writing the code. Claude designed the project, Gemini wrote the tests, and ChatGPT wrote the code.

It did not go smoothly. When I asked Gemini for all the tests at once, it wrote the finished program instead, so nothing failed and the whole point was lost. The next try crashed, and the one after that wouldn't even compile. Even when the tests ran, some were too lazy. They only checked whether an answer was positive or negative, not whether it was the right amount.

What worked was going one small piece at a time and checking every step myself. Does it run? Does every test fail before the code exists? Does the right test fail when I break something?

## Two correct programs that disagreed

My favorite surprise came at the end. ChatGPT's version of the money code and Claude's version both passed the same 35 tests. But when I fed them an amount typed with a leading space, one accepted it and one rejected it.

Both were allowed, because none of my tests said what should happen. A passing test only protects what it checks. "All green" doesn't mean correct. It means correct as far as I asked.

## C or Python

The Python version needed about a third less code than the C one, and I never had to manage memory by hand. C was harder, but it showed me what the computer is actually doing underneath. The tests, on the other hand, barely changed. The same edge cases mattered in both languages.

## What I'm taking with me

I'd tell anyone learning to code to build something small with exact rules, write the tests first, and then try to break it. Test the edges, because that's where bugs live. And don't trust any result, from a person or an AI, that you haven't run yourself.

The full write-up, with the code and the test results, is on the [project page](/projects/tdd-bank-c-python/).
