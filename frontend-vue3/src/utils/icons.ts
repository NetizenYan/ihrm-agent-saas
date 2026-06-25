import type { App } from 'vue'
import {
  Odometer, ChatDotRound, OfficeBuilding, Briefcase, Setting,
  User, UserFilled, Key, Avatar, Wallet, Calendar, Money,
  DocumentChecked, Expand, Fold
} from '@element-plus/icons-vue'

// 仅注册通过字符串名称解析的图标（Sidebar 菜单 meta.icon、Navbar 折叠按钮）。
// 各业务页面自行按需具名 import 所用图标，避免将整包 @element-plus/icons-vue 打入主 chunk。
const NAME_RESOLVED_ICONS = {
  Odometer, ChatDotRound, OfficeBuilding, Briefcase, Setting,
  User, UserFilled, Key, Avatar, Wallet, Calendar, Money,
  DocumentChecked, Expand, Fold
}

export function registerGlobalIcons(app: App): void {
  for (const [key, component] of Object.entries(NAME_RESOLVED_ICONS)) {
    app.component(key, component as any)
  }
}
