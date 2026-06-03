import { useState, useEffect, useRef } from 'react';
import GestureControl from '../GestureControl';
import { GestureInterpreter } from './GestureInterpreter';
import ScrollController from './controllers/ScrollController';
import ClickController from './controllers/ClickController';
import SelectionController from './controllers/SelectionController';
import ZoomController from './controllers/ZoomController';
import VirtualCursor from './VirtualCursor';

export default function GestureDemo() {
  // Core state
  const [gestureActive, setGestureActive] = useState(false);
  const [currentGesture, setCurrentGesture] = useState(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [activeZone, setActiveZone] = useState(null); // 当前激活的区域

  // Demo area states
  const [clickCount, setClickCount] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  const [zoomImage, setZoomImage] = useState(null);

  // Controller instances
  const interpreterRef = useRef(null);
  const scrollControllerRef = useRef(null);
  const clickControllerRef = useRef(null);
  const selectionControllerRef = useRef(null);
  const zoomControllerRef = useRef(null);

  // Initialize controllers
  useEffect(() => {
    interpreterRef.current = new GestureInterpreter();
    scrollControllerRef.current = new ScrollController();
    clickControllerRef.current = new ClickController();
    selectionControllerRef.current = new SelectionController();
    zoomControllerRef.current = new ZoomController();

    // Setup controller callbacks
    clickControllerRef.current.onExecute = () => {
      setClickCount(prev => prev + 1);
    };

    selectionControllerRef.current.onTextSelected = (text) => {
      setSelectedText(text);
    };

    zoomControllerRef.current.onZoomChange = (imageId) => {
      setZoomImage(imageId);
    };
  }, []);

  // Activate/deactivate controllers based on gestureActive state
  useEffect(() => {
    if (gestureActive) {
      // 默认不激活任何 controller，等待进入特定区域
      console.log('✅ [GestureDemo] Gesture control enabled');
    } else {
      // Deactivate all controllers when gesture control is disabled
      scrollControllerRef.current?.deactivate();
      clickControllerRef.current?.deactivate();
      selectionControllerRef.current?.deactivate();
      setActiveZone(null);
      console.log('🛑 [GestureDemo] Controllers deactivated');
    }
  }, [gestureActive]);

  // 检测光标在哪个区域
  const detectZone = (screenPos) => {
    const element = document.elementFromPoint(screenPos.x, screenPos.y);
    if (!element) {
      console.warn('[detectZone] No element at position:', screenPos);
      return null;
    }

    // 查找最近的区域容器
    const zone = element.closest('[data-gesture-zone]');
    const zoneName = zone ? zone.dataset.gestureZone : null;

    // 调试：显示检测结果
    if (zoneName) {
      console.log(`[detectZone] Found zone: ${zoneName}, element:`, element.tagName);
    }

    return zoneName;
  };

  // 根据区域激活对应的 controller
  useEffect(() => {
    if (!gestureActive) return;

    // 停用所有 controller
    scrollControllerRef.current?.deactivate();
    clickControllerRef.current?.deactivate();
    selectionControllerRef.current?.deactivate();

    // 根据区域激活特定 controller
    switch (activeZone) {
      case 'scroll':
        scrollControllerRef.current?.activate();
        console.log('📜 [GestureDemo] Scroll zone activated');
        break;
      case 'click':
        clickControllerRef.current?.activate();
        console.log('👆 [GestureDemo] Click zone activated');
        break;
      case 'selection':
        selectionControllerRef.current?.activate();
        console.log('✍️ [GestureDemo] Selection zone activated');
        break;
      case 'zoom':
        // ZoomController 不需要 activate
        console.log('🔍 [GestureDemo] Zoom zone activated');
        break;
    }
  }, [activeZone, gestureActive]);

  // Handle gesture data from GestureControl
  const handleGestureData = (landmarks) => {
    if (!interpreterRef.current) {
      console.warn('⚠️ [GestureDemo] Interpreter not initialized');
      return;
    }

    const gestureData = interpreterRef.current.interpret(landmarks);

    // 只在手势类型变化时输出日志，避免过度输出
    if (gestureData.type !== currentGesture) {
      console.log('🎯 [GestureDemo] Gesture changed:', gestureData.type);
    }

    setCurrentGesture(gestureData.type);

    // 将手部坐标映射到屏幕坐标（用于虚拟光标）
    let currentZone = activeZone; // 使用本地变量而不是状态
    if (gestureData.position) {
      const screenPos = {
        x: gestureData.position.x * window.innerWidth,
        y: gestureData.position.y * window.innerHeight
      };
      setCursorPosition(screenPos);

      // 检测当前在哪个区域
      const zone = detectZone(screenPos);
      if (zone !== activeZone) {
        setActiveZone(zone);
        currentZone = zone; // 立即更新本地变量
        console.log('🎯 [GestureDemo] Zone changed:', zone);
      }
    }

    // 调试：显示当前状态
    console.log(`[DEBUG] currentZone: ${currentZone}, gestureType: ${gestureData.type}`);

    // 只在对应区域执行对应的手势
    if (!currentZone) {
      console.warn('⚠️ [GestureDemo] No active zone detected');
      return;
    }

    switch (gestureData.type) {
      case 'scroll':
        if (currentZone === 'scroll') {
          console.log('✅ [GestureDemo] Executing scroll');
          scrollControllerRef.current?.execute(gestureData);
        }
        break;

      case 'pointing':
        if (currentZone === 'click') {
          console.log('✅ [GestureDemo] Executing click', cursorPosition);
          // 传递屏幕坐标而不是归一化坐标
          clickControllerRef.current?.execute({
            ...gestureData,
            screenPosition: cursorPosition
          });
        }
        break;

      case 'selection-ready':
        if (currentZone === 'selection') {
          console.log('✅ [GestureDemo] Executing selection');
          selectionControllerRef.current?.execute({
            ...gestureData,
            screenPosition: cursorPosition
          });
        }
        break;

      case 'zoom':
        if (currentZone === 'zoom') {
          console.log('✅ [GestureDemo] Executing zoom');
          zoomControllerRef.current?.execute(gestureData);
        }
        break;

      case 'fist':
        console.log('✊ [GestureDemo] Fist detected - closing zoom/selection');
        zoomControllerRef.current?.close?.();
        selectionControllerRef.current?.reset?.();
        break;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">手势控制演示</h1>
            <p className="text-sm text-purple-300">当前区域: {activeZone || '无'} | 手势: {currentGesture || '无'}</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Navigation */}
            <nav className="flex gap-2">
              <a href="#scroll" className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded-lg transition-colors text-sm">📜 滚动</a>
              <a href="#click" className="px-4 py-2 bg-green-500/20 hover:bg-green-500/40 text-green-300 rounded-lg transition-colors text-sm">👆 点击</a>
              <a href="#selection" className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 rounded-lg transition-colors text-sm">✍️ 选择</a>
              <a href="#zoom" className="px-4 py-2 bg-pink-500/20 hover:bg-pink-500/40 text-pink-300 rounded-lg transition-colors text-sm">🔍 缩放</a>
            </nav>

            {/* Start Button */}
            <button
              onClick={() => setGestureActive(!gestureActive)}
              className={`
                px-6 py-2 rounded-lg font-semibold text-sm
                transition-all duration-300
                ${gestureActive
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                }
              `}
            >
              {gestureActive ? '🛑 停止' : '🚀 启动'}
            </button>
          </div>
        </div>
      </header>
      

      {/* Main Content - Full Screen Sections */}
      <main className="pt-20">
        {/* Section 1: Scroll Demo */}
        <section
          id="scroll"
          data-gesture-zone="scroll"
          className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 flex items-center justify-center p-8"
        >
          <div className="max-w-4xl w-full">
            <div className="text-center mb-12">
              <div className="text-8xl mb-6">📜</div>
              <h2 className="text-5xl font-bold text-white mb-4">滚动控制</h2>
              <p className="text-2xl text-blue-200 mb-2">张开手掌，上下移动</p>
              <p className="text-lg text-blue-300">Scroll with Open Palm</p>
            </div>

            <div
              id="scroll-area"
              className="h-[600px] overflow-y-auto bg-black/40 backdrop-blur-md rounded-3xl p-8 space-y-6 border-2 border-blue-400/30"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#3b82f6 #1e293b' }}
            >
              {Array.from({ length: 20 }, (_, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/20 hover:border-blue-400/50 transition-all">
                  <h3 className="text-2xl font-bold text-white mb-3">内容块 {i + 1}</h3>
                  <p className="text-lg text-gray-200 leading-relaxed">
                    这是一段测试文本。使用手势控制滚动页面，体验无接触交互的便利性。
                    通过计算机视觉技术，我们可以实现更自然的人机交互方式。
                    在医疗、展览、工业等场景中，手势控制可以避免接触污染，提高操作效率。
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <a href="#click" className="inline-block px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors">
                下一个演示 →
              </a>
            </div>
          </div>
        </section>

        {/* Section 2: Click Demo */}
        <section
          id="click"
          data-gesture-zone="click"
          className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-slate-900 flex items-center justify-center p-8"
        >
          <div className="max-w-4xl w-full">
            <div className="text-center mb-12">
              <div className="text-8xl mb-6">👆</div>
              <h2 className="text-5xl font-bold text-white mb-4">点击控制</h2>
              <p className="text-2xl text-green-200 mb-2">食指指向目标，向前戳</p>
              <p className="text-lg text-green-300">Point and Click</p>
            </div>

            <div className="space-y-8">
              {/* Click Counter */}
              <div className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 backdrop-blur-md rounded-3xl p-12 border-2 border-green-400/30">
                <div className="text-center">
                  <div className="text-xl text-green-200 mb-4">总点击次数</div>
                  <div className="text-9xl font-bold text-white mb-4">{clickCount}</div>
                  <div className="text-lg text-gray-300">使用手势点击下方按钮</div>
                </div>
              </div>

              {/* Clickable Buttons */}
              <div className="grid grid-cols-3 gap-6">
                <button
                  data-clickable="button-1"
                  className="h-32 bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-2xl rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl"
                >
                  按钮 1
                </button>

                <button
                  data-clickable="button-2"
                  className="h-32 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-2xl rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl"
                >
                  按钮 2
                </button>

                <button
                  data-clickable="button-3"
                  className="h-32 bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-2xl rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl"
                >
                  按钮 3
                </button>
              </div>
            </div>

            <div className="text-center mt-8">
              <a href="#selection" className="inline-block px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors">
                下一个演示 →
              </a>
            </div>
          </div>
        </section>

        {/* Section 3: Text Selection Demo */}
        <section
          id="selection"
          data-gesture-zone="selection"
          className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-slate-900 flex items-center justify-center p-8"
        >
          <div className="max-w-4xl w-full">
            <div className="text-center mb-12">
              <div className="text-8xl mb-6">✍️</div>
              <h2 className="text-5xl font-bold text-white mb-4">文本选择</h2>
              <p className="text-2xl text-purple-200 mb-2">食指停留2秒后拖拽</p>
              <p className="text-lg text-purple-300">Hover and Drag to Select</p>
            </div>

            <div className="space-y-8">
              {/* Selectable Text Area */}
              <div
                data-selectable="text-area"
                className="bg-black/40 backdrop-blur-md rounded-3xl p-12 border-2 border-purple-400/30 min-h-[400px]"
              >
                <div className="text-xl text-gray-100 leading-relaxed space-y-6">
                  <p>
                    计算机视觉技术正在改变我们与设备交互的方式。通过手势识别，
                    我们可以实现更自然、更直观的人机交互体验。MediaPipe 提供了强大的手部追踪能力，
                    能够实时检测 21 个手部关键点。
                  </p>
                  <p>
                    这项技术在医疗、教育、娱乐等多个领域都有广泛的应用前景。
                    想象一下，在手术室里，医生可以通过手势浏览医学影像，
                    而无需触碰任何设备，保持无菌环境。在教育场景中，教师可以通过手势控制课件演示。
                  </p>
                  <p>
                    未来，手势控制将成为人机交互的重要组成部分，
                    为用户提供更加便捷和高效的操作方式。结合 AI 和深度学习技术，
                    手势识别的准确性和鲁棒性将持续提升。
                  </p>
                </div>
              </div>

              {/* Selected Text Display */}
              <div className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-md rounded-3xl p-8 border-2 border-purple-400/30 min-h-32">
                <div className="text-xl text-purple-200 mb-4">已选择的文字:</div>
                <div className="text-2xl text-white font-medium">
                  {selectedText || '（使用手势选择上方文字）'}
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <a href="#zoom" className="inline-block px-8 py-4 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition-colors">
                下一个演示 →
              </a>
            </div>
          </div>
        </section>

        {/* Section 4: Image Zoom Demo */}
        <section
          id="zoom"
          data-gesture-zone="zoom"
          className="min-h-screen bg-gradient-to-br from-pink-900 via-pink-800 to-slate-900 flex items-center justify-center p-8"
        >
          <div className="max-w-4xl w-full">
            <div className="text-center mb-12">
              <div className="text-8xl mb-6">🔍</div>
              <h2 className="text-5xl font-bold text-white mb-4">图片缩放</h2>
              <p className="text-2xl text-pink-200 mb-2">两指捏合缩放</p>
              <p className="text-lg text-pink-300">Pinch to Zoom</p>
            </div>

            <div className="space-y-8">
              {/* Image Grid */}
              <div className="grid grid-cols-3 gap-6">
                {['image-1', 'image-2', 'image-3'].map((id, index) => (
                  <div
                    key={id}
                    data-zoomable={id}
                    className={`
                      relative aspect-square rounded-2xl overflow-hidden cursor-pointer
                      transition-all duration-300 transform hover:scale-105
                      ${zoomImage === id ? 'ring-4 ring-pink-400 scale-110' : ''}
                    `}
                  >
                    <div
                      className={`
                        w-full h-full flex items-center justify-center
                        ${index === 0 ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-8xl' : ''}
                        ${index === 1 ? 'bg-gradient-to-br from-green-400 to-green-600 text-8xl' : ''}
                        ${index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-8xl' : ''}
                      `}
                    >
                      {['🌄', '🎨', '🚀'][index]}
                    </div>
                  </div>
                ))}
              </div>

              {/* Zoom Instruction */}
              <div className="bg-gradient-to-br from-pink-500/30 to-purple-500/30 backdrop-blur-md rounded-3xl p-8 border-2 border-pink-400/30">
                <div className="text-center">
                  <p className="text-xl text-pink-200 mb-2">
                    使用两指捏合手势放大图片
                  </p>
                  <p className="text-lg text-gray-300">
                    当前状态: {zoomImage ? `正在查看 ${zoomImage}` : '未选择图片'}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <a href="#scroll" className="inline-block px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-xl transition-colors">
                返回第一个演示 →
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Virtual Cursor */}
      {gestureActive && cursorPosition.x > 0 && (
        <VirtualCursor
          position={cursorPosition}
          state={currentGesture || 'default'}
        />
      )}

      {/* Gesture Control (hidden UI, only processing) */}
      <GestureControl
        isActive={gestureActive}
        onLandmarks={handleGestureData}
        hideUI={true}
      />

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.8);
        }
      `}</style>
    </div>
  );
}
