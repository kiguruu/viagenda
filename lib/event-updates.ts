import { TravelEvent } from "@/types/event";
import { travelEventsSchema } from "@/lib/event-schema";

export function updateEventSchedule(
  events: TravelEvent[],
  eventId: string,
  start: string,
  end: string,
) {
  const updatedEvents = events.map((event) => {
    if (event.id !== eventId) {
      return event;
    }

    return {
      ...event,
      start,
      end,
    };
  });

  const parsed = travelEventsSchema.safeParse(updatedEvents);
  return parsed.success ? parsed.data : null;
}
