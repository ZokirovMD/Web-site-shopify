# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) on Vercel, Neon Postgres as the data layer. Chosen by the user.
Own authentication. Russian UI with a translation layer from day one. PWA for the phone
surface — installed to the home screen, not shipped to an app store.

## Users

One user: the owner — a university student in Uzbekistan who also runs courses, is
building a business, and trains. He may hand it to a couple of friends later, but he has
explicitly said to **stop designing for that**: this is a personal system, not a product,
and productising it is a conversation for a future that may never come.

His job: stop opening fifty-five different sites, apps, and phone widgets to find out
where he stands. One place that answers "where am I, and what do I do today" across
money, study, training, food, time, and business.

The schema keeps a `user_id` on every row — that is cheap insurance, not a product plan.
No registration flow, pricing, landing page, or multi-user UI is being built.

## Product Purpose

ORBIT is a personal operations console with an agent in the loop. It holds the whole of
one person's life as a single connected system, and Claude reads and writes that system
directly rather than being asked questions in a separate chat window.

Success is behavioural: he opens ORBIT once a day and it is enough. If he still opens a
spreadsheet, a bank app, a fitness app, and four phone widgets afterwards, ORBIT failed.

## Positioning

Two mechanisms, not one.

**1. Recurring flows compute the future forward.** He declares a rule once — "50 000 UZS
leaves every day", "stipend arrives on the 5th", "the course costs $40 a month" — and
every other module reads that same projection. The wishlist knows when he can afford the
thing. The dashboard knows what today costs. Nothing is re-entered, nothing goes stale.

**2. The agent is inside the system, not beside it.** He does not open a chat and ask
"what should I eat if I'm running this month". He sets the training goal in ORBIT;
Claude reads the state, writes the training block and the matching nutrition plan back
into ORBIT, and he simply finds it there. The chat is for changing direction, not for
fetching answers.

Together these are what a neighbouring product cannot copy without becoming this product.

## Operating Context

- Once-a-day ritual, most often evening, laptop. The phone is the second surface but a
  required one.
- **The phone surface is widget-shaped, not app-shaped.** The user has no app icons on
  his home screen — he lives on widgets: weather, calendar, habits, fitness. He wants one
  glanceable surface that replaces all of them. This is a binding design constraint on
  the phone layout: glanceable tiles first, navigation second.
- Money is bi-currency and lopsided: UZS is the everyday currency (five- and six-digit
  numbers, e.g. 50 000), USD is the thinking currency for goals and courses. Roughly
  12 500 UZS to 1 USD at the time of writing — the rate is user-editable data, never a
  hardcoded truth.
- University work arrives as assignments with due dates, per course, in semesters.
- Training runs in monthly blocks whose modality changes on the user's say-so: running
  one month, stepper the next, strength after that. Roughly three sessions a week.
- **Food has a specific shape: breakfast and dinner are cooked at home and need full
  detail; lunch is eaten outside and needs only a calorie and composition target.**
  Local availability matters — plov, samsa, lepyoshka, chicken, beef, rice, chickpeas,
  ayran, suzma. A generic "oatmeal and salmon" plan is useless to him.
- Data entry is manual by design. He expects to type things in; he does not expect bank
  or wearable integrations. What he does not expect is to calculate anything himself.

## Capabilities and Constraints

Confirmed domains:

1. **ПУЛЬС** — the daily surface, widget-shaped.
2. **ДЕНЬГИ** — accounts, transactions, recurring rules, the projection engine, budgets,
   subscriptions.
3. **ЦЕЛИ** — savings goals with a computed funding date.
4. **ВРЕМЯ** — draggable calendar, tasks, a single deadline feed across all modules.
5. **УЧЁБА** — semesters, courses, assignments, grades; external courses and their cost.
6. **ТЕЛО** — training programme (blocks, sessions, prescriptions, logged reality),
   habits and streaks, body measurements.
7. **ПИТАНИЕ** — a nutrition plan derived from the training goal and body data, with
   full detail at breakfast and dinner and a target-only lunch.
8. **КОЛЛЕКЦИИ** — Instagram-style saves: films, places, books, ideas, links, purchases.
   Collections with items, tags, and a want/doing/done state.
9. **БИЗНЕС** — projects, business ideas, links, reference material.
10. **ИТОГИ** — weekly and monthly review.

Plus **НАСТРОЙКИ** and a **local backup** of all data to the user's own computer.

Constraints:
- Free tier only (Vercel + Neon free plans). Any recurring cost must be raised before
  it is incurred.
- Must be genuinely usable at phone width, widget-first.
- The user explicitly rejected "a default dashboard a ten-year-old could generate", and
  wants it to read as a brand even though it is personal.

**Explicitly resolved:** the vault stores no passwords or credentials. What the user
called "saving things" turned out to mean collections — places, films, ideas, links.
That is ordinary data, so no client-side encryption scheme is required, and the security
section that proposed one is withdrawn.

**Undecided and deliberately not invented:** how Claude connects to the live system
(an ORBIT MCP server, scheduled Routines, in-app Anthropic API calls, or a combination),
and the mechanism for mirroring data to the user's computer. Both carry cost and
capability trade-offs the user must choose between.

## Brand Commitments

Name: **ORBIT**. Reads in Russian as «Орбит». Interface language is Russian, with a
translation layer. Visual direction is committed: girih / Timurid tilework, mode Operate,
recorded in the surface brief under seed `309a2252`.

## Evidence on Hand

None yet. Greenfield: no code, no real transactions, no courses, no body data, no users
beyond the owner.

Body metrics needed for the nutrition engine — height, weight, age, current activity —
have not been supplied and **must not be invented**. All figures in any design work are
authored demonstration data and labelled synthetic.

## Product Principles

1. **The projection is the product.** Any number the system can derive, it derives.
   Asking the user to compute something himself is a defect.
2. **The agent writes into the system, not into the chat.** A plan that exists only as
   a message he has to copy somewhere is a failure of this product.
3. **One ritual, not seven widgets.** The daily surface answers the day's question
   without navigation.
4. **Manual entry is respected.** Every number is typed by a human: entry must be fast,
   forgiving, correctable, and never lost.
5. **Modules are independent, the projection is shared.** A new module must be addable
   without touching the others.
6. **His data can always leave.** Export and local mirror are features, not afterthoughts.

## Accessibility & Inclusion

No product-specific requirement beyond the standard floor: legible and operable at phone
width, and money, deadline, and training-load states never carried by colour alone.
