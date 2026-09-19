const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatDate = (value) => {
  if (!value) {
    return "To be announced";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "To be announced";
  }

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const formatTime = (value) => {
  if (!value) {
    return "Time to be announced";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time to be announced";
  }

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const formatCurrency = (
  amountInCentavos,
  currency = "PHP",
) => {
  const amount =
    Number(amountInCentavos ?? 0) / 100;

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
  }).format(amount);
};

const buildSessionText = (session) => {
  const lines = [
    session.title,
    `${formatDate(session.startTime)} · ${formatTime(
      session.startTime,
    )}–${formatTime(session.endTime)}`,
  ];

  if (session.venue) {
    lines.push(session.venue);
  }

  return lines.join("\n");
};

const buildSessionHtml = (session) => `
  <div
    style="
      margin-bottom: 12px;
      padding: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: #ffffff;
    "
  >
    <p
      style="
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: #0f172a;
      "
    >
      ${escapeHtml(session.title)}
    </p>

    <p
      style="
        margin: 6px 0 0;
        font-size: 14px;
        color: #475569;
      "
    >
      ${escapeHtml(formatDate(session.startTime))}
      ·
      ${escapeHtml(formatTime(session.startTime))}
      –
      ${escapeHtml(formatTime(session.endTime))}
    </p>

    ${
      session.venue
        ? `
          <p
            style="
              margin: 6px 0 0;
              font-size: 14px;
              color: #475569;
            "
          >
            ${escapeHtml(session.venue)}
          </p>
        `
        : ""
    }
  </div>
`;

const createRegistrationConfirmationEmail = ({
  participant,
  event,
  registration,
  payment,
  sessions = [],
  dashboardUrl,
}) => {
  if (!participant?.email) {
    throw new Error(
      "The participant email address is required.",
    );
  }

  if (!event?.title) {
    throw new Error(
      "The event title is required.",
    );
  }

  const participantName =
    participant.name ||
    participant.fullName ||
    "Participant";

  const registrationReference =
    registration.reference ||
    registration.registrationReference ||
    registration._id ||
    "Not available";

  const paymentReference =
    payment?.providerReference ||
    payment?.reference ||
    "Not available";

  const amountPaid = formatCurrency(
    payment?.amountInCentavos,
    payment?.currency,
  );

  const scheduleText =
    sessions.length > 0
      ? sessions
          .map(
            (session, index) =>
              `${index + 1}. ${buildSessionText(
                session,
              )}`,
          )
          .join("\n\n")
      : "Your personal schedule will be available on your dashboard.";

  const scheduleHtml =
    sessions.length > 0
      ? sessions
          .map(buildSessionHtml)
          .join("")
      : `
        <p style="margin: 0; color: #475569;">
          Your personal schedule will be
          available on your dashboard.
        </p>
      `;

  const subject =
    `Registration confirmed: ${event.title}`;

  const text = `
Hello ${participantName},

Your registration for ${event.title} is confirmed.

EVENT DETAILS
Event: ${event.title}
Start date: ${formatDate(event.startDate)}
End date: ${formatDate(event.endDate)}
Venue: ${event.venue || "To be announced"}

REGISTRATION
Status: Confirmed
Registration reference: ${registrationReference}

PAYMENT
Status: Paid
Amount paid: ${amountPaid}
Payment reference: ${paymentReference}

YOUR SCHEDULE
${scheduleText}

View your registration and complete schedule:
${dashboardUrl}

Thank you,
SessionFlow
`.trim();

  const html = `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />

        <title>
          ${escapeHtml(subject)}
        </title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background: #f1f5f9;
          font-family: Arial, Helvetica, sans-serif;
          color: #0f172a;
        "
      >
        <div
          style="
            max-width: 680px;
            margin: 0 auto;
            padding: 32px 16px;
          "
        >
          <div
            style="
              overflow: hidden;
              border: 1px solid #e2e8f0;
              border-radius: 20px;
              background: #ffffff;
            "
          >
            <div
              style="
                padding: 28px;
                background: #1d4ed8;
                color: #ffffff;
              "
            >
              <p
                style="
                  margin: 0 0 8px;
                  font-size: 13px;
                  font-weight: 700;
                  letter-spacing: 0.12em;
                  text-transform: uppercase;
                "
              >
                SessionFlow
              </p>

              <h1
                style="
                  margin: 0;
                  font-size: 28px;
                  line-height: 1.25;
                "
              >
                Registration confirmed
              </h1>
            </div>

            <div style="padding: 28px;">
              <p
                style="
                  margin: 0 0 16px;
                  font-size: 16px;
                  line-height: 1.7;
                "
              >
                Hello
                <strong>
                  ${escapeHtml(participantName)}
                </strong>,
              </p>

              <p
                style="
                  margin: 0 0 24px;
                  font-size: 16px;
                  line-height: 1.7;
                  color: #475569;
                "
              >
                Your registration for
                <strong>
                  ${escapeHtml(event.title)}
                </strong>
                has been confirmed.
              </p>

              <div
                style="
                  margin-bottom: 24px;
                  padding: 20px;
                  border-radius: 14px;
                  background: #eff6ff;
                "
              >
                <h2
                  style="
                    margin: 0 0 12px;
                    font-size: 18px;
                  "
                >
                  Event details
                </h2>

                <p style="margin: 6px 0;">
                  <strong>Event:</strong>
                  ${escapeHtml(event.title)}
                </p>

                <p style="margin: 6px 0;">
                  <strong>Dates:</strong>
                  ${escapeHtml(
                    formatDate(event.startDate),
                  )}
                  –
                  ${escapeHtml(
                    formatDate(event.endDate),
                  )}
                </p>

                <p style="margin: 6px 0;">
                  <strong>Venue:</strong>
                  ${escapeHtml(
                    event.venue ||
                      "To be announced",
                  )}
                </p>
              </div>

              <div
                style="
                  margin-bottom: 24px;
                  display: block;
                "
              >
                <h2
                  style="
                    margin: 0 0 12px;
                    font-size: 18px;
                  "
                >
                  Registration and payment
                </h2>

                <p style="margin: 6px 0;">
                  <strong>Status:</strong>
                  Confirmed
                </p>

                <p style="margin: 6px 0;">
                  <strong>
                    Registration reference:
                  </strong>
                  ${escapeHtml(
                    registrationReference,
                  )}
                </p>

                <p style="margin: 6px 0;">
                  <strong>Amount paid:</strong>
                  ${escapeHtml(amountPaid)}
                </p>

                <p style="margin: 6px 0;">
                  <strong>
                    Payment reference:
                  </strong>
                  ${escapeHtml(paymentReference)}
                </p>
              </div>

              <div style="margin-bottom: 28px;">
                <h2
                  style="
                    margin: 0 0 14px;
                    font-size: 18px;
                  "
                >
                  Your personal schedule
                </h2>

                ${scheduleHtml}
              </div>

              <a
                href="${escapeHtml(dashboardUrl)}"
                style="
                  display: inline-block;
                  padding: 13px 20px;
                  border-radius: 10px;
                  background: #1d4ed8;
                  color: #ffffff;
                  font-size: 15px;
                  font-weight: 700;
                  text-decoration: none;
                "
              >
                View my dashboard
              </a>

              <p
                style="
                  margin: 28px 0 0;
                  font-size: 14px;
                  line-height: 1.6;
                  color: #64748b;
                "
              >
                This is a test-generated
                SessionFlow email. Please do
                not reply to this message.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return {
    to: participant.email,
    subject,
    text,
    html,
  };
};

export default createRegistrationConfirmationEmail;