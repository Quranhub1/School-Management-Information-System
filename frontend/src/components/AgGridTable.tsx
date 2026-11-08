<<<<<<< HEAD
<<<<<<< HEAD
import { useCallback, useMemo, useRef, useState } from 'react'
import type { ZodType } from 'zod'
import type { CellValueChangedEvent } from 'ag-grid-community'
=======
import { useCallback, useMemo, useState } from 'react'
>>>>>>> origin/feat/ag-grid-table-migration
=======
import { useCallback, useMemo, useRef, useState } from 'react'
import type { ZodType } from 'zod'
import './AgGridTable.css'
>>>>>>> origin/feat/central-zod-validation-v2
import {
  AllCommunityModule,
  type CellValueChangedEvent,
  type ColDef,
  type GridApi,
  type GridOptions,
  themeQuartz,
} from 'ag-grid-community'
import { AgGridProvider, AgGridReact } from 'ag-grid-react'

<<<<<<< HEAD
function GridLoadingOverlay() {
  return <div className="smis-ag-grid-overlay" role="status" aria-live="polite">Loading records…</div>
}

function GridNoRowsOverlay() {
  return <div className="smis-ag-grid-overlay" role="status">No records to display.</div>
}
import './AgGridTable.css'
import { useDebounce } from 'use-debounce'
import { downloadInstitutionalPdf, printInstitutionalPdf } from '../lib/pdfmake'
import { useOptionalInstitutionSettings } from './InstitutionSettingsContext'

=======
>>>>>>> origin/feat/ag-grid-table-migration
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
<<<<<<< HEAD
<<<<<<< HEAD
  /** Optional Zod contract enforced before edited rows reach persistence handlers. */
  rowValidationSchema?: ZodType
=======
>>>>>>> origin/feat/ag-grid-table-migration
=======
  /** Optional Zod contract enforced for edited rows before caller persistence handlers run. */
  rowValidationSchema?: ZodType
>>>>>>> origin/feat/central-zod-validation-v2
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
<<<<<<< HEAD
<<<<<<< HEAD
  rowValidationSchema,
=======
>>>>>>> origin/feat/ag-grid-table-migration
=======
  rowValidationSchema,
>>>>>>> origin/feat/central-zod-validation-v2
  getRowId,
  className,
}: AgGridTableProps<TData>) {
  const [api, setApi] = useState<GridApi<TData> | null>(null)
  const [filter, setFilter] = useState(quickFilterText ?? '')
<<<<<<< HEAD
<<<<<<< HEAD
  // Keep typing immediate; debounce the expensive grid quick-filter pass.
  const [debouncedFilter] = useDebounce(quickFilterText ?? filter, 300)
  const [rowValidationErrors, setRowValidationErrors] = useState<Record<string, string[]>>({})
  const revertingCell = useRef(false)
  const institutionContext = useOptionalInstitutionSettings()
  const institution = institutionContext?.institution
  const institutionLoaded = institutionContext?.loaded ?? false
=======
>>>>>>> origin/feat/ag-grid-table-migration
=======
  const [rowValidationErrors, setRowValidationErrors] = useState<Record<string, string[]>>({})
  const revertingCell = useRef(false)
>>>>>>> origin/feat/central-zod-validation-v2
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> origin/feat/central-zod-validation-v2
  const handleCellValueChanged = useCallback((event: CellValueChangedEvent<TData>) => {
    if (revertingCell.current) return
    const rowKey = event.node.id ?? String(event.rowIndex ?? 'unknown-row')
    if (rowValidationSchema) {
      const result = rowValidationSchema.safeParse(event.data)
      if (!result.success) {
        const messages = result.error.issues.map(issue => `${issue.path.join('.') || 'Row'}: ${issue.message}`)
        setRowValidationErrors(current => ({ ...current, [rowKey]: messages }))
        revertingCell.current = true
        event.node.setDataValue(event.column.getColId(), event.oldValue)
        Promise.resolve().then(() => { revertingCell.current = false })
        return
      }
    }
    setRowValidationErrors(current => {
      if (!(rowKey in current)) return current
      const next = { ...current }
      delete next[rowKey]
      return next
    })
    onCellValueChanged?.(event)
  }, [onCellValueChanged, rowValidationSchema])
<<<<<<< HEAD

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
=======
>>>>>>> origin/feat/ag-grid-table-migration
=======
>>>>>>> origin/feat/central-zod-validation-v2

  return (
    <div className={['smis-ag-grid-shell', className].filter(Boolean).join(' ')}>
      {toolbar && <div className="smis-ag-grid-toolbar">
        <label className="smis-ag-grid-search">
          <span className="sr-only">Search table</span>
          <input value={filter} onChange={event => setFilter(event.target.value)} placeholder="Search records…" />
        </label>
        <span className="smis-ag-grid-count">{rows.length.toLocaleString('en-UG')} records</span>
        <button type="button" className="secondary-button" onClick={exportCsv} disabled={!api || rows.length === 0}>Export CSV</button>
<<<<<<< HEAD
        <button type="button" className="secondary-button" onClick={exportPdf} disabled={!api || rows.length === 0}>Export PDF</button>
        <button type="button" className="secondary-button" onClick={printPdf} disabled={!api || rows.length === 0}>Print PDF</button>
=======
>>>>>>> origin/feat/ag-grid-table-migration
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> origin/feat/central-zod-validation-v2
      {Object.entries(rowValidationErrors).map(([rowKey, messages]) => (
        <div key={rowKey} className="smis-ag-grid-validation" role="alert" aria-live="polite">
          <strong>Row {rowKey} was not saved because its data is invalid.</strong>
          <ul>{messages.map((message, index) => <li key={`${rowKey}-${index}`}>{message}</li>)}</ul>
        </div>
      ))}
<<<<<<< HEAD
=======
>>>>>>> origin/feat/ag-grid-table-migration
=======
>>>>>>> origin/feat/central-zod-validation-v2
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
<<<<<<< HEAD
            quickFilterText={debouncedFilter}
            rowSelection={rowSelection}
            suppressMultiSort={false}
            suppressMovableColumns={false}
            loadingOverlayComponent={GridLoadingOverlay}
            noRowsOverlayComponent={GridNoRowsOverlay}
            onGridReady={event => setApi(event.api)}
            onRowClicked={onRowClicked}
            onSelectionChanged={onSelectionChanged}
            onCellValueChanged={handleCellValueChanged}
=======
            quickFilterText={quickFilterText ?? filter}
            rowSelection={rowSelection}
            onGridReady={event => setApi(event.api)}
            onRowClicked={onRowClicked}
            onSelectionChanged={onSelectionChanged}
<<<<<<< HEAD
            onCellValueChanged={onCellValueChanged}
>>>>>>> origin/feat/ag-grid-table-migration
=======
            onCellValueChanged={handleCellValueChanged}
>>>>>>> origin/feat/central-zod-validation-v2
            getRowId={getRowId}
            suppressCellFocus={false}
          />
        </AgGridProvider>
      </div>
    </div>
  )
}
