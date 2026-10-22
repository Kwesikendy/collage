import { clerkClient, getAuth } from "@clerk/express";
import { and, eq } from "drizzle-orm";
import type { RequestHandler } from "express";
import { db, staffMembersTable } from "@workspace/db";

const deny = (res: Parameters<RequestHandler>[1], status: number, error: string) => {
  res.status(status).json({ error });
};

export const requireCollatAdmin: RequestHandler = async (req, res, next) => {
  const userId = getAuth(req).userId;
  if (!userId) {
    deny(res, 401, "Sign in to access Collage ERP.");
    return;
  }

  try {
    let [member] = await db
      .select()
      .from(staffMembersTable)
      .where(eq(staffMembersTable.clerkUserId, userId))
      .limit(1);

    // Bootstrap only the named, verified initial admin. Existing role records
    // are never automatically promoted again, so later revocations are kept.
    if (!member) {
      const configuredEmail = process.env.COLLAT_INITIAL_ADMIN_EMAIL
        ?.trim()
        .toLowerCase();
      if (!configuredEmail) {
        deny(res, 503, "Initial administrator access has not been configured.");
        return;
      }

      const user = await clerkClient.users.getUser(userId);
      const primaryEmail = user.primaryEmailAddress;
      const email = primaryEmail?.emailAddress.trim().toLowerCase();
      if (
        !primaryEmail ||
        !email ||
        email !== configuredEmail ||
        primaryEmail.verification?.status !== "verified"
      ) {
        deny(res, 403, "Your account does not have Collage ERP access.");
        return;
      }

      await db
        .insert(staffMembersTable)
        .values({
          clerkUserId: userId,
          email,
          name: user.fullName || user.firstName || email,
          role: "admin",
          status: "active",
        })
        .onConflictDoNothing();

      [member] = await db
        .select()
        .from(staffMembersTable)
        .where(
          and(
            eq(staffMembersTable.clerkUserId, userId),
            eq(staffMembersTable.email, email),
          ),
        )
        .limit(1);
    }

    if (!member || member.status !== "active" || member.role !== "admin") {
      deny(res, 403, "Your account does not have administrator access.");
      return;
    }

    next();
  } catch (error) {
    req.log.error({ err: error }, "Collage ERP access check failed");
    deny(res, 500, "Unable to verify your Collage ERP access.");
  }
};
