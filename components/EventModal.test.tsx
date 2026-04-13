import { expect, test, describe, mock, beforeEach, afterEach } from "bun:test";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventModal } from "./EventModal";
import { TravelEvent } from "@/types/event";

describe("EventModal", () => {
  const mockOnClose = mock(() => {});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const mockOnSubmit = mock((_event: TravelEvent) => {});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const mockOnDelete = mock((_id: string) => {});

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSubmit.mockClear();
    mockOnDelete.mockClear();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    cleanup();
  });

  const renderModal = (props = {}) => {
    return render(
      <EventModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        onDelete={mockOnDelete}
        {...props}
      />
    );
  };

  test("新しい予定を追加するための入力フォームが表示されること", () => {
    renderModal();
    
    expect(screen.getByText("新しい予定を追加")).toBeTruthy();
    expect(screen.getByLabelText("タイトル")).toBeTruthy();
    expect(screen.getByLabelText("開始日時")).toBeTruthy();
    expect(screen.getByLabelText("終了日時")).toBeTruthy();
    expect(screen.getByLabelText("場所")).toBeTruthy();
    expect(screen.getByLabelText("詳細")).toBeTruthy();
  });

  test("フォームを正しく入力して保存すると onSubmit が呼ばれること", async () => {
    const user = userEvent.setup();
    renderModal();

    // 入力
    await user.type(screen.getByLabelText("タイトル"), "テスト旅行");
    
    // 開始日時の入力
    const startInput = screen.getByLabelText("開始日時");
    fireEvent.change(startInput, { target: { value: "2026-05-01T10:00" } });
    
    // 終了日時の入力
    const endInput = screen.getByLabelText("終了日時");
    fireEvent.change(endInput, { target: { value: "2026-05-01T12:00" } });

    // 保存ボタンクリック
    const saveButton = screen.getByRole("button", { name: "保存" });
    await user.click(saveButton);

    // onSubmit が呼ばれたか確認
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
      const submittedEvent = mockOnSubmit.mock.calls[0][0] as TravelEvent;
      expect(submittedEvent.title).toBe("テスト旅行");
      expect(submittedEvent.start).toBe("2026-05-01T10:00");
    });
  });

  test("既存のイベントがある場合、編集タイトルが表示され削除ボタンが存在すること", () => {
    const initialEvent = {
      id: "event-123",
      title: "既存の予定",
      start: "2026-05-01T10:00:00",
      end: "2026-05-01T12:00:00",
    };

    renderModal({ initialEvent });

    expect(screen.getByText("予定を編集")).toBeTruthy();
    expect(screen.getByDisplayValue("既存の予定")).toBeTruthy();
    expect(screen.getByRole("button", { name: "削除" })).toBeTruthy();
  });

  test("削除ボタンをクリックすると onDelete が呼ばれること", async () => {
    const initialEvent = {
      id: "event-123",
      title: "既存の予定",
      start: "2026-05-01T10:00:00",
      end: "2026-05-01T12:00:00",
    };

    const user = userEvent.setup();
    renderModal({ initialEvent });

    const deleteButton = screen.getByRole("button", { name: "削除" });
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith("event-123");
  });

  test("終了日時が開始日時より前なら保存されずエラーが表示されること", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("タイトル"), "逆転した予定");

    fireEvent.change(screen.getByLabelText("開始日時"), {
      target: { value: "2026-05-01T12:00" },
    });
    fireEvent.change(screen.getByLabelText("終了日時"), {
      target: { value: "2026-05-01T10:00" },
    });

    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(screen.getByText("終了日時は開始日時以降にしてください")).toBeTruthy();
    });
  });
});
