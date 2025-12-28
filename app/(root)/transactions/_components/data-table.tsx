"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleXIcon,
  FilterIcon,
  ListFilterIcon,
  Trash2Icon,
} from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onSelectionChange?: (selectedRows: TData[]) => void;
  selectedCount?: number;
  onBulkDelete?: () => void;
  onRowClick?: (row: TData) => void;
};

const typeLabels: Record<string, string> = {
  income: "Pemasukan",
  expense: "Pengeluaran",
};

const frequencyLabels: Record<string, string> = {
  one_time: "Sekali",
  daily: "Harian",
  weekly: "Mingguan",
  monthly: "Bulanan",
  yearly: "Tahunan",
};

export function DataTable<TData, TValue>({
  columns,
  data,
  onSelectionChange,
  selectedCount = 0,
  onBulkDelete,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Notify parent when selection changes
  const handleRowSelectionChange = (
    updater:
      | RowSelectionState
      | ((old: RowSelectionState) => RowSelectionState),
  ) => {
    const newSelection =
      typeof updater === "function" ? updater(rowSelection) : updater;
    setRowSelection(newSelection);

    if (onSelectionChange) {
      const selectedRows = Object.keys(newSelection)
        .filter((key) => newSelection[key])
        .map((key) => data[parseInt(key)]);
      onSelectionChange(selectedRows);
    }
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onRowSelectionChange: handleRowSelectionChange,
    state: {
      sorting,
      columnFilters,
      pagination,
      rowSelection,
    },
  });

  // Get unique type values
  const uniqueTypeValues = useMemo(() => {
    const typeColumn = table.getColumn("type");
    if (!typeColumn) {
      return [];
    }
    const values = Array.from(typeColumn.getFacetedUniqueValues().keys());
    return values.sort();
  }, [table.getColumn]);

  // Get counts for each type
  const typeCounts = useMemo(() => {
    const typeColumn = table.getColumn("type");
    if (!typeColumn) {
      return new Map();
    }
    return typeColumn.getFacetedUniqueValues();
  }, [table.getColumn]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <- need to add for checkbox state
  const selectedTypes = useMemo(() => {
    const filterValue = table.getColumn("type")?.getFilterValue() as string[];
    return filterValue ?? [];
  }, [table, columnFilters]);

  const handleTypeChange = (checked: boolean, value: string) => {
    const filterValue = table.getColumn("type")?.getFilterValue() as string[];
    const newFilterValue = filterValue ? [...filterValue] : [];

    if (checked) {
      newFilterValue.push(value);
    } else {
      const index = newFilterValue.indexOf(value);
      if (index > -1) {
        newFilterValue.splice(index, 1);
      }
    }

    table
      .getColumn("type")
      ?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
  };

  // Get unique frequency values
  const uniqueFrequencyValues = useMemo(() => {
    const frequencyColumn = table.getColumn("frequency");
    if (!frequencyColumn) {
      return [];
    }
    const values = Array.from(frequencyColumn.getFacetedUniqueValues().keys());
    // Map null to 'one_time' and filter out duplicates
    const mappedValues = values.map((v) => (v === null ? "one_time" : v));
    return [...new Set(mappedValues)].sort();
  }, [table.getColumn]);

  // Get counts for each frequency
  const frequencyCounts = useMemo(() => {
    const frequencyColumn = table.getColumn("frequency");
    if (!frequencyColumn) {
      return new Map();
    }
    const originalCounts = frequencyColumn.getFacetedUniqueValues();
    const newCounts = new Map<string, number>();
    originalCounts.forEach((count, key) => {
      const mappedKey = key === null ? "one_time" : key;
      newCounts.set(mappedKey, (newCounts.get(mappedKey) || 0) + count);
    });
    return newCounts;
  }, [table.getColumn]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: need to add for checkbox state
  const selectedFrequencies = useMemo(() => {
    const filterValue = table.getColumn("frequency")?.getFilterValue() as
      | string[]
      | undefined;
    return filterValue ?? [];
  }, [table, columnFilters]);

  const handleFrequencyChange = (checked: boolean, value: string) => {
    const filterValue = table.getColumn("frequency")?.getFilterValue() as
      | string[]
      | undefined;
    const newFilterValue = filterValue ? [...filterValue] : [];

    if (checked) {
      newFilterValue.push(value);
    } else {
      const index = newFilterValue.indexOf(value);
      if (index > -1) {
        newFilterValue.splice(index, 1);
      }
    }

    table
      .getColumn("frequency")
      ?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter by name */}
          <div className="relative">
            <Input
              aria-label="Cari transaksi"
              className={cn(
                "peer min-w-60 ps-9",
                Boolean(table.getColumn("name")?.getFilterValue()) && "pe-9",
              )}
              id={`${id}-input`}
              onChange={(e) =>
                table.getColumn("name")?.setFilterValue(e.target.value)
              }
              placeholder="Cari transaksi..."
              ref={inputRef}
              type="text"
              value={
                (table.getColumn("name")?.getFilterValue() ?? "") as string
              }
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
              <ListFilterIcon aria-hidden="true" size={16} />
            </div>
            {Boolean(table.getColumn("name")?.getFilterValue()) && (
              <button
                aria-label="Clear filter"
                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 outline-none transition-[color,box-shadow] hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                  table.getColumn("name")?.setFilterValue("");
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
                type="button"
              >
                <CircleXIcon aria-hidden="true" size={16} />
              </button>
            )}
          </div>

          {/* Filter by type */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <FilterIcon
                  aria-hidden="true"
                  className="-ms-1 opacity-60"
                  size={16}
                />
                Tipe
                {selectedTypes.length > 0 && (
                  <span className="-me-1 inline-flex h-5 max-h-full items-center rounded border bg-background px-1 font-[inherit] font-medium text-[0.625rem] text-muted-foreground/70">
                    {selectedTypes.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto min-w-36 p-3">
              <div className="space-y-3">
                <div className="font-medium text-muted-foreground text-xs">
                  Filter Tipe
                </div>
                <div className="space-y-3">
                  {uniqueTypeValues.map((value, i) => (
                    <div className="flex items-center gap-2" key={value}>
                      <Checkbox
                        checked={selectedTypes.includes(value)}
                        id={`${id}-type-${i}`}
                        onCheckedChange={(checked: boolean) =>
                          handleTypeChange(checked, value)
                        }
                      />
                      <Label
                        className="flex grow justify-between gap-2 font-normal"
                        htmlFor={`${id}-type-${i}`}
                      >
                        {typeLabels[value] || value}
                        <span className="ms-2 text-muted-foreground text-xs">
                          {typeCounts.get(value)}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Filter by frequency */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <FilterIcon
                  aria-hidden="true"
                  className="-ms-1 opacity-60"
                  size={16}
                />
                Frekuensi
                {selectedFrequencies.length > 0 && (
                  <span className="-me-1 inline-flex h-5 max-h-full items-center rounded border bg-background px-1 font-[inherit] font-medium text-[0.625rem] text-muted-foreground/70">
                    {selectedFrequencies.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto min-w-36 p-3">
              <div className="space-y-3">
                <div className="font-medium text-muted-foreground text-xs">
                  Filter Frekuensi
                </div>
                <div className="space-y-3">
                  {uniqueFrequencyValues.map((value, i) => (
                    <div className="flex items-center gap-2" key={value}>
                      <Checkbox
                        checked={selectedFrequencies.includes(value)}
                        id={`${id}-freq-${i}`}
                        onCheckedChange={(checked: boolean) =>
                          handleFrequencyChange(checked, value)
                        }
                      />
                      <Label
                        className="flex grow justify-between gap-2 font-normal"
                        htmlFor={`${id}-freq-${i}`}
                      >
                        {frequencyLabels[value] || value}
                        <span className="ms-2 text-muted-foreground text-xs">
                          {frequencyCounts.get(value)}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Bulk delete button */}
        {selectedCount > 0 && onBulkDelete && (
          <Button onClick={onBulkDelete} variant="destructive">
            <Trash2Icon className="size-4" />
            Hapus ({selectedCount})
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow className="hover:bg-transparent" key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                  onClick={(e) => {
                    // Don't trigger row click if clicking on buttons, checkboxes, or dropdown menus
                    const target = e.target as HTMLElement;
                    const isClickable =
                      target.closest("button") ||
                      target.closest("input[type='checkbox']") ||
                      target.closest("[role='menuitem']") ||
                      target.closest("[data-radix-popper-content-wrapper]");
                    if (!isClickable && onRowClick) {
                      onRowClick(row.original);
                    }
                  }}
                  className={onRowClick ? "cursor-pointer" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  Tidak ada transaksi ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3 sm:gap-8">
        {/* Results per page */}
        <div className="flex items-center gap-3">
          <Label className="max-sm:sr-only" htmlFor={`${id}-page-size`}>
            Baris per halaman
          </Label>
          <Select
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
            value={table.getState().pagination.pageSize.toString()}
          >
            <SelectTrigger
              className="w-fit whitespace-nowrap"
              id={`${id}-page-size`}
            >
              <SelectValue placeholder="Pilih jumlah baris" />
            </SelectTrigger>
            <SelectContent className="[&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2 [&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8">
              {[5, 10, 25, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page number information - hidden on small screens */}
        <div className="hidden grow justify-end whitespace-nowrap text-muted-foreground text-sm sm:flex">
          <p
            aria-live="polite"
            className="whitespace-nowrap text-muted-foreground text-sm"
          >
            <span className="text-foreground">
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}
              -
              {Math.min(
                table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  table.getState().pagination.pageSize,
                table.getRowCount(),
              )}
            </span>{" "}
            dari{" "}
            <span className="text-foreground">
              {table.getRowCount().toString()}
            </span>
          </p>
        </div>

        {/* Pagination buttons */}
        <div className="flex items-center gap-1">
          <Pagination>
            <PaginationContent>
              {/* First page button - hidden on small screens */}
              <PaginationItem className="hidden sm:block">
                <Button
                  aria-label="Ke halaman pertama"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.firstPage()}
                  size="icon"
                  variant="outline"
                >
                  <ChevronFirstIcon aria-hidden="true" size={16} />
                </Button>
              </PaginationItem>
              {/* Previous page button */}
              <PaginationItem>
                <Button
                  aria-label="Ke halaman sebelumnya"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                  size="icon"
                  variant="outline"
                >
                  <ChevronLeftIcon aria-hidden="true" size={16} />
                </Button>
              </PaginationItem>
              {/* Next page button */}
              <PaginationItem>
                <Button
                  aria-label="Ke halaman berikutnya"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                  size="icon"
                  variant="outline"
                >
                  <ChevronRightIcon aria-hidden="true" size={16} />
                </Button>
              </PaginationItem>
              {/* Last page button - hidden on small screens */}
              <PaginationItem className="hidden sm:block">
                <Button
                  aria-label="Ke halaman terakhir"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.lastPage()}
                  size="icon"
                  variant="outline"
                >
                  <ChevronLastIcon aria-hidden="true" size={16} />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
