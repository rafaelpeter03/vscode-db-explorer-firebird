<script setup lang="ts">
import { computed } from "vue";
import { AgGridVue } from "ag-grid-vue3";
import { AllCommunityModule, ModuleRegistry, themeBalham } from "ag-grid-community";

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
      cellClass:
        "text-center text-[var(--vscode-descriptionForeground)] font-mono text-xs opacity-70 border-r border-[var(--vscode-panel-border)] bg-[var(--vscode-editor-inactiveSelectionBackground)]",
      valueGetter: (params: any) => params.node.rowIndex + 1,
    },
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
          const colorClass = isTrue
            ? "text-[var(--vscode-testing-iconPassed)]"
            : "text-[var(--vscode-testing-iconFailed)]";
          return `<span class="flex items-center gap-1 font-mono"><span class="${colorClass}">${icon}</span><span>${value}</span></span>`;
        }

        const text = value == null ? "" : String(value);
        if (text === "0" || text === "0.0" || text === "0.00") {
          return `<span class="opacity-50">${text}</span>`;
        }

        return `<span class="font-sans whitespace-nowrap overflow-hidden text-ellipsis block w-full" title="${text.replace(
          /"/g,
          "&quot;"
        )}">${text}</span>`;
      },
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
  return props.recordsPerPage === "All records"
    ? 500
    : parseInt(props.recordsPerPage) || 50;
});
</script>

<template>
  <div
    class="h-full w-full bg-(--vscode-editor-background) text-(--vscode-editor-foreground)"
  >
    <ag-grid-vue
      :theme="themeBalham"
      class="ag-theme-custom h-full w-full"
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
/* AG Grid Custom Theme */
.ag-theme-custom {
  --ag-grid-size: 4px;
  --ag-list-item-height: 28px;
  --ag-row-height: 32px;
  --ag-font-family: var(--vscode-font-family);
  --ag-font-size: 11px;
  --ag-foreground-color: var(--vscode-editor-foreground);
  --ag-background-color: var(--vscode-editor-background);
  --ag-secondary-background-color: var(--vscode-sideBar-background);
  --ag-border-color: var(--vscode-panel-border);
  --ag-header-background-color: var(--vscode-editorGroupHeader-tabsBackground);
  --ag-header-foreground-color: var(--vscode-editor-foreground);
  --ag-header-cell-border-color: var(--vscode-panel-border);
  --ag-selected-row-background-color: color-mix(
    in srgb,
    var(--vscode-list-selectionBackground) 40%,
    transparent
  );
  --ag-row-hover-color: var(--vscode-list-hoverBackground);
}

.ag-theme-custom.ag-root {
  font-size: 12px;
  font-family: var(--vscode-font-family);
  background-color: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
}

.ag-theme-custom .ag-root-wrapper {
  border: none;
  border-radius: 0;
  background-color: var(--vscode-editor-background);
}

.ag-theme-custom .ag-header-row {
  background-color: var(--vscode-editorGroupHeader-tabsBackground);
  border-bottom: 1px solid var(--vscode-panel-border);
}

.ag-theme-custom .ag-header-cell {
  background-color: var(--vscode-editorGroupHeader-tabsBackground);
  color: var(--vscode-editor-foreground);
  border-right: 2px solid var(--vscode-editor-background);
  font-weight: 600;
  padding: 8px;
  display: flex;
  align-items: center;
}

.ag-theme-custom .ag-header-cell :hover {
  filter: brightness(150);
}

.ag-theme-custom .ag-header-cell-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.ag-theme-custom .ag-row {
  background-color: var(--vscode-editor-background);
  border-bottom: 1px solid color-mix(in srgb, var(--vscode-panel-border) 50%, transparent);
}

.ag-theme-custom .ag-row:hover .ag-cell {
  background-color: var(--vscode-list-hoverBackground);
}

.ag-theme-custom .ag-row-selected .ag-cell {
  background-color: color-mix(
    in srgb,
    var(--vscode-list-selectionBackground) 40%,
    transparent
  );
}

.ag-theme-custom .ag-cell {
  background-color: transparent;
  color: var(--vscode-editor-foreground);
  border-right: 1px solid var(--vscode-panel-border);
  padding: 5px 5px;
  display: flex;
  align-items: center;
}

.ag-theme-custom .ag-cell-value {
  overflow: hidden;
  text-overflow: ellipsis;
}

.ag-cell-wrapper {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ag-theme-custom .ag-floating-filter-button {
  background-color: var(--vscode-button-secondaryBackground);
  color: var(--vscode-button-secondaryForeground);
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 4px 6px;
  cursor: pointer;
}

.ag-theme-custom .ag-floating-filter-button:hover {
  background-color: var(--vscode-button-secondaryHoverBackground);
}

.ag-theme-custom .ag-floating-filter-button-button {
  background-color: var(--vscode-button-secondaryBackground);
  border-color: var(--vscode-panel-border);
}

.ag-theme-custom .ag-input-field-input {
  background-color: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
  border-radius: 4px;
  padding: 5px 5px 5px 25px;
  font-size: 12px;
  font-family: var(--vscode-font-family);
}

.ag-theme-custom .ag-input-field-input:focus {
  border-color: var(--vscode-focusBorder);
  outline: none;
}

.ag-paging-panel {
  justify-content: flex-end;
  background-color: var(--vscode-sideBar-background);
}
.ag-theme-custom .ag-pagination {
  background-color: var(--vscode-sideBar-background);
  border-top: 1px solid var(--vscode-panel-border);
  padding: 8px 12px;
}

.ag-theme-custom .ag-paging-button {
  background-color: var(--vscode-button-secondaryBackground);
  color: var(--vscode-button-secondaryForeground);
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  margin: 0 2px;
}

.ag-theme-custom .ag-paging-button:hover:not(.ag-disabled) {
  background-color: var(--vscode-button-secondaryHoverBackground);
}

.ag-theme-custom .ag-paging-button.ag-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ag-theme-custom .ag-paging-page-size-selector-button {
  background-color: var(--vscode-button-secondaryBackground);
  color: var(--vscode-button-secondaryForeground);
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
}

.ag-theme-custom .ag-paging-page-size-selector-button:hover {
  background-color: var(--vscode-button-secondaryHoverBackground);
}

.ag-theme-custom .ag-paging-page-size-selector-button-item {
  background-color: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-panel-border);
}

.ag-theme-custom .ag-pinned-left-cols-container {
  background-color: var(--vscode-sideBar-background);
}

.ag-theme-custom .ag-pinned-right-cols-container {
  background-color: var(--vscode-sideBar-background);
}

.ag-cell-row-index {
  color: var(--vscode-descriptionForeground) !important;
  text-align: right;
  white-space: nowrap;
  font-weight: 400;
  opacity: 0.7;
}

.cell-preview {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  min-width: 0;
}

body.wrap-cells .cell-preview,
.cell-preview.wrap {
  white-space: pre-wrap;
  overflow: visible;
  text-overflow: clip;
  word-break: break-word;
}
</style>
