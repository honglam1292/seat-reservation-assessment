import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { ServiceError } from "@/services/errors";

export async function loginWithPassword(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw new ServiceError("INVALID_LOGIN", "Email and password are required.");
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new ServiceError("INVALID_LOGIN", "Invalid email or password.");
  }

  await createSession(user.id);

  return {
    id: user.id,
    email: user.email
  };
}
