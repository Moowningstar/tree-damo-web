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

  /**
   * 检测缩放手势：✋ 张开手掌 = 放大, ✊ 握拳 = 缩小
   */
  detectZoomGesture(hand) {
    const thumb_tip = hand[4];
    const index_tip = hand[8];
    const middle_tip = hand[12];
    const ring_tip = hand[16];
    const pinky_tip = hand[20];
    const index_mcp = hand[5];

    // 检查所有手指是否伸展（张开手掌）
    const allFingersExtended =
      isFingerExtended(thumb_tip, hand[3]) &&
      isFingerExtended(index_tip, index_mcp) &&
      isFingerExtended(middle_tip, index_mcp) &&
      isFingerExtended(ring_tip, index_mcp) &&
      isFingerExtended(pinky_tip, index_mcp);

    // 检查是否握拳（所有手指收起）
    const isFist =
      !isFingerExtended(thumb_tip, hand[3]) &&
      !isFingerExtended(index_tip, index_mcp) &&
      !isFingerExtended(middle_tip, index_mcp) &&
      !isFingerExtended(ring_tip, index_mcp) &&
      !isFingerExtended(pinky_tip, index_mcp);

    if (allFingersExtended) {
      // 张开手掌 = 放大
      return {
        type: 'zoom',
        action: 'zoom-in',  // 放大
        position: {
          x: (thumb_tip.x + index_tip.x + middle_tip.x + ring_tip.x + pinky_tip.x) / 5,
          y: (thumb_tip.y + index_tip.y + middle_tip.y + ring_tip.y + pinky_tip.y) / 5
        }
      };
    } else if (isFist) {
      // 握拳 = 缩小
      return {
        type: 'zoom',
        action: 'zoom-out',  // 缩小
        position: index_tip
      };
    }

    return null;
  }
}

export default GestureInterpreter;
