"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { StoredDataResult, useLocalStorage } from "@/hooks/useLocalStorage";
import { TravelEvent } from "@/types/event";
import { EventDropArg, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { EventResizeDoneArg } from "@fullcalendar/interaction";
import { EventModal } from "@/components/EventModal";
import { Button } from "@/components/ui/button";
import { DownloadIcon, UploadIcon, PlusIcon, CalendarIcon, TrashIcon, SunIcon, MoonIcon, AlertTriangleIcon, XIcon } from "lucide-react";
import { useTheme } from "next-themes";
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
import { parseTravelEvents } from "@/lib/event-schema";
import { updateEventSchedule } from "@/lib/event-updates";
import { validateEventsForExport } from "@/lib/event-export";

// 初期のチュートリアル用日程を生成する関数
const getInitialEvents = (): TravelEvent[] => {
  const today = dayjs().format("YYYY-MM-DD");
  const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");

  return [
    {
      id: "tutorial-001",
      title: "Viagendaへようこそ! 👋",
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
      title: "端を伸ばして時間を調整！ 🔽",
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

type Notice = {
  message: string;
  tone: "warning" | "error";
};

type HomePageProps = {
  eventsOverride?: TravelEvent[];
  storedDataOverride?: StoredDataResult<TravelEvent[]>;
};

export function HomePage({ eventsOverride, storedDataOverride }: HomePageProps = {}) {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const initialEvents = useMemo(() => getInitialEvents(), []);
  const [events, setEvents, getStoredData] = useLocalStorage<TravelEvent[]>("travel-events", initialEvents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Partial<TravelEvent> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // localStorage からの読み込み確認用
  const [showLoadConfirm, setShowLoadConfirm] = useState(false);
  const [pendingEvents, setPendingEvents] = useState<TravelEvent[] | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  // 全て削除の確認用
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const showNotice = useCallback((message: string, tone: Notice["tone"] = "error") => {
    setNotice({ message, tone });
  }, []);

  const currentEvents = eventsOverride ?? events;
  const getStoredDataResult = useCallback(
    () => storedDataOverride ?? getStoredData(),
    [storedDataOverride, getStoredData],
  );

  // マウント状態を管理
  useEffect(() => {
    setMounted(true);
  }, []);

  // マウント時に localStorage をチェック
  useEffect(() => {
    const storedData = getStoredDataResult();

    if (storedData.status === "invalid") {
      const timer = setTimeout(() => {
        showNotice("ブラウザに保存されていた日程データの読み込みに失敗したため、保存データを無視しました。必要であれば JSON を見直して再インポートしてください。", "warning");
      }, 0);
      return () => clearTimeout(timer);
    }

    const parsed = parseTravelEvents(storedData.data);

    if (parsed.success) {
      if (parsed.data.length > 0) {
        const timer = setTimeout(() => {
          setPendingEvents(parsed.data);
          setShowLoadConfirm(true);
        }, 0);
        return () => clearTimeout(timer);
      }
      // parsed.success だがデータが空の場合は何もしない
      return;
    }

    if (storedData.status === "valid" && storedData.data !== null && Array.isArray(storedData.data) && storedData.data.length > 0) {
      const timer = setTimeout(() => {
        showNotice("ブラウザに保存されていた日程データに不正な内容が含まれていたため、読み込みをスキップしました。必要であれば JSON を見直して再インポートしてください。", "warning");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [getStoredDataResult, showNotice]);

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

  const handleClearAll = () => {
    setEvents([]);
    setShowClearConfirm(false);
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
    const event = currentEvents.find((e) => e.id === clickInfo.event.id);
    if (event) {
      setSelectedEvent(event);
      setIsModalOpen(true);
    }
  };

  // モーダルからの保存処理
  const handleModalSubmit = useCallback((newEvent: TravelEvent) => {
    const existingIndex = currentEvents.findIndex((e) => e.id === newEvent.id);
    if (existingIndex > -1) {
      const updatedEvents = [...currentEvents];
      updatedEvents[existingIndex] = newEvent;
      setEvents(updatedEvents);
    } else {
      setEvents([...currentEvents, newEvent]);
    }
  }, [currentEvents, setEvents]);

  // 削除処理
  const handleEventDelete = useCallback((id: string) => {
    setEvents(currentEvents.filter((e) => e.id !== id));
  }, [currentEvents, setEvents]);

  // ドラッグ＆ドロップ移動
  const handleEventDrop = (info: EventDropArg) => {
    const updatedEvents = updateEventSchedule(
      currentEvents,
      info.event.id,
      info.event.startStr,
      info.event.endStr || info.event.startStr,
    );

    if (!updatedEvents) {
      info.revert();
      showNotice("予定の更新に失敗しました。日時の内容を確認してください。");
      return;
    }

    setEvents(updatedEvents);
  };

  // リサイズ
  const handleEventResize = (info: EventResizeDoneArg) => {
    const updatedEvents = updateEventSchedule(
      currentEvents,
      info.event.id,
      info.event.startStr,
      info.event.endStr || info.event.startStr,
    );

    if (!updatedEvents) {
      info.revert();
      showNotice("予定の更新に失敗しました。日時の内容を確認してください。");
      return;
    }

    setEvents(updatedEvents);
  };

  // エクスポート (JSON)
  const handleExportJSON = () => {
    const validatedEvents = validateEventsForExport(currentEvents);
    if (!validatedEvents) {
      showNotice("不正なイベントデータが含まれているため、JSON出力を中止しました。");
      return;
    }

    const blob = new Blob([JSON.stringify(validatedEvents, null, 2)], { type: "application/json" });
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
    const validatedEvents = validateEventsForExport(currentEvents);
    if (!validatedEvents) {
      showNotice("不正なイベントデータが含まれているため、ICS出力を中止しました。");
      return;
    }

    const icsEvents: EventAttributes[] = validatedEvents.map((event) => {
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
        showNotice("iCalendar形式の生成に失敗しました。");
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
        const parsed = parseTravelEvents(json);

        if (!parsed.success) {
          showNotice("不正なイベントデータです。JSON形式と日時の内容を確認してください。");
          return;
        }

        setEvents(parsed.data);
      } catch {
        // console.error() を呼ぶとNext.jsの開発サーバーがエラーオーバーレイを表示してしまうため削除
        showNotice("ファイルの読み込みに失敗しました。正しいJSONファイルを選択してください。");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full tabular-nums">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-5xl font-normal tracking-wider text-balance font-[family-name:var(--font-lexend)] bg-gradient-to-r from-sky-500 to-blue-800 bg-clip-text text-transparent py-2">Viagenda</h1>
          <p className="text-muted-foreground mt-1">
            あなただけの旅の予定帳。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full w-8 h-8"
            aria-label={mounted ? (theme === "dark" ? "ライトテーマに切り替え" : "ダークテーマに切り替え") : "テーマ切り替え"}
          >
            <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            <span className="sr-only">テーマ切り替え</span>
          </Button>
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
          <Button variant="destructive" size="sm" onClick={() => setShowClearConfirm(true)}>
            <TrashIcon className="size-4" data-icon="inline-start" />
            全て削除
          </Button>
          <Button size="sm" onClick={handleAddNew}>
            <PlusIcon className="size-4" data-icon="inline-start" />
            予定を追加
          </Button>
        </div>
      </header>

      {notice && (
        <div
          className={`mb-6 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${
            notice.tone === "warning"
              ? "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100"
              : "border-destructive/30 bg-destructive/10 text-destructive dark:text-destructive"
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
            <p>{notice.message}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 shrink-0 rounded-full ${
              notice.tone === "warning"
                ? "text-amber-900 hover:bg-amber-500/15 hover:text-amber-950 dark:text-amber-100 dark:hover:bg-amber-500/20 dark:hover:text-amber-50"
                : "text-destructive hover:bg-destructive/15 hover:text-destructive dark:text-destructive dark:hover:bg-destructive/20"
            }`}
            onClick={() => setNotice(null)}
          >
            <XIcon className="size-4" />
            <span className="sr-only">通知を閉じる</span>
          </Button>
        </div>
      )}

      <div className="bg-card text-card-foreground rounded-xl shadow-sm border p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          locale="ja"
          events={currentEvents}
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
        <AlertDialogContent className="sm:w-auto w-full flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle>保存されたデータの読み込み</AlertDialogTitle>
            <AlertDialogDescription>
              ブラウザに保存されている旅行日程が見つかりました。このデータを読み込みますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center sm:justify-between gap-4 w-full">
            <AlertDialogAction 
              onClick={handleStartEmpty} 
              variant="destructive"
            >
              空の日程で始める
            </AlertDialogAction>
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

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>すべての予定を削除</AlertDialogTitle>
            <AlertDialogDescription>
              カレンダー上のすべての予定を削除します。この操作は取り消せません。本当によろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearAll} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

export default function Home() {
  return <HomePage />;
}
