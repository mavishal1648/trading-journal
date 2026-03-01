"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { StarRating } from "@/components/star-rating";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import { TagCombobox } from "@/components/tag-combobox";

import { INSTRUMENT_OPTIONS, DIRECTIONS, RESULTS } from "@/lib/constants";
import { calculatePnl } from "@/lib/utils/pnl";
import { uploadScreenshot } from "@/lib/utils/screenshots";
import { createTrade, updateTrade } from "@/lib/actions/trades";
import type { TradeWithRelations } from "@/lib/types";
import { cn } from "@/lib/utils";

const tradeFormSchema = z.object({
  instrument: z.string().min(1, "Required"),
  direction: z.string().min(1, "Required"),
  entryPrice: z.coerce.number().positive("Must be positive"),
  exitPrice: z.coerce.number().positive("Must be positive"),
  quantity: z.coerce.number().int().positive("Must be at least 1"),
  riskReward: z.coerce.number().positive("Must be positive"),
  result: z.string().min(1, "Required"),
  pnl: z.coerce.number(),
  rating: z.coerce.number().int().min(1, "Rate 1-5").max(5),
  tradeDate: z.date({ error: "Required" }),
  entryTime: z.string().optional(),
  exitTime: z.string().optional(),
  notes: z.string().optional(),
  tagIds: z.array(z.string()),
});

type TradeFormValues = z.infer<typeof tradeFormSchema>;

interface TradeFormProps {
  mode: "create" | "edit";
  initialData?: TradeWithRelations;
}

export function TradeForm({ mode, initialData }: TradeFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [existingUrls, setExistingUrls] = useState<string[]>(
    initialData?.screenshots.map((s) => s.url) ?? []
  );
  const [pnlManual, setPnlManual] = useState(false);

  const form = useForm<TradeFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(tradeFormSchema) as any,
    defaultValues: initialData
      ? {
          instrument: initialData.instrument,
          direction: initialData.direction,
          entryPrice: Number(initialData.entryPrice),
          exitPrice: Number(initialData.exitPrice),
          quantity: initialData.quantity,
          riskReward: Number(initialData.riskReward),
          result: initialData.result,
          pnl: Number(initialData.pnl),
          rating: initialData.rating,
          tradeDate: new Date(initialData.tradeDate),
          entryTime: initialData.entryTime
            ? format(new Date(initialData.entryTime), "HH:mm")
            : "",
          exitTime: initialData.exitTime
            ? format(new Date(initialData.exitTime), "HH:mm")
            : "",
          notes: initialData.notes ?? "",
          tagIds: initialData.tags.map((t) => t.tagId),
        }
      : {
          instrument: "",
          direction: "",
          entryPrice: undefined as unknown as number,
          exitPrice: undefined as unknown as number,
          quantity: 1,
          riskReward: undefined as unknown as number,
          result: "",
          pnl: 0,
          rating: 3,
          tradeDate: new Date(),
          entryTime: "",
          exitTime: "",
          notes: "",
          tagIds: [],
        },
  });

  // Auto-calculate P&L
  const instrument = form.watch("instrument");
  const direction = form.watch("direction");
  const entryPrice = form.watch("entryPrice");
  const exitPrice = form.watch("exitPrice");
  const quantity = form.watch("quantity");

  useEffect(() => {
    if (pnlManual) return;
    if (instrument && direction && entryPrice && exitPrice && quantity) {
      const pnl = calculatePnl(
        instrument,
        direction,
        entryPrice,
        exitPrice,
        quantity
      );
      form.setValue("pnl", parseFloat(pnl.toFixed(2)));
    }
  }, [instrument, direction, entryPrice, exitPrice, quantity, pnlManual, form]);

  const onSubmit = async (values: TradeFormValues) => {
    setSubmitting(true);

    try {
      // Upload new screenshots
      const newUrls: string[] = [];
      for (const file of screenshots) {
        const url = await uploadScreenshot(file);
        newUrls.push(url);
      }
      const allScreenshotUrls = [...existingUrls, ...newUrls];

      // Build FormData
      const formData = new FormData();
      formData.set("instrument", values.instrument);
      formData.set("direction", values.direction);
      formData.set("entryPrice", String(values.entryPrice));
      formData.set("exitPrice", String(values.exitPrice));
      formData.set("quantity", String(values.quantity));
      formData.set("riskReward", String(values.riskReward));
      formData.set("result", values.result);
      formData.set("pnl", String(values.pnl));
      formData.set("rating", String(values.rating));
      formData.set("tradeDate", values.tradeDate.toISOString());
      formData.set("notes", values.notes ?? "");
      formData.set("tagIds", JSON.stringify(values.tagIds));
      formData.set("screenshotUrls", JSON.stringify(allScreenshotUrls));

      if (values.entryTime) {
        const [h, m] = values.entryTime.split(":");
        const entryDt = new Date(values.tradeDate);
        entryDt.setHours(parseInt(h), parseInt(m));
        formData.set("entryTime", entryDt.toISOString());
      }
      if (values.exitTime) {
        const [h, m] = values.exitTime.split(":");
        const exitDt = new Date(values.tradeDate);
        exitDt.setHours(parseInt(h), parseInt(m));
        formData.set("exitTime", exitDt.toISOString());
      }

      if (mode === "create") {
        const result = await createTrade(formData);
        if (result.success) {
          toast.success("Trade added successfully");
          router.push("/trades");
        } else {
          toast.error(result.error ?? "Failed to create trade");
        }
      } else {
        const result = await updateTrade(initialData!.id, formData);
        if (result.success) {
          toast.success("Trade updated successfully");
          router.push("/trades");
        } else {
          toast.error(result.error ?? "Failed to update trade");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left column — Trade data (3/5 width) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Trade Setup */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Trade Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="instrument"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instrument</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select instrument" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INSTRUMENT_OPTIONS.map((inst) => (
                              <SelectItem key={inst.name} value={inst.name}>
                                {inst.name} — {inst.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="direction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Direction</FormLabel>
                        <FormControl>
                          <ToggleGroup
                            type="single"
                            value={field.value}
                            onValueChange={(val) => {
                              if (val) field.onChange(val);
                            }}
                            className="justify-start"
                          >
                            {DIRECTIONS.map((dir) => (
                              <ToggleGroupItem
                                key={dir}
                                value={dir}
                                className={cn(
                                  "px-6 font-medium",
                                  field.value === dir &&
                                    dir === "LONG" &&
                                    "bg-emerald-600 text-white hover:bg-emerald-700 data-[state=on]:bg-emerald-600 data-[state=on]:text-white",
                                  field.value === dir &&
                                    dir === "SHORT" &&
                                    "bg-red-600 text-white hover:bg-red-700 data-[state=on]:bg-red-600 data-[state=on]:text-white"
                                )}
                              >
                                {dir}
                              </ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="entryPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.25"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="exitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exit Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.25"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contracts</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            placeholder="1"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="riskReward"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>R:R</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="1.0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Result & Timing */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Result & Timing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="result"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Result</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select result" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {RESULTS.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pnl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          P&L ($){" "}
                          {!pnlManual && (
                            <span className="text-xs text-muted-foreground">
                              (auto-estimate)
                            </span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => {
                              setPnlManual(true);
                              field.onChange(e.target.valueAsNumber);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="tradeDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Trade Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                                type="button"
                              >
                                {field.value
                                  ? format(field.value, "MMM d, yyyy")
                                  : "Pick a date"}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="entryTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="exitTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exit Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column — Analysis & Screenshots (2/5 width) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="flex-1">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating</FormLabel>
                      <FormControl>
                        <StarRating
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="tagIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <TagCombobox
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What did you observe? What went well or wrong?"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="space-y-2">
                  <FormLabel>Screenshots</FormLabel>
                  <ScreenshotUpload
                    value={screenshots}
                    onChange={setScreenshots}
                    existingUrls={existingUrls}
                    onRemoveExisting={(url) =>
                      setExistingUrls((prev) => prev.filter((u) => u !== url))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit — full width below grid */}
        <Button type="submit" disabled={submitting} size="lg" className="w-full mt-6">
          {submitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {mode === "create" ? "Add Trade" : "Update Trade"}
        </Button>
      </form>
    </Form>
  );
}
