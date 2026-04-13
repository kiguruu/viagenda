"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { TravelEvent } from "@/types/event";
import dayjs from "dayjs";

const formSchema = z.z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  start: z.string().min(1, "開始日時を入力してください"),
  end: z.string().min(1, "終了日時を入力してください"),
  description: z.string().optional(),
  location: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TravelEvent) => void;
  onDelete?: (id: string) => void;
  initialEvent?: Partial<TravelEvent> | null;
}

export function EventModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialEvent,
}: EventModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      start: "",
      end: "",
      description: "",
      location: "",
    },
  });

  useEffect(() => {
    if (initialEvent) {
      reset({
        title: initialEvent.title || "",
        start: initialEvent.start ? dayjs(initialEvent.start).format("YYYY-MM-DDTHH:mm") : "",
        end: initialEvent.end ? dayjs(initialEvent.end).format("YYYY-MM-DDTHH:mm") : "",
        description: initialEvent.description || "",
        location: initialEvent.location || "",
      });
    } else {
      reset({
        title: "",
        start: "",
        end: "",
        description: "",
        location: "",
      });
    }
  }, [initialEvent, reset, isOpen]);

  const handleFormSubmit = (data: FormValues) => {
    // ID生成はイベントハンドラ内で行う（不純な操作でもOK）
    const eventId = initialEvent?.id || crypto.randomUUID();
    
    onSubmit({
      ...data,
      id: eventId,
    } as TravelEvent);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white text-slate-900">
        <DialogHeader>
          <DialogTitle>
            {initialEvent?.id ? "予定を編集" : "新しい予定を追加"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel>タイトル</FieldLabel>
              <Input {...register("title")} placeholder="例: 札幌駅到着" />
              <FieldError errors={[errors.title]} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>開始日時</FieldLabel>
                <Input type="datetime-local" {...register("start")} />
                <FieldError errors={[errors.start]} />
              </Field>
              <Field>
                <FieldLabel>終了日時</FieldLabel>
                <Input type="datetime-local" {...register("end")} />
                <FieldError errors={[errors.end]} />
              </Field>
            </div>
            <Field>
              <FieldLabel>場所</FieldLabel>
              <Input {...register("location")} placeholder="例: 札幌駅" />
            </Field>
            <Field>
              <FieldLabel>詳細</FieldLabel>
              <Textarea
                {...register("description")}
                placeholder="例: 快速エアポートで到着"
              />
            </Field>
          </FieldGroup>
          <DialogFooter className="flex justify-between sm:justify-between w-full">
            <div>
              {initialEvent?.id && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    onDelete(initialEvent.id!);
                    onClose();
                  }}
                >
                  削除
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button type="submit">保存</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
