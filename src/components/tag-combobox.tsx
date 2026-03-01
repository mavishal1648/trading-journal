"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronsUpDown, Check, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getTags, createTag } from "@/lib/actions/tags";
import type { Tag } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Purple", value: "#a855f7" },
  { name: "Orange", value: "#f97316" },
];

interface TagComboboxProps {
  value: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagCombobox({ value, onChange }: TagComboboxProps) {
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0].value);

  useEffect(() => {
    getTags().then(setTags);
  }, []);

  const toggleTag = useCallback(
    (tagId: string) => {
      if (value.includes(tagId)) {
        onChange(value.filter((id) => id !== tagId));
      } else {
        onChange([...value, tagId]);
      }
    },
    [value, onChange]
  );

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const tag = await createTag(newTagName.trim(), newTagColor);
      setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
      onChange([...value, tag.id]);
      setCreating(false);
      setNewTagName("");
      setNewTagColor(PRESET_COLORS[0].value);
    } catch (error) {
      console.error("Failed to create tag:", error);
    }
  };

  const selectedTags = tags.filter((t) => value.includes(t.id));
  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );
  const hasExactMatch = tags.some(
    (t) => t.name.toLowerCase() === search.toLowerCase()
  );

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            type="button"
          >
            {value.length > 0
              ? `${value.length} tag${value.length > 1 ? "s" : ""} selected`
              : "Select tags..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          {creating ? (
            <div className="p-3 space-y-3">
              <p className="text-sm font-medium">Create new tag</p>
              <Input
                placeholder="Tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Color:</span>
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-transform",
                      newTagColor === color.value
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setNewTagColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                >
                  Create
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCreating(false);
                    setNewTagName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Command>
              <CommandInput
                placeholder="Search tags..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>
                  <span className="text-muted-foreground">No tags found.</span>
                </CommandEmpty>
                <CommandGroup>
                  {filteredTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => toggleTag(tag.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.includes(tag.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span
                        className="mr-2 h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {search && !hasExactMatch && (
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setNewTagName(search);
                        setCreating(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create &quot;{search}&quot;
                    </CommandItem>
                  </CommandGroup>
                )}
                {!search && (
                  <CommandGroup>
                    <CommandItem onSelect={() => setCreating(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create new tag
                    </CommandItem>
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>

      {/* Selected tags as badges */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="gap-1 pr-1"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
              <button
                type="button"
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                onClick={() => toggleTag(tag.id)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
