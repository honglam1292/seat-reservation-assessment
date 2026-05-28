# Seat Reservation Assessment

Small public seat reservation platform built as a Senior / Lead Engineer technical assessment.

The goal is not production polish. The goal is a compact implementation that shows correct reservation state transitions, server-side validation, double-booking protection, and practical trade-offs.

## Live Demo

Live demo:

```txt
https://seat-reservation-assessment-demo.vercel.app
```

Source code:

```txt
https://github.com/honglam1292/seat-reservation-assessment
```

The live demo is deployed separately on Vercel using Prisma Postgres so the server-side reservation and mock payment workflow can be reviewed online.

GitHub Pages is intentionally not used because this assessment includes server-side logic, authentication, session handling, database-backed reservation state, and mock payment confirmation.

## Tech Stack

* Next.js App Router
* TypeScript
* Prisma
* SQLite for local development
* Prisma Postgres for the live demo deployment
* HTTP-only cookie sessions
* Server actions and route handlers

This is a single fullstack Next.js repository so the assessment stays easy to run, review, and reason about within a short time window.

## Local Setup

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Environment Variables

For local development with SQLite:

```env
DATABASE_URL="file:./dev.db"
```

For the Vercel live demo, the app uses a hosted PostgreSQL database through Prisma Postgres:

```env
DATABASE_URL="postgresql://..."
SESSION_SECRET="replace-with-a-secure-random-value"
```

SQLite is used locally for simplicity. For the deployed demo and for a real production reservation system, PostgreSQL is preferred because of stronger concurrency primitives, operational maturity, and better support for production workloads.

## Database Setup

Run migrations:

```bash
npm run db:migrate
```

Seed the database:

```bash
npm run db:seed
```

The seed creates exactly three seats and two demo users. It also clears previous sessions and reservations so the app returns to a clean demo state.

## Demo Login

```txt
alice@example.com / password123
bob@example.com / password123
```

Sessions are stored in the database and set with an HTTP-only cookie that expires after 90 days.

## Reservation Flow

1. An unauthenticated user can view the three seats but cannot reserve one.
2. After login, the user can select an available seat.
3. Selecting a seat does not reserve it permanently.
4. The server creates a short-lived `PENDING` reservation.
5. The user is redirected to a mock payment page.
6. If payment succeeds, the server confirms the reservation.
7. If payment fails, the pending reservation is marked `FAILED` and the seat is released.
8. Expired pending reservations are cleaned up opportunistically during reads and mutations.

The important rule is that a seat is confirmed only after payment succeeds. Client state is treated as advisory only; all meaningful checks happen on the server.

## Data Model Summary

* `User`: seeded demo account with hashed password.
* `Session`: hashed opaque session token with expiry timestamp.
* `Seat`: one of the three reservable seats.
* `Reservation`: user-seat relationship with state.

Reservation states:

* `PENDING`: temporary hold before payment completion.
* `CONFIRMED`: seat is reserved.
* `FAILED`: payment failed and the hold is released.
* `EXPIRED`: pending hold timed out and the seat is released.

For the local SQLite version, the migration adds a partial unique index so a seat can have only one active reservation:

```sql
CREATE UNIQUE INDEX "Reservation_active_seat_key"
ON "Reservation"("seatId")
WHERE "status" IN ('PENDING', 'CONFIRMED');
```

This database constraint is the final backstop against double booking. Service logic also checks availability inside transactions before creating or confirming reservations.

For the deployed PostgreSQL demo, the same reservation rule is preserved in the application flow and database-backed state transitions.

## Engineering Decisions And Trade-offs

* Single fullstack repo: keeps the assessment small, reviewable, and easy to run.
* Prisma + SQLite locally: fast local setup with a clear schema and migration history.
* Prisma Postgres for the live demo: allows reviewers to test the server-side workflow online.
* Service modules: route files stay thin while auth, reservation, and payment rules live in dedicated services.
* Pending holds: selection creates a temporary hold instead of prematurely reserving the seat.
* Opportunistic expiry: avoids background workers while still cleaning stale pending reservations.
* Mock payment: enough to test state transitions without integrating a real payment provider.
* Minimal UI: the focus is correctness and maintainability, not visual polish.

These choices fit a roughly two-hour assessment. They are intentionally not the full production shape.

## Failure Cases Handled

* Unauthenticated users are redirected before starting a reservation.
* Invalid or missing seat IDs are rejected server-side.
* Already pending or confirmed seats cannot be reserved again.
* Expired pending reservations are marked `EXPIRED` before availability/payment checks.
* Payment success is idempotent: repeating success for an already confirmed reservation returns the confirmed state.
* Payment failure only applies to pending reservations and cannot release an already confirmed seat.
* Users cannot complete payment for another user's reservation.

## Security Considerations

Implemented:

* Passwords are hashed with `scrypt`.
* Session tokens are random opaque values.
* Only token hashes are stored in the database.
* Session cookie is HTTP-only, `sameSite=lax`, and `secure` in production.
* Server-side validation protects reservation and payment mutations.
* Auth lookup returns only the user fields the app needs.

Not production-complete:

* No rate limiting.
* No CSRF token layer beyond same-site cookies and server actions.
* No account recovery, registration hardening, or email verification.
* No audit log for payment or reservation state changes.
* No monitoring or alerting.

## Production Improvements

For a real system, I would add:

* PostgreSQL with carefully designed constraints and transaction isolation.
* Real payment provider integration.
* Webhook signature verification.
* Payment and reservation audit logs.
* Idempotency keys for external payment callbacks.
* Background cleanup job for expired pending reservations.
* Rate limiting on login and reservation/payment actions.
* Structured logging, metrics, and monitoring.
* CI for typecheck, lint, build, tests, and migration validation.
* Automated tests for reservation races, payment idempotency, expiry, and auth boundaries.

This implementation is intentionally scoped to demonstrate the core workflow and engineering judgment without pretending to be production complete.
