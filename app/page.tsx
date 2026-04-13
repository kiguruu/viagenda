"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { TravelEvent } from "@/types/event";
import { EventDropArg, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { EventResizeDoneArg } from "@fullcalendar/interaction";
import { EventModal } from "@/components/EventModal";
import { Button } from "@/components/ui/button";
import { DownloadIcon, UploadIcon, PlusIcon, CalendarIcon } from "lucide-react";
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
import { createEvents, EventAttributes } from "ics";
import dayjs from "dayjs";

// 初期のチュートリアル用日程を生成する関数
const getInitialEvents = (): TravelEvent[] => {
  const today = dayjs().format("YYYY-MM-DD");
  const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");

  return [
    {
      id: "tutorial-001",
      title: "Viagendaへようこそ！ 👋",
      start: `${today}T09:00:00`,
      end: `${today}T10:00:00`,
      description: "これは旅行日程を管理するアプリです。直感的に予定を操作できます！",
      location: "はじまりの場所"
    },
    {
      id: "tutorial-002",
      title: "予定をドラッグして移動してみてね 🎯",
      start: `${today}T11:00:00`,
      end: `${today}T12:30:00`,
      description: "マウスで掴んで、好きな時間に移動させてみましょう。",
    },
    {
      id: "tutorial-003",
      title: "端を伸ばして時間を調整！ ↔️",
      start: `${today}T14:00:00`,
      end: `${today}T16:00:00`,
      description: "予定の下端をドラッグすると、長さを変更できます。",
    },
    {
      id: "tutorial-004",
      title: "クリックして詳細を編集 or 削除 📝",
      start: `${tomorrow}T10:00:00`,
      end: `${tomorrow}T12:00:00`,
      description: "予定をクリックすると、この説明文や場所を書き換えることができます。",
      location: "編集モーダルの中"
    }
  ];
};

export default function Home() {
  const initialEvents = useMemo(() => getInitialEvents(), []);
  const [events, setEvents, getStoredData] = useLocalStorage<TravelEvent[]>("travel-events", initialEvents);
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
      const timer = setTimeout(() => {
        setPendingEvents(data);
        setShowLoadConfirm(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [getStoredData]);

  const handleConfirmLoad = () => {
    if (pendingEvents) {
      setEvents(pendingEvents);
    }
    setShowLoadConfirm(false);
  };

  const handleStartWithTutorial = () => {
    setEvents(initialEvents);
    setShowLoadConfirm(false);
  };

  const handleStartEmpty = () => {
    setEvents([]);
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
  const handleModalSubmit = useCallback((newEvent: TravelEvent) => {
    const existingIndex = events.findIndex((e) => e.id === newEvent.id);
    if (existingIndex > -1) {
      const updatedEvents = [...events];
      updatedEvents[existingIndex] = newEvent;
      setEvents(updatedEvents);
    } else {
      setEvents([...events, newEvent]);
    }
  }, [events, setEvents]);

  // 削除処理
  const handleEventDelete = useCallback((id: string) => {
    setEvents(events.filter((e) => e.id !== id));
  }, [events, setEvents]);

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
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `viagenda-export-${dayjs().format("YYYY-MM-DD")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // エクスポート (.ics)
  const handleExportICS = () => {
    const icsEvents: EventAttributes[] = events.map((event) => {
      const start = new Date(event.start);
      const end = new Date(event.end);

      return {
        title: event.title,
        description: event.description,
        location: event.location,
        start: [
          start.getFullYear(),
          start.getMonth() + 1,
          start.getDate(),
          start.getHours(),
          start.getMinutes(),
        ],
        end: [
          end.getFullYear(),
          end.getMonth() + 1,
          end.getDate(),
          end.getHours(),
          end.getMinutes(),
        ],
      };
    });

    createEvents(icsEvents, (error, value) => {
      if (error) {
        console.error(error);
        alert("iCalendar形式の生成に失敗しました。");
        return;
      }

      const blob = new Blob([value], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `viagenda-itinerary-${dayjs().format("YYYY-MM-DD")}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
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
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <DownloadIcon className="size-4" data-icon="inline-start" />
              JSON出力
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportICS}>
              <CalendarIcon className="size-4" data-icon="inline-start" />
              ICS出力
            </Button>
          </div>
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
        <AlertDialogContent className="bg-white text-slate-900 sm:w-auto w-full flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle>保存されたデータの読み込み</AlertDialogTitle>
            <AlertDialogDescription>
              ブラウザに保存されている旅行日程が見つかりました。このデータを読み込みますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center sm:justify-between gap-4 w-full">
            <AlertDialogCancel 
              onClick={handleStartEmpty} 
              className="border-destructive/20 text-destructive hover:bg-destructive/10 m-0"
            >
              空の日程で始める
            </AlertDialogCancel>
            <div className="flex flex-col sm:flex-row gap-2">
              <AlertDialogAction 
                onClick={handleStartWithTutorial} 
                variant="outline"
              >
                チュートリアルを表示
              </AlertDialogAction>
              <AlertDialogAction 
                onClick={handleConfirmLoad}
              >
                はい、読み込む
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
