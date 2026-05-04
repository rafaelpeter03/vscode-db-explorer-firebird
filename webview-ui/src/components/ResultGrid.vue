<script setup lang="ts">
import { computed } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

const props = defineProps<{
  header: any[];
  body: any[][];
  recordsPerPage: string;
}>();

const isBooleanValue = (value: any) => {
  if (value === "__FIREBIRD_NULL__" || value == null) return false;
  const str = String(value).toLowerCase().trim();
  return str === "true" || str === "false";
};

// Generate colDefs based on header
const columnDefs = computed(() => {
  if (!props.header || !props.header.length) return [];
  
  const defs = [
    {
      headerName: "#",
      field: "_rowIndex",
      width: 50,
      pinned: "left" as const,
      sortable: false,
      filter: false,
      resizable: false,
      suppressMovable: true,
      cellClass: "text-center text-[var(--vscode-descriptionForeground)] font-mono text-xs opacity-70 border-r border-[var(--vscode-panel-border)] bg-[var(--vscode-editor-inactiveSelectionBackground)]",
      valueGetter: (params: any) => params.node.rowIndex + 1
    }
  ];

  props.header.forEach((col, index) => {
    defs.push({
      headerName: col.title,
      field: `col_${index}`,
      filter: "agTextColumnFilter",
      resizable: true,
      sortable: true,
      cellRenderer: (params: any) => {
        const value = params.value;
        if (value === "__FIREBIRD_NULL__") {
          return `<span class="px-1 py-0.5 rounded text-[10px] font-bold bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-button-secondaryForeground)] opacity-70">NULL</span>`;
        }
        
        if (isBooleanValue(value)) {
          const isTrue = String(value).toLowerCase().trim() === "true";
          const icon = isTrue ? "✓" : "✗";
          const colorClass = isTrue ? "text-[var(--vscode-testing-iconPassed)]" : "text-[var(--vscode-testing-iconFailed)]";
          return `<span class="flex items-center gap-1 font-mono"><span class="${colorClass}">${icon}</span><span>${value}</span></span>`;
        }
        
        const text = value == null ? "" : String(value);
        if (text === "0" || text === "0.0" || text === "0.00") {
          return `<span class="opacity-50">${text}</span>`;
        }
        
        return `<span class="font-sans whitespace-nowrap overflow-hidden text-ellipsis block w-full" title="${text.replace(/"/g, '&quot;')}">${text}</span>`;
      }
    } as any);
  });
  
  return defs;
});

const rowData = computed(() => {
  if (!props.body || !props.body.length) return [];
  
  return props.body.map((row, rowIndex) => {
    const rowObj: any = { _rowIndex: rowIndex };
    props.header.forEach((_, colIndex) => {
      rowObj[`col_${colIndex}`] = row[colIndex];
    });
    return rowObj;
  });
});

const defaultColDef = {
  resizable: true,
  sortable: true,
  filter: true,
};

const paginationPageSize = computed(() => {
  return props.recordsPerPage === "All records" ? 500 : parseInt(props.recordsPerPage) || 50;
});
</script>

<template>
  <div class="h-full w-full bg-[var(--vscode-editor-background)] text-[var(--vscode-editor-foreground)]">
    <ag-grid-vue
      class="ag-theme-vscode h-full w-full"
      :columnDefs="columnDefs"
      :rowData="rowData"
      :defaultColDef="defaultColDef"
      :rowHeight="28"
      :headerHeight="32"
      :pagination="true"
      :paginationPageSize="paginationPageSize"
      :enableCellTextSelection="true"
      :suppressDragLeaveHidesColumns="true"
    >
    </ag-grid-vue>
  </div>
</template>

<style>
/* Base imports for AG Grid */
@import 'ag-grid-community/styles/ag-grid.css';
@import 'ag-grid-community/styles/ag-theme-balham.css';

/* Custom VS Code Theme for AG Grid */
.ag-theme-vscode {
  --ag-font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  --ag-font-size: 13px;
  --ag-background-color: var(--vscode-editor-background);
  --ag-foreground-color: var(--vscode-editor-foreground);
  --ag-border-color: var(--vscode-panel-border);
  --ag-header-background-color: var(--vscode-editor-inactiveSelectionBackground);
  --ag-header-foreground-color: var(--vscode-editor-foreground);
  --ag-row-hover-color: var(--vscode-list-hoverBackground);
  --ag-selected-row-background-color: var(--vscode-list-activeSelectionBackground);
  --ag-header-column-separator-color: var(--vscode-panel-border);
  --ag-cell-horizontal-border: solid var(--ag-border-color);
  --ag-row-border-color: var(--vscode-panel-border);
  --ag-odd-row-background-color: transparent;
  --ag-control-panel-background-color: var(--vscode-editor-background);
}

.ag-theme-vscode .ag-root-wrapper {
  border: none;
}

.ag-theme-vscode .ag-header-cell {
  font-weight: 600;
  border-right: 1px solid var(--vscode-panel-border);
}

.ag-theme-vscode .ag-cell {
  display: flex;
  align-items: center;
  border-right: 1px solid var(--vscode-panel-border);
  padding: 0 8px;
}

.ag-theme-vscode .ag-cell-focus {
  border: 1px solid var(--vscode-focusBorder) !important;
  outline: none;
}

.ag-theme-vscode .ag-paging-panel {
  border-top: 1px solid var(--vscode-panel-border);
  background-color: var(--vscode-editor-inactiveSelectionBackground);
  color: var(--vscode-editor-foreground);
}

.ag-theme-vscode .ag-paging-button {
  color: var(--vscode-button-foreground);
  background-color: var(--vscode-button-background);
  border: none;
  border-radius: 2px;
  padding: 2px 8px;
  cursor: pointer;
}

.ag-theme-vscode .ag-paging-button:hover {
  background-color: var(--vscode-button-hoverBackground);
}

.ag-theme-vscode .ag-paging-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Fix text color in paging panel dropdown and inputs */
.ag-theme-vscode input, .ag-theme-vscode select {
  background-color: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border);
}
</style>
