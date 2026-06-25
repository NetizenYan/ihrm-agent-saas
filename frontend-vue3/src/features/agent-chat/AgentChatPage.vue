<template>
  <div class="agent-chat-page">
    <AgentChatDialog page-mode />
  </div>
</template>
<script setup lang="ts">
import AgentChatDialog from './AgentChatDialog.vue'
</script>
<style scoped>
.agent-chat-page { max-width: 960px; margin: 0 auto; }
</style>
