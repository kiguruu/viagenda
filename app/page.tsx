"use client";

import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { TravelEvent } from "@/types/event";
import { EventDropArg } from "@fullcalendar/interaction";
import { EventResizeDoneArg } from "@fullcalendar/interaction";

const INITIAL_EVENTS: TravelEvent[] = [
  {
    id: "event-001",
    title: "札幌駅到着",
    start: "2026-05-01T10:00:00",
    end: "2026-05-01T10:30:00",
    description: "快速エアポートで到着",
    location: "札幌駅"
  },
  {
    id: "event-002",
    title: "余市蒸溜所見学",
    start: "2026-05-02T13:00:00",
    end: "2026-05-02T15:00:00",
    description: "試飲あり。事前に予約チケットの確認。",
    location: "ニッカウヰスキー 北海道工場 余市蒸溜所"
  }
];

export default function Home() {
  const [events, setEvents] = useLocalStorage<TravelEvent[]>("travel-events", INITIAL_EVENTS);

  // イベントがドラッグで移動された時の処理
  const handleEventDrop = (info: EventDropArg) => {
    const updatedEvents = events.map((event) => {
      if (event.id === info.event.id) {
        return {
          ...event,
          start: info.event.startStr,
          end: info.event.endStr || info.event.startStr, // endがない場合はstartと同じにする
        };
      }
      return event;
    });
    setEvents(updatedEvents);
  };

  // イベントの時間が変更（リサイズ）された時の処理
  const handleEventResize = (info: EventResizeDoneArg) => {
    const updatedEvents = events.map((event) => {
      if (event.id === info.event.id) {
        return {
          ...event,
          start: info.event.startStr,
          end: info.event.endStr || info.event.startStr,
        };
      }
      return event;
    });
    setEvents(updatedEvents);
  };

  return (
    <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full text-slate-900">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Viagenda</h1>
        <p className="text-muted-foreground mt-2">
          旅行の日程を直感的に管理しましょう。
        </p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          initialDate="2026-05-01"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          locale="ja"
          events={events}
          height="auto"
          stickyHeaderDates={true}
          nowIndicator={true}
          editable={true}
          selectable={true}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
        />
      </div>
    </main>
  );
}
