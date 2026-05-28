"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getServiceErrorMessage } from "@/services/errors";
import { completeMockPayment, failMockPayment } from "@/services/paymentService";

function getReservationId(formData: FormData) {
  const reservationId = formData.get("reservationId");
  return typeof reservationId === "string" ? reservationId : "";
}

export async function paySuccessfullyAction(formData: FormData) {
  const user = await getCurrentUser();
  const reservationId = getReservationId(formData);

  if (!user) {
    redirect("/login");
  }

  if (!reservationId) {
    redirect("/?error=Invalid%20reservation.");
  }

  const reservationPath = `/payment/${encodeURIComponent(reservationId)}`;

  try {
    await completeMockPayment(user.id, reservationId);
  } catch (error) {
    redirect(
      `${reservationPath}?error=${encodeURIComponent(
        getServiceErrorMessage(error)
      )}`
    );
  }

  redirect("/?message=Payment%20completed.%20Seat%20reserved.");
}

export async function failPaymentAction(formData: FormData) {
  const user = await getCurrentUser();
  const reservationId = getReservationId(formData);

  if (!user) {
    redirect("/login");
  }

  if (!reservationId) {
    redirect("/?error=Invalid%20reservation.");
  }

  const reservationPath = `/payment/${encodeURIComponent(reservationId)}`;

  try {
    await failMockPayment(user.id, reservationId);
  } catch (error) {
    redirect(
      `${reservationPath}?error=${encodeURIComponent(
        getServiceErrorMessage(error)
      )}`
    );
  }

  redirect("/?message=Payment%20failed.%20Seat%20released.");
}
