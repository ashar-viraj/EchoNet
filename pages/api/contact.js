import { sendEmail } from "@/lib/email";
import { query } from "@/lib/db";
import crypto from "crypto";

const RECIPIENTS = ["25M0770@iitb.ac.in", "viraj.ashar@iitb.ac.in"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  const { sender = "", message = "" } = req.body || {};
  if (!message.trim()) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    // Persist feedback
    await query(
      "INSERT INTO feedback (id, sender, message) VALUES ($1, $2, $3)",
      [crypto.randomUUID(), sender, message]
    );

    let mailOk = true;

    // Send feedback to team
    try {
      await sendEmail({
        to: RECIPIENTS.join(","),
        subject: "EchoNet Feedback",
        text: `From: ${sender || "Anonymous"}\n\n${message}`,
        html: `<p><strong>From:</strong> ${sender || "Anonymous"}</p><p>${message.replace(/\n/g, "<br/>")}</p>`,
      });
    } catch (err) {
      console.error("Team email failed", err);
      mailOk = false;
    }

    // Send acknowledgement to sender if provided and looks like an email
    if (sender && sender.includes("@")) {
      try {
        await sendEmail({
          to: sender,
          subject: "Thank you for your feedback",
          text: "Thanks for reaching out to EchoNet. We received your message and will reply soon.",
          html: "<p>Thanks for reaching out to EchoNet. We received your message and will reply soon.</p>",
        });
      } catch (err) {
        console.error("Ack email failed", err);
        mailOk = false;
      }
    }

    return res.status(200).json({ ok: true, mailOk });
  } catch (err) {
    console.error("Contact send failed", err);
    return res.status(500).json({ error: "Unable to send your message right now." });
  }
}
