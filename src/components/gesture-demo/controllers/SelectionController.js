// src/components/gesture-demo/controllers/SelectionController.js
import { mapHandToScreen } from '../../../utils/gestureHelpers';

export class SelectionController {
  constructor() {
    this.isActive = false;
    this.state = 'idle'; // idle, hovering, selecting
    this.hoverStartTime = null;
    this.hoverStartPosition = null;
    this.hoverThreshold = 2000; // 2 seconds
    this.movementThreshold = 50; // 50 pixels
    this.selectionStartElement = null;
    this.range = null;
    this.selectedText = '';
    this.hoverProgress = 0;
  }

  /**
   * 激活选择模式
   */
  activate() {
    this.isActive = true;
  }

  /**
   * 停用选择模式
   */
  deactivate() {
    this.isActive = false;
    this.reset();
  }

  /**
   * 重置状态
   */
  reset() {
    this.state = 'idle';
    this.hoverStartTime = null;
    this.hoverStartPosition = null;
    this.selectionStartElement = null;
    this.range = null;
    this.selectedText = '';
    this.hoverProgress = 0;
    
    // 清除选择
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
  }

  /**
   * 执行选择检测
   */
  execute(gestureData) {
    if (!this.isActive) return;

    // 使用已经映射好的屏幕坐标
    const screenPos = gestureData.screenPosition || { x: 0, y: 0 };
    const now = Date.now();

    switch (this.state) {
      case 'idle':
        this.handleIdleState(screenPos, now);
        break;
      case 'hovering':
        this.handleHoveringState(screenPos, now);
        break;
      case 'selecting':
        this.handleSelectingState(screenPos);
        break;
    }
  }

  /**
   * 处理 idle 状态
   */
  handleIdleState(screenPos, now) {
    // 开始停留检测
    this.hoverStartTime = now;
    this.hoverStartPosition = screenPos;
    this.state = 'hovering';
    this.hoverProgress = 0;
  }

  /**
   * 处理 hovering 状态
   */
  handleHoveringState(screenPos, now) {
    // 检查位置移动
    const movement = Math.sqrt(
      Math.pow(screenPos.x - this.hoverStartPosition.x, 2) +
      Math.pow(screenPos.y - this.hoverStartPosition.y, 2)
    );

    if (movement > this.movementThreshold) {
      // 移动超过阈值，重置为 idle
      this.state = 'idle';
      this.hoverProgress = 0;
      return;
    }

    // 计算停留进度
    const hoverDuration = now - this.hoverStartTime;
    this.hoverProgress = Math.min(hoverDuration / this.hoverThreshold, 1);

    if (hoverDuration >= this.hoverThreshold) {
      // 停留时间达到阈值，开始选择
      this.startSelection(screenPos);
    }
  }

  /**
   * 处理 selecting 状态
   */
  handleSelectingState(screenPos) {
    // 扩展选择范围
    this.extendSelection(screenPos);
  }

  /**
   * 开始文本选择
   */
  startSelection(screenPos) {
    const element = document.elementFromPoint(screenPos.x, screenPos.y);
    
    if (!element) {
      this.state = 'idle';
      return;
    }

    // 查找文本节点
    const textNode = this.findTextNode(element, screenPos);
    
    if (!textNode) {
      this.state = 'idle';
      return;
    }

    // 创建 Range
    this.range = document.createRange();
    const offset = this.getTextOffset(textNode, screenPos);
    
    try {
      this.range.setStart(textNode, offset);
      this.range.setEnd(textNode, offset);
      
      // 应用选择
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(this.range);
      
      this.selectionStartElement = element;
      this.state = 'selecting';
    } catch (error) {
      console.error('Failed to start selection:', error);
      this.state = 'idle';
    }
  }

  /**
   * 扩展选择范围
   */
  extendSelection(screenPos) {
    if (!this.range) return;

    const element = document.elementFromPoint(screenPos.x, screenPos.y);
    
    if (!element) return;

    const textNode = this.findTextNode(element, screenPos);
    
    if (!textNode) return;

    const offset = this.getTextOffset(textNode, screenPos);
    
    try {
      this.range.setEnd(textNode, offset);
      
      // 更新选择
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(this.range);
      
      // 更新选中的文本
      this.selectedText = this.range.toString();
    } catch (error) {
      console.error('Failed to extend selection:', error);
    }
  }

  /**
   * 查找文本节点
   */
  findTextNode(element, screenPos) {
    // 递归查找包含文本的节点
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // 跳过空白文本节点
          if (!node.textContent.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let textNode = walker.nextNode();
    
    // 如果没有找到文本节点，尝试父元素
    if (!textNode && element.parentElement) {
      return this.findTextNode(element.parentElement, screenPos);
    }

    return textNode;
  }

  /**
   * 计算文本偏移量
   */
  getTextOffset(textNode, screenPos) {
    if (!textNode || !textNode.textContent) return 0;

    const range = document.createRange();
    const textContent = textNode.textContent;
    let closestOffset = 0;
    let closestDistance = Infinity;

    // 遍历每个字符位置，找到最接近鼠标的位置
    for (let i = 0; i <= textContent.length; i++) {
      try {
        range.setStart(textNode, i);
        range.setEnd(textNode, i);
        
        const rect = range.getBoundingClientRect();
        const distance = Math.sqrt(
          Math.pow(rect.left - screenPos.x, 2) +
          Math.pow(rect.top - screenPos.y, 2)
        );

        if (distance < closestDistance) {
          closestDistance = distance;
          closestOffset = i;
        }
      } catch (error) {
        // 忽略错误，继续下一个位置
      }
    }

    return closestOffset;
  }

  /**
   * 获取当前状态
   */
  getState() {
    return {
      active: this.isActive,
      state: this.state,
      hoverProgress: this.hoverProgress,
      selectedText: this.selectedText
    };
  }
}

export default SelectionController;
