import { getServerSession } from "next-auth";
import { UserRole } from "@/generated/prisma/enums";
import { authOptions } from "@/lib/auth";

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return null;
  }

  return session;
}
