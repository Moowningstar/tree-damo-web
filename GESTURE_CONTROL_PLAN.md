# 手势控制演示系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个独立的网页手势控制演示系统，展示滚动、点击、文本选择和图片缩放四种手势交互

**Architecture:** 复用现有 GestureControl 组件的 MediaPipe Hands 识别能力，新建 GestureInterpreter 将原始关键点数据转换为高级手势事件，通过 ActionExecutor 的四个子控制器执行具体交互，最终在 DemoPage 演示页面中集成展示

**Tech Stack:** React 18, MediaPipe Hands 0.4, Tailwind CSS 3.4, Vite 5

---

## 文件结构

```
src/
├── components/
│   ├── GestureControl.jsx          (已存在 - 复用)
│   └── gesture-demo/
│       ├── GestureInterpreter.js   (新建 - 手势解释器)
│       ├── controllers/
│       │   ├── ScrollController.js (新建 - 滚动控制)
│       │   ├── ClickController.js  (新建 - 点击控制)
│       │   ├── SelectionController.js (新建 - 文本选择)
│       │   └── ZoomController.js   (新建 - 图片缩放)
│       ├── VirtualCursor.jsx       (新建 - 虚拟光标)
│       └── GestureDemo.jsx         (新建 - 演示页面)
├── utils/
│   └── gestureHelpers.js           (新建 - 工具函数)
└── main.jsx                        (修改 - 添加路由)
```

---

## Task 1: 创建手势工具函数库

**Files:**
- Create: `src/utils/gestureHelpers.js`

- [ ] **Step 1: 创建基础工具函数**

```javascript
// src/utils/gestureHelpers.js

/**
 * 计算两点之间的欧氏距离
 */
export function calculateDistance(point1, point2) {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  const dz = (point1.z || 0) - (point2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 计算手指是否伸展（基于关键点 Y 轴位置）
 */
export function isFingerExtended(tip, mcp) {
  return tip.y < mcp.y;
}

/**
 * 防抖函数 - 限制函数执行频率
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数 - 保证函数在指定时间内只执行一次
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 将手部坐标映射到屏幕坐标
 */
export function mapHandToScreen(handPoint) {
  return {
    x: handPoint.x * window.innerWidth,
    y: handPoint.y * window.innerHeight
  };
}

/**
 * 计算速度（像素/秒）
 */
export function calculateVelocity(currentPos, previousPos, deltaTime) {
  if (!previousPos || deltaTime === 0) return 0;
  
  const distance = Math.abs(currentPos.y - previousPos.y);
  return (distance / deltaTime) * 1000; // 转换为每秒
}
```

- [ ] **Step 2: 提交工具函数**

```bash
cd three-damo-web
git add src/utils/gestureHelpers.js
git commit -m "feat: add gesture helper utilities"
```

---

## Task 2: 创建手势解释器

**Files:**
- Create: `src/components/gesture-demo/GestureInterpreter.js`

- [ ] **Step 1: 创建 GestureInterpreter 类骨架**

```javascript
// src/components/gesture-demo/GestureInterpreter.js
import { calculateDistance, isFingerExtended, calculateVelocity } from '../../utils/gestureHelpers';

export class GestureInterpreter {
  constructor() {
    this.history = []; // 存储最近10帧的数据
    this.maxHistory = 10;
    this.lastTimestamp = Date.now();
  }

  /**
   * 更新历史记录
   */
  updateHistory(landmarks) {
    const timestamp = Date.now();
    this.history.push({
      landmarks,
      timestamp
    });
    
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * 获取前一帧数据
   */
  getPreviousFrame() {
    if (this.history.length < 2) return null;
    return this.history[this.history.length - 2];
  }

  /**
   * 主解释函数 - 分析当前手势
   */
  interpret(landmarks) {
    if (!landmarks || landmarks.length === 0) {
      return { type: 'none' };
    }

    this.updateHistory(landmarks);
    const hand = landmarks[0];

    // 按优先级检测手势
    const zoomGesture = this.detectZoomGesture(hand);
    if (zoomGesture) return zoomGesture;

    const selectionGesture = this.detectSelectionGesture(hand);
    if (selectionGesture) return selectionGesture;

    const clickGesture = this.detectClickGesture(hand);
    if (clickGesture) return clickGesture;

    const scrollGesture = this.detectScrollGesture(hand);
    if (scrollGesture) return scrollGesture;

    return { type: 'none' };
  }
}
```

- [ ] **Step 2: 实现滚动手势检测**

```javascript
// 在 GestureInterpreter 类中添加方法

  /**
   * 检测滚动手势：✋ 张开手掌 + 上下移动
   */
  detectScrollGesture(hand) {
    // 获取关键点
    const thumb_tip = hand[4];
    const index_tip = hand[8];
    const middle_tip = hand[12];
    const ring_tip = hand[16];
    const pinky_tip = hand[20];
    const index_mcp = hand[5];
    const wrist = hand[0];

    // 检查是否所有手指都伸展
    const allFingersExtended = 
      isFingerExtended(thumb_tip, hand[3]) &&
      isFingerExtended(index_tip, index_mcp) &&
      isFingerExtended(middle_tip, index_mcp) &&
      isFingerExtended(ring_tip, index_mcp) &&
      isFingerExtended(pinky_tip, index_mcp);

    if (!allFingersExtended) return null;

    // 计算手掌中心（用于定位）
    const palmCenter = {
      x: (thumb_tip.x + index_tip.x + middle_tip.x + ring_tip.x + pinky_tip.x) / 5,
      y: (thumb_tip.y + index_tip.y + middle_tip.y + ring_tip.y + pinky_tip.y) / 5
    };

    // 计算 Y 轴速度
    const previousFrame = this.getPreviousFrame();
    if (!previousFrame) {
      return {
        type: 'scroll',
        velocity: 0,
        position: palmCenter
      };
    }

    const prevHand = previousFrame.landmarks[0];
    const prevPalmY = (prevHand[4].y + prevHand[8].y + prevHand[12].y + prevHand[16].y + prevHand[20].y) / 5;
    const deltaTime = Date.now() - previousFrame.timestamp;
    const velocity = calculateVelocity({ y: palmCenter.y }, { y: prevPalmY }, deltaTime);

    return {
      type: 'scroll',
      velocity: (palmCenter.y - prevPalmY) * 5000, // 放大速度
      position: palmCenter
    };
  }
```

- [ ] **Step 3: 实现点击手势检测**

```javascript
// 在 GestureInterpreter 类中添加方法

  /**
   * 检测点击手势：☝️ 食指向前戳（Z轴变化）
   */
  detectClickGesture(hand) {
    const index_tip = hand[8];
    const index_mcp = hand[5];
    const middle_tip = hand[12];
    const ring_tip = hand[16];
    const pinky_tip = hand[20];

    // 只有食指伸展
    const onlyIndexExtended =
      isFingerExtended(index_tip, index_mcp) &&
      !isFingerExtended(middle_tip, index_mcp) &&
      !isFingerExtended(ring_tip, index_mcp) &&
      !isFingerExtended(pinky_tip, index_mcp);

    if (!onlyIndexExtended) return null;

    // 检测 Z 轴快速变化
    const previousFrame = this.getPreviousFrame();
    if (!previousFrame) {
      return {
        type: 'pointing',
        position: index_tip,
        clicking: false
      };
    }

    const prevIndexTip = previousFrame.landmarks[0][8];
    const zChange = Math.abs((index_tip.z || 0) - (prevIndexTip.z || 0));

    // Z 轴变化超过阈值 = 点击
    const isClicking = zChange > 0.08;

    return {
      type: 'pointing',
      position: index_tip,
      clicking: isClicking,
      zChange
    };
  }
```

- [ ] **Step 4: 实现文本选择手势检测**

```javascript
// 在 GestureInterpreter 类中添加方法

  /**
   * 检测选择手势：☝️ 食指停留 + 拖拽
   */
  detectSelectionGesture(hand) {
    const index_tip = hand[8];
    const index_mcp = hand[5];
    const middle_tip = hand[12];

    // 只有食指伸展
    const onlyIndexExtended =
      isFingerExtended(index_tip, index_mcp) &&
      !isFingerExtended(middle_tip, index_mcp);

    if (!onlyIndexExtended) return null;

    // 检查停留时间（需要在外部状态管理中实现）
    // 这里只返回位置信息
    return {
      type: 'selection-ready',
      position: index_tip
    };
  }
```

- [ ] **Step 5: 实现缩放手势检测**

```javascript
// 在 GestureInterpreter 类中添加方法

  /**
   * 检测缩放手势：✌️ 两指距离变化
   */
  detectZoomGesture(hand) {
    const index_tip = hand[8];
    const middle_tip = hand[12];
    const ring_tip = hand[16];
    const pinky_tip = hand[20];
    const index_mcp = hand[5];

    // 食指和中指伸展，无名指和小指收起
    const twoFingersExtended =
      isFingerExtended(index_tip, index_mcp) &&
      isFingerExtended(middle_tip, index_mcp) &&
      !isFingerExtended(ring_tip, index_mcp) &&
      !isFingerExtended(pinky_tip, index_mcp);

    if (!twoFingersExtended) {
      // 检查是否握拳（关闭缩放）
      const isFist = 
        !isFingerExtended(index_tip, index_mcp) &&
        !isFingerExtended(middle_tip, index_mcp) &&
        !isFingerExtended(ring_tip, index_mcp) &&
        !isFingerExtended(pinky_tip, index_mcp);
      
      if (isFist) {
        return { type: 'fist' };
      }
      
      return null;
    }

    // 计算两指距离
    const distance = calculateDistance(index_tip, middle_tip);

    // 计算距离变化（用于判断放大/缩小）
    const previousFrame = this.getPreviousFrame();
    let distanceChange = 0;
    
    if (previousFrame) {
      const prevHand = previousFrame.landmarks[0];
      const prevDistance = calculateDistance(prevHand[8], prevHand[12]);
      distanceChange = distance - prevDistance;
    }

    return {
      type: 'zoom',
      distance,
      distanceChange,
      scale: Math.max(0.5, Math.min(3, distance * 10)) // 映射到 0.5x - 3x
    };
  }
```

- [ ] **Step 6: 导出手势解释器**

```javascript
// 在文件末尾添加

export default GestureInterpreter;
```

- [ ] **Step 7: 提交手势解释器**

```bash
git add src/components/gesture-demo/GestureInterpreter.js
git commit -m "feat: add gesture interpreter with scroll, click, selection, and zoom detection"
```

---

## Task 3: 创建滚动控制器

**Files:**
- Create: `src/components/gesture-demo/controllers/ScrollController.js`

- [ ] **Step 1: 创建 ScrollController 类**

```javascript
// src/components/gesture-demo/controllers/ScrollController.js
import { throttle } from '../../../utils/gestureHelpers';

export class ScrollController {
  constructor() {
    this.isActive = false;
    this.currentVelocity = 0;
    
    // 节流处理滚动事件
    this.throttledScroll = throttle(this.performScroll.bind(this), 16); // ~60fps
  }

  /**
   * 激活滚动模式
   */
  activate() {
    this.isActive = true;
  }

  /**
   * 停用滚动模式
   */
  deactivate() {
    this.isActive = false;
    this.currentVelocity = 0;
  }

  /**
   * 执行滚动
   */
  execute(gestureData) {
    if (!this.isActive) return;
    
    this.currentVelocity = gestureData.velocity;
    this.throttledScroll();
  }

  /**
   * 实际滚动操作
   */
  performScroll() {
    if (Math.abs(this.currentVelocity) < 0.1) return;
    
    window.scrollBy({
      top: this.currentVelocity,
      behavior: 'auto'
    });
  }

  /**
   * 获取当前状态
   */
  getState() {
    return {
      active: this.isActive,
      velocity: this.currentVelocity
    };
  }
}

export default ScrollController;
```

- [ ] **Step 2: 提交滚动控制器**

```bash
git add src/components/gesture-demo/controllers/ScrollController.js
git commit -m "feat: add scroll controller with velocity-based scrolling"
```

---

## Task 4: 创建点击控
