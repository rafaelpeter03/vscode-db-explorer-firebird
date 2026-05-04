<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  summary?: any;
}>();

const title = computed(() => {
  if (!props.summary) return 'Result grid';
  const parts = [];
  if (props.summary.database) parts.push(props.summary.database);
  if (props.summary.host) parts.push(props.summary.host);
  return parts.length ? parts.join(' • ') : 'Result grid';
});

const subtitle = computed(() => {
  return props.summary?.executedAt || 'Run a query to inspect rows here.';
});
</script>

<template>
  <div class="flex-1">
    <h1 class="text-xl font-semibold m-0 text-[var(--vscode-editor-foreground)]">{{ title }}</h1>
    <p class="text-xs m-0 mt-1 opacity-70 text-[var(--vscode-editor-foreground)]">{{ subtitle }}</p>
  </div>
</template>
