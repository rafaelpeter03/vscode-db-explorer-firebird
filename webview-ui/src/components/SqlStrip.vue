<script setup lang="ts">
defineProps<{
  sql: string;
}>();

const emit = defineEmits<{
  (e: 'copy', text: string): void
}>();
</script>

<template>
  <div class="mt-2 bg-[var(--vscode-textCodeBlock-background)] border border-[var(--vscode-panel-border)] rounded overflow-hidden flex items-stretch text-sm group">
    <div class="bg-[var(--vscode-editor-inactiveSelectionBackground)] px-2 py-1 flex items-center justify-center font-semibold text-xs border-r border-[var(--vscode-panel-border)]">
      SQL
    </div>
    <div class="flex-1 px-3 py-1 font-mono overflow-x-auto whitespace-nowrap text-xs flex items-center opacity-90">
      {{ sql }}
    </div>
    <button 
      @click="emit('copy', sql)" 
      class="px-3 hover:bg-[var(--vscode-list-hoverBackground)] cursor-pointer border-l border-transparent group-hover:border-[var(--vscode-panel-border)] transition-colors opacity-50 hover:opacity-100"
      title="Copy SQL"
    >
      📋
    </button>
  </div>
</template>
