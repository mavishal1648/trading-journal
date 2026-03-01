"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { INSTRUMENT_OPTIONS, RESULTS } from "@/lib/constants";

export type TradeFilters = {
  instrument: string;
  result: string;
  search: string;
};

type TradeFiltersProps = {
  filters: TradeFilters;
  onChange: (filters: TradeFilters) => void;
};

export function TradeFiltersBar({ filters, onChange }: TradeFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <Select
        value={filters.instrument}
        onValueChange={(value) =>
          onChange({ ...filters, instrument: value })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Instrument" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Instruments</SelectItem>
          {INSTRUMENT_OPTIONS.map((inst) => (
            <SelectItem key={inst.name} value={inst.name}>
              {inst.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.result}
        onValueChange={(value) =>
          onChange({ ...filters, result: value })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Result" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Results</SelectItem>
          {RESULTS.map((result) => (
            <SelectItem key={result} value={result}>
              {result}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="Search notes..."
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        className="max-w-[250px]"
      />
    </div>
  );
}
