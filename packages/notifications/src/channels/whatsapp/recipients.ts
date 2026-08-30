import { db } from "@mumzo/db";
import { user } from "@mumzo/db/schema/auth";
import { userDevice } from "@mumzo/db/schema/notifications";
import { eq } from "drizzle-orm";

/**
 * Registers the customer's verified phone number as a WhatsApp recipient.
 *
 * Unlike FCM, there is no client-supplied token here: the address *is*
 * `user.phoneNumber`, already proven by OTP, so this is called server-side
 * after verification rather than from the app.
 *
 * Only transactional templates are sent to rows created this way. Meta
 * treats order updates as expected follow-ups to a purchase, but marketing
 * needs separate, explicit opt-in — sending promotions off the back of a
 * login would earn blocks, and blocks throttle the whole number's quality
 * rating.
 *
 * `deviceId` is the fixed string `"whatsapp"` so the upsert on
 * `(userId, deviceId)` keeps exactly one WhatsApp row per customer, which
 * also means a changed phone number updates in place instead of leaving a
 * stale second recipient.
 */
export async function registerWhatsAppRecipient(userId: string) {
  const [authUser] = await db
    .select({
      phoneNumber: user.phoneNumber,
      verified: user.phoneNumberVerified,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  // An unverified number must never receive messages: it may belong to
  // someone else entirely, and messaging a stranger is precisely what
  // Meta penalises.
  if (!authUser?.phoneNumber || !authUser.verified) {
    return null;
  }

  const [row] = await db
    .insert(userDevice)
    .values({
      userId,
      phone: authUser.phoneNumber,
      deviceId: "whatsapp",
      channel: "whatsapp",
      platform: "web",
      app: "platform",
      // The adapter addresses a phone number, not a push token; storing it
      // here keeps `DeviceTarget` uniform across channels.
      token: authUser.phoneNumber,
      isActive: true,
      lastSeenAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userDevice.userId, userDevice.deviceId],
      set: {
        phone: authUser.phoneNumber,
        token: authUser.phoneNumber,
        isActive: true,
        lastSeenAt: new Date(),
      },
    })
    .returning();

  return row ?? null;
}
