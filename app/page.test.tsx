import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TravelEvent } from "@/types/event";
import type { StoredDataResult } from "@/hooks/useLocalStorage";

mock.module("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: () => {} }),
}));

mock.module("@fullcalendar/react", () => ({
  __esModule: true,
  default: ({ events }: { events: unknown[] }) => <div data-testid="calendar">events:{events.length}</div>,
}));

const { HomePage } = await import("./page");

class MockFileReader {
  onload: ((event: { target: { result: string } }) => void) | null = null;
  #result: string;

  constructor(result: string) {
    this.#result = result;
  }

  readAsText() {
    this.onload?.({ target: { result: this.#result } });
  }
}

describe("Home page integration", () => {
  const originalFileReader = globalThis.FileReader;

  beforeEach(() => {
    window.localStorage.clear();
    cleanup();
  });

  afterEach(() => {
    globalThis.FileReader = originalFileReader;
    cleanup();
  });

  test("壊れた localStorage データがあると警告通知を表示すること", async () => {
    const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
    window.localStorage.setItem("travel-events", "{broken-json");

    render(<HomePage />);

    await waitFor(() => {
      expect(
        screen.getByText("ブラウザに保存されていた日程データの読み込みに失敗したため、保存データを無視しました。必要であれば JSON を見直して再インポートしてください。"),
      ).toBeTruthy();
    });

    consoleSpy.mockRestore();
  });

  test("構造不正な保存データは読み込まず警告通知を表示すること", async () => {
    window.localStorage.setItem(
      "travel-events",
      JSON.stringify([
        {
          id: "bad-event",
          title: "逆転した予定",
          start: "2026-05-01T12:00:00",
          end: "2026-05-01T10:00:00",
        },
      ]),
    );

    render(<HomePage />);

    await waitFor(() => {
      expect(
        screen.getByText("ブラウザに保存されていた日程データに不正な内容が含まれていたため、読み込みをスキップしました。必要であれば JSON を見直して再インポートしてください。"),
      ).toBeTruthy();
    });
  });

  test("不正な JSON インポートで通知を表示すること", async () => {
    const user = userEvent.setup();
    const invalidJson = JSON.stringify([
      {
        id: "bad-event",
        title: "逆転した予定",
        start: "2026-05-01T12:00:00",
        end: "2026-05-01T10:00:00",
      },
    ]);
    globalThis.FileReader = class extends MockFileReader {
      constructor() {
        super(invalidJson);
      }
    } as typeof FileReader;

    render(<HomePage />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["placeholder"], "invalid.json", { type: "application/json" });
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText("不正なイベントデータです。JSON形式と日時の内容を確認してください。")).toBeTruthy();
    });
  });

  test("通知バナーを閉じられること", async () => {
    const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    window.localStorage.setItem("travel-events", "{broken-json");

    render(<HomePage />);

    const closeButton = await screen.findByRole("button", { name: "通知を閉じる" });
    await user.click(closeButton);

    await waitFor(() => {
      expect(
        screen.queryByText("ブラウザに保存されていた日程データの読み込みに失敗したため、保存データを無視しました。必要であれば JSON を見直して再インポートしてください。"),
      ).toBeNull();
    });

    consoleSpy.mockRestore();
  });

  test("保存済みの正常データがあると読み込み確認ダイアログを表示すること", async () => {
    const storedEvents: TravelEvent[] = [
      {
        id: "event-001",
        title: "保存済みの予定",
        start: "2026-05-01T10:00:00",
        end: "2026-05-01T11:00:00",
      },
    ];
    const storedDataOverride: StoredDataResult<TravelEvent[]> = {
      status: "valid",
      data: storedEvents,
    };

    render(<HomePage storedDataOverride={storedDataOverride} />);

    await waitFor(() => {
      expect(screen.getByText("保存されたデータの読み込み")).toBeTruthy();
      expect(screen.getByText("はい、読み込む")).toBeTruthy();
    });
  });

  test("JSON 出力前バリデーションに失敗したら通知してダウンロードしないこと", async () => {
    const user = userEvent.setup();
    const createObjectURL = mock(() => "blob:test");
    const originalCreateObjectURL = URL.createObjectURL;
    const invalidEvents: TravelEvent[] = [
      {
        id: "event-001",
        title: "逆転した予定",
        start: "2026-05-01T12:00:00",
        end: "2026-05-01T10:00:00",
      },
    ];
    URL.createObjectURL = createObjectURL;

    render(<HomePage eventsOverride={invalidEvents} />);
    await user.click(screen.getByRole("button", { name: "JSON出力" }));

    await waitFor(() => {
      expect(screen.getByText("不正なイベントデータが含まれているため、JSON出力を中止しました。")).toBeTruthy();
      expect(createObjectURL).not.toHaveBeenCalled();
    });

    URL.createObjectURL = originalCreateObjectURL;
  });

  test("ICS 出力前バリデーションに失敗したら通知してダウンロードしないこと", async () => {
    const user = userEvent.setup();
    const createObjectURL = mock(() => "blob:test");
    const originalCreateObjectURL = URL.createObjectURL;
    const invalidEvents: TravelEvent[] = [
      {
        id: "event-001",
        title: "逆転した予定",
        start: "2026-05-01T12:00:00",
        end: "2026-05-01T10:00:00",
      },
    ];
    URL.createObjectURL = createObjectURL;

    render(<HomePage eventsOverride={invalidEvents} />);
    await user.click(screen.getByRole("button", { name: "ICS出力" }));

    await waitFor(() => {
      expect(screen.getByText("不正なイベントデータが含まれているため、ICS出力を中止しました。")).toBeTruthy();
      expect(createObjectURL).not.toHaveBeenCalled();
    });

    URL.createObjectURL = originalCreateObjectURL;
  });
});
