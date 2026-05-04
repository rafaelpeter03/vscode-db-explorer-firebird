<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  execution?: any;
  summary?: any;
}>();

const formatMs = (val: any) => val != null ? `${val} ms` : '-';
const safeVal = (val: any) => val != null ? String(val) : '-';

const stats = computed(() => [
  { label: 'Rows', value: safeVal(props.summary?.rowCount) },
  { label: 'Columns', value: safeVal(props.summary?.columnCount) },
  { label: 'Total', value: formatMs(props.execution?.totalMs) },
  { label: 'Connect', value: formatMs(props.execution?.connectMs) },
  { label: 'Execute', value: formatMs(props.execution?.executeMs) },
  { label: 'Fetch', value: formatMs(props.execution?.fetchMs) },
  { label: 'Blob', value: formatMs(props.execution?.blobDecodeMs) }
]);
</script>

<template>
  <div class="flex flex-wrap gap-x-4 gap-y-1 justify-end text-xs ml-4">
    <div v-for="stat in stats" :key="stat.label" class="flex items-center gap-1">
      <span class="opacity-60">{{ stat.label }}:</span>
      <span class="font-mono font-semibold">{{ stat.value }}</span>
    </div>
  </div>
</template>
