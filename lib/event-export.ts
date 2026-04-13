import { TravelEvent } from "@/types/event";
import { parseTravelEvents } from "@/lib/event-schema";

export function validateEventsForExport(events: TravelEvent[]) {
  const parsed = parseTravelEvents(events);
  return parsed.success ? parsed.data : null;
}
