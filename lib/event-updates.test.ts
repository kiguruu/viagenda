import { describe, expect, test } from "bun:test";
import { updateEventSchedule } from "./event-updates";

const baseEvents = [
  {
    id: "event-001",
    title: "札幌駅到着",
    start: "2026-05-01T10:00:00",
    end: "2026-05-01T10:30:00",
    description: "快速エアポートで到着",
    location: "札幌駅",
  },
];

describe("updateEventSchedule", () => {
  test("正しい日時更新を適用できること", () => {
    const result = updateEventSchedule(
      baseEvents,
      "event-001",
      "2026-05-01T11:00:00",
      "2026-05-01T11:30:00",
    );

    expect(result).not.toBeNull();
    expect(result?.[0]?.start).toBe("2026-05-01T11:00:00");
    expect(result?.[0]?.end).toBe("2026-05-01T11:30:00");
  });

  test("終了日時が開始日時より前の更新を拒否すること", () => {
    const result = updateEventSchedule(
      baseEvents,
      "event-001",
      "2026-05-01T12:00:00",
      "2026-05-01T10:00:00",
    );

    expect(result).toBeNull();
  });
});
