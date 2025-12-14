import { calendar, CALENDAR_ID } from "@/lib/googleCalendar";

export async function createAppointmentEvent({
  title,
  start,
  end,
  specialist,
}: {
  title: string;
  start: string;
  end: string;
  specialist: string;
}) {
  const res = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      summary: title,
      description: `Especialista: ${specialist}`,
      start: {
        dateTime: start,
        timeZone: "America/Bogota",
      },
      end: {
        dateTime: end,
        timeZone: "America/Bogota",
      },
    },
  });

  return res.data.id!;
}
