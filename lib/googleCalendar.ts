import { google } from "googleapis";

// ID del calendario (el tuyo)
export const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID!;

// Cliente autenticado
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

// Exportamos el cliente de Calendar
export const calendar = google.calendar({
  version: "v3",
  auth,
});
