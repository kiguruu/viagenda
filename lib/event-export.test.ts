import { describe, expect, test } from "bun:test";
import { validateEventsForExport } from "./event-export";

describe("validateEventsForExport", () => {
  test("正しいイベント配列ならそのまま返すこと", () => {
    const events = [
      {
        id: "event-001",
        title: "札幌駅到着",
        start: "2026-05-01T10:00:00",
        end: "2026-05-01T10:30:00",
        description: "快速エアポートで到着",
        location: "札幌駅",
      },
    ];

    expect(validateEventsForExport(events)).toEqual(events);
  });

  test("不正なイベント配列なら null を返すこと", () => {
    const events = [
      {
        id: "event-001",
        title: "逆転した予定",
        start: "2026-05-01T12:00:00",
        end: "2026-05-01T10:00:00",
      },
    ];

    expect(validateEventsForExport(events)).toBeNull();
  });
});
