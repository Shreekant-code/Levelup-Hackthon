const eventMemory = new Map();
const dailyTypeMemory = new Map();
const dailyCountMemory = new Map();

const IMPORTANT_TYPES = new Set([
  "streak_warning",
  "streak_broken",
  "streak_break",
  "level_up",
  "roadmap_ready",
  "penalty_warning",
  "daily_summary",
]);

const OPTIONAL_TYPES = new Set(["task_complete", "streak_update", "task_added", "skill_added", "skill_progress_updated"]);

let transporter = null;
let transportInitialized = false;

const getEnv = (...keys) => {
  for (const key of keys) {
    if (process.env[key]) return process.env[key];
  }
  return "";
};

const currentDayKey = () => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
};

const getTransportConfig = () => ({
  host: getEnv("SMTP_HOST", "EMAIL_HOST", "EMAIL_SMTP_HOST"),
  port: Number(getEnv("SMTP_PORT", "EMAIL_PORT", "EMAIL_SMTP_PORT") || 587),
  secure: String(getEnv("SMTP_SECURE", "EMAIL_SECURE") || "false").toLowerCase() === "true",
  auth: {
    user: getEnv("EMAIL_USER", "SMTP_USER"),
    pass: getEnv("EMAIL_PASS", "SMTP_PASS"),
  },
});

const canEmail = () => {
  const cfg = getTransportConfig();
  return Boolean((cfg.host || getEnv("EMAIL_SERVICE")) && cfg.auth.user && cfg.auth.pass);
};

const shouldSendByPolicy = ({ to, type, additionalData = {} }) => {
  const dayKey = additionalData.dayKey || currentDayKey();
  const baseKey = `${to}|${dayKey}`;

  const isImportant = IMPORTANT_TYPES.has(type);
  const isOptional = OPTIONAL_TYPES.has(type);
  const forceEmail = additionalData.forceEmail === true;

  if (!isImportant && !(isOptional && forceEmail)) {
    return { allow: false, reason: "optional_email_skipped" };
  }

  const alreadySentTypes = dailyTypeMemory.get(baseKey) || new Set();
  if (alreadySentTypes.has(type)) {
    return { allow: false, reason: "same_type_already_sent_today" };
  }

  const dailyCount = dailyCountMemory.get(baseKey) || 0;
  if (dailyCount >= 3) {
    return { allow: false, reason: "daily_limit_reached" };
  }

  alreadySentTypes.add(type);
  dailyTypeMemory.set(baseKey, alreadySentTypes);
  dailyCountMemory.set(baseKey, dailyCount + 1);

  return { allow: true };
};

const shouldSendByCooldown = ({ to, type, eventKey, cooldownMs = 60 * 60 * 1000 }) => {
  const key = `${to}|${type}|${eventKey || "default"}`;
  const now = Date.now();
  const last = eventMemory.get(key);
  if (last && now - last < cooldownMs) return false;
  eventMemory.set(key, now);
  return true;
};

const styleByType = (type) => {
  if (type === "task_complete") return { accent: "#22c55e", label: "Task Completed" };
  if (type === "task_added") return { accent: "#3b82f6", label: "New Task Added" };
  if (type === "skill_added") return { accent: "#06b6d4", label: "New Skill Added" };
  if (type === "skill_progress_updated") return { accent: "#0ea5e9", label: "Skill Progress Updated" };
  if (type === "daily_summary") return { accent: "#3b82f6", label: "Daily Summary" };
  if (type === "streak_update") return { accent: "#f59e0b", label: "Streak Update" };
  if (type === "streak_warning") return { accent: "#facc15", label: "Streak Warning" };
  if (type === "streak_break" || type === "streak_broken") return { accent: "#f97316", label: "Streak Broken" };
  if (type === "level_up") return { accent: "#a855f7", label: "Level Up" };
  if (type === "roadmap_ready") return { accent: "#06b6d4", label: "Roadmap Ready" };
  return { accent: "#ef4444", label: "Optimization Applied" };
};

const buildCoreCopy = ({ type, customMessage, additionalData }) => {
  if (customMessage) return customMessage;

  if (type === "task_added") {
    return `New task added: "${additionalData?.taskTitle || "Task"}" for ${additionalData?.focusArea || "focus work"}.`;
  }
  if (type === "task_complete") {
    return `You completed "${additionalData?.taskTitle || "a task"}" and earned ${
      additionalData?.xpEarned ?? 0
    } XP.`;
  }
  if (type === "skill_added") {
    return `New skill tracked: ${additionalData?.skillName || "Skill"}. Keep building momentum.`;
  }
  if (type === "skill_progress_updated") {
    return `${additionalData?.skillName || "Skill"} progress updated to ${additionalData?.progressPercentage ?? 0}%.`;
  }
  if (type === "daily_summary") {
    return `Today: ${additionalData?.tasksCompleted ?? 0} tasks completed, ${
      additionalData?.xpGained ?? 0
    } XP gained, streak at ${additionalData?.streakCount ?? 0}.`;
  }
  if (type === "streak_update") {
    return `Your streak increased to ${additionalData?.streakCount ?? 0} day(s). Keep the momentum.`;
  }
  if (type === "streak_warning") {
    return "Your streak is about to break. Complete at least one task before the day ends.";
  }
  if (type === "streak_break" || type === "streak_broken") {
    return "Your streak was interrupted. Complete one focused task daily to recover quickly.";
  }
  if (type === "level_up") {
    return `You reached Level ${additionalData?.newLevel ?? "next"}. Great execution.`;
  }
  if (type === "roadmap_ready") {
    return `Your roadmap was optimized with predicted success rate ${Math.round(
      Number(additionalData?.predictedSuccessRate || 0)
    )}%.`;
  }
  return `Roadmap completion dropped to ${Math.round(
    Number(additionalData?.roadmapCompletionRate || 0)
  )}%. Recovery mode was activated.`;
};

const buildHtmlTemplate = ({ username, type, customMessage, additionalData }) => {
  const { accent, label } = styleByType(type);
  const bodyMessage = buildCoreCopy({ type, customMessage, additionalData });
  const suggestion =
    additionalData?.reinforcementSuggestion ||
    "Focus on one high-impact session and close one meaningful task today.";

  const extraRows = [
    additionalData?.taskTitle
      ? `<tr><td style="padding:6px 0;color:#9ca3af;">Task</td><td style="padding:6px 0;color:#e5e7eb;">${additionalData.taskTitle}</td></tr>`
      : "",
    additionalData?.focusArea
      ? `<tr><td style="padding:6px 0;color:#9ca3af;">Focus Area</td><td style="padding:6px 0;color:#e5e7eb;">${additionalData.focusArea}</td></tr>`
      : "",
    additionalData?.skillName
      ? `<tr><td style="padding:6px 0;color:#9ca3af;">Skill</td><td style="padding:6px 0;color:#e5e7eb;">${additionalData.skillName}</td></tr>`
      : "",
    Number.isFinite(Number(additionalData?.progressPercentage))
      ? `<tr><td style="padding:6px 0;color:#9ca3af;">Progress</td><td style="padding:6px 0;color:#e5e7eb;">${Number(
          additionalData.progressPercentage
        )}%</td></tr>`
      : "",
    Number.isFinite(Number(additionalData?.xpEarned))
      ? `<tr><td style="padding:6px 0;color:#9ca3af;">XP Earned</td><td style="padding:6px 0;color:#e5e7eb;">${Number(
          additionalData.xpEarned
        )}</td></tr>`
      : "",
    Number.isFinite(Number(additionalData?.tasksCompleted))
      ? `<tr><td style="padding:6px 0;color:#9ca3af;">Tasks Completed</td><td style="padding:6px 0;color:#e5e7eb;">${Number(
          additionalData.tasksCompleted
        )}</td></tr>`
      : "",
    Number.isFinite(Number(additionalData?.streakCount))
      ? `<tr><td style="padding:6px 0;color:#9ca3af;">Current Streak</td><td style="padding:6px 0;color:#e5e7eb;">${Number(
          additionalData.streakCount
        )} day(s)</td></tr>`
      : "",
    Number.isFinite(Number(additionalData?.newLevel))
      ? `<tr><td style="padding:6px 0;color:#9ca3af;">Level</td><td style="padding:6px 0;color:#e5e7eb;">${Number(
          additionalData.newLevel
        )}</td></tr>`
      : "",
    Number.isFinite(Number(additionalData?.predictedSuccessRate))
      ? `<tr><td style="padding:6px 0;color:#9ca3af;">Predicted Success</td><td style="padding:6px 0;color:#e5e7eb;">${Math.round(
          Number(additionalData.predictedSuccessRate)
        )}%</td></tr>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  return `
  <div style="font-family:Arial,sans-serif;background:#030712;padding:24px;color:#e5e7eb;">
    <div style="max-width:620px;margin:0 auto;border-radius:14px;overflow:hidden;border:1px solid #1f2937;box-shadow:0 20px 45px rgba(0,0,0,0.45);">
      <div style="padding:18px 20px;background:linear-gradient(135deg,${accent},#111827);border-bottom:1px solid #1f2937;">
        <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#d1d5db;">FutureME AI Productivity System</div>
        <h2 style="margin:8px 0 0;font-size:22px;color:#ffffff;">${label}</h2>
      </div>
      <div style="background:#0b1220;padding:22px 20px;">
        <p style="margin:0 0 12px;color:#f3f4f6;">Hi ${username || "Learner"},</p>
        <p style="margin:0 0 16px;color:#d1d5db;line-height:1.6;">${bodyMessage}</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">${extraRows}</table>
        <div style="margin:0 0 10px;color:#9ca3af;">Reinforcement Suggestion</div>
        <div style="padding:12px;border:1px solid #1f2937;border-radius:10px;background:#0f172a;color:#e2e8f0;line-height:1.5;">${suggestion}</div>
      </div>
      <div style="padding:14px 20px;background:#050b18;border-top:1px solid #1f2937;color:#6b7280;font-size:12px;">
        Keep compounding progress. One focused block today is enough to stay ahead.
      </div>
    </div>
  </div>`;
};

const getSubject = ({ type }) => {
  if (type === "task_added") return "?? New Task Added";
  if (type === "task_complete") return "? Task Completed";
  if (type === "skill_added") return "?? New Skill Added";
  if (type === "skill_progress_updated") return "?? Skill Progress Updated";
  if (type === "daily_summary") return "FutureME: Daily Summary";
  if (type === "streak_update") return "?? Streak Updated";
  if (type === "streak_warning") return "FutureME: Streak Warning";
  if (type === "streak_break" || type === "streak_broken") return "FutureME: Streak Broken";
  if (type === "level_up") return "FutureME: Level Up";
  if (type === "roadmap_ready") return "?? New Roadmap Ready";
  return "?? Optimization Applied";
};

const getTransporter = async () => {
  if (transporter) return transporter;

  const nodemailerModule = await import("nodemailer").catch(() => null);
  if (!nodemailerModule?.default) return null;

  const config = getTransportConfig();
  transporter = nodemailerModule.default.createTransport(
    config.host
      ? config
      : {
          service: getEnv("EMAIL_SERVICE", "SMTP_SERVICE") || "gmail",
          auth: config.auth,
        }
  );

  return transporter;
};

export const initEmailServiceHealth = async () => {
  try {
    const emailUser = getEnv("EMAIL_USER", "SMTP_USER");
    const emailPass = getEnv("EMAIL_PASS", "SMTP_PASS");

    if (!emailUser || !emailPass) {
      console.warn("Email config warning: EMAIL_USER or EMAIL_PASS missing. Email delivery disabled.");
      return { verified: false, reason: "credentials_missing" };
    }

    const tx = await getTransporter();
    if (!tx) {
      console.warn("Email server verification failed: nodemailer unavailable.");
      return { verified: false, reason: "nodemailer_unavailable" };
    }

    if (!transportInitialized) {
      await tx.verify();
      transportInitialized = true;
      console.log("Email server connected successfully");
    }

    return { verified: true };
  } catch (error) {
    console.warn("Email server verification failed", error?.message || error);
    return { verified: false, reason: "verify_failed" };
  }
};

export const sendProductivityEmail = async ({
  to,
  username,
  type,
  customMessage,
  additionalData = {},
}) => {
  try {
    if (!to || !type || !canEmail()) {
      return { sent: false, reason: "email_not_configured_or_missing_data" };
    }

    const policy = shouldSendByPolicy({ to, type, additionalData });
    if (!policy.allow) return { sent: false, reason: policy.reason };

    const eventKey =
      additionalData.eventKey ||
      additionalData.taskId ||
      additionalData.dayKey ||
      `${new Date().getUTCFullYear()}-${new Date().getUTCMonth()}-${new Date().getUTCDate()}`;

    if (
      !shouldSendByCooldown({
        to,
        type,
        eventKey,
        cooldownMs: Number(additionalData.cooldownMs || 60 * 60 * 1000),
      })
    ) {
      return { sent: false, reason: "cooldown_blocked" };
    }

    const tx = await getTransporter();
    if (!tx) {
      return { sent: false, reason: "nodemailer_unavailable" };
    }

    const subject = getSubject({ type });
    const html = buildHtmlTemplate({ username, type, customMessage, additionalData });

    await tx.sendMail({
      from: `${getEnv("EMAIL_FROM_NAME") || "FutureME"} <${
        getEnv("EMAIL_USER", "SMTP_USER") || "no-reply@futureme.local"
      }>`,
      to,
      subject,
      html,
    });

    return { sent: true };
  } catch (error) {
    console.error("Email send failed:", error?.message || error);
    return { sent: false, reason: "send_failed" };
  }
};
