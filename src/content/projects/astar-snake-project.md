---
title: "A* Snake Maze: Pathfinding You Can Watch"
description: "A snake maze built with A*, the pathfinding idea behind GPS and self-driving cars, using g, h and f = g + h, a min-heap waiting list, an explore mode and a 3D view."
date: 2026-10-20
tags: [javascript, algorithms, pathfinding, data-structures, threejs]
featured: false
cover: "../../assets/projects/astar-snake-cover.png"
coverAlt: "A snake finding its way through a maze with the A* search drawn on the grid"
repoUrl: "https://github.com/aabdullakh/astar-snake-maze"
---

## The project

Snake Maze is a snake that finds its way through a maze using the A* algorithm. A* is a popular graph traversal and pathfinding algorithm used across computer science to find the shortest, most efficient route between a starting point and a goal.

It is the same idea self-driving cars use in real life: A*-style search picks the route through a graph of roads, and a variant called Hybrid A* plans the actual driving path, replanning whenever the sensors show something new.

It uses g, h and f = g + h.

| Number | Meaning |
|---|---|
| **g** | The number of steps walked from starting point A to the specific cell or location. |
| **h** | The guess of steps left to finishing point B, ignoring walls, just the sum of horizontal and vertical cells. |
| **f = g + h** | The lowest and fastest path we could find. In short, A* = f(n). |

For example, a cell 5 steps from A (g = 5) that is 3 cells right and 2 cells down from B (h = 3 + 2 = 5) has f = 10.

## Our code

The algorithm lives in `astar.js` and `heap.js` (the waiting list).

`astar.js` is the A* search. It keeps, for every cell, its g (steps from the start), h (estimated steps to the goal) and parent, and it ranks cells by f = g + h. Every time it finds a new or cheaper way to a neighbor, it records that and pushes the neighbor's f and g into the open list.

The open list is a min-heap in `heap.js`, so the cell with the lowest f is always at index 0 and can be taken off in a few steps (O(log n) instead of scanning every cell). A new entry climbs to the position its f deserves, and when the top is popped, the replacement sinks down.

```js
// the heap is stored in a plain array
parent   = (i - 1) >> 1
children = 2 * i + 1  and  2 * i + 2
// push: add at the end, climb while f is smaller than the parent's
// pop:  take index 0, move the last item to the top, sink it down
``` A* repeats this until the goal is popped, then follows the parent records back to the start to get the path.

## How the search works

We use g, h and f for A*, since it's the most optimal pathfinding algorithm. We have 3 types of cell:

- **Unseen:** not discovered yet.
- **Open:** discovered, waiting to be worked on in the heap.
- **Closed:** already worked on (expanded).

So our loop works this way:

1. Take the open cell with the lowest f.
2. Close it.
3. If it is B, stop.
4. Look at its neighbors, and add or improve any that deserve it:

```js
if (g[current] + 1 < g[neighbor]) {
  g[neighbor] = g[current] + 1;
  parent[neighbor] = current;
  heap.push({ i: neighbor, f: g[neighbor] + h(neighbor), g: g[neighbor] });
}
```

And A* is what finds the shortest route through a maze, and uses the heap as its waiting list.

## In professional terms

`astar.js` implements A* search over a 4-connected grid graph with unit edge costs. Given a grid, a start node and a goal node, it maintains an open list, a binary min-heap priority queue keyed by f(n) = g(n) + h(n), and a closed set of expanded nodes.

Each iteration extracts the minimum-f node and expands it. For each traversable neighbor, it relaxes the edge: if g(current) + 1 < g(neighbor), it updates g, computes h with the heuristic, sets the neighbor's parent pointer, and inserts it into the open list (reopening it if it was closed).

The search terminates when the goal node is extracted, and the path is reconstructed by following parent pointers back to the start. With an admissible, consistent heuristic (Manhattan distance), the returned path is optimal and each node is expanded at most once. If the open list empties first, no path exists.

To summarize, all our algorithm lives in `astar.js` and it uses `heap.js` to store the certain data as explained above.

## The rest of the files

| File | Job |
|---|---|
| `astar.js` | The A* search. |
| `heap.js` | The waiting list (min-heap). |
| `game.js` | The game's rules and state. |
| `maze.js` | Builds the maze. |
| `config.js` | Constants that never change. |
| `main.js` | Runs the program. |

### game.js

`game.js` holds the game's rules and state. It has 5 main setups with their own functions:

1. `tick()` runs repeatedly, and each call does one small action depending on the current phase: a search step, a snake step, or a new goal.
2. `beginSearch()` creates and sets up a new A* search from the snake's position to the goal. It doesn't run the search itself.
3. `advanceSearch()` runs one A* step (expanding one cell) and updates the phase: found, failed, or still searching.
4. `stepMove()` moves the snake one cell along the path A* found.
5. `nextGoal()` picks a new point B, sets the start to the snake's head, and begins a new search.

### maze.js, config.js and main.js

`maze.js` is what builds the maze in the game.

`config.js` holds constants that never change while the program runs, such as maze size, speed tables and snake length.

`main.js` is what runs the program.

```
index.html loads the scripts → main.js starts the loop
main.js ──calls──▶ Game.tick() ──uses──▶ astar.js ──uses──▶ heap.js
main.js ──calls──▶ Render.draw()   (reads the Game state and paints it)

maze.js ──supplies the maze to──▶ game.js
config.js ──supplies settings to──▶ everyone
```

## Explore mode and 3D view

Later, I added explore mode on the maze and a 3D view so it would be more interactive.

## What I learned

I learned the core ideas of the A* algorithm and the logic behind it.

Later, I discovered **NetworkX**. NetworkX works with graphs made of nodes and edges. In a road map, the intersections are the nodes and the roads themselves are the edges. When two edges connect at a node, it means they meet at an intersection. That is the same graph idea A* searches over in my maze, where every cell is a node.

And later, I built a project with NetworkX using NVIDIA's version.
