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
  return <ChevronsUpDown className="h-3.5 w-3.5 text-[#879497] dark:text-[#6B828A]" />;
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
          className="h-4 w-4 rounded border-[#E8E0D1] dark:border-[#232737] text-[#B58A2E] dark:text-[#E6C075] focus:ring-[#D4A853]"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
          className="h-4 w-4 rounded border-[#E8E0D1] dark:border-[#232737] text-[#B58A2E] dark:text-[#E6C075] focus:ring-[#D4A853]"
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-[#E8E0D1] dark:border-[#232737]">
          {title && <h3 className="text-sm font-semibold text-[#003844] dark:text-[#E9F1F2]">{title}</h3>}
          <div className="flex items-center gap-2">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#879497] dark:text-[#6B828A]" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="w-48 sm:w-56 pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E8E0D1] dark:border-[#232737] bg-white dark:bg-[#161925] text-[#003844] dark:text-[#E9F1F2] placeholder:text-[#879497] dark:placeholder:text-[#6B828A] outline-none focus:border-[#D4A853]/60 transition-colors"
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
                  <tr key={headerGroup.id} className="border-b border-[#E8E0D1] dark:border-[#232737] bg-[#FFFAF4] dark:bg-[#10131D]">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={`py-3 px-4 text-left text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wider ${
                          header.column.getCanSort() ? 'cursor-pointer select-none hover:text-[#003844] dark:hover:text-[#E9F1F2]' : ''
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
                    className="border-b border-[#E8E0D1] dark:border-[#232737] last:border-b-0 hover:bg-[#F3ECDE] dark:hover:bg-[#232737] transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-3 px-4 text-[#003844] dark:text-[#E9F1F2]">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-[#E8E0D1] dark:border-[#232737]">
              <span className="text-xs text-[#879497] dark:text-[#6B828A]">
                Page {pageIndex + 1} of {pageCount}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="p-1.5 rounded-lg border border-[#E8E0D1] dark:border-[#232737] text-[#879497] dark:text-[#6B828A] hover:text-[#003844] dark:hover:text-[#E9F1F2] hover:bg-[#F3ECDE] dark:hover:bg-[#232737] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: pageCount }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => table.setPageIndex(i)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                      i === pageIndex
                        ? 'bg-[#D4A853]/10 text-[#B58A2E] dark:text-[#E6C075] border border-[#D4A853]/40'
                        : 'text-[#879497] dark:text-[#6B828A] hover:text-[#003844] dark:hover:text-[#E9F1F2] hover:bg-[#F3ECDE] dark:hover:bg-[#232737] border border-transparent'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="p-1.5 rounded-lg border border-[#E8E0D1] dark:border-[#232737] text-[#879497] dark:text-[#6B828A] hover:text-[#003844] dark:hover:text-[#E9F1F2] hover:bg-[#F3ECDE] dark:hover:bg-[#232737] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
