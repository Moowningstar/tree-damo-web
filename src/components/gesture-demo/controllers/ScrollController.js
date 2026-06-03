// src/components/gesture-demo/controllers/ScrollController.js
import { throttle } from '../../../utils/gestureHelpers';

export class ScrollController {
  constructor() {
    this.isActive = false;
    this.currentVelocity = 0;
    this.targetElement = null; // 目标滚动元素

    // 节流处理滚动事件
    this.throttledScroll = throttle(this.performScroll.bind(this), 16); // ~60fps
  }

  /**
   * 激活滚动模式
   * @param {HTMLElement} targetElement - 可选的目标滚动元素
   */
  activate(targetElement = null) {
    this.isActive = true;
    this.targetElement = targetElement;
  }

  /**
   * 停用滚动模式
   */
  deactivate() {
    this.isActive = false;
    this.currentVelocity = 0;
    this.targetElement = null;
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

    // 如果指定了目标元素，则滚动该元素；否则查找滚动区域
    if (this.targetElement) {
      this.targetElement.scrollTop += this.currentVelocity;
    } else {
      // 自动查找 id="scroll-area" 的元素
      const scrollArea = document.getElementById('scroll-area');
      if (scrollArea) {
        scrollArea.scrollTop += this.currentVelocity;
      } else {
        // 降级到全局滚动
        window.scrollBy({
          top: this.currentVelocity,
          behavior: 'auto'
        });
      }
    }
  }

  /**
   * 获取当前状态
   */
  getState() {
    return {
      active: this.isActive,
      velocity: this.currentVelocity,
      hasTarget: !!this.targetElement
    };
  }
}

export default ScrollController;
