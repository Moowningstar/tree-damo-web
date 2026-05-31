# Three-Damo Frontend

基于 React + Vite + Tailwind CSS 的智能对话系统前端，支持手势识别游戏。

## ✨ 特性

- 💬 **实时流式对话** - 逐字显示 AI 回复
- 🎮 **手势识别游戏** - 石头剪刀布小游戏，支持摄像头手势控制
- 🤚 **手势控制** - MediaPipe Hands 实时手势识别
- 📱 **响应式设计** - 移动端和桌面端完美适配
- 🎨 **现代化 UI** - Tailwind CSS + 流畅动画

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Bun (推荐) 或 npm/yarn

### 安装依赖

```bash
# 使用 Bun (推荐)
bun install

# 或使用 npm
npm install
```

### 配置环境变量

创建 `.env` 文件：

```env
# 后端 API 地址
VITE_API_BASE_URL=http://localhost:8000
```

### 启动开发服务器

```bash
# 使用 Bun
bun run dev

# 或使用 npm
npm run dev
```

访问 http://localhost:5173

### 生产构建

```bash
# 构建
bun run build

# 预览构建产物
bun run preview
```

## 📁 项目结构

```
frontend/
├── src/
│   ├── components/
│   │   ├── ChatInput.jsx          # 输入框组件
│   │   ├── ChatMessage.jsx        # 消息组件
│   │   ├── GestureControl.jsx     # 手势识别组件
│   │   └── RockPaperScissors.jsx  # 石头剪刀布游戏
│   ├── services/
│   │   └── chatService.js         # API 服务
│   ├── App.jsx                    # 主应用
│   └── main.jsx                   # 入口文件
├── public/
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🎮 功能说明

### 1. AI 对话

- 实时流式响应
- 会话历史管理
- RAG 知识库问答

### 2. 手势识别游戏

- 点击按钮选择石头/剪刀/布
- 或使用手势控制：
  - ✊ 握拳 → 石头
  - ✋ 张开手掌 → 布
  - ✌️ 胜利手势 → 剪刀
- 实时计分系统
- 3 秒倒计时

### 3. 手势控制

- MediaPipe Hands 实时手部追踪
- 21 个手部关键点识别
- 支持多种手势：
  - 👍 竖大拇指
  - ✋ 张开手掌
  - ✊ 握拳
  - ✌️ 胜利手势
  - 👌 OK 手势

## 🔧 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | 后端 API 地址 | `http://localhost:8000` |

## 🚀 部署

### EdgeOne Pages / Vercel / Netlify

1. **连接 Git 仓库**

2. **配置构建设置**：
   - 框架预设: Vite
   - 构建命令: `bun run build` 或 `npm run build`
   - 输出目录: `dist`
   - Node 版本: 18.x

3. **添加环境变量**：
   ```
   VITE_API_BASE_URL=https://your-backend-api.com
   ```

4. **部署**

### Docker

```bash
# 构建镜像
docker build -t three-damo-frontend .

# 运行容器
docker run -p 80:80 three-damo-frontend
```

## 📝 技术栈

- **框架**: React 18
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **手势识别**: MediaPipe Hands
- **包管理器**: Bun

## 🐛 故障排查

### 手势识别不工作

- 确保使用 HTTPS 或 localhost
- 检查浏览器摄像头权限
- 确认 MediaPipe CDN 可访问

### 无法连接后端

- 检查 `VITE_API_BASE_URL` 配置
- 确认后端服务正在运行
- 检查 CORS 配置

## 📄 License

MIT
