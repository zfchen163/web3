/**
 * ChainVault V3 前端应用入口文件
 * 
 * 功能说明：
 * 1. 导入主应用组件（AppV3）
 * 2. 渲染到 DOM
 * 3. 启用 React 严格模式（开发环境下检查潜在问题）
 * 
 * 注意事项：
 * - 确保使用 AppV3（V3版本）而不是旧的 App
 * - StrictMode 会导致组件渲染两次（仅开发环境）
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './AppV3.tsx'  // 使用 V3 版本
import './index.css'

// 获取根 DOM 元素并渲染应用
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

