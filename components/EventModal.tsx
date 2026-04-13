"use client";

import React, { useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { travelEventFormSchema } from "@/lib/event-schema";
import { z } from "zod";

type FormValues = z.infer<typeof travelEventFormSchema>;

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
  const titleId = useId();
  const startId = useId();
  const endId = useId();
  const locationId = useId();
  const descriptionId = useId();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(travelEventFormSchema),
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
    const eventId = initialEvent?.id || crypto.randomUUID();
    
    onSubmit({
      ...data,
      id: eventId,
    } as TravelEvent);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-balance">
            {initialEvent?.id ? "予定を編集" : "新しい予定を追加"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor={titleId}>タイトル</FieldLabel>
              <Input 
                id={titleId} 
                {...register("title")} 
                placeholder="例: 札幌駅到着" 
                autoComplete="off"
              />
              <FieldError errors={[errors.title]} />
            </Field>
            <div className="grid grid-cols-2 gap-4 tabular-nums">
              <Field>
                <FieldLabel htmlFor={startId}>開始日時</FieldLabel>
                <Input id={startId} type="datetime-local" {...register("start")} />
                <FieldError errors={[errors.start]} />
              </Field>
              <Field>
                <FieldLabel htmlFor={endId}>終了日時</FieldLabel>
                <Input id={endId} type="datetime-local" {...register("end")} />
                <FieldError errors={[errors.end]} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor={locationId}>場所</FieldLabel>
              <Input 
                id={locationId} 
                {...register("location")} 
                placeholder="例: 札幌駅" 
                autoComplete="street-address"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={descriptionId}>詳細</FieldLabel>
              <Textarea
                id={descriptionId}
                {...register("description")}
                placeholder="例: 快速エアポートで到着"
                autoComplete="off"
              />
            </Field>
          </FieldGroup>
          <div className="flex w-full items-center justify-between gap-2 pt-4">
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
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button type="submit">保存</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
