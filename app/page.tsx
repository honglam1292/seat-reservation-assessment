import Link from "next/link";
import { SeatPicker } from "@/components/SeatPicker";
import { getCurrentUser } from "@/lib/auth/session";
import { listSeatsWithAvailability } from "@/services/reservationService";

type HomePageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const paramsPromise: Promise<{ error?: string; message?: string }> =
    searchParams ?? Promise.resolve({});

  const [user, seats, params] = await Promise.all([
    getCurrentUser(),
    listSeatsWithAvailability(),
    paramsPromise
  ]);

  return (
    <main className="page">
      <div className="topbar">
        <div>
          <h1>Seat Reservations</h1>
          <p className="muted">Select one of three seats and complete mock payment.</p>
        </div>

        <div className="topbar-actions">
          {user ? (
            <>
              <span className="muted">{user.email}</span>
              <form action="/api/logout" method="post">
                <button className="button-secondary" type="submit">
                  Logout
                </button>
              </form>
            </>
          ) : (
            <Link href="/login">Log in</Link>
          )}
        </div>
      </div>

      <div className="stack">
        {params.error ? (
          <div className="notice notice-error" role="alert">
            {params.error}
          </div>
        ) : null}

        {params.message ? (
          <div className="notice notice-success" role="status">
            {params.message}
          </div>
        ) : null}

        <SeatPicker isAuthenticated={Boolean(user)} seats={seats} />
      </div>
    </main>
  );
}
