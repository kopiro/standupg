import fastify from "fastify";
import { google, calendar_v3 } from "googleapis";
import fs from "fs";
import path from "path";
import { todayStart, todayEnd, tomorrowStart, tomorrowEnd } from ".";

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

const getDescription = ({ description }: calendar_v3.Schema$Event) => {
  return (
    description &&
    description.length < 200 &&
    `(${description.replace(/- /g, "")})` // Remove any bullet point
  );
};

const attendeesAliases = process.env.CALENDAR_ALIASES
  ? JSON.parse(process.env.CALENDAR_ALIASES)
  : {};

const getAttendees = ({ attendees }: calendar_v3.Schema$Event) => {
  const filteredAttendees = (attendees || [])
    .filter((att) => att.responseStatus === "accepted")
    .filter((att) => att.email !== process.env.GOOGLE_EMAIL);
  return (
    filteredAttendees &&
    filteredAttendees.length > 0 &&
    filteredAttendees.length <=
      Number(process.env.CALENDAR_MAX_ATTENDEES_SHOWN) &&
    `(with ${filteredAttendees
      .map((att) => {
        const username = att.email?.split("@")[0]!;
        return attendeesAliases[username] || username;
      })
      .join(", ")})`
  );
};

const getCalendar = () => {
  if (!fs.existsSync(secretFile)) {
    return null;
  }

  const tokens = JSON.parse(fs.readFileSync(secretFile, "utf8"));

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
  );
  auth.setCredentials(tokens);

  return google.calendar({ version: "v3", auth });
};

const eventsBuilder = (items: calendar_v3.Schema$Event[] = []) => {
  return items
    .filter((event) => event.status === "confirmed")
    .filter(
      (event) =>
        event.attendees?.find((att) => att.email === process.env.GOOGLE_EMAIL)
          ?.responseStatus === "accepted"
    )
    .filter((event) => !/standup/i.test(event.summary!))
    .map((event) => {
      return [`- ${event.summary}`, getDescription(event), getAttendees(event)]
        .filter(Boolean)
        .join(" ");
    })
    .join("\n");
};

export async function main() {
  const calendar = getCalendar();
  if (!calendar) {
    return "";
  }

  const { data } = await calendar.events.list({
    calendarId: "primary",
    timeMin: todayStart.toISOString(),
    timeMax: todayEnd.toISOString(),
    maxResults: 100,
    singleEvents: true,
    orderBy: "startTime",
  });

  return `*Meetings:*\n${eventsBuilder(data.items)}`;
}

export async function next() {
  const calendar = getCalendar();
  if (!calendar) {
    return "";
  }

  const { data } = await calendar.events.list({
    calendarId: "primary",
    timeMin: tomorrowStart.toISOString(),
    timeMax: tomorrowEnd.toISOString(),
    maxResults: 100,
    singleEvents: true,
    orderBy: "startTime",
  });

  return eventsBuilder(data.items);
}
