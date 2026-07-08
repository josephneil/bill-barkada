import { Prisma } from "@prisma/client";

export function getBillApiError(error: unknown): {
  message: string;
  status: number;
} {
  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return {
      message:
        "Database connection failed. Check DATABASE_URL and run the Prisma migration.",
      status: 503,
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return {
        message: "This bill conflicted with existing saved data. Please retry.",
        status: 409,
      };
    }

    if (error.code === "P2021" || error.code === "P2022") {
      return {
        message: "Database tables are not ready. Run npm run prisma:migrate.",
        status: 503,
      };
    }
  }

  return {
    message: "Could not save this bill online.",
    status: 500,
  };
}
