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
