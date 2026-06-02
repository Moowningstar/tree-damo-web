// src/components/gesture-demo/controllers/ClickController.js
import { mapHandToScreen, debounce } from '../../../utils/gestureHelpers';

export class ClickController {
  constructor() {
    this.isActive = false;
    this.hoveredElement = null;
    this.lastClickTime = 0;
    this.clickCooldown = 500; // 500ms 冷却时间
    
    // 防抖处理悬停检测
    this.debouncedHoverCheck = debounce(this.checkHover.bind(this), 50);
  }

  /**
   * 激活点击模式
   */
  activate() {
    this.isActive = true;
  }

  /**
   * 停用点击模式
   */
  deactivate() {
    this.isActive = false;
    this.clearHover();
  }

  /**
   * 执行点击检测
   */
  execute(gestureData) {
    if (!this.isActive) return;
    
    const screenPos = mapHandToScreen(gestureData.position);
    
    // 处理悬停状态
    this.debouncedHoverCheck(screenPos);
    
    // 检测点击动作
    if (gestureData.clicking) {
      this.handleClick(screenPos);
    }
  }

  /**
   * 检查鼠标悬停的元素
   */
  checkHover(screenPos) {
    const element = document.elementFromPoint(screenPos.x, screenPos.y);
    
    if (element !== this.hoveredElement) {
      // 移除旧元素的悬停状态
      if (this.hoveredElement) {
        this.hoveredElement.classList.remove('gesture-hover');
      }
      
      // 添加新元素的悬停状态
      if (element && this.isClickable(element)) {
        this.hoveredElement = element;
        this.handleHover(element);
      } else {
        this.hoveredElement = null;
      }
    }
  }

  /**
   * 判断元素是否可点击
   */
  isClickable(element) {
    const clickableTags = ['BUTTON', 'A', 'INPUT'];
    return clickableTags.includes(element.tagName) || 
           element.onclick !== null ||
           element.hasAttribute('data-clickable');
  }

  /**
   * 处理悬停效果
   */
  handleHover(element) {
    element.classList.add('gesture-hover');
  }

  /**
   * 清除悬停状态
   */
  clearHover() {
    if (this.hoveredElement) {
      this.hoveredElement.classList.remove('gesture-hover');
      this.hoveredElement = null;
    }
  }

  /**
   * 处理点击事件
   */
  handleClick(screenPos) {
    const now = Date.now();
    
    // 检查冷却时间
    if (now - this.lastClickTime < this.clickCooldown) {
      return;
    }
    
    const element = document.elementFromPoint(screenPos.x, screenPos.y);
    
    if (element && this.isClickable(element)) {
      // 触发点击
      element.click();
      
      // 显示点击反馈
      this.showClickFeedback(element, screenPos);
      
      // 更新最后点击时间
      this.lastClickTime = now;
    }
  }

  /**
   * 显示点击反馈动画
   */
  showClickFeedback(element, screenPos) {
    // 添加点击动画类
    element.classList.add('gesture-clicking');
    
    // 创建涟漪效果
    const ripple = document.createElement('div');
    ripple.className = 'gesture-click-ripple';
    ripple.style.left = `${screenPos.x}px`;
    ripple.style.top = `${screenPos.y}px`;
    document.body.appendChild(ripple);
    
    // 移除动画类
    setTimeout(() => {
      element.classList.remove('gesture-clicking');
    }, 300);
    
    // 移除涟漪元素
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  /**
   * 获取当前状态
   */
  getState() {
    return {
      active: this.isActive,
      hoveredElement: this.hoveredElement?.tagName || null,
      lastClickTime: this.lastClickTime
    };
  }
}

export default ClickController;
