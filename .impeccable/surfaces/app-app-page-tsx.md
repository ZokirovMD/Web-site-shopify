---
version: 1
slug: "app-app-page-tsx"
primary_target: "app/(app)/page.tsx"
related_targets: []
---

## Scope

ORBIT application shell and the daily surface (ПУЛЬС), plus the module surfaces that
inherit from it. Visitor mode: **Operate** — the user comes to complete a task and to
read his own state, never to be persuaded.

## Audience and job

One user: a university student in Uzbekistan running study, money, training, and a
business. Opens once a day, most often late evening on a laptop, sometimes on a phone
between classes. His job: answer "where do I stand, and what do I do today" without
opening anything else.

## Constraints

Russian UI with a translation layer. Bi-currency UZS/USD with a user-editable rate.
Every figure is typed by hand, so entry must be fast and forgiving. Free-tier
infrastructure only. Must work at phone width. All demonstration data is authored and
labelled synthetic; no real balances, courses, or business facts are invented.

## Direction contract

THESIS: A life console built on girih — the five-tile Timurid system where one edge
length and angles locked to 36° generate endless non-repeating pattern. Modules are
tiles on one grid, not cards in a feed. It refuses the category default: the neutral
sidebar shell with rounded cards and a blue accent, and equally the near-black
telemetry board with a neon glow.

OWN-WORLD: Fired-manganese ground (#17131C), not neutral black. Three named glaze
roles — lapis for structure and primary action, turquoise for inflow and progress,
ochre for deadlines and attention — with pomegranate for outflow and overdue, and ganch
ivory for the light surface. Cards carry one chamfered corner cut at 36°, never a
uniform radius. Strapwork hairlines terminate in node marks at grid crossings. Pattern
appears at page ground (≤4% opacity), in empty states at full scale, and on the lock
screen — never beneath data. Unbounded for display and numerals, Golos Text for UI,
Martian Mono in small doses for keys and timestamps; all three carry real Cyrillic.

STORY: He opens ORBIT and within one viewport knows today's money, today's obligations,
and whether his streaks held. He believes the numbers because he can see what produced
them. He acts by marking, moving, or entering one thing — then closes the tab.

FIRST VIEWPORT: Full-bleed manganese ground with the girih ground pattern at 3%. Top
strap: ORBIT node mark left, today's date and the projection scrubber centred, entry
button right. Immediately below, at the largest scale on the page, the money line —
current balance in Unbounded at display size with the UZS/USD pair beneath it, and the
projected balance at the scrubber's date set beside it in turquoise or pomegranate
depending on direction. Under that, a three-tile row on the girih grid: ОБЯЗАТЕЛЬСТВА
(today's assignments and tasks by deadline colour), ПРИВЫЧКИ (today's marks as
fillable node glyphs with streak counts), ЦЕЛИ (the nearest goal with its funded date).
Primary action — quick entry — sits in the top strap and is reachable by keyboard.

FORM: Girih / Timurid majolica tile system, candidate 4 of the ordered grounded list,
assigned by the roll. Seed key 309a2252. Signature interaction: ПРОЕКЦИЯ — the strap
scrubber drags forward in time and every number on the surface recomputes to that day,
including goal funding dates and affordability.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

Whether the vault stores real secrets (encryption design pending user decision) and the
phone surface's navigation model at the smallest width.
