// 区域感知的手势解释器
// 根据当前区域动态调整手势识别优先级

export function interpretGestureForZone(interpreter, landmarks, zone) {
  if (!interpreter || !landmarks || landmarks.length === 0) {
    return { type: 'none' };
  }

  const hand = landmarks[0];
  interpreter.updateHistory(landmarks);

  // 根据区域调整检测优先级
  switch (zone) {
    case 'scroll':
      // 滚动区域：优先检测 scroll
      // 优先级: scroll > pointing > selection
      return (
        interpreter.detectScrollGesture(hand) ||
        interpreter.detectClickGesture(hand) ||
        interpreter.detectSelectionGesture(hand) ||
        { type: 'none' }
      );

    case 'click':
      // 点击区域：优先检测 pointing
      // 优先级: pointing > scroll
      return (
        interpreter.detectClickGesture(hand) ||
        interpreter.detectScrollGesture(hand) ||
        { type: 'none' }
      );

    case 'selection':
      // 选择区域：优先检测 selection-ready
      // 优先级: selection > pointing
      return (
        interpreter.detectSelectionGesture(hand) ||
        interpreter.detectClickGesture(hand) ||
        { type: 'none' }
      );

    case 'zoom':
      // 缩放区域：优先检测 zoom
      // 优先级: zoom 独占
      return (
        interpreter.detectZoomGesture(hand) ||
        { type: 'none' }
      );

    default:
      // 默认使用解释器的标准优先级
      return interpreter.interpret(landmarks);
  }
}
