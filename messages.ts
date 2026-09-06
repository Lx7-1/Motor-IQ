import { Router } from "express";
import { db } from "@workspace/db";
import { messagesTable, usersTable, vehiclesTable } from "@workspace/db";
import { eq, and, or, sql, desc } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

// GET /api/messages (conversations list)
router.get("/messages", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  // Get latest message per vehicle conversation involving this user
  const conversations = await db
    .select({
      vehicleId: messagesTable.vehicleId,
      latestAt: sql<Date>`max(${messagesTable.createdAt})`,
    })
    .from(messagesTable)
    .where(or(eq(messagesTable.senderId, userId), eq(messagesTable.receiverId, userId)))
    .groupBy(messagesTable.vehicleId)
    .orderBy(sql`max(${messagesTable.createdAt}) desc`);

  const result = await Promise.all(
    conversations.map(async (conv) => {
      const [lastMsg] = await db
        .select()
        .from(messagesTable)
        .where(and(
          eq(messagesTable.vehicleId, conv.vehicleId),
          or(eq(messagesTable.senderId, userId), eq(messagesTable.receiverId, userId))
        ))
        .orderBy(desc(messagesTable.createdAt))
        .limit(1);

      const otherId = lastMsg.senderId === userId ? lastMsg.receiverId : lastMsg.senderId;
      const [[vehicle], [otherUser], [{ unread }]] = await Promise.all([
        db.select({ title: vehiclesTable.title }).from(vehiclesTable).where(eq(vehiclesTable.id, conv.vehicleId)).limit(1),
        db.select().from(usersTable).where(eq(usersTable.id, otherId)).limit(1),
        db.select({ unread: sql<number>`cast(count(*) as int)` }).from(messagesTable).where(and(eq(messagesTable.vehicleId, conv.vehicleId), eq(messagesTable.receiverId, userId), eq(messagesTable.isRead, false))),
      ]);

      return {
        vehicle_id: conv.vehicleId,
        vehicle_title: vehicle?.title ?? "",
        vehicle_cover: null,
        other_user: otherUser ? {
          id: otherUser.id,
          display_name: otherUser.displayName,
          avatar_url: otherUser.avatarUrl ?? null,
          phone: otherUser.phone ?? null,
          whatsapp: otherUser.whatsapp ?? null,
          role: otherUser.role,
          created_at: otherUser.createdAt instanceof Date ? otherUser.createdAt.toISOString() : otherUser.createdAt,
        } : null,
        last_message: lastMsg.content,
        last_message_at: lastMsg.createdAt instanceof Date ? lastMsg.createdAt.toISOString() : lastMsg.createdAt,
        unread_count: unread,
      };
    })
  );

  res.json(result);
});

// GET /api/messages/:vehicleId
router.get("/messages/:vehicleId", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const vehicleId = Array.isArray(req.params.vehicleId) ? req.params.vehicleId[0] : req.params.vehicleId;
  const userId = req.userId!;

  const messages = await db
    .select()
    .from(messagesTable)
    .where(and(
      eq(messagesTable.vehicleId, vehicleId),
      or(eq(messagesTable.senderId, userId), eq(messagesTable.receiverId, userId))
    ))
    .orderBy(messagesTable.createdAt);

  // Mark received as read
  await db.update(messagesTable)
    .set({ isRead: true })
    .where(and(eq(messagesTable.vehicleId, vehicleId), eq(messagesTable.receiverId, userId)));

  const senderIds = [...new Set(messages.map((m) => m.senderId))];
  const senders = senderIds.length > 0
    ? await db.select().from(usersTable).where(sql`${usersTable.id} = ANY(ARRAY[${sql.join(senderIds.map((id) => sql`${id}`), sql`, `)}]::text[])`)
    : [];
  const senderMap = new Map(senders.map((s) => [s.id, s]));

  res.json(messages.map((m) => {
    const sender = senderMap.get(m.senderId);
    return {
      id: m.id,
      vehicle_id: m.vehicleId,
      sender_id: m.senderId,
      receiver_id: m.receiverId,
      content: m.content,
      is_read: m.isRead,
      created_at: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
      sender: sender ? {
        id: sender.id,
        display_name: sender.displayName,
        avatar_url: sender.avatarUrl ?? null,
        phone: sender.phone ?? null,
        whatsapp: sender.whatsapp ?? null,
        role: sender.role,
        created_at: sender.createdAt instanceof Date ? sender.createdAt.toISOString() : sender.createdAt,
      } : null,
    };
  }));
});

// POST /api/messages/:vehicleId
router.post("/messages/:vehicleId", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const vehicleId = Array.isArray(req.params.vehicleId) ? req.params.vehicleId[0] : req.params.vehicleId;
  const body = req.body;
  const [msg] = await db.insert(messagesTable).values({
    vehicleId,
    senderId: req.userId!,
    receiverId: body.receiver_id,
    content: body.content,
    isRead: false,
  }).returning();

  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  res.status(201).json({
    id: msg.id,
    vehicle_id: msg.vehicleId,
    sender_id: msg.senderId,
    receiver_id: msg.receiverId,
    content: msg.content,
    is_read: msg.isRead,
    created_at: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : msg.createdAt,
    sender: sender ? { id: sender.id, display_name: sender.displayName, avatar_url: sender.avatarUrl ?? null, phone: sender.phone ?? null, whatsapp: sender.whatsapp ?? null, role: sender.role, created_at: sender.createdAt instanceof Date ? sender.createdAt.toISOString() : sender.createdAt } : null,
  });
});

export default router;
