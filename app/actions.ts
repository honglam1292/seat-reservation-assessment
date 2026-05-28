"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getServiceErrorMessage } from "@/services/errors";
import { createPendingReservation } from "@/services/reservationService";

export async function createPendingReservationAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const seatId = formData.get("seatId");

  if (typeof seatId !== "string" || !seatId) {
    redirect("/?error=Invalid%20seat%20selection.");
  }

  let reservationId = "";

  try {
    const reservation = await createPendingReservation(user.id, seatId);
    reservationId = reservation.id;
  } catch (error) {
    redirect(`/?error=${encodeURIComponent(getServiceErrorMessage(error))}`);
  }

  redirect(`/payment/${reservationId}`);
}
