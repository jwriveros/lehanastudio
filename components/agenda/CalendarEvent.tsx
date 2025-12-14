import moment from "moment";
import { CalendarAppointment } from "./CalendarSection";

export default function CalendarEvent({
  event,
}: {
  event: CalendarAppointment;
}) {
  const { raw, start, end } = event;

  return (
    <div className="calendar-event">
      <div className="calendar-event-time">
        {moment(start).format("HH:mm")} – {moment(end).format("HH:mm")}
      </div>

      <div className="calendar-event-title">
        {raw.servicio}
      </div>

      <div className="calendar-event-client">
        {raw.cliente}
      </div>
    </div>
  );
}
