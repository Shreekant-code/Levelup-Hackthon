const canSendEmail = () =>
  Boolean(
    (process.env.SMTP_HOST || process.env.EMAIL_HOST) &&
      (process.env.SMTP_USER || process.env.EMAIL_USER) &&
      (process.env.SMTP_PASS || process.env.EMAIL_PASS)
  );

const resolveTransportConfig = () => ({
  host: process.env.SMTP_HOST || process.env.EMAIL_HOST,
  port: Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587),
  secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
});

const renderTemplate = ({ username, completionRate, suggestion, title, subtitle }) => `
  <div style="font-family:Arial,sans-serif;background:#09090b;color:#f4f4f5;padding:24px">
    <div style="max-width:620px;margin:0 auto;border:1px solid #27272a;background:#111827;border-radius:12px;overflow:hidden">
      <div style="padding:18px 22px;border-bottom:1px solid #27272a;background:linear-gradient(90deg,#1d4ed8,#7c3aed)">
        <h2 style="margin:0;font-size:20px;color:#fff;">${title}</h2>
        <p style="margin:6px 0 0;color:#e5e7eb;">${subtitle}</p>
      </div>
      <div style="padding:20px 22px">
        <p style="margin:0 0 12px;color:#e5e7eb;">Hi ${username},</p>
        <p style="margin:0 0 12px;color:#d4d4d8;">Roadmap completion rate: <strong>${Math.round(
          completionRate
        )}%</strong></p>
        <p style="margin:0 0 8px;color:#a1a1aa;">Reinforcement suggestion:</p>
        <p style="margin:0;color:#e4e4e7;">${suggestion}</p>
      </div>
    </div>
  </div>
`;

const buildEmailPayload = ({ type, username, completionRate, suggestion }) => {
  if (type === "levelup") {
    return {
      subject: "FutureME: Level Up Achieved",
      html: renderTemplate({
        username,
        completionRate,
        suggestion,
        title: "Level Up Unlocked",
        subtitle: "Your effort is compounding. Keep your momentum.",
      }),
    };
  }

  if (type === "streak_break") {
    return {
      subject: "FutureME: Streak Alert",
      html: renderTemplate({
        username,
        completionRate,
        suggestion,
        title: "Streak Break Warning",
        subtitle: "Complete one focused task today to recover consistency.",
      }),
    };
  }

  if (type === "roadmap_ready") {
    return {
      subject: "FutureME: New Adaptive Roadmap Ready",
      html: renderTemplate({
        username,
        completionRate,
        suggestion,
        title: "Adaptive Roadmap Updated",
        subtitle: "Your weekly plan has been re-optimized.",
      }),
    };
  }

  if (type === "penalty_warning") {
    return {
      subject: "FutureME: Reinforcement Penalty Applied",
      html: renderTemplate({
        username,
        completionRate,
        suggestion,
        title: "Performance Alert",
        subtitle: "We simplified your roadmap to restore progress.",
      }),
    };
  }

  return {
    subject: "FutureME: Smart Learning Reminder",
    html: renderTemplate({
      username,
      completionRate,
      suggestion,
      title: "Daily Reminder",
      subtitle: "One focused session today keeps your growth on track.",
    }),
  };
};

export const sendSystemEmail = async ({
  to,
  type,
  username,
  completionRate,
  suggestion,
}) => {
  try {
    if (!to || !canSendEmail()) return { sent: false, reason: "email_not_configured" };

    const nodemailerModule = await import("nodemailer").catch(() => null);
    if (!nodemailerModule?.default) {
      return { sent: false, reason: "nodemailer_unavailable" };
    }

    const transporter = nodemailerModule.default.createTransport(resolveTransportConfig());
    const payload = buildEmailPayload({ type, username, completionRate, suggestion });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER,
      to,
      subject: payload.subject,
      html: payload.html,
    });

    return { sent: true };
  } catch {
    return { sent: false, reason: "email_send_failed" };
  }
};

