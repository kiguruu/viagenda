import { describe, expect, test } from "bun:test";
import { parseTravelEvents } from "./event-schema";

describe("parseTravelEvents", () => {
  test("正しいイベント配列を受け入れること", () => {
    const result = parseTravelEvents([
      {
        id: "event-001",
        title: "札幌駅到着",
        start: "2026-05-01T10:00:00",
        end: "2026-05-01T10:30:00",
        description: "快速エアポートで到着",
        location: "札幌駅",
      },
    ]);

    expect(result.success).toBe(true);
  });

  test("必須項目が欠けた配列を拒否すること", () => {
    const result = parseTravelEvents([
      {
        title: "IDなしの予定",
        start: "2026-05-01T10:00:00",
        end: "2026-05-01T10:30:00",
      },
    ]);

    expect(result.success).toBe(false);
  });

  test("終了日時が開始日時より前の配列を拒否すること", () => {
    const result = parseTravelEvents([
      {
        id: "event-002",
        title: "逆転した予定",
        start: "2026-05-01T12:00:00",
        end: "2026-05-01T10:00:00",
      },
    ]);

    expect(result.success).toBe(false);
  });
});
