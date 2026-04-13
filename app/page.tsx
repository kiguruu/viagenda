"use client";

import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { TravelEvent } from "@/types/event";
import { EventDropArg, DateSelectArg, EventClickArg, EventResizeDoneArg } from "@fullcalendar/core";
import { EventModal } from "@/components/EventModal";
import { Button } from "@/components/ui/button";
import { DownloadIcon, UploadIcon, PlusIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [events, setEvents, getStoredData] = useLocalStorage<TravelEvent[]>("travel-events", INITIAL_EVENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Partial<TravelEvent> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // localStorage からの読み込み確認用
  const [showLoadConfirm, setShowLoadConfirm] = useState(false);
  const [pendingEvents, setPendingEvents] = useState<TravelEvent[] | null>(null);

  // マウント時に localStorage をチェック
  useEffect(() => {
    const data = getStoredData();
    if (data && data.length > 0) {
      setPendingEvents(data);
      setShowLoadConfirm(true);
    }
  }, []);

  const handleConfirmLoad = () => {
    if (pendingEvents) {
      setEvents(pendingEvents);
    }
    setShowLoadConfirm(false);
  };

  const handleDiscardLoad = () => {
    setShowLoadConfirm(false);
  };

  // 新規追加ボタン用
  const handleAddNew = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  // カレンダーの空き枠をクリック/ドラッグした時
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedEvent({
      start: selectInfo.startStr,
      end: selectInfo.endStr,
    });
    setIsModalOpen(true);
  };

  // 既存のイベントをクリックした時
  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = events.find((e) => e.id === clickInfo.event.id);
    if (event) {
      setSelectedEvent(event);
      setIsModalOpen(true);
    }
  };

  // モーダルからの保存処理
  const handleModalSubmit = (newEvent: TravelEvent) => {
    const existingIndex = events.findIndex((e) => e.id === newEvent.id);
    if (existingIndex > -1) {
      const updatedEvents = [...events];
      updatedEvents[existingIndex] = newEvent;
      setEvents(updatedEvents);
    } else {
      setEvents([...events, newEvent]);
    }
  };

  // 削除処理
  const handleEventDelete = (id: string) => {
    setEvents(events.filter((e) => e.id !== id));
  };

  // ドラッグ＆ドロップ移動
  const handleEventDrop = (info: EventDropArg) => {
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

  // リサイズ
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

  // エクスポート (JSON)
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `viagenda-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // インポート (JSON)
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          setEvents(json);
        } else {
          alert("不正なファイル形式です。");
        }
      } catch (error) {
        console.error(error);
        alert("ファイルの読み込みに失敗しました。");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full text-slate-900">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Viagenda</h1>
          <p className="text-muted-foreground mt-1">
            旅行の日程を直感的に管理しましょう。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleImport}
          />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <UploadIcon className="size-4" data-icon="inline-start" />
            インポート
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <DownloadIcon className="size-4" data-icon="inline-start" />
            エクスポート
          </Button>
          <Button size="sm" onClick={handleAddNew}>
            <PlusIcon className="size-4" data-icon="inline-start" />
            予定を追加
          </Button>
        </div>
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
          selectMirror={true}
          dayMaxEvents={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
        />
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        onDelete={handleEventDelete}
        initialEvent={selectedEvent}
      />

      <AlertDialog open={showLoadConfirm} onOpenChange={setShowLoadConfirm}>
        <AlertDialogContent className="bg-white text-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle>保存されたデータの読み込み</AlertDialogTitle>
            <AlertDialogDescription>
              ブラウザに保存されている旅行日程が見つかりました。このデータを読み込みますか？
              「いいえ」を選択すると、初期データから開始します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardLoad}>いいえ、新しい日程から始める</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLoad}>はい、読み込む</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
