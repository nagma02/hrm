import { useMemo, useState, type ReactNode } from 'react'
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  tableFeatures,
  useTable,
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { buildCsv } from '@/utils/csv'
import { TableToolbar } from './TableToolbar'
import { TablePagination } from './TablePagination'
import { TableSkeleton } from '@/components/ui/skeleton'

export type DataTableColumn<TItem> = {
  key: string
  header: ReactNode
  cell: (item: TItem) => ReactNode
}

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
})

export function DataTable<TItem extends object>({
  items,
  columns,
  emptyMessage = 'No rows found.',
  isLoading = false,
  pageSize: initialPageSize = 10,
  getRowId,
}: {
  items: TItem[]
  columns: Array<DataTableColumn<TItem>>
  emptyMessage?: string
  isLoading?: boolean
  pageSize?: number
  getRowId?: (item: TItem, index: number) => string
}) {
  const [globalSearch, setGlobalSearch] = useState('')
  const [filterColumn, setFilterColumn] = useState('')
  const [columnFilter, setColumnFilter] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  })
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const filterKeys = useMemo(() => (items[0] ? Object.keys(items[0] as object) : []), [items])
  const columnFilters: ColumnFiltersState =
    filterColumn && columnFilter ? [{ id: filterColumn, value: columnFilter }] : []

  const tableColumns = useMemo(() => {
    const helper = createColumnHelper<typeof features, TItem>()
    return helper.columns(
      columns.map((column) =>
        helper.accessor((item) => (item as Record<string, unknown>)[column.key] as string, {
          id: column.key,
          header: () => column.header,
          cell: ({ row }) => column.cell(row.original),
        }),
      ),
    )
  }, [columns])

  const table = useTable({
    features,
    data: items,
    columns: tableColumns,
    getRowId: (item, index) =>
      getRowId?.(item, index) ?? String((item as { id?: unknown }).id ?? index),
    state: { pagination, rowSelection, globalFilter: globalSearch, columnFilters },
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalSearch,
    globalFilterFn: (row, columnId, filterValue) =>
      String(row.getValue(columnId) ?? '')
        .toLocaleLowerCase()
        .includes(String(filterValue ?? '').toLocaleLowerCase()),
  })

  const filteredItems = table.getFilteredRowModel().rows.map((row) => row.original)
  const pageCount = table.getPageCount()

  const exportCsv = () => {
    const keys = filterKeys
    const csv = buildCsv(
      keys,
      filteredItems.map((item) => keys.map((key) => (item as Record<string, unknown>)[key])),
    )
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'table-export.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading)
    return (
      <div className="table-shell" aria-label="Loading records">
        <TableSkeleton rows={Math.min(Math.max(initialPageSize, 5), 8)} columns={columns.length} />
      </div>
    )

  if (items.length === 0)
    return (
      <div className="rounded-xl border border-slate-200/90 bg-white p-8 text-center text-slate-500 state state--empty shadow-xs">
        {emptyMessage}
      </div>
    )

  const selectedCount = table.getSelectedRowIds().length

  return (
    <div className="table-component space-y-3">
      {/* Search and Filters Toolbar (Image 2 style) */}
      <TableToolbar
        searchQuery={globalSearch}
        onSearchChange={(value) => {
          setGlobalSearch(value)
          table.setGlobalFilter(value)
          table.firstPage()
        }}
        searchPlaceholder="Search all rows"
        sortValue={sortOrder}

        onSortChange={setSortOrder}
        sortOptions={[
          { label: 'Newest first', value: 'newest' },
          { label: 'Oldest first', value: 'oldest' },
        ]}
        filterValue={filterColumn}
        onFilterChange={(col) => {
          setFilterColumn(col)
          setColumnFilter('')
          table.firstPage()
        }}
        filterOptions={[
          { label: 'All Categories', value: '' },
          ...filterKeys.map((key) => ({ label: key, value: key })),
        ]}
        filterLabel="All Categories"
        pageSize={pagination.pageSize}
        onPageSizeChange={(size) => {
          table.setPageSize(size)
        }}
        pageSizeOptions={[10, 15, 25, 50]}
        onExport={exportCsv}
      >
        {selectedCount > 0 && (
          <Badge variant="secondary" className="table-selected-count font-medium">
            {selectedCount} selected
          </Badge>
        )}
      </TableToolbar>

      {/* shadcn Table Container (Image 1 style) */}
      <div className="table-shell">
        <Table className="table">
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                <TableHead className="w-12 text-center">
                  <div className="flex justify-center items-center">
                    <Checkbox
                      aria-label="Select visible rows"
                      checked={table.getIsAllPageRowsSelected()}
                      onCheckedChange={(val) => {
                        table.toggleAllPageRowsSelected(!!val)
                      }}
                    />
                  </div>
                </TableHead>
                <TableHead className="w-16">S.NO</TableHead>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    <div className="inline-flex items-center gap-1">
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                      <span className="text-[10px] text-slate-400">↕</span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row, index) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
              >
                <TableCell className="text-center">
                  <div className="flex justify-center items-center">
                    <Checkbox
                      aria-label={`Select row ${row.id}`}
                      checked={row.getIsSelected()}
                      onCheckedChange={(val) => {
                        row.toggleSelected(!!val)
                      }}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-xs font-semibold text-slate-500">
                  {pagination.pageIndex * pagination.pageSize + index + 1}
                </TableCell>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination (Image 1 centered style) */}
      {!filteredItems.length ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 state state--empty">
          No matching records.
        </div>
      ) : (
        <TablePagination
          page={pagination.pageIndex + 1}
          pageCount={pageCount}
          totalItems={filteredItems.length}
          onPageChange={(pageIndex) => {
            table.setPageIndex(pageIndex - 1)
          }}
        />
      )}
    </div>
  )
}
