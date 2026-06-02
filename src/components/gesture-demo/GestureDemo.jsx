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
  
  // Handle gesture data from GestureControl
  const handleGestureData = (landmarks) => {
    if (!interpreterRef.current) return;
    
    const gestureData = interpreterRef.current.interpret(landmarks);
    
    setCurrentGesture(gestureData.type);
    
    switch (gestureData.type) {
      case 'scroll':
        scrollControllerRef.current?.execute(gestureData);
        setCursorPosition(gestureData.position);
        break;
        
      case 'pointing':
        clickControllerRef.current?.execute(gestureData);
        setCursorPosition(gestureData.position);
        break;
        
      case 'selection-ready':
        selectionControllerRef.current?.execute(gestureData);
        setCursorPosition(gestureData.position);
        break;
        
      case 'zoom':
        zoomControllerRef.current?.execute(gestureData);
        if (gestureData.position) {
          setCursorPosition(gestureData.position);
        }
        break;
        
      case 'fist':
        // 握拳手势 - 关闭缩放或停止选择
        zoomControllerRef.current?.close?.();
        selectionControllerRef.current?.reset?.();
        break;
        
      default:
        if (gestureData.position) {
          setCursorPosition(gestureData.position);
        }
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-sm border-b border-white/10 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                手势控制演示系统
              </h1>
              <p className="text-purple-300">
                Gesture Control Demo - Computer Vision Interaction
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Current Gesture Indicator */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 border border-white/20">
                <div className="text-sm text-purple-300 mb-1">当前手势</div>
                <div className="text-2xl font-bold text-white">
                  {currentGesture || '无手势'}
                </div>
              </div>
              
              {/* Start Button */}
              <button
                onClick={() => setGestureActive(!gestureActive)}
                className={`
                  px-8 py-4 rounded-xl font-semibold text-lg
                  transition-all duration-300 transform hover:scale-105
                  ${gestureActive 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/50'
                  }
                `}
              >
                {gestureActive ? '🛑 停止控制' : '🚀 启动手势控制'}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Demo Areas */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Row 1: Scroll + Button */}
        <div className="grid grid-cols-2 gap-6">
          {/* Scroll Test Area */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">📜</span>
                滚动测试区
              </h2>
              <span className="text-sm text-purple-300">手势: 手掌上下移动</span>
            </div>
            
            <div 
              id="scroll-area"
              className="h-96 overflow-y-auto bg-black/20 rounded-xl p-4 space-y-4 custom-scrollbar"
            >
              {Array.from({ length: 20 }, (_, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-white font-semibold mb-2">内容块 {i + 1}</h3>
                  <p className="text-gray-300 text-sm">
                    这是一段测试文本。使用手势控制滚动页面，体验无接触交互的便利性。
                    通过计算机视觉技术，我们可以实现更自然的人机交互方式。
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Button Test Area */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">👆</span>
                按钮测试区
              </h2>
              <span className="text-sm text-purple-300">手势: 食指点击</span>
            </div>
            
            <div className="space-y-6">
              {/* Click Counter */}
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-400/30">
                <div className="text-center">
                  <div className="text-sm text-purple-300 mb-2">总点击次数</div>
                  <div className="text-6xl font-bold text-white mb-2">{clickCount}</div>
                  <div className="text-xs text-gray-400">使用手势点击下方按钮</div>
                </div>
              </div>
              
              {/* Clickable Buttons */}
              <div className="space-y-3">
                <button
                  data-clickable="button-1"
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  按钮 1 - 点我试试
                </button>
                
                <button
                  data-clickable="button-2"
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  按钮 2 - 用手势点击
                </button>
                
                <button
                  data-clickable="button-3"
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  按钮 3 - 无接触交互
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Row 2: Text Selection + Image Zoom */}
        <div className="grid grid-cols-2 gap-6">
          {/* Text Selection Area */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">✍️</span>
                文字选择区
              </h2>
              <span className="text-sm text-purple-300">手势: 双指框选</span>
            </div>
            
            <div className="space-y-4">
              {/* Selectable Text */}
              <div 
                data-selectable="text-area"
                className="bg-black/20 rounded-xl p-6 min-h-48 leading-relaxed text-gray-200 select-none"
              >
                <p className="mb-4">
                  计算机视觉技术正在改变我们与设备交互的方式。通过手势识别，
                  我们可以实现更自然、更直观的人机交互体验。
                </p>
                <p className="mb-4">
                  这项技术在医疗、教育、娱乐等多个领域都有广泛的应用前景。
                  想象一下，在手术室里，医生可以通过手势浏览医学影像，
                  而无需触碰任何设备，保持无菌环境。
                </p>
                <p>
                  未来，手势控制将成为人机交互的重要组成部分，
                  为用户提供更加便捷和高效的操作方式。
                </p>
              </div>
              
              {/* Selected Text Display */}
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-400/30 min-h-24">
                <div className="text-sm text-purple-300 mb-2">已选择的文字:</div>
                <div className="text-white font-medium">
                  {selectedText || '（使用手势选择上方文字）'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Image Zoom Area */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🔍</span>
                图片缩放区
              </h2>
              <span className="text-sm text-purple-300">手势: 捏合放大</span>
            </div>
            
            <div className="space-y-4">
              {/* Image Grid */}
              <div className="grid grid-cols-3 gap-3">
                {['image-1', 'image-2', 'image-3'].map((id, index) => (
                  <div
                    key={id}
                    data-zoomable={id}
                    className={`
                      relative aspect-square rounded-xl overflow-hidden cursor-pointer
                      transition-all duration-300 transform hover:scale-105
                      ${zoomImage === id ? 'ring-4 ring-purple-500 scale-110' : ''}
                    `}
                  >
                    <div 
                      className={`
                        w-full h-full flex items-center justify-center text-6xl
                        ${index === 0 ? 'bg-gradient-to-br from-blue-400 to-blue-600' : ''}
                        ${index === 1 ? 'bg-gradient-to-br from-green-400 to-green-600' : ''}
                        ${index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' : ''}
                      `}
                    >
                      {['🌄', '🌊', '🌅'][index]}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Zoom Status */}
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-400/30">
                <div className="text-sm text-purple-300 mb-2">当前缩放:</div>
                <div className="text-white font-medium text-lg">
                  {zoomImage ? `图片 ${zoomImage.split('-')[1]} - 已放大` : '（使用捏合手势放大图片）'}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Instructions Panel */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-md rounded-2xl p-6 border border-purple-400/30">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">📖</span>
            使用说明
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-black/20 rounded-xl p-4">
              <div className="text-3xl mb-2">📜</div>
              <div className="text-white font-semibold mb-1">滚动</div>
              <div className="text-sm text-gray-300">张开手掌上下移动</div>
            </div>
            <div className="bg-black/20 rounded-xl p-4">
              <div className="text-3xl mb-2">👆</div>
              <div className="text-white font-semibold mb-1">点击</div>
              <div className="text-sm text-gray-300">食指指向目标</div>
            </div>
            <div className="bg-black/20 rounded-xl p-4">
              <div className="text-3xl mb-2">✍️</div>
              <div className="text-white font-semibold mb-1">选择</div>
              <div className="text-sm text-gray-300">双指框选文字</div>
            </div>
            <div className="bg-black/20 rounded-xl p-4">
              <div className="text-3xl mb-2">🔍</div>
              <div className="text-white font-semibold mb-1">缩放</div>
              <div className="text-sm text-gray-300">捏合手势放大</div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Virtual Cursor */}
      {gestureActive && (
        <VirtualCursor position={cursorPosition} />
      )}
      
      {/* Gesture Control (hidden UI, only processing) */}
      <GestureControl
        isActive={gestureActive}
        onGesture={handleGestureData}
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
