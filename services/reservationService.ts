import { Prisma, ReservationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { addMinutes, PENDING_RESERVATION_MINUTES } from "@/lib/time";
import { ServiceError } from "@/services/errors";

type DbClient = Prisma.TransactionClient | typeof prisma;

const activeStatuses: ReservationStatus[] = [
  ReservationStatus.PENDING,
  ReservationStatus.CONFIRMED
];

export type SeatAvailability = {
  id: string;
  label: string;
  status: "available" | "pending" | "reserved";
  pendingExpiresAt: Date | null;
};

export async function expireStaleReservations(
  db: DbClient = prisma,
  now = new Date()
) {
  await db.reservation.updateMany({
    where: {
      status: ReservationStatus.PENDING,
      expiresAt: { lte: now }
    },
    data: {
      status: ReservationStatus.EXPIRED
    }
  });
}

export async function listSeatsWithAvailability(): Promise<SeatAvailability[]> {
  await expireStaleReservations();

  const seats = await prisma.seat.findMany({
    orderBy: { label: "asc" },
    include: {
      reservations: {
        where: { status: { in: activeStatuses } },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  return seats.map((seat) => {
    const activeReservation = seat.reservations[0];

    if (!activeReservation) {
      return {
        id: seat.id,
        label: seat.label,
        status: "available",
        pendingExpiresAt: null
      };
    }

    return {
      id: seat.id,
      label: seat.label,
      status:
        activeReservation.status === ReservationStatus.CONFIRMED
          ? "reserved"
          : "pending",
      pendingExpiresAt:
        activeReservation.status === ReservationStatus.PENDING
          ? activeReservation.expiresAt
          : null
    };
  });
}

export async function createPendingReservation(userId: string, seatId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const now = new Date();

      await expireStaleReservations(tx, now);

      const seat = await tx.seat.findUnique({
        where: { id: seatId }
      });

      if (!seat) {
        throw new ServiceError("SEAT_NOT_FOUND", "Seat not found.");
      }

      const activeReservation = await tx.reservation.findFirst({
        where: {
          seatId,
          status: { in: activeStatuses }
        }
      });

      if (activeReservation) {
        throw new ServiceError(
          "SEAT_UNAVAILABLE",
          "That seat already has an active reservation."
        );
      }

      return tx.reservation.create({
        data: {
          userId,
          seatId,
          status: ReservationStatus.PENDING,
          expiresAt: addMinutes(now, PENDING_RESERVATION_MINUTES)
        }
      });
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      throw error;
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ServiceError(
        "SEAT_UNAVAILABLE",
        "That seat already has an active reservation."
      );
    }

    throw error;
  }
}

export async function getReservationForPayment(
  userId: string,
  reservationId: string
) {
  await expireStaleReservations();

  const reservation = await prisma.reservation.findFirst({
    where: {
      id: reservationId,
      userId
    },
    include: {
      seat: true
    }
  });

  if (!reservation) {
    throw new ServiceError("RESERVATION_NOT_FOUND", "Reservation not found.");
  }

  return reservation;
}
