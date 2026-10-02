import { prisma } from "./prisma";

export type ConversationSummary = {
   id: string;
   title: string | null;
   isGroup: boolean;
   avatarUrl: string | null;
   lastMessage: {
      body: string;
      senderName: string;
      createdAt: string;
      isMine: boolean;
   } | null;
   unreadCount: number;
   updatedAt: string;
};

export type MessageItem = {
   id: string;
   body: string;
   senderId: string;
   senderName: string;
   senderImage: string | null;
   createdAt: string;
   isMine: boolean;
};

/** List all conversations for a user, ordered by last activity. */
export async function listConversations(
   userId: string,
): Promise<ConversationSummary[]> {
   const memberships = await prisma.conversationMember.findMany({
      where: { userId },
      include: {
         conversation: {
            include: {
               members: {
                  include: {
                     user: { select: { id: true, name: true, image: true } },
                  },
               },
               messages: {
                  orderBy: { createdAt: "desc" },
                  take: 1,
                  include: {
                     sender: { select: { id: true, name: true } },
                  },
               },
            },
         },
      },
      orderBy: { conversation: { updatedAt: "desc" } },
   });

   const result: ConversationSummary[] = [];

   for (const m of memberships) {
      const c = m.conversation;

      // Unread count = messages created after lastReadAt, not sent by me
      const unreadCount = await prisma.message.count({
         where: {
            conversationId: c.id,
            createdAt: { gt: m.lastReadAt },
            senderId: { not: userId },
         },
      });

      // For 1-on-1: use the other person's name/avatar
      const other = c.members.find((x) => x.user.id !== userId)?.user;
      const title = c.isGroup
         ? (c.title ?? "Group")
         : (other?.name ?? "Unknown");
      const avatarUrl = other?.image ?? null;

      const last = c.messages[0];

      result.push({
         id: c.id,
         title,
         isGroup: c.isGroup,
         avatarUrl,
         lastMessage: last
            ? {
                 body: last.body,
                 senderName: last.sender.name,
                 createdAt: last.createdAt.toISOString(),
                 isMine: last.senderId === userId,
              }
            : null,
         unreadCount,
         updatedAt: c.updatedAt.toISOString(),
      });
   }

   return result;
}

/** Fetch messages in a conversation, oldest first. */
export async function getMessages(
   conversationId: string,
   userId: string,
): Promise<{
   messages: MessageItem[];
   isMember: boolean;
   title: string;
   avatarUrl: string | null;
}> {
   const membership = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
   });

   if (!membership) {
      return { messages: [], isMember: false, title: "", avatarUrl: null };
   }

   const [messages, conversation] = await Promise.all([
      prisma.message.findMany({
         where: { conversationId },
         orderBy: { createdAt: "asc" },
         include: { sender: { select: { id: true, name: true, image: true } } },
      }),
      prisma.conversation.findUnique({
         where: { id: conversationId },
         include: {
            members: {
               include: {
                  user: { select: { id: true, name: true, image: true } },
               },
            },
         },
      }),
   ]);

   const other = conversation?.members.find((x) => x.user.id !== userId)?.user;
   const title = conversation?.isGroup
      ? (conversation.title ?? "Group")
      : (other?.name ?? "Unknown");
   const avatarUrl = other?.image ?? null;

   return {
      messages: messages.map((m) => ({
         id: m.id,
         body: m.body,
         senderId: m.senderId,
         senderName: m.sender.name,
         senderImage: m.sender.image,
         createdAt: m.createdAt.toISOString(),
         isMine: m.senderId === userId,
      })),
      isMember: true,
      title,
      avatarUrl,
   };
}

/** Send a message only when the sender belongs to the conversation. */
export async function sendMessage(
   conversationId: string,
   senderId: string,
   body: string,
): Promise<MessageItem> {
   const trimmed = body.trim();
   if (!trimmed) throw new Error("EMPTY_MESSAGE");
   if (trimmed.length > 4000) throw new Error("MESSAGE_TOO_LONG");

   const membership = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
   });
   if (!membership) throw new Error("NOT_MEMBER");

   const recipients = await prisma.conversationMember.findMany({
      where: { conversationId, userId: { not: senderId } },
      select: { userId: true },
   });

   const msg = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
         data: { conversationId, senderId, body: trimmed },
         include: { sender: { select: { id: true, name: true, image: true } } },
      });

      await tx.conversation.update({
         where: { id: conversationId },
         data: { updatedAt: new Date() },
      });

      if (recipients.length > 0) {
         await tx.notification.createMany({
            data: recipients.map(({ userId }) => ({
               userId,
               title: `New message from ${created.sender.name}`,
               message: trimmed,
               type: "info",
               link: `/dashboard/messages?c=${conversationId}`,
            })),
         });
      }

      return created;
   });

   return {
      id: msg.id,
      body: msg.body,
      senderId: msg.senderId,
      senderName: msg.sender.name,
      senderImage: msg.sender.image,
      createdAt: msg.createdAt.toISOString(),
      isMine: true,
   };
}

/** Mark conversation as read (updates lastReadAt). */
export async function markRead(conversationId: string, userId: string) {
   await prisma.conversationMember.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: new Date() },
   });
}

/** Create or find a 1-on-1 conversation between two users. */
export async function findOrCreateDirect(userA: string, userB: string) {
   // Look for an existing 1-on-1
   const existing = await prisma.conversation.findFirst({
      where: {
         isGroup: false,
         AND: [
            { members: { some: { userId: userA } } },
            { members: { some: { userId: userB } } },
         ],
      },
   });
   if (existing) return existing;

   return prisma.conversation.create({
      data: {
         isGroup: false,
         members: {
            create: [{ userId: userA }, { userId: userB }],
         },
      },
   });
}
