<template>
  <div class="agent-float-root">
    <transition name="agent-panel">
      <div v-if="open" class="agent-panel">
        <AgentChatDialog @close="open = false" />
      </div>
    </transition>
    <button v-if="!open" class="agent-fab" @click="open = true" aria-label="打开 Agent 对话">
      <el-icon><ChatDotRound /></el-icon>
    </button>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { ChatDotRound } from '@element-plus/icons-vue'
import AgentChatDialog from './AgentChatDialog.vue'
const open = ref(false)
</script>
<style scoped>
.agent-float-root { position: fixed; right: 24px; bottom: 24px; z-index: 9999; }
.agent-fab { width: 52px; height: 52px; border-radius: 50%; border: none; background: #409eff; color: #fff; font-size: 24px; cursor: pointer; box-shadow: 0 4px 16px rgba(64,158,255,0.45); display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
.agent-fab:hover { transform: scale(1.08); }
.agent-panel { width: 380px; height: 560px; max-height: 80vh; background: #f7f8fa; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.2); overflow: hidden; display: flex; flex-direction: column; position: absolute; right: 0; bottom: 0; }
.agent-panel-enter-active, .agent-panel-leave-active { transition: opacity 0.2s, transform 0.2s; }
.agent-panel-enter-from, .agent-panel-leave-to { opacity: 0; transform: translateY(20px); }
</style>
