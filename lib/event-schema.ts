import dayjs from "dayjs";
import { z } from "zod";

const dateTimeStringSchema = z.string().refine(
  (value) => dayjs(value).isValid(),
  "有効な日時を指定してください",
);

const travelEventBaseSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  start: dateTimeStringSchema,
  end: dateTimeStringSchema,
  description: z.string().optional(),
  location: z.string().optional(),
});

export const travelEventFormSchema = travelEventBaseSchema.refine(
  (event) => dayjs(event.end).isSame(dayjs(event.start)) || dayjs(event.end).isAfter(dayjs(event.start)),
  {
    message: "終了日時は開始日時以降にしてください",
    path: ["end"],
  },
);

export const travelEventSchema = travelEventBaseSchema.extend({
  id: z.string().min(1, "IDが必要です"),
}).refine(
  (event) => dayjs(event.end).isSame(dayjs(event.start)) || dayjs(event.end).isAfter(dayjs(event.start)),
  {
    message: "終了日時は開始日時以降にしてください",
    path: ["end"],
  },
);

export const travelEventsSchema = z.array(travelEventSchema);

export function parseTravelEvents(data: unknown) {
  return travelEventsSchema.safeParse(data);
}
