"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
};

type ComboboxProps = {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  addButtonText?: string;
  onAddClick?: () => void;
  disabled?: boolean;
  className?: string;
};

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  emptyText = "Tidak ditemukan.",
  addButtonText = "Tambah Baru",
  onAddClick,
  disabled = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase()),
    );
  }, [options, search]);

  const handleSelect = (selectedValue: string) => {
    onValueChange?.(selectedValue === value ? "" : selectedValue);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
          role="combobox"
          variant="outline"
        >
          <span className="flex items-center gap-2 truncate">
            {selectedOption?.icon}
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            onValueChange={setSearch}
            placeholder={searchPlaceholder}
            value={search}
          />
          <CommandList>
            {filteredOptions.length === 0 ? (
              <div className="py-2">
                <p className="pt-4 pb-6 text-center text-muted-foreground text-sm">
                  {emptyText}
                </p>
                {onAddClick && (
                  <div className="px-1 border-t">
                    <Button
                      className="w-full justify-start"
                      onClick={() => {
                        onAddClick();
                        setOpen(false);
                        setSearch("");
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <PlusIcon className="mr-2 size-4" />
                      {addButtonText}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      onSelect={() => handleSelect(option.value)}
                      value={option.value}
                    >
                      <span className="flex items-center gap-2">
                        {option.icon}
                        {option.label}
                      </span>
                      <CheckIcon
                        className={cn(
                          "ml-auto size-4",
                          value === option.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
                {onAddClick && (
                  <>
                    <div className="mx-1 my-1 h-px bg-border" />
                    <div className="p-1">
                      <Button
                        className="w-full justify-start"
                        onClick={() => {
                          onAddClick();
                          setOpen(false);
                          setSearch("");
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        <PlusIcon className="mr-2 size-4" />
                        {addButtonText}
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
