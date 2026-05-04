<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Loader from './components/Loader.vue';
import Header from './components/Header.vue';
import ExecutionStats from './components/ExecutionStats.vue';
import SqlStrip from './components/SqlStrip.vue';
import EmptyState from './components/EmptyState.vue';
import ResultGrid from './components/ResultGrid.vue';
import FooterActions from './components/FooterActions.vue';

// Define vscode api interface
declare function acquireVsCodeApi(): any;
const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null;

// State
const isLoaded = ref(false);
const runtimeData = ref<any>(null);

// Methods
const handleMessage = (event: MessageEvent) => {
  const message = event.data;
  if (message.command === 'message' || message.data) {
    runtimeData.value = message.data;
    isLoaded.value = true;
  }
};

const copyToClipboard = (text: string) => {
  if (text) navigator.clipboard.writeText(text);
};

onMounted(() => {
  window.addEventListener('message', handleMessage);
  
  if (vscode) {
    vscode.postMessage({ command: 'getData', data: {} });
  } else {
    // Development mock data
    setTimeout(() => {
      runtimeData.value = {
        tableHeader: [{ title: 'ID' }, { title: 'Name' }],
        tableBody: [[1, 'Alice'], [2, 'Bob']],
        summary: { rowCount: 2, columnCount: 2, database: 'test.fdb', host: 'localhost', executedAt: new Date().toLocaleString() },
        execution: { totalMs: 10, sql: 'SELECT * FROM test' },
        recordsPerPage: '50'
      };
      isLoaded.value = true;
    }, 1000);
  }
});

onUnmounted(() => {
  window.removeEventListener('message', handleMessage);
});
</script>

<template>
  <div class="h-screen w-full flex flex-col bg-[var(--vscode-editor-background)] text-[var(--vscode-editor-foreground)] font-sans overflow-hidden">
    <Loader v-if="!isLoaded" />
    
    <div v-else class="flex flex-col h-full overflow-hidden">
      <div class="flex-none p-4 pb-2">
        <div class="flex justify-between items-start mb-2">
          <Header :summary="runtimeData?.summary" />
          <ExecutionStats :execution="runtimeData?.execution" :summary="runtimeData?.summary" />
        </div>
        
        <SqlStrip v-if="runtimeData?.execution?.sql" :sql="runtimeData?.execution?.sqlPreview || runtimeData?.execution?.sql" @copy="copyToClipboard" />
      </div>
      
      <div class="flex-1 min-h-0 overflow-hidden relative border-t border-[var(--vscode-panel-border)]">
        <EmptyState v-if="!runtimeData?.tableBody?.length" />
        <ResultGrid 
          v-else 
          :header="runtimeData.tableHeader" 
          :body="runtimeData.tableBody" 
          :recordsPerPage="runtimeData.recordsPerPage" 
        />
      </div>
      
      <FooterActions v-if="runtimeData?.tableBody?.length" :runtimeData="runtimeData" @copy="copyToClipboard" />
    </div>
  </div>
</template>
