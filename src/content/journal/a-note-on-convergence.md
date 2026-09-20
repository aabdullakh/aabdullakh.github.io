---
title: A note on convergence
date: 2026-03-18
description: Working through why gradient descent actually converges, for a course I'm taking — with the math written out properly.
tags: [math, notes]
---

I'm taking an optimization course this term, and I wanted to actually work through *why* gradient descent converges instead of just trusting that it does. Writing it out here so I stop re-deriving it every time I forget.[^why-write]

[^why-write]: I've now derived this three separate times across three different problem sets, which is exactly the kind of thing a journal entry is for.

## The setup

Say we're minimizing a differentiable, convex function $f: \mathbb{R}^n \to \mathbb{R}$ whose gradient is $L$-Lipschitz continuous — meaning for all $x, y$:

$$
\lVert \nabla f(x) - \nabla f(y) \rVert \le L \lVert x - y \rVert
$$

Gradient descent updates a guess $x_k$ by stepping against the gradient:

$$
x_{k+1} = x_k - \eta \, \nabla f(x_k)
$$

where $\eta$ is the step size. The question is: for what $\eta$ does this actually get us closer to the minimum, rather than overshooting forever?

## Why the step size matters

The Lipschitz condition gives us a quadratic upper bound on $f$ near any point $x_k$:

$$
f(y) \le f(x_k) + \nabla f(x_k)^\top (y - x_k) + \frac{L}{2} \lVert y - x_k \rVert^2
$$

Substituting in the gradient step $x_{k+1} = x_k - \eta \nabla f(x_k)$ and simplifying, you get:

$$
f(x_{k+1}) \le f(x_k) - \eta \left(1 - \frac{L\eta}{2}\right) \lVert \nabla f(x_k) \rVert^2
$$

For the right-hand side to actually decrease $f$, the term in parentheses needs to stay positive — which happens exactly when $\eta < \frac{2}{L}$. Pick $\eta = \frac{1}{L}$ and every step is guaranteed not to make things worse, as long as the gradient at that step is nonzero.

## What this actually means

That single inequality is the whole argument: as long as the step size respects the curvature bound $L$, each step decreases $f$ by an amount proportional to how steep the gradient still is. Summing that decrease over all steps and rearranging gives the usual $O(1/k)$ convergence rate for convex functions — the objective's distance from optimal shrinks proportionally to $1/k$ after $k$ steps.

The part that used to feel like magic — "just don't use too big a learning rate" — turns out to be exactly this Lipschitz bound in disguise.
