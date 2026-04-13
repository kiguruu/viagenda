import { expect, test } from "@playwright/test";

test("home page renders the main UI", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Viagenda" })).toBeVisible();
  await expect(page.getByRole("button", { name: "インポート" })).toBeVisible();
  await expect(page.getByRole("button", { name: "JSON出力" })).toBeVisible();
  await expect(page.getByRole("button", { name: "ICS出力" })).toBeVisible();
  await expect(page.getByRole("button", { name: "予定を追加" })).toBeVisible();
});

test("invalid json import shows an in-page notice", async ({ page }) => {
  await page.goto("/");

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "インポート" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles("e2e/fixtures/invalid-events.json");

  await expect(
    page.getByText("不正なイベントデータです。JSON形式と日時の内容を確認してください。"),
  ).toBeVisible();
});

test("saved valid data shows the restore dialog on load", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "travel-events",
      JSON.stringify([
        {
          id: "event-restore-001",
          title: "保存済みの予定",
          start: "2026-05-01T10:00:00",
          end: "2026-05-01T11:00:00",
          description: "E2E test fixture",
          location: "Tokyo",
        },
      ]),
    );
  });

  await page.goto("/");

  await expect(page.getByText("保存されたデータの読み込み")).toBeVisible();
  await expect(page.getByRole("button", { name: "はい、読み込む" })).toBeVisible();
});
