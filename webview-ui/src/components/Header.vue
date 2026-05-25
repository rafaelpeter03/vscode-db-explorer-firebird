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
  <div class="flex-1  flex-wrap flex justify-start items-center gap-4 whitespace-nowrap">
    <h1 class="text-xl font-semibold m-0 text-(--vscode-editor-foreground)">{{ title }}</h1>
    <p class="text-xs m-0 opacity-70 text-(--vscode-editor-foreground)">{{ subtitle }}</p>
  </div>
</template>
