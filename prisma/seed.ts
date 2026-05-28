import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  await prisma.session.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.user.deleteMany();

  await prisma.seat.createMany({
    data: [{ label: "A1" }, { label: "A2" }, { label: "A3" }]
  });

  const passwordHash = await hashPassword("password123");

  await prisma.user.createMany({
    data: [
      {
        email: "alice@example.com",
        passwordHash
      },
      {
        email: "bob@example.com",
        passwordHash
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
