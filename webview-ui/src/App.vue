<script setup lang="ts">
import { ref, onMounted, onUnmounted, shallowRef } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import { ClientSideRowModelModule, TextFilterModule, ValidationModule } from 'ag-grid-community';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-balham.css';

interface MessageEvent {
  data: {
    data?: any;
  };
}

const modules = [ClientSideRowModelModule, TextFilterModule, ValidationModule];

const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null;
const previousState: any = vscode ? (vscode.getState() || {}) : {};

// State
const isLoaded = ref(false);
const isEmpty = ref(true);
const title = ref('Result grid');
const subtitle = ref('Run a query to inspect rows here.');
const stats = ref<Array<{ label: string; value: string }>>([]);
const sqlQuery = ref('');
const showSql = ref(false);

const rowData = ref<any[]>([]);
const columnDefs = ref<any[]>([]);

const gridApi = shallowRef<any>(null);

const maxCellPreviewLength = ref(120);
const wrapCells = ref(previousState.wrapCells === true);
const compactRows = ref(previousState.compactRows !== false);
const recordsPerPage = ref<number | string>(50);
const columnWidths = ref<Record<string, number>>(previousState.columnWidths || {});

const persistState = () => {
  if (vscode) {
    vscode.setState({
      wrapCells: wrapCells.value,
      compactRows: compactRows.value,
      columnWidths: columnWidths.value
    });
  }
};

const escapeHtml = (value: any) => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// Handlers
const handleMessage = (event: MessageEvent) => {
  const payload = event.data.data;
  if (!payload) return;

  maxCellPreviewLength.value = payload.maxCellPreviewLength || 120;

  const summary = payload.summary || {};
  const execution = payload.execution || {};

  // Header
  const titleParts = [];
  if (summary.database) titleParts.push(summary.database);
  if (summary.host) titleParts.push(summary.host);
  title.value = titleParts.length ? titleParts.join(' • ') : 'Result grid';

  subtitle.value = summary.executedAt || 'Run a query to inspect rows here.';

  // Stats
  stats.value = [
    { label: 'Rows', value: summary.rowCount ?? '-' },
    { label: 'Columns', value: summary.columnCount ?? '-' },
    { label: 'Total', value: execution.totalMs != null ? `${execution.totalMs} ms` : '-' },
    { label: 'Connect', value: execution.connectMs != null ? `${execution.connectMs} ms` : '-' },
    { label: 'Execute', value: execution.executeMs != null ? `${execution.executeMs} ms` : '-' },
    { label: 'Fetch', value: execution.fetchMs != null ? `${execution.fetchMs} ms` : '-' },
    { label: 'Blob', value: execution.blobDecodeMs != null ? `${execution.blobDecodeMs} ms` : '-' },
  ];

  // SQL
  const sql = execution.sqlPreview || execution.sql || '';
  if (sql) {
    showSql.value = true;
    sqlQuery.value = sql;
  } else {
    showSql.value = false;
  }

  // Table
  if (!payload.tableBody || !payload.tableBody.length) {
    isEmpty.value = true;
    rowData.value = [];
    columnDefs.value = [];
  } else {
    isEmpty.value = false;

    // Convert array of arrays to objects
    rowData.value = payload.tableBody.map((row: any[], rowIndex: number) => {
      const rowObj: any = { _rowIndex: rowIndex };
      payload.tableHeader.forEach((_header: any, colIndex: number) => {
        rowObj[`col_${colIndex}`] = row[colIndex];
      });
      return rowObj;
    });

    // Column definitions
    columnDefs.value = [
      {
        headerName: '#',
        field: '_rowIndex',
        width: 44,
        pinned: 'left',
        sortable: false,
        filter: false,
        resizable: false,
        suppressMovable: true,
        valueGetter: (params: any) => params.node.rowIndex + 1,
        cellStyle: { backgroundColor: 'var(--vscode-editorWidget-background)', color: 'var(--vscode-descriptionForeground)' }
      },
      ...payload.tableHeader.map((column: any, index: number) => {
        return {
          headerName: column.title,
          field: `col_${index}`,
          filter: 'agTextColumnFilter',
          resizable: true,
          sortable: true,
          autoHeight: wrapCells.value,
          wrapText: wrapCells.value,
          cellRenderer: (params: any) => {
            const val = params.value;

            if (val === '__FIREBIRD_NULL__') {
               return `<span class="bg-gray-700 text-gray-300 px-1 py-0.5 rounded text-xs">NULL</span>`;
            }
            if (val == null) return '';

            const str = String(val);
            const lowerStr = str.toLowerCase().trim();
            const safeStr = escapeHtml(str);

            if (lowerStr === 'true') {
              return `<span class="text-green-500">✓ true</span>`;
            } else if (lowerStr === 'false') {
              return `<span class="text-red-500">✗ false</span>`;
            }

            if (str === '0' || str === '0.0' || str === '0.00') {
               return `<span class="opacity-50">${safeStr}</span>`;
            }

            const maxLen = maxCellPreviewLength.value;
            if (str.length > maxLen) {
              return escapeHtml(`${str.slice(0, maxLen - 1)}…`);
            }

            return safeStr;
          },
          comparator: (valueA: any, valueB: any) => {
            if (valueA === '__FIREBIRD_NULL__' || valueA == null) valueA = '';
            if (valueB === '__FIREBIRD_NULL__' || valueB == null) valueB = '';

            valueA = String(valueA).trim();
            valueB = String(valueB).trim();

            const numA = parseFloat(valueA);
            const numB = parseFloat(valueB);

            if (!isNaN(numA) && !isNaN(numB) && valueA !== '' && valueB !== '') {
              return numA - numB;
            }

            return valueA.localeCompare(valueB);
          }
        };
      })
    ];

    recordsPerPage.value = payload.recordsPerPage || 50;
  }

  isLoaded.value = true;
};

onMounted(() => {
  window.addEventListener('message', handleMessage);

  if (vscode) {
    vscode.postMessage({ command: 'getData', data: {} });
  } else {
    // Mock data for local testing
    handleMessage({
      data: {
        data: {
          summary: { database: 'TEST_DB', host: 'localhost', executedAt: '12:00:00', rowCount: 2, columnCount: 2 },
          execution: { totalMs: 10, sql: 'SELECT * FROM TEST;' },
          tableHeader: [{ title: 'ID' }, { title: 'NAME' }],
          tableBody: [[1, '<script>alert(1)</'+'script>']]
        }
      }
    } as any);
  }
});

onUnmounted(() => {
  window.removeEventListener('message', handleMessage);
});

const onGridReady = (params: any) => {
  gridApi.value = params.api;
  applyStoredColumnWidths();
};

const onColumnResized = (params: any) => {
  if (!params.finished) return;
  const columns = params.api ? params.api.getColumns() : gridApi.value.getColumns();
  if (columns) {
    columns.forEach((col: any, index: number) => {
      const width = col.getActualWidth();
      if (width) {
        columnWidths.value[index] = width;
      }
    });
    persistState();
  }
};

const applyStoredColumnWidths = () => {
  if (!gridApi.value) return;
  const columns = gridApi.value.getColumns();
  if (columns) {
    columns.forEach((col: any, index: number) => {
      const storedWidth = columnWidths.value[index];
      if (storedWidth && gridApi.value.setColumnWidths) {
        gridApi.value.setColumnWidths([{ key: col.getColId(), newWidth: storedWidth }]);
      }
    });
  }
};

const copySql = () => {
  navigator.clipboard.writeText(sqlQuery.value);
};

const downloadCsv = () => {
  if (gridApi.value) {
    gridApi.value.exportDataAsCsv();
  }
};
</script>

<template>
  <div class="results-shell bg-vscode-editor text-vscode-foreground">
    <header class="results-header">
      <div>
        <h1 class="text-xl font-bold">{{ title }}</h1>
        <p class="text-sm opacity-70">{{ subtitle }}</p>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div v-for="stat in stats" :key="stat.label" class="flex flex-col">
          <span class="opacity-60 text-xs">{{ stat.label }}</span>
          <span>{{ stat.value }}</span>
        </div>
      </div>
    </header>

    <section v-if="showSql" class="p-3 border-b border-vscode-border flex items-start gap-4">
      <div class="font-bold text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">SQL</div>
      <div class="font-mono text-sm flex-1 break-all">{{ sqlQuery }}</div>
      <button @click="copySql" class="p-1 hover:bg-gray-700 rounded" title="Copy SQL">📋</button>
    </section>

    <section v-if="isEmpty && isLoaded" class="flex-1 flex flex-col items-center justify-center opacity-50 p-8">
      <h2 class="text-2xl font-bold mb-2">No rows to display</h2>
      <p>The command ran, but no records were returned for the current result set.</p>
    </section>

    <section v-if="!isEmpty && isLoaded" class="table-shell flex flex-col relative h-full w-full">
       <ag-grid-vue
          style="width: 100%; height: 100%;"
          class="ag-theme-balham ag-theme-custom"
          :columnDefs="columnDefs"
          :rowData="rowData"
          :modules="modules"
          :rowHeight="compactRows ? 28 : 32"
          :headerHeight="40"
          :defaultColDef="{
            resizable: true,
            sortable: true,
            filter: true
          }"
          :pagination="true"
          :paginationPageSize="recordsPerPage === 'All records' ? undefined : Number(recordsPerPage)"
          :paginationPageSizeSelector="[50, 100, 500, 1000]"
          @grid-ready="onGridReady"
          @column-resized="onColumnResized"
       />
    </section>

    <footer v-if="!isEmpty && isLoaded" class="p-2 border-t border-vscode-border flex justify-end">
      <button @click="downloadCsv" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors">
        ⬇️ CSV
      </button>
    </footer>
  </div>
</template>

<style>
/* Base VSCode Theme Variables mapped for tailwind and grid */
:root {
  --vscode-editor-background: var(--vscode-editor-background, #1e1e1e);
  --vscode-editor-foreground: var(--vscode-editor-foreground, #d4d4d4);
  --vscode-panel-border: var(--vscode-panel-border, #444);
}

.bg-vscode-editor { background-color: var(--vscode-editor-background); }
.text-vscode-foreground { color: var(--vscode-editor-foreground); }
.border-vscode-border { border-color: var(--vscode-panel-border); }

.ag-theme-custom {
  --ag-background-color: var(--vscode-editor-background) !important;
  --ag-foreground-color: var(--vscode-editor-foreground) !important;
  --ag-border-color: var(--vscode-panel-border) !important;
  --ag-header-background-color: var(--vscode-editor-background) !important;
  --ag-header-foreground-color: var(--vscode-editor-foreground) !important;
  --ag-row-hover-color: rgba(255, 255, 255, 0.1) !important;
  --ag-header-column-separator-display: block !important;
  --ag-header-column-separator-color: var(--vscode-panel-border) !important;
}
</style>