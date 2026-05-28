import Link from "next/link";
import { createPendingReservationAction } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import type { SeatAvailability } from "@/services/reservationService";

type SeatPickerProps = {
  seats: SeatAvailability[];
  isAuthenticated: boolean;
};

function formatSeatStatus(seat: SeatAvailability) {
  if (seat.status === "available") {
    return "Available";
  }

  if (seat.status === "reserved") {
    return "Reserved";
  }

  return "Pending";
}

export function SeatPicker({ seats, isAuthenticated }: SeatPickerProps) {
  return (
    <div className="seat-grid">
      {seats.map((seat) => {
        const isAvailable = seat.status === "available";
        const canReserve = isAuthenticated && isAvailable;

        return (
          <article className="seat-card" key={seat.id}>
            <header>
              <div className="seat-label">{seat.label}</div>
              <span className={`status status-${seat.status}`}>
                {formatSeatStatus(seat)}
              </span>
            </header>

            {seat.pendingExpiresAt ? (
              <p className="muted">
                Held until {seat.pendingExpiresAt.toLocaleTimeString()}.
              </p>
            ) : (
              <p className="muted">
                {isAvailable
                  ? "Ready for checkout."
                  : "No longer available for checkout."}
              </p>
            )}

            {isAuthenticated ? (
              <form action={createPendingReservationAction}>
                <input name="seatId" type="hidden" value={seat.id} />
                <SubmitButton
                  disabled={!canReserve}
                  pendingLabel="Creating hold..."
                  type="submit"
                >
                  Reserve seat
                </SubmitButton>
              </form>
            ) : (
              <Link href="/login">Log in to reserve</Link>
            )}
          </article>
        );
      })}
    </div>
  );
}
