"use client";

import { useMemo, useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import type { TradeWithRelations } from "@/lib/types";
import { getColumns } from "@/components/trades-columns";
import {
  TradeFiltersBar,
  type TradeFilters,
} from "@/components/trade-filters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { deleteTrade } from "@/lib/actions/trades";

type TradesTableProps = {
  data: TradeWithRelations[];
};

export function TradesTable({ data }: TradesTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "tradeDate", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filters, setFilters] = useState<TradeFilters>({
    instrument: "ALL",
    result: "ALL",
    search: "",
  });

  const handleDelete = useCallback(
    async (tradeId: string) => {
      if (!window.confirm("Are you sure you want to delete this trade?"))
        return;
      const result = await deleteTrade(tradeId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to delete trade");
      }
    },
    [router]
  );

  const columns = useMemo(() => getColumns(handleDelete), [handleDelete]);

  const filteredData = useMemo(() => {
    let result = data;
    if (filters.instrument !== "ALL") {
      result = result.filter((t) => t.instrument === filters.instrument);
    }
    if (filters.result !== "ALL") {
      result = result.filter((t) => t.result === filters.result);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter((t) => t.notes?.toLowerCase().includes(search));
    }
    return result;
  }, [data, filters]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  function getRowClassName(result: string): string {
    if (result === "WIN") return "bg-green-500/5 hover:bg-green-500/10";
    if (result === "LOSS") return "bg-red-500/5 hover:bg-red-500/10";
    return "";
  }

  return (
    <div className="space-y-4">
      <TradeFiltersBar filters={filters} onChange={setFilters} />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
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
                  key={row.id}
                  className={`cursor-pointer ${getRowClassName(row.original.result)}`}
                  onClick={() => router.push(`/trades/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No trades found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()} ({filteredData.length} trades)
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
