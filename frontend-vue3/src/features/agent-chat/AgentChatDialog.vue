<template>
  <div class="agent-chat" :class="{ 'is-page': pageMode }">
    <div class="agent-chat-header">
      <div class="ach-left">
        <el-icon class="ach-icon"><ChatDotRound /></el-icon>
        <span class="ach-title">Agent 对话</span>
        <el-tag v-if="mockMode" size="small" type="warning" effect="plain">Mock 模式</el-tag>
        <el-tag v-else size="small" type="success" effect="plain">真实流式</el-tag>
      </div>
      <div class="ach-right">
        <el-button link size="small" @click="handleClear" :disabled="loading"><el-icon><Delete /></el-icon> 清空会话</el-button>
        <el-button v-if="!pageMode" link size="small" @click="$emit('close')"><el-icon><Close /></el-icon></el-button>
      </div>
    </div>
    <div class="agent-mode-bar">
      <span class="am-mode">模式：<strong>{{ mockMode ? '前端 Mock 流式' : '真实流式接口' }}</strong></span>
      <span v-if="!mockMode" class="am-endpoint">接口：{{ endpoint }}</span>
      <span v-else class="am-endpoint">未连接真实后端</span>
    </div>
    <el-alert class="agent-notice" type="warning" :closable="false" title="当前仅前端演示，未接真实业务 Tool 调用，不会访问薪资/社保/考勤/审批/权限/导入/导出等敏感接口或数据库。" />
    <div ref="listRef" class="agent-chat-body">
      <div v-if="!messages.length" class="agent-empty">
        <el-icon class="empty-icon"><ChatLineSquare /></el-icon>
        <p>开始与 Agent 对话吧</p>
        <p class="empty-sub">输入消息后按回车或点击发送</p>
      </div>
      <div v-for="msg in messages" :key="msg.id" class="agent-msg" :class="`agent-msg-${msg.role}`">
        <div class="msg-avatar">
          <el-icon v-if="msg.role === 'user'"><User /></el-icon>
          <el-icon v-else-if="msg.role === 'assistant'"><ChatDotRound /></el-icon>
          <el-icon v-else><InfoFilled /></el-icon>
        </div>
        <div class="msg-content">
          <div v-if="msg.role === 'assistant'" class="markdown-body" v-html="renderMd(msg.content)"></div>
          <div v-else class="msg-text">{{ msg.content }}</div>
          <div v-if="msg.streaming" class="msg-cursor">▋</div>
          <div v-if="msg.error" class="msg-error"><el-icon><WarningFilled /></el-icon> 生成失败：{{ error }}</div>
          <div v-if="msg.role === 'assistant' && !msg.streaming && msg.content" class="msg-actions">
            <el-button link size="small" @click="handleCopy(msg)"><el-icon><CopyDocument /></el-icon> 复制</el-button>
          </div>
        </div>
      </div>
    </div>
    <div class="agent-chat-footer">
      <div class="input-row">
        <el-input v-model="input" type="textarea" :rows="pageMode ? 3 : 2" resize="none" placeholder="输入消息，回车发送（Shift+Enter 换行）" :disabled="loading" @keydown.enter.exact.prevent="handleSend" />
        <div class="btn-group">
          <el-button v-if="loading" type="danger" @click="handleStop"><el-icon><VideoPause /></el-icon> 停止生成</el-button>
          <el-button v-else type="primary" :disabled="!input.trim()" @click="handleSend"><el-icon><Promotion /></el-icon> 发送</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Delete, Close, ChatLineSquare, User, InfoFilled, WarningFilled, CopyDocument, VideoPause, Promotion } from '@element-plus/icons-vue'
import { useChat } from './useChat'
import { renderMarkdownSafe } from './markdown'
import type { ChatMessage } from './types'

withDefaults(defineProps<{ pageMode?: boolean }>(), { pageMode: false })
defineEmits<{ (e: 'close'): void }>()

const input = ref('')
const listRef = ref<HTMLElement>()
const { messages, loading, error, canStop, mockMode, endpoint, send, stop, clear, copyAnswer } = useChat()

function renderMd(content: string): string { return renderMarkdownSafe(content) }
async function handleSend() { const text = input.value.trim(); if (!text || loading.value) return; input.value = ''; await send(text) }
function handleStop() { stop() }
function handleClear() { clear() }
async function handleCopy(msg: ChatMessage) { try { await copyAnswer(msg); ElMessage.success('已复制回答') } catch { ElMessage.error('复制失败') } }
function scrollToBottom() { nextTick(() => { if (listRef.value) { listRef.value.scrollTop = listRef.value.scrollHeight } }) }
watch(() => messages.value.map((m) => m.content).join(''), () => scrollToBottom())
watch(loading, () => scrollToBottom())
onMounted(() => scrollToBottom())
</script>

<style scoped>
.agent-chat { display: flex; flex-direction: column; height: 100%; background: #f7f8fa; }
.agent-chat.is-page { height: calc(100vh - 110px); border: 1px solid #e6e6e6; border-radius: 8px; overflow: hidden; }
.agent-chat-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #fff; border-bottom: 1px solid #ebeef5; }
.ach-left { display: flex; align-items: center; gap: 6px; }
.ach-icon { color: #409eff; font-size: 18px; }
.ach-title { font-weight: 600; margin-right: 4px; }
.ach-right { display: flex; align-items: center; }
.agent-notice { margin: 0; border-radius: 0; }
.agent-mode-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 14px; background: #f4f6fa; border-bottom: 1px solid #ebeef5; font-size: 12px; color: #606266; }
.am-mode strong { color: #303133; }
.am-endpoint { color: #909399; word-break: break-all; text-align: right; }
.agent-chat-body { flex: 1; overflow-y: auto; padding: 14px; }
.agent-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #909399; }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-sub { font-size: 12px; color: #c0c4cc; }
.agent-msg { display: flex; margin-bottom: 16px; }
.msg-avatar { flex: 0 0 32px; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px; color: #fff; font-size: 16px; }
.agent-msg-user .msg-avatar { background: #409eff; }
.agent-msg-assistant .msg-avatar { background: #67c23a; }
.agent-msg-system .msg-avatar { background: #909399; }
.msg-content { flex: 1; min-width: 0; background: #fff; border-radius: 8px; padding: 10px 12px; word-break: break-word; }
.agent-msg-user .msg-content { background: #ecf5ff; }
.msg-text { white-space: pre-wrap; }
.msg-cursor { display: inline-block; color: #409eff; animation: blink 1s steps(2, start) infinite; }
@keyframes blink { to { visibility: hidden; } }
.msg-error { color: #f56c6c; margin-top: 6px; font-size: 12px; }
.msg-actions { margin-top: 6px; text-align: right; }
.agent-chat-footer { padding: 10px 12px; background: #fff; border-top: 1px solid #ebeef5; }
.input-row { display: flex; gap: 10px; align-items: flex-end; }
.btn-group { flex: 0 0 auto; }
</style>
