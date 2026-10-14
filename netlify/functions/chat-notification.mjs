import { json } from "@netlify/functions";

const RECIPIENT = "Solace.cyber.workstations@mail.com";
const ALLOWED_HOSTS = new Set(["solacecyberwork.online", "www.solacecyberwork.online"]);

function response(statusCode, body) {
  return json(body, { statusCode, headers: { "Cache-Control": "no-store" } });
}

export default async (request) => {
  if (request.method !== "POST") return response(405, { error: "Method not allowed" });

  const origin = request.headers.get("origin");
  if (!origin) return response(403, { error: "Origin required" });
  let host;
  try { host = new URL(origin).hostname.toLowerCase(); }
  catch { return response(403, { error: "Invalid origin" }); }
  if (!ALLOWED_HOSTS.has(host)) return response(403, { error: "Origin not allowed" });

  if (!process.env.RESEND_API_KEY || !process.env.CHAT_NOTIFICATIONS_FROM_EMAIL) {
    console.error("Chat notification email is not configured.");
    return response(503, { error: "Notifications are not configured" });
  }

  let data;
  try { data = await request.json(); }
  catch { return response(400, { error: "Invalid JSON" }); }

  const eventType = data?.eventType;
  if (!["visitor_message", "chatbot_reply"].includes(eventType)) return response(400, { error: "Invalid event type" });

  const message = typeof data.message === "string" ? data.message.trim().slice(0, 1000) : "";
  const reply = typeof data.reply === "string" ? data.reply.trim().slice(0, 2000) : "";
  const sessionId = typeof data.sessionId === "string" ? data.sessionId.slice(0, 100) : "unknown";
  const page = typeof data.page === "string" ? data.page.slice(0, 180) : "/";
  const occurredAt = typeof data.occurredAt === "string" ? data.occurredAt.slice(0, 50) : new Date().toISOString();

  if (eventType === "visitor_message" && !message) return response(400, { error: "Message required" });
  if (eventType === "chatbot_reply" && !reply) return response(400, { error: "Reply required" });

  const isVisitor = eventType === "visitor_message";
  const subject = isVisitor ? "Solace chatbot — new visitor message" : "Solace chatbot — new chatbot reply";
  const text = [
    "Solace Cyber Workstations chatbot notification", "",
    "Event: " + (isVisitor ? "Visitor message" : "Chatbot reply"),
    "Time: " + occurredAt, "Session: " + sessionId, "Page: " + page, "",
    isVisitor ? "Visitor message:" : "Visitor message (context):", message || "(not included)", "",
    "Chatbot reply:", reply || "(not included in this event)", "",
    "Privacy reminder: do not request or send passwords, recovery phrases, private keys, or one-time codes through chat."
  ].join("\n");

  try {
    const result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.CHAT_NOTIFICATIONS_FROM_EMAIL, to: [RECIPIENT], subject, text })
    });
    if (!result.ok) {
      const detail = await result.text();
      console.error("Resend rejected chatbot notification:", result.status, detail.slice(0, 400));
      return response(502, { error: "Email provider rejected notification" });
    }
    return response(200, { ok: true });
  } catch (error) {
    console.error("Chat notification delivery failed:", error?.message || "unknown error");
    return response(502, { error: "Email delivery failed" });
  }
};

export const config = { path: "/.netlify/functions/chat-notification" };
