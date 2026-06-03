// src/components/gesture-demo/controllers/ZoomController.js

export class ZoomController {
  constructor() {
    this.isActive = false;
    this.currentImage = null; // 当前选中的图片元素
    this.originalTransform = new Map(); // 保存原始变换
    this.scaleStep = 0.1; // 每次缩放步长
  }

  /**
   * 激活缩放模式
   */
  activate() {
    this.isActive = true;
  }

  /**
   * 停用缩放模式
   */
  deactivate() {
    this.isActive = false;
    this.resetAll();
  }

  /**
   * 执行缩放控制（统一接口）
   * @param {Object} gestureData - { action: 'zoom-in' | 'zoom-out', screenPosition }
   */
  execute(gestureData) {
    console.log('[ZoomController] execute called, isActive:', this.isActive, 'action:', gestureData.action);

    if (!this.isActive) {
      console.warn('[ZoomController] Not active, skipping');
      return;
    }

    const screenPos = gestureData.screenPosition || { x: 0, y: 0 };
    console.log('[ZoomController] screenPos:', screenPos);

    const element = document.elementFromPoint(screenPos.x, screenPos.y);
    console.log('[ZoomController] element at position:', element?.tagName, element?.dataset);

    // 检查是否是可缩放的图片
    const zoomableImage = element?.closest('[data-zoomable]');
    console.log('[ZoomController] zoomableImage found:', zoomableImage?.dataset.zoomable);

    if (!zoomableImage) {
      console.log('[ZoomController] No zoomable image at cursor position');
      return;
    }

    // 如果切换了图片，重置之前的图片
    if (this.currentImage && this.currentImage !== zoomableImage) {
      this.resetImage(this.currentImage);
    }

    this.currentImage = zoomableImage;

    // 保存原始变换（如果还没保存）
    if (!this.originalTransform.has(zoomableImage)) {
      const currentTransform = window.getComputedStyle(zoomableImage).transform;
      this.originalTransform.set(zoomableImage, currentTransform);
      console.log('[ZoomController] Saved original transform:', currentTransform);
    }

    // 根据手势动作缩放
    if (gestureData.action === 'zoom-in') {
      this.zoomIn(zoomableImage);
    } else if (gestureData.action === 'zoom-out') {
      this.zoomOut(zoomableImage);
    }
  }

  /**
   * 放大图片
   */
  zoomIn(element) {
    const currentScale = this.getCurrentScale(element);
    const newScale = Math.min(currentScale + this.scaleStep, 3); // 最大3倍
    this.applyScale(element, newScale);
    console.log(`[ZoomController] Zoom in: ${newScale.toFixed(1)}x`);
  }

  /**
   * 缩小图片
   */
  zoomOut(element) {
    const currentScale = this.getCurrentScale(element);
    const newScale = Math.max(currentScale - this.scaleStep, 1); // 最小1倍
    this.applyScale(element, newScale);
    console.log(`[ZoomController] Zoom out: ${newScale.toFixed(1)}x`);
  }

  /**
   * 获取当前缩放比例
   */
  getCurrentScale(element) {
    const transform = window.getComputedStyle(element).transform;
    if (transform === 'none') return 1;

    const matrix = new DOMMatrix(transform);
    return matrix.a; // scaleX
  }

  /**
   * 应用缩放
   */
  applyScale(element, scale) {
    element.style.transform = `scale(${scale})`;
    element.style.transition = 'transform 0.2s ease';
    element.style.zIndex = scale > 1 ? '20' : '1';
  }

  /**
   * 重置单个图片
   */
  resetImage(element) {
    if (!element) return;

    const original = this.originalTransform.get(element);
    if (original) {
      element.style.transform = original;
      element.style.zIndex = '';
      this.originalTransform.delete(element);
    }
  }

  /**
   * 重置所有图片
   */
  resetAll() {
    this.originalTransform.forEach((originalTransform, element) => {
      element.style.transform = originalTransform;
      element.style.zIndex = '';
    });
    this.originalTransform.clear();
    this.currentImage = null;
  }

  /**
   * 关闭缩放（兼容旧接口）
   */
  close() {
    this.resetAll();
  }

  /**
   * 获取当前状态
   */
  getState() {
    return {
      active: this.isActive,
      currentImage: this.currentImage?.dataset.zoomable || null,
      scale: this.currentImage ? this.getCurrentScale(this.currentImage) : 1
    };
  }
}

export default ZoomController;
