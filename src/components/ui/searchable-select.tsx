'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  hasError?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  searchPlaceholder = 'Cari...',
  emptyText = 'Data tidak ditemukan.',
  disabled = false,
  hasError = false,
  icon,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = React.useMemo(
    () => options.find((opt) => opt.value.toLowerCase() === (value || '').toLowerCase()),
    [options, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all focus:outline-none cursor-pointer text-left',
            disabled
              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              : hasError
                ? 'border-2 border-rose-400 bg-rose-50/20 text-slate-900 focus:border-rose-500'
                : 'bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600 hover:border-slate-300',
            className
          )}
        >
          <div className="flex items-center gap-2 truncate flex-1 min-w-0">
            {icon && <span className="shrink-0 text-slate-400">{icon}</span>}
            <span className={cn('truncate', !selectedOption && 'text-slate-400 font-normal')}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0 shadow-2xl border-slate-200 rounded-2xl overflow-hidden z-50 bg-white"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-[260px] overflow-y-auto">
            <CommandEmpty className="py-6 text-center text-xs text-slate-400 font-medium">
              {emptyText}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = option.value.toLowerCase() === (value || '').toLowerCase();
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between py-2 px-3 cursor-pointer text-xs rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className={cn('font-semibold truncate', isSelected ? 'text-blue-600 font-bold' : 'text-slate-800')}>
                        {option.label}
                      </span>
                      {option.sublabel && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          {option.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
