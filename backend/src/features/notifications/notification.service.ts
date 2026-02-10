/**
 * Notification delivery service — Email (SendGrid).
 *
 * Set the following env vars:
 *   SENDGRID_API_KEY       — SendGrid API key
 *   SENDGRID_FROM_EMAIL    — verified sender email
 */

// ────────────────────────────── Email (SendGrid REST API) ──────────────────────────────

interface EmailAttachment {
  content: string; // Base64 encoded content (without data URI prefix)
  filename: string;
  type: string; // MIME type, e.g. "image/jpeg"
  content_id: string; // CID for inline referencing in HTML
  disposition: "inline" | "attachment";
}

export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  attachments?: EmailAttachment[],
): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL || "noreply@lullalink.app";

  if (!apiKey) {
    console.warn("⚠️  SENDGRID_API_KEY not set — skipping email to", to);
    return false;
  }

  try {
    const emailData: Record<string, unknown> = {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from, name: "Lullalink" },
      subject,
      content: [{ type: "text/html", value: htmlBody }],
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      emailData.attachments = attachments;
    }

    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (res.ok || res.status === 202) {
      console.log(`📧 Email sent to ${to}`);
      return true;
    }

    const errText = await res.text();
    console.error("❌ SendGrid error:", res.status, errText);
    return false;
  } catch (err) {
    console.error("❌ Email delivery failed:", err);
    return false;
  }
}

// ────────────────────────────── Build notification email HTML ──────────────────────────────

const SNAPSHOT_CID = "baby-snapshot";

/**
 * Build HTML email content. Snapshot is included as a separate attachment,
 * not embedded inline (more reliable across email clients).
 */
export function buildNotificationEmail(_type: string, message: string, time: string, _hasSnapshot?: boolean): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #FF6B6B;">Lullalink Security Alert</h1>
        </div>
        <p style="font-size:16px;color:#333;">${message}</p>
        <p style="font-size:13px;color:#888;">Detected at ${time}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="font-size:12px;color:#aaa;">You're receiving this because you enabled email alerts in Lullalink settings.</p>
    </div>
  `;
}

/**
 * Create an inline attachment object for SendGrid from a base64 snapshot.
 * Strips data URI prefix if present.
 */
export function createSnapshotAttachment(snapshotBase64: string): {
  content: string;
  filename: string;
  type: string;
  content_id: string;
  disposition: "inline";
} {
  // Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
  const base64Content = snapshotBase64.includes(",") ? snapshotBase64.split(",")[1] : snapshotBase64;

  return {
    content: base64Content,
    filename: "snapshot.jpg",
    type: "image/jpeg",
    content_id: SNAPSHOT_CID,
    disposition: "inline",
  };
}
