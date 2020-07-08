import fastify from "fastify";
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { today, todayEnd } from ".";

const PORT = 8080;
const ROUTE = "/oauth_redirect";
const secretFile = path.join(".secrets", "calendar.json");

if (!fs.existsSync(secretFile)) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `http://localhost:${PORT}${ROUTE}`
  );

  const scopes = ["https://www.googleapis.com/auth/calendar.events.readonly"];

  const server = fastify();

  server.get(ROUTE, async (request, reply) => {
    const { tokens } = await oauth2Client.getToken(
      (request.query as Record<string, string>).code as string
    );
    fs.writeFileSync(secretFile, JSON.stringify(tokens));
    reply.send("OK");
  });

  // Run the server!
  server.listen(PORT, "0.0.0.0");

  const url = oauth2Client.generateAuthUrl({
    prompt: "consent",
    access_type: "offline",
    scope: scopes,
  });
  console.log(`Please configure Google Calendar integration: ${url}`);
}

export default async function () {
  if (!fs.existsSync(secretFile)) {
    return "";
  }

  const tokens = JSON.parse(fs.readFileSync(secretFile, "utf8"));

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
  );
  auth.setCredentials(tokens);

  const calendar = google.calendar({ version: "v3", auth });
  const { data } = await calendar.events.list({
    calendarId: "primary",
    timeMin: today.toISOString(),
    timeMax: todayEnd.toISOString(),
    maxResults: 100,
    singleEvents: true,
    orderBy: "startTime",
  });

  const list = (data.items || [])
    .filter((event) => event.status === "confirmed")
    .filter(
      (event) =>
        event.attendees?.find((att) => att.email === process.env.GOOGLE_EMAIL)
          ?.responseStatus === "accepted"
    )
    .filter((event) => !/standup/i.test(event.summary!))
    .map((event) => {
      const attendees = (event.attendees || [])
        .filter((att) => att.responseStatus === "accepted")
        .filter((att) => att.email !== process.env.GOOGLE_EMAIL);

      return [
        `- ${event.summary}`,
        attendees.length > 0 &&
          attendees.length <=
            Number(process.env.CALENDAR_MAX_ATTENDEES_SHOWN) &&
          ` (with ${attendees
            .map((att) => att.email?.split("@")[0])
            .join(", ")})`,
      ]
        .filter(Boolean)
        .join("");
    })
    .join("\n");

  return `*Meetings:*\n${list}`;
}
