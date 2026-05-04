<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  runtimeData: any;
}>();

const emit = defineEmits<{
  (e: 'copy', text: string): void
}>();

const copyFeedback = ref(false);

const buildAndCopyCsv = () => {
  if (!props.runtimeData || !props.runtimeData.tableHeader || !props.runtimeData.tableBody) return;

  const headers = props.runtimeData.tableHeader.map((h: any) => h.title);
  const rows = props.runtimeData.tableBody;

  const csvContent = [
    headers.map((h: string) => `"${String(h).replace(/"/g, '""')}"`).join(","),
    ...rows.map((row: any[]) => row.map((cell: any) => {
      if (cell === "__FIREBIRD_NULL__" || cell == null) return "";
      const value = String(cell).replace(/"/g, '""');
      return /[,"\n]/g.test(value) ? `"${value}"` : value;
    }).join(","))
  ].join("\n");

  emit('copy', csvContent);
  showFeedback();
};

const showFeedback = () => {
  copyFeedback.value = true;
  setTimeout(() => {
    copyFeedback.value = false;
  }, 2000);
};
</script>

<template>
  <div class="p-2 border-t border-[var(--vscode-panel-border)] flex items-center justify-end bg-[var(--vscode-editor-background)] text-xs h-10 relative shrink-0">
    <div class="flex gap-2">
      <!-- We can't easily do file download in a simple webview without messaging back, but we can do copy. -->
      <!-- Keeping the CSV copy as it is fully frontend. -->
      <button 
        @click="buildAndCopyCsv"
        class="flex items-center gap-1.5 px-3 py-1 bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] hover:bg-[var(--vscode-button-hoverBackground)] rounded transition-colors cursor-pointer border-none font-medium"
      >
        📋 Copy as CSV
      </button>
    </div>
    
    <div 
      class="absolute right-32 top-2 bg-[var(--vscode-notificationsInfoIcon-foreground)] text-white px-3 py-1 rounded shadow-lg transition-all duration-300"
      :class="copyFeedback ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'"
    >
      ✓ Copied to clipboard
    </div>
  </div>
</template>
