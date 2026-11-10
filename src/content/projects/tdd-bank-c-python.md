---
cover: "../../assets/images/tdd-bank-cover.png"
title: "I built a bank twice to learn test-driven development"
description: "Built a bank in C and Python, writing tests first. The write-up covers breaking the code on purpose and splitting the work among three AI models."
date: 2026-11-10
tags: [tdd, testing, c, python, ai]
repoUrl: https://github.com/aabdullakh/bank-tdd
---

## The project

A bank is a good place to learn about bugs. Money has exact rules: you can overdraw to a limit but not past it, a frozen account can't move money, and a transfer either happens completely or not at all. Get one comparison wrong by a single cent and the bank is wrong.

I wanted to learn **test-driven development (TDD)**, so I built a small bank system. I built it in **C** first, then in **Python**, so I could compare how the same ideas look in a low-level and a high-level language. Both versions follow the same rules and the same menu, and both give the same balance for the same scripted session.

The rules: amounts are stored in cents, checking accounts have an overdraft limit, savings accounts never go below zero, frozen and closed accounts can't move money, interest uses banker's rounding, and transfers are all-or-nothing.

## How TDD works

The idea is simple, and it feels backwards at first: **write the test before the code.**

For the C version I used [Unity](https://github.com/ThrowTheSwitch/Unity), a small test framework. A test is a short function that says what should happen:

```c
void test_add_sums_the_amounts(void)
{
    TEST_ASSERT_EQUAL_INT(1500, money_add(money_of(1000), money_of(500)).cents);
}
```

Money is stored in cents, so this says: adding 10.00 and 5.00 should give 1500 cents. Then the cycle goes like this:

1. **Red.** `money_add()` doesn't exist yet, so the test fails. That is the point: a failing test proves the test can detect a problem.
2. **Green.** I write the smallest amount of code that makes the test pass.
3. **Refactor.** I improve the structure and readability of the code without changing what it does. The tests stay green, so I know I didn't break anything.

Then I repeat it for the next function.

## How the C project is organized

- **`src/`** holds the bank logic: money, accounts, services, and `main.c`. Each `.c` file has a matching `.h` header, which lists each function's name, what it takes and what it returns.
- **`test/`** holds the tests. Each test file connects to the code with `#include "money.h"`.
- **`unity/`** is the test framework. It compares the value I expected with the value I got, and prints PASS or FAIL.
- **`Makefile`** lets me type `make test` instead of a long `gcc` command. It builds and runs everything.

When someone uses the program, the request travels down and the answer comes back up:

```
user types 3 (deposit)
  -> main.c       reads the input, prints the answer
  -> services.c   runs the use case
  -> account.c    enforces the rules
  <- the answer returns up to main.c and is printed
```

`main.c` only handles input and output. All the rules live in the tested code.

## The Python version

The Python bank has the same rules and the same tests in spirit, but the tooling is lighter. [pytest](https://docs.pytest.org) finds every function named `test_*`, and a test is a plain `assert`:

```python
def test_add_sums_the_amounts():
    assert (Money(1000) + Money(500)).cents == 1500
```

Errors are exceptions instead of return codes, and a `fixture` builds fresh objects for every test, so I never free memory by hand. The logic came out around 480 lines, against about 750 in C.

## The experiment: three AI models

I used different AI models for different jobs, so the model that writes the tests isn't the one writing the code. Neither grades its own homework.

| Job | Who |
|---|---|
| Architecture: a design guide with UML diagrams and the C headers | Claude |
| Writing the tests (red) | Gemini |
| Writing the source code (green) | ChatGPT |

I also had Claude build complete reference versions of the bank in C and Python to study. I ran the three-model experiment separately, starting with the `Money` module.

## Challenges I hit

- **Gemini wrote the implementation instead of failing tests.** I asked for the whole test suite at once. It wrote real code, so every test passed and nothing was red. The next attempt crashed with segmentation faults, and the one after that didn't compile.
- **One file at a time worked better.** Even then, the first `test_money.c` called functions that didn't match the header file. After I sent the compile errors back, it fixed them.
- **Some tests were weak.** Several only checked the *sign* of an answer, so a function that always returned the wrong amount could still pass. I asked for exact values, then ran the tests against my reference code (all 35 passed), against wrong stubs (most failed), and against a bug I injected myself.
- **Breaking the code on purpose.** Once ChatGPT's `money.c` passed all 35 tests, I changed `>` to `>=` in `money_is_greater_than` and ran `make test`:

```
test_money.c:102:test_money_is_greater_than_when_equal:FAIL: Expected FALSE Was TRUE
-----------------------
35 Tests 1 Failures 0 Ignored
```

Exactly one test out of 35 noticed, the one that asks whether 10.00 is greater than 10.00. The right answer is no, but `>=` says yes. The other tests compare different numbers, where `>` and `>=` agree. This is why boundaries matter: just below the limit, exactly on it, and just above. It's also where a real bank would let someone withdraw one cent too much.

- **Two correct programs that disagreed.** ChatGPT's `money.c` and Claude's both passed the same 35 tests, but one accepted `" 25"` with a leading space and the other rejected it. One accepted `".5"` and the other didn't. No test said what should happen, so both were allowed.

## C versus Python

| | C | Python |
|---|---|---|
| Logic (money, accounts, repository, services) | ~750 lines | ~480 lines |
| Test framework | Unity + a Makefile | pytest |
| Errors | return codes (`ERR_INSUFFICIENT_FUNDS`) | exceptions (`InsufficientFundsError`) |
| Account types | one struct with a `type` field | `CheckingAccount` and `SavingsAccount` classes |
| Memory | `malloc` and `free`, a linked list | a `list` and a `dict` |

The tests checked the same things in both: the same boundaries and the same all-or-nothing transfer rule. The deliberate-bug check worked in both languages. In C I injected 6 bugs and 5 were caught. In Python I injected 14 and 13 were caught. The one that survived in both is the same: removing a safety check that a second check makes redundant. No test can tell the difference, because the bank behaves identically.

## What I Learned

**Writing the test first forces you to decide what "correct" means.** The hardest part wasn't the code. It was deciding that `"12."` is invalid, or what to do with exactly zero.

**Test the edges.** One-cent differences found the most problems for the least effort, in both languages.

**A passing test only proves what it checks.** Two programs passed the same tests and still disagreed.

**Break your code on purpose.** It's the quickest way to find out whether your tests are actually watching.

**Don't trust AI output you haven't run.** Splitting tests and code across models worked, but only because I checked each step: does it compile, does every test fail first, and does the right test fail when I break something?

**Refactoring isn't about speed.** It's about making code clearer while the tests stay green.
