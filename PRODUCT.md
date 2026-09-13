# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) on Vercel, Neon Postgres as the data layer. Chosen by the user:
Vercel because it is free and already familiar; Neon because the user wants the database
in the same deployment surface. Own authentication (no Supabase Auth). Russian UI with a
translation layer from day one so a second locale is a dictionary file, not a refactor.

## Users

Primary and, for now, only user: the owner — a university student in Uzbekistan who also
runs courses, is building a business, and trains at the gym. He opens the product once a
day, usually from a laptop, and needs it to work from a phone between classes.

His job: stop opening 55 different sites and resources to find out where he stands.
One place that answers "where am I, and what do I do today" across money, study,
training, and business.

Secondary users are not real yet. The architecture is multi-tenant from the first commit
so that opening it to other people later is a week of work, not a rewrite — but no
registration flow, pricing, or marketing surface is being built now.

## Product Purpose

ORBIT is a personal operations console. It holds the whole of one person's life as a
single connected system: money on hand and where it is going, savings goals and how far
away they are, university coursework and deadlines, a calendar he can actually rearrange,
habits and their streaks, and the business links and notes he keeps losing.

Success is behavioural, not feature-based: the user opens ORBIT once a day, and it is
enough. If he still opens a spreadsheet, a notes app, and a bank app afterwards, ORBIT
failed.

## Positioning

Notion is a blank page that makes you build the system yourself, then makes you maintain
it. Budgeting apps know money but nothing about Thursday's homework. Habit trackers know
streaks but not what they cost.

ORBIT's mechanism: **recurring flows compute the future forward.** The user declares a
rule once — "50 000 UZS leaves every day", "stipend arrives on the 5th", "the course costs
$40 a month" — and every other module reads from that same projection. The wishlist knows
when he can afford the thing. The dashboard knows what today actually costs. Nothing is
re-entered by hand, and nothing goes stale because he forgot to update it.

That projection engine, shared across finance, goals, calendar, and business, is the
thing a neighbouring product cannot truthfully copy without becoming this product.

## Operating Context

- Once-a-day ritual, most often evening, laptop. Phone access is required but is the
  second surface, not the first.
- Money is bi-currency and lopsided: UZS is the everyday currency (five- and six-digit
  numbers, e.g. 50 000), USD is the thinking currency for goals and courses
  (roughly 12 500 UZS to 1 USD at the time of writing — the rate must be user-editable,
  never hardcoded as truth).
- University work arrives as assignments with due dates, per course, in semesters.
- Habits are binary daily marks (gym / not gym), and the user cares about streaks.
- Business material is mostly links, credentials-adjacent references, and short notes
  he needs to find fast.
- Data entry is manual by design. The user expects to type things in; he does not expect
  bank integrations. What he does not expect is to recalculate anything himself.

## Capabilities and Constraints

Confirmed modules for the system, in the user's own framing:

1. **Finance** — accounts and balances, income and expenses, recurring rules that
   auto-project, indicators of where he stands.
2. **Goals / wishlist** — a thing he wants, its price, how much is collected, how far away
   it is given current savings rate.
3. **University** — courses, homework, deadlines, status.
4. **Calendar** — events he can drag, move, edit, describe, re-date.
5. **Habits** — declared habits, daily done/not-done, streaks.
6. **Business** — important links, notes, reference material.
7. **Notes** — a Notion-like place to write and calculate.

Constraints:
- Free tier only (Vercel + Neon free plans). No paid infrastructure.
- Must be genuinely usable at phone width; the user stated this explicitly as an
  end-state requirement.
- The user intends to keep extending this for a long time and may take it to market.
  Code quality, module boundaries, and a real design system matter more than shipping
  speed. He explicitly rejected "a default dashboard a ten-year-old could generate".

Undecided and deliberately not invented: pricing, any multi-user collaboration,
integrations with banks or university systems, mobile app packaging.

## Brand Commitments

Name: **ORBIT** (chosen by the user from proposed options). Reads in Russian as «Орбит».
No existing logo, palette, or typography — the visual world is open.

Interface language is Russian. Translation layer required from the start.

## Evidence on Hand

None yet. This is a greenfield build with no existing code, no real transactions, no
screenshots, and no users beyond the owner.

All figures, transactions, courses, and habits shown in any design work are authored
demonstration data and must be labelled as such. Nothing about real balances, real
university courses, or real business material may be fabricated as fact.

## Product Principles

1. **The projection is the product.** Any number the system can derive, it derives.
   Asking the user to compute something himself is a defect.
2. **One ritual, not seven tabs.** The daily surface answers the day's question without
   navigation. Modules are where you go to change things, not to find out how you are.
3. **Manual entry is respected.** Since every number is typed by a human, entry must be
   fast, forgiving, correctable, and never lost.
4. **Modules are independent, the projection is shared.** A new module must be addable
   without touching the others; all of them read the same financial and temporal truth.
5. **Built to be extended in public.** Multi-tenant schema, typed boundaries, and a
   documented design system from the first commit, because this may become a product.

## Accessibility & Inclusion

No product-specific requirement was established beyond the standard floor: the interface
must remain legible and operable at phone width, and money and deadline states must never
be carried by colour alone.
