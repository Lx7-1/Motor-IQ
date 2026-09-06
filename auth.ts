import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

/**
 * Ensures the request has a valid Clerk session.
 * For web apps, Clerk auth is cookie-based — no Bearer token needed.
 * JIT-provisions the user row in our DB on first login.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { userId: clerkUserId } = getAuth(req);

  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    // JIT provision: create user row if it doesn't exist yet
    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, clerkUserId))
      .limit(1);

    if (!user) {
      try {
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
        const displayName =
          `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
          email.split("@")[0];

        [user] = await db
          .insert(usersTable)
          .values({
            id: clerkUserId,
            email,
            displayName,
            avatarUrl: clerkUser.imageUrl ?? null,
            role: "buyer",
            isDealer: false,
          })
          .returning();
      } catch (err) {
        logger.error({ err }, "Failed to create user from Clerk");
        res.status(500).json({ error: "Failed to initialize user" });
        return;
      }
    }

    req.userId = user.id;
    next();
  } catch (err) {
    logger.error({ err }, "Auth middleware error");
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Attaches userId if a valid session exists, but does not block unauthenticated requests.
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId: clerkUserId } = getAuth(req);
    if (clerkUserId) {
      req.userId = clerkUserId;
    }
  } catch {
    // Silently ignore — optional auth
  }
  next();
}

/**
 * Requires auth AND that the user has role = 'admin'.
 */
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  await requireAuth(req, res, async () => {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.userId))
      .limit(1);

    if (!user || user.role !== "admin") {
      res.status(403).json({ error: "Forbidden: Admin only" });
      return;
    }
    next();
  });
}
