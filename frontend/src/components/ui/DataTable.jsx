import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from './Card';
import { Skeleton, EmptyState, ErrorState } from './States';

const SortIcon = ({ sorted }) => {
  if (sorted === 'asc') return <ChevronUp className="h-3.5 w-3.5" />;
  if (sorted === 'desc') return <ChevronDown className="h-3.5 w-3.5" />;
  return <ChevronsUpDown className="h-3.5 w-3.5 text-[#94A3B8]" />;
};

// DataTable — Generic TanStack-Table-powered table with sorting, search, pagination, and loading/empty/error states
const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  error = null,
  onRetry,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyIcon,
  searchable = false,
  searchPlaceholder = 'Search...',
  pageSize = 10,
  selectable = false,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
  getRowId,
  title,
  headerActions,
}) => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [internalRowSelection, setInternalRowSelection] = useState({});
  const rowSelection = controlledRowSelection ?? internalRowSelection;
  const setRowSelection = onRowSelectionChange ?? setInternalRowSelection;

  const finalColumns = useMemo(() => {
    if (!selectable) return columns;
    const selectColumn = {
      id: '__select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          ref={(el) => {
            if (el) el.indeterminate = table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected();
          }}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="h-4 w-4 rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
          className="h-4 w-4 rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]"
        />
      ),
      enableSorting: false,
    };
    return [selectColumn, ...columns];
  }, [columns, selectable]);

  const table = useReactTable({
    data,
    columns: finalColumns,
    state: { globalFilter, sorting, ...(selectable ? { rowSelection } : {}) },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onRowSelectionChange: selectable ? setRowSelection : undefined,
    enableRowSelection: selectable,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const rows = table.getRowModel().rows;
  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;

  return (
    <Card padded={false} className="overflow-hidden">
      {(title || searchable || headerActions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-[#E2E8F0]">
          {title && <h3 className="text-sm font-semibold text-[#0F172A]">{title}</h3>}
          <div className="flex items-center gap-2">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="w-48 sm:w-56 pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#2563EB]/40 transition-colors"
                />
              </div>
            )}
            {headerActions}
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-6 space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState description={typeof error === 'string' ? error : undefined} onRetry={onRetry} />
      ) : rows.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={`py-3 px-4 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider ${
                          header.column.getCanSort() ? 'cursor-pointer select-none hover:text-[#0F172A]' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.isPlaceholder ? null : (
                          <div className="flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && <SortIcon sorted={header.column.getIsSorted()} />}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[#E2E8F0] last:border-b-0 hover:bg-[#F1F5F9] transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-3 px-4 text-[#0F172A]">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-[#E2E8F0]">
              <span className="text-xs text-[#94A3B8]">
                Page {pageIndex + 1} of {pageCount}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="p-1.5 rounded-lg border border-[#E2E8F0] text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: pageCount }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => table.setPageIndex(i)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                      i === pageIndex
                        ? 'bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20'
                        : 'text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] border border-transparent'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="p-1.5 rounded-lg border border-[#E2E8F0] text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default DataTable;
