// src/components/gesture-demo/controllers/ZoomController.js

export class ZoomController {
  constructor() {
    // 状态机：closed | zooming
    this.state = 'closed';
    
    // 缩放参数
    this.currentScale = 1;
    this.minScale = 0.5;
    this.maxScale = 3;
    this.baseDistance = null; // 初始两指距离
    
    // DOM 元素引用
    this.overlay = null;
    this.container = null;
    this.image = null;
    this.infoElement = null;
  }

  /**
   * 打开图片预览
   * @param {string} imageSrc - 图片 URL
   */
  openImage(imageSrc) {
    if (this.state === 'zooming') return;
    
    this.createZoomOverlay(imageSrc);
    this.state = 'zooming';
    this.currentScale = 1;
    this.baseDistance = null;
    
    // 淡入动画
    requestAnimationFrame(() => {
      this.overlay.style.opacity = '1';
    });
  }

  /**
   * 创建全屏预览层
   */
  createZoomOverlay(imageSrc) {
    // 创建容器
    this.overlay = document.createElement('div');
    this.overlay.className = 'gesture-zoom-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    this.container = document.createElement('div');
    this.container.className = 'gesture-zoom-container';
    this.container.style.cssText = `
      position: relative;
      width: 80%;
      height: 80%;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // 创建图片
    this.image = document.createElement('img');
    this.image.className = 'gesture-zoom-image';
    this.image.src = imageSrc;
    this.image.style.cssText = `
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      transition: transform 0.1s ease-out;
      transform-origin: center center;
    `;

    // 创建缩放信息
    this.infoElement = document.createElement('div');
    this.infoElement.className = 'gesture-zoom-info';
    this.infoElement.textContent = '100%';
    this.infoElement.style.cssText = `
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 255, 255, 0.9);
      color: #333;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      pointer-events: none;
    `;

    // 创建提示信息
    const hint = document.createElement('div');
    hint.className = 'gesture-zoom-hint';
    hint.textContent = '✌️ 两指缩放 | ✊ 握拳关闭';
    hint.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      pointer-events: none;
    `;

    // 组装 DOM
    this.container.appendChild(this.image);
    this.container.appendChild(this.infoElement);
    this.container.appendChild(hint);
    this.overlay.appendChild(this.container);
    document.body.appendChild(this.overlay);
  }

  /**
   * 处理缩放手势
   * @param {Object} gestureData - { distance, distanceChange }
   */
  handleZoom(gestureData) {
    if (this.state !== 'zooming') return;
    
    // 设置基准距离（首次检测）
    if (this.baseDistance === null) {
      this.baseDistance = gestureData.distance;
      return;
    }

    // 计算缩放比例
    const ratio = gestureData.distance / this.baseDistance;
    const newScale = Math.max(this.minScale, Math.min(this.maxScale, ratio));
    
    this.currentScale = newScale;
    this.applyScale();
  }

  /**
   * 应用缩放变换
   */
  applyScale() {
    if (!this.image) return;
    
    this.image.style.transform = `scale(${this.currentScale})`;
    
    // 更新缩放信息显示
    if (this.infoElement) {
      const percentage = Math.round(this.currentScale * 100);
      this.infoElement.textContent = `${percentage}%`;
    }
  }

  /**
   * 关闭预览
   */
  close() {
    if (this.state === 'closed' || !this.overlay) return;
    
    // 淡出动画
    this.overlay.style.opacity = '0';
    
    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      
      // 清理引用
      this.overlay = null;
      this.container = null;
      this.image = null;
      this.infoElement = null;
      this.state = 'closed';
      this.currentScale = 1;
      this.baseDistance = null;
    }, 300); // 等待淡出动画完成
  }

  /**
   * 获取当前状态
   */
  getState() {
    return {
      state: this.state,
      scale: this.currentScale,
      isOpen: this.state === 'zooming'
    };
  }
}

export default ZoomController;
