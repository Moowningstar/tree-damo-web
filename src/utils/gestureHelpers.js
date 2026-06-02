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
