import { ReservationStatus as Status } from "@prisma/client";

type ReservationStatusProps = {
  status: Status;
};

const labels: Record<Status, string> = {
  [Status.PENDING]: "Pending",
  [Status.CONFIRMED]: "Reserved",
  [Status.FAILED]: "Failed",
  [Status.EXPIRED]: "Expired"
};

const classNames: Record<Status, string> = {
  [Status.PENDING]: "status-pending",
  [Status.CONFIRMED]: "status-reserved",
  [Status.FAILED]: "status-failed",
  [Status.EXPIRED]: "status-expired"
};

export function ReservationStatus({ status }: ReservationStatusProps) {
  return <span className={`status ${classNames[status]}`}>{labels[status]}</span>;
}
