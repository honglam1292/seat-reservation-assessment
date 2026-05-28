export class ServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export function getServiceErrorMessage(error: unknown) {
  if (error instanceof ServiceError) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
