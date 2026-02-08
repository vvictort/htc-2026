/**
 * Notification delivery services — Email (SendGrid) and SMS (Twilio).
 *
 * Set the following env vars:
 *   SENDGRID_API_KEY       — SendGrid API key
 *   SENDGRID_FROM_EMAIL    — verified sender email
 *   TWILIO_ACCOUNT_SID     — Twilio account SID
 *   TWILIO_AUTH_TOKEN       — Twilio auth token
 *   TWILIO_FROM_NUMBER      — Twilio phone number (E.164)
 */

// ────────────────────────────── Email (SendGrid REST API) ──────────────────────────────

export async function sendEmail(
    to: string,
    subject: string,
    htmlBody: string
): Promise<boolean> {
    const apiKey = process.env.SENDGRID_API_KEY;
    const from = process.env.SENDGRID_FROM_EMAIL || "noreply@babywatcher.app";

    if (!apiKey) {
        console.warn("⚠️  SENDGRID_API_KEY not set — skipping email to", to);
        return false;
    }

    try {
        const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email: to }] }],
                from: { email: from, name: "BabyWatcher" },
                subject,
                content: [{ type: "text/html", value: htmlBody }],
            }),
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

// ────────────────────────────── SMS (Twilio REST API) ──────────────────────────────

export async function sendSms(
    to: string,
    body: string
): Promise<boolean> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !from) {
        console.warn("⚠️  Twilio env vars not set — skipping SMS to", to);
        return false;
    }

    try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

        const params = new URLSearchParams();
        params.append("To", to);
        params.append("From", from);
        params.append("Body", body);

        const res = await fetch(url, {
            method: "POST",
            headers: {
                Authorization:
                    "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });

        if (res.ok) {
            console.log(`📱 SMS sent to ${to}`);
            return true;
        }

        const errText = await res.text();
        console.error("❌ Twilio error:", res.status, errText);
        return false;
    } catch (err) {
        console.error("❌ SMS delivery failed:", err);
        return false;
    }
}

// ────────────────────────────── Build notification email HTML ──────────────────────────────

export function buildNotificationEmail(
    _type: string,
    message: string,
    time: string,
    snapshotBase64?: string
): string {
    const imgTag = snapshotBase64
        ? `<img src="data:image/jpeg;base64,${snapshotBase64}" alt="Baby snapshot" style="max-width:100%;border-radius:12px;margin:16px 0;" />`
        : "";

    return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <h2 style="color:#FF6F61;">🍼 BabyWatcher Alert</h2>
      <p style="font-size:16px;color:#333;">${message}</p>
      ${imgTag}
      <p style="font-size:13px;color:#888;">Detected at ${time}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
      <p style="font-size:12px;color:#aaa;">You're receiving this because you enabled email alerts in BabyWatcher settings.</p>
    </div>
  `;
}
