---
title: "I built a bank twice to learn test-driven development"
description: "C and Python, tests first. What happened when I broke my own code on purpose and let three AI models split the job."
date: 2026-10-20
tags: [tdd, testing, c, python, ai]
---

A bank is a good place to learn about bugs. Money has exact rules: you can overdraw to a limit but not past it, a frozen account can't move money, a transfer either happens completely or not at all. Get one comparison wrong by a single cent and the bank is wrong.

My mentor suggested I learn **test-driven development (TDD)** by building a small bank system. I did it in **C** first, then in **Python**, so I could compare how the same ideas look in a low-level and a high-level language. The code is on GitHub: [github.com/aabdullakh/bank-tdd](https://github.com/aabdullakh/bank-tdd).

This post covers how TDD works, what happened when I let three AI models split the job, and what the project taught me.

## How TDD works: red, green, refactor

The idea is simple, and it feels backwards at first: **write the test before the code.**

For the C version I used a small test framework called [Unity](https://github.com/ThrowTheSwitch/Unity). A test is a short function that says what should happen:

```c
void test_add_sums_the_amounts(void)
{
    TEST_ASSERT_EQUAL_INT(1500, money_add(money_of(1000), money_of(500)).cents);
}
```

Money is stored in cents, so this says: adding 10.00 and 5.00 should give 1500 cents. Then the cycle goes like this:

1. **Red.** The function `money_add()` doesn't exist yet, so the test fails. That is the point: a failing test proves the test can detect a problem.
2. **Green.** I write the smallest amount of code that makes the test pass.
3. **Refactor.** I improve the structure and readability of the code without changing what it does. The tests stay green, so I know I didn't break anything.

Then I repeat it for the next function.

## How the project is organized

The C project has four main parts:

- **`src/`** holds the bank logic: money, accounts, services, and `main.c`. Each `.c` file has a matching `.h` header, which is like a menu: it lists each function's name, what it takes and what it returns.
- **`test/`** holds the tests. Each test file connects to the code with `#include "money.h"`.
- **`unity/`** is the test framework. It does the comparing: it checks the value I expected against the value I got, and prints PASS or FAIL.
- **`Makefile`** lets me type `make test` instead of a long `gcc` command. It builds and runs everything.

When someone uses the program, the flow is: the user types `3` (deposit), `main.c` reads it, calls `services.c`, which calls `account.c`, and the answer travels back up to `main.c` to be printed. `main.c` only handles input and output. All the rules live in the tested code.

## The experiment: three AI models, three jobs

My mentor suggested using different AI models for different jobs. The idea is that the model writing the tests shouldn't be the one writing the code, so neither one grades its own homework. I split it up like this:

| Job | Who |
|---|---|
| Architecture (a design guide with UML diagrams and the C headers) | Claude |
| Writing the tests (red) | Gemini |
| Writing the source code (green) | ChatGPT |

I also asked Claude to build a complete reference version of the bank in C so I had something to study, and later a Python version. I ran the three-model experiment on its own, starting with the `Money` module.

### Gemini's tests needed checking

This part taught me the most. When I asked Gemini for the whole test suite at once, it wrote the real implementation instead of failing stubs, so every test passed and nothing was red. Its next attempt crashed with segmentation faults, and the one after that didn't compile. When I switched to asking for one test file at a time, the first `test_money.c` still didn't compile, because it called functions that didn't match the header file.

Even once it compiled, some tests were weak. Several only checked the *sign* of an answer, so a function that always returned the wrong amount could still pass. After I asked for exact values, I ran the tests three ways:

- against my reference implementation, where all 35 passed,
- against deliberately wrong stubs, where most failed,
- and with a bug I injected myself.

**A test suite written by an AI is a draft. Someone has to check the checker.**

### Breaking the code on purpose

Once ChatGPT's `money.c` passed all 35 tests, I did what felt strange at first: I broke it. In `money_is_greater_than` I changed `>` to `>=`, and ran `make test`:

```
test_money.c:102:test_money_is_greater_than_when_equal:FAIL: Expected FALSE Was TRUE
-----------------------
35 Tests 1 Failures 0 Ignored
```

Exactly one test out of 35 noticed, the one that asks: "Is 10.00 greater than 10.00?" The right answer is no, but `>=` says yes. The other tests compare different numbers, where `>` and `>=` give the same answer.

This is why the boundary cases matter: just below the limit, exactly on it, and just above it. It is also where a real bank would let someone withdraw one cent too much, or refuse them their own full balance.

### Two correct programs that behave differently

ChatGPT's `money.c` and the one Claude wrote both passed the same 35 tests, but they didn't behave the same. One accepted `" 25"` with a leading space and the other rejected it. One accepted `".5"` and the other didn't. They also counted digits differently.

None of the tests said what should happen in those cases, so both were allowed. **Tests only protect what they check.** Passing doesn't mean correct; it means "correct as far as I asked."

## C versus Python

I built the same bank, with the same rules and the same menu, in both languages. Both give the same balance for the same scripted session.

| | C | Python |
|---|---|---|
| Logic (money, accounts, repository, services) | ~750 lines | ~480 lines |
| Test framework | Unity + a Makefile | pytest |
| Errors | return codes (`ERR_INSUFFICIENT_FUNDS`) | exceptions (`InsufficientFundsError`) |
| Account types | one struct with a `type` field | `CheckingAccount` and `SavingsAccount` classes |
| Memory | `malloc` and `free`, a linked list | a `list` and a `dict` |
| A test | `TEST_ASSERT_EQUAL_INT(1500, ...)` | `assert (a + b).cents == 1500` |

The tests checked the same things in both: the same boundaries, the same all-or-nothing transfer rule. The code changed more than the process did.

- Python needed about a third less code, and I never had to free memory.
- C taught me what the machine is doing: where memory goes, why error codes exist, and what a header file is for.
- C's compiler caught a wrong argument type before the program ran. Python happily accepts `Money(10.5)` unless I add a type checker.

The deliberate-bug check worked in both languages. In C I injected 6 bugs and 5 were caught. In Python I injected 14 and 13 were caught. The one that survived in both is the same: removing a safety check that a second safety check makes redundant. No test can tell the difference, because the bank behaves identically.

## What I learned

1. **Writing the test first forces you to decide what "correct" means.** The hardest part was not the code. It was deciding that `"12."` is invalid, or what to do with exactly zero.
2. **Test the edges.** One-cent differences found the most problems for the least effort, in both languages.
3. **A passing test only proves what it checks.** Two programs passed the same tests and still disagreed.
4. **Break your code on purpose.** It's the quickest way to find out whether your tests are actually watching.
5. **Don't trust AI output you haven't run.** Using separate models for tests and code worked well, but only because I checked each step myself: Does it compile? Does every test fail first? Does the right test fail when I break something?
6. **Refactoring is not about speed.** It's about making code clearer while the tests stay green.

## What's next

TDD is what's valuable, next is master programming language C.

If you're learning to code, I'd suggest building something small with exact rules and writing the tests first, then trying to break it. You'll learn more from the failing test than from the passing ones.

*Code and tests: [github.com/aabdullakh/bank-tdd](https://github.com/aabdullakh/bank-tdd)*
