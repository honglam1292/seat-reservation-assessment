import Link from "next/link";
import { notFound } from "next/navigation";
import { ReservationStatus as Status } from "@prisma/client";
import { ReservationStatus } from "@/components/ReservationStatus";
import { SubmitButton } from "@/components/SubmitButton";
import { requireUser } from "@/lib/auth/requireUser";
import { ServiceError } from "@/services/errors";
import { getReservationForPayment } from "@/services/reservationService";
import {
  failPaymentAction,
  paySuccessfullyAction
} from "@/app/payment/[reservationId]/actions";

type PaymentPageProps = {
  params: Promise<{
    reservationId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function PaymentPage({
  params,
  searchParams
}: PaymentPageProps) {
  const user = await requireUser();
  const { reservationId } = await params;
  const query = searchParams ? await searchParams : {};

  let reservation;

  try {
    reservation = await getReservationForPayment(user.id, reservationId);
  } catch (error) {
    if (error instanceof ServiceError && error.code === "RESERVATION_NOT_FOUND") {
      notFound();
    }

    throw error;
  }

  const canPay = reservation.status === Status.PENDING;

  return (
    <main className="page">
      <div className="topbar">
        <div>
          <h1>Mock Payment</h1>
          <p className="muted">Complete or fail payment for seat {reservation.seat.label}.</p>
        </div>
        <Link href="/">Back to seats</Link>
      </div>

      <section className="panel stack">
        {query.error ? (
          <div className="notice notice-error" role="alert">
            {query.error}
          </div>
        ) : null}

        <div>
          <p className="muted">Seat</p>
          <div className="seat-label">{reservation.seat.label}</div>
        </div>

        <div>
          <p className="muted">Reservation status</p>
          <ReservationStatus status={reservation.status} />
        </div>

        {reservation.status === Status.PENDING ? (
          <p className="muted">
            Pending hold expires at {reservation.expiresAt.toLocaleString()}.
          </p>
        ) : null}

        <div className="actions">
          <form action={paySuccessfullyAction}>
            <input name="reservationId" type="hidden" value={reservation.id} />
            <SubmitButton
              disabled={!canPay}
              pendingLabel="Completing..."
              type="submit"
            >
              Pay successfully
            </SubmitButton>
          </form>

          <form action={failPaymentAction}>
            <input name="reservationId" type="hidden" value={reservation.id} />
            <SubmitButton
              className="button-danger"
              disabled={!canPay}
              pendingLabel="Releasing..."
              type="submit"
            >
              Fail payment
            </SubmitButton>
          </form>
        </div>

        {!canPay ? (
          <p className="muted">This reservation is no longer pending.</p>
        ) : null}
      </section>
    </main>
  );
}
