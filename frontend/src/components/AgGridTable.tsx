import { useMemo } from 'react'
import {
  AllCommunityModule,
  type ColDef,
  type GridOptions,
  themeQuartz,
} from 'ag-grid-community'
import { AgGridProvider, AgGridReact } from 'ag-grid-react'

export type AgGridTableProps<TData extends object> = {
  rows: TData[]
  columns: ColDef<TData>[]
  height?: number | string
  pageSize?: number
  loading?: boolean
  quickFilterText?: string
  rowSelection?: GridOptions<TData>['rowSelection']
  onRowClicked?: GridOptions<TData>['onRowClicked']
  onCellValueChanged?: GridOptions<TData>['onCellValueChanged']
  getRowId?: GridOptions<TData>['getRowId']
  className?: string
}

/**
 * Shared SMIS data-grid wrapper.
 * Uses AG Grid Community only (MIT licensed); no Enterprise modules or licence key.
 */
export function AgGridTable<TData extends object>({
  rows,
  columns,
  height = 520,
  pageSize = 25,
  loading = false,
  quickFilterText,
  rowSelection,
  onRowClicked,
  onCellValueChanged,
  getRowId,
  className,
}: AgGridTableProps<TData>) {
  const defaultColDef = useMemo<ColDef<TData>>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 110,
    flex: 1,
    floatingFilter: false,
  }), [])

  const theme = useMemo(() => themeQuartz.withParams({
    fontFamily: 'Inter, Arial, sans-serif',
    fontSize: 13,
    headerFontSize: 12,
    headerFontWeight: 700,
    rowHeight: 38,
    headerHeight: 40,
    borderRadius: 0,
    wrapperBorderRadius: 0,
    spacing: 6,
  }), [])

  return (
    <div className={['smis-ag-grid', className].filter(Boolean).join(' ')} style={{ height, width: '100%' }}>
      <AgGridProvider modules={[AllCommunityModule]}>
        <AgGridReact<TData>
          theme={theme}
          rowData={rows}
          columnDefs={columns}
          defaultColDef={defaultColDef}
          pagination
          paginationPageSize={pageSize}
          paginationPageSizeSelector={[10, 25, 50, 100]}
          animateRows={false}
          loading={loading}
          quickFilterText={quickFilterText}
          rowSelection={rowSelection}
          onRowClicked={onRowClicked}
          onCellValueChanged={onCellValueChanged}
          getRowId={getRowId}
          suppressCellFocus={false}
        />
      </AgGridProvider>
    </div>
  )
}
