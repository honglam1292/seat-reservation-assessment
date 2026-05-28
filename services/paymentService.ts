import { ReservationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ServiceError } from "@/services/errors";
import { expireStaleReservations } from "@/services/reservationService";

export async function completeMockPayment(userId: string, reservationId: string) {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    await expireStaleReservations(tx, now);

    const updateResult = await tx.reservation.updateMany({
      where: {
        id: reservationId,
        userId,
        status: ReservationStatus.PENDING,
        expiresAt: { gt: now }
      },
      data: {
        status: ReservationStatus.CONFIRMED,
        confirmedAt: now
      }
    });

    const reservation = await tx.reservation.findFirst({
      where: { id: reservationId, userId },
      include: { seat: true }
    });

    if (!reservation) {
      throw new ServiceError("RESERVATION_NOT_FOUND", "Reservation not found.");
    }

    if (reservation.status === ReservationStatus.CONFIRMED) {
      return reservation;
    }

    if (reservation.status === ReservationStatus.FAILED) {
      throw new ServiceError(
        "PAYMENT_ALREADY_FAILED",
        "This reservation was already released after failed payment."
      );
    }

    if (reservation.status === ReservationStatus.EXPIRED) {
      throw new ServiceError(
        "RESERVATION_EXPIRED",
        "This pending reservation has expired."
      );
    }

    if (updateResult.count === 0) {
      throw new ServiceError(
        "PAYMENT_NOT_COMPLETED",
        "Payment could not be completed for this reservation."
      );
    }

    throw new ServiceError(
      "PAYMENT_NOT_COMPLETED",
      "Payment could not be completed for this reservation."
    );
  });
}

export async function failMockPayment(userId: string, reservationId: string) {
  return prisma.$transaction(async (tx) => {
    await expireStaleReservations(tx);

    await tx.reservation.updateMany({
      where: {
        id: reservationId,
        userId,
        status: ReservationStatus.PENDING
      },
      data: { status: ReservationStatus.FAILED }
    });

    const reservation = await tx.reservation.findFirst({
      where: { id: reservationId, userId },
      include: { seat: true }
    });

    if (!reservation) {
      throw new ServiceError("RESERVATION_NOT_FOUND", "Reservation not found.");
    }

    if (
      reservation.status === ReservationStatus.FAILED ||
      reservation.status === ReservationStatus.EXPIRED
    ) {
      return reservation;
    }

    if (reservation.status === ReservationStatus.CONFIRMED) {
      throw new ServiceError(
        "RESERVATION_CONFIRMED",
        "This reservation has already been confirmed."
      );
    }

    throw new ServiceError(
      "PAYMENT_NOT_FAILED",
      "Payment could not be failed for this reservation."
    );
  });
}
