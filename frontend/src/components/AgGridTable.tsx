import { useCallback, useMemo, useState } from 'react'
import {
  AllCommunityModule,
  type ColDef,
  type GridApi,
  type GridOptions,
  themeQuartz,
} from 'ag-grid-community'
import { AgGridProvider, AgGridReact } from 'ag-grid-react'
import { downloadInstitutionalPdf, printInstitutionalPdf } from '../lib/pdfmake'
import { useOptionalInstitutionSettings } from './InstitutionSettingsContext'

export type AgGridTableProps<TData extends object> = {
  rows: TData[]
  columns: ColDef<TData>[]
  height?: number | string
  pageSize?: number
  loading?: boolean
  quickFilterText?: string
  rowSelection?: GridOptions<TData>['rowSelection']
  editable?: boolean
  exportFileName?: string
  toolbar?: boolean
  onRowClicked?: GridOptions<TData>['onRowClicked']
  onSelectionChanged?: GridOptions<TData>['onSelectionChanged']
  onCellValueChanged?: GridOptions<TData>['onCellValueChanged']
  getRowId?: GridOptions<TData>['getRowId']
  className?: string
}

/** Shared SMIS data grid. Community edition only; all edits still pass through caller-owned API handlers. */
export function AgGridTable<TData extends object>({
  rows,
  columns,
  height = 520,
  pageSize = 25,
  loading = false,
  quickFilterText,
  rowSelection = { mode: 'multiRow' },
  editable = false,
  exportFileName = 'smis-data',
  toolbar = true,
  onRowClicked,
  onSelectionChanged,
  onCellValueChanged,
  getRowId,
  className,
}: AgGridTableProps<TData>) {
  const [api, setApi] = useState<GridApi<TData> | null>(null)
  const [filter, setFilter] = useState(quickFilterText ?? '')
  const institutionContext = useOptionalInstitutionSettings()
  const institution = institutionContext?.institution
  const institutionLoaded = institutionContext?.loaded ?? false
  const defaultColDef = useMemo<ColDef<TData>>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 110,
    flex: 1,
    floatingFilter: true,
    editable,
    wrapHeaderText: true,
    autoHeaderHeight: true,
  }), [editable])
  const theme = useMemo(() => themeQuartz.withParams({
    fontFamily: 'Inter, Arial, sans-serif',
    fontSize: 13,
    headerFontSize: 12,
    headerFontWeight: 700,
    borderRadius: 0,
    wrapperBorderRadius: 0,
    spacing: 6,
  }), [])
  const exportCsv = useCallback(() => {
    api?.exportDataAsCsv({ fileName: exportFileName })
  }, [api, exportFileName])
  const toggleColumn = useCallback((colId: string, visible: boolean) => {
    api?.setColumnsVisible([colId], visible)
  }, [api])
  const tablePdfOptions = useCallback(() => {
    if (!api) return null
    const displayedColumns = api.getAllDisplayedColumns()
    const headers = displayedColumns.map(column => ({
      text: String(column.getColDef().headerName ?? column.getColDef().field ?? column.getColId()),
      style: 'tableHeader',
    }))
    const body: unknown[][] = [headers]
    api.forEachNodeAfterFilterAndSort(node => {
      if (!node.data) return
      body.push(displayedColumns.map(column => {
        const value = api.getCellValue({ rowNode: node, colKey: column.getColId(), useFormatter: true })
        if (value === null || value === undefined || value === '') return '—'
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
        try { return JSON.stringify(value) } catch { return String(value) }
      }))
    })
    if (body.length === 1) return null
    const title = exportFileName.replace(/[-_]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())
    return {
      title,
      filename: exportFileName,
      orientation: displayedColumns.length > 7 ? 'landscape' as const : 'portrait' as const,
      institutionName: institutionLoaded && institution?.isActive ? institution.institutionName : undefined,
      motto: institutionLoaded && institution?.isActive ? institution.motto : undefined,
      contactLines: institutionLoaded && institution?.isActive ? [institution.address, institution.phone, institution.email].filter((value): value is string => Boolean(value?.trim())) : [],
      accentColor: institutionLoaded && institution?.isActive ? institution.primaryColor : undefined,
      content: [
        { text: 'Records: ' + (body.length - 1).toLocaleString('en-UG'), style: 'muted', margin: [0, 0, 0, 8] },
        { table: { headerRows: 1, widths: displayedColumns.map(() => '*'), body }, layout: 'lightHorizontalLines', fontSize: displayedColumns.length > 10 ? 6 : 8 },
      ],
    }
  }, [api, exportFileName, institution, institutionLoaded])
  const exportPdf = useCallback(() => {
    const options = tablePdfOptions()
    if (options) downloadInstitutionalPdf(options)
  }, [tablePdfOptions])
  const printPdf = useCallback(() => {
    const options = tablePdfOptions()
    if (options) printInstitutionalPdf(options)
  }, [tablePdfOptions])

  return (
    <div className={['smis-ag-grid-shell', className].filter(Boolean).join(' ')}>
      {toolbar && <div className="smis-ag-grid-toolbar">
        <label className="smis-ag-grid-search">
          <span className="sr-only">Search table</span>
          <input value={filter} onChange={event => setFilter(event.target.value)} placeholder="Search records…" />
        </label>
        <span className="smis-ag-grid-count">{rows.length.toLocaleString('en-UG')} records</span>
        <button type="button" className="secondary-button" onClick={exportCsv} disabled={!api || rows.length === 0}>Export CSV</button>
        <button type="button" className="secondary-button" onClick={exportPdf} disabled={!api || rows.length === 0}>Export PDF</button>
        <button type="button" className="secondary-button" onClick={printPdf} disabled={!api || rows.length === 0}>Print PDF</button>
        <details className="smis-ag-grid-columns">
          <summary>Columns</summary>
          <div className="smis-ag-grid-column-menu">
            {columns.map((column, index) => {
              const colId = String(column.colId ?? column.field ?? index)
              const visible = api?.getColumn(colId)?.isVisible() ?? !column.hide
              return <label key={colId}>
                <input type="checkbox" checked={visible} onChange={event => toggleColumn(colId, event.target.checked)} />
                {String(column.headerName ?? column.field ?? colId)}
              </label>
            })}
          </div>
        </details>
      </div>}
      <div className="smis-ag-grid" style={{ height, width: '100%' }}>
        <AgGridProvider modules={[AllCommunityModule]}>
          <AgGridReact<TData>
            theme={theme}
            rowData={rows}
            columnDefs={columns}
            defaultColDef={defaultColDef}
            rowHeight={38}
            headerHeight={40}
            pagination
            paginationPageSize={pageSize}
            paginationPageSizeSelector={[10, 25, 50, 100]}
            animateRows={false}
            loading={loading}
            quickFilterText={quickFilterText ?? filter}
            rowSelection={rowSelection}
            onGridReady={event => setApi(event.api)}
            onRowClicked={onRowClicked}
            onSelectionChanged={onSelectionChanged}
            onCellValueChanged={onCellValueChanged}
            getRowId={getRowId}
            suppressCellFocus={false}
          />
        </AgGridProvider>
      </div>
    </div>
  )
}
