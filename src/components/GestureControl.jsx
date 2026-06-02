import { useEffect, useRef, useState } from 'react'

const GESTURES = {
  THUMBS_UP: '👍',
  OPEN_PALM: '✋',
  FIST: '✊',
  PEACE: '✌️',
  OK: '👌'
}

// 从 CDN 加载 MediaPipe Hands（使用多个备用源）
const loadMediaPipeHands = () => {
  return new Promise((resolve, reject) => {
    // 检查是否已加载
    if (window.Hands) {
      resolve(window.Hands)
      return
    }

    // CDN 备用列表（按优先级排序）
    const cdnUrls = [
      'https://unpkg.com/@mediapipe/hands@0.4.1646424915/hands.js',
      'https://fastly.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js'
    ]

    let currentIndex = 0

    const tryLoadFromCDN = () => {
      if (currentIndex >= cdnUrls.length) {
        reject(new Error('所有 CDN 源均加载失败，请检查网络连接'))
        return
      }

      const script = document.createElement('script')
      script.src = cdnUrls[currentIndex]
      script.crossOrigin = 'anonymous'

      script.onload = () => {
        if (window.Hands) {
          console.log(`MediaPipe Hands 从 CDN ${currentIndex + 1} 加载成功`)
          resolve(window.Hands)
        } else {
          console.warn(`CDN ${currentIndex + 1} 加载失败，尝试下一个...`)
          currentIndex++
          tryLoadFromCDN()
        }
      }

      script.onerror = () => {
        console.warn(`CDN ${currentIndex + 1} 加载失败，尝试下一个...`)
        document.head.removeChild(script)
        currentIndex++
        tryLoadFromCDN()
      }

      document.head.appendChild(script)
    }

    tryLoadFromCDN()
  })
}

export default function GestureControl({ onGesture, onLandmarks, isActive, hideUI = false }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [currentGesture, setCurrentGesture] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const handsRef = useRef(null)
  const cameraRef = useRef(null)

  // 识别手势
  const recognizeGesture = (landmarks) => {
    if (!landmarks || landmarks.length === 0) return null

    const hand = landmarks[0]

    // 获取关键点
    const thumb_tip = hand[4]
    const thumb_ip = hand[3]
    const index_tip = hand[8]
    const index_mcp = hand[5]
    const middle_tip = hand[12]
    const ring_tip = hand[16]
    const pinky_tip = hand[20]
    const wrist = hand[0]

    // 计算手指是否伸展
    const isThumbUp = thumb_tip.y < thumb_ip.y
    const isIndexUp = index_tip.y < index_mcp.y
    const isMiddleUp = middle_tip.y < index_mcp.y
    const isRingUp = ring_tip.y < index_mcp.y
    const isPinkyUp = pinky_tip.y < index_mcp.y

    // 竖起大拇指 👍
    if (isThumbUp && !isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
      return GESTURES.THUMBS_UP
    }

    // 张开手掌 ✋
    if (isThumbUp && isIndexUp && isMiddleUp && isRingUp && isPinkyUp) {
      return GESTURES.OPEN_PALM
    }

    // 握拳 ✊
    if (!isThumbUp && !isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
      return GESTURES.FIST
    }

    // 胜利手势 ✌️
    if (isIndexUp && isMiddleUp && !isRingUp && !isPinkyUp) {
      return GESTURES.PEACE
    }

    // OK 手势 👌
    const thumbIndexDistance = Math.sqrt(
      Math.pow(thumb_tip.x - index_tip.x, 2) +
      Math.pow(thumb_tip.y - index_tip.y, 2)
    )
    if (thumbIndexDistance < 0.05 && isMiddleUp && isRingUp && isPinkyUp) {
      return GESTURES.OK
    }

    return null
  }

  useEffect(() => {
    if (!isActive) return

    const initializeCamera = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // 从 CDN 加载 MediaPipe Hands（带备用源）
        console.log('开始加载 MediaPipe Hands...')
        const Hands = await loadMediaPipeHands()
        console.log('MediaPipe Hands 加载成功')

        // 初始化 MediaPipe Hands
        const hands = new Hands({
          locateFile: (file) => {
            // 使用 unpkg 作为模型文件源（国内访问较稳定）
            return `https://unpkg.com/@mediapipe/hands@0.4.1646424915/${file}`
          }
        })
        
        console.log('MediaPipe Hands 初始化成功')

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        })

        hands.onResults((results) => {
          const canvas = canvasRef.current
          if (!canvas) return

          const ctx = canvas.getContext('2d')
          ctx.save()
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          
          // 绘制视频帧
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)

          // 绘制手部关键点
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0]
            
            // 绘制连接线
            ctx.strokeStyle = '#00FF00'
            ctx.lineWidth = 2
            const connections = [
              [0, 1], [1, 2], [2, 3], [3, 4], // 大拇指
              [0, 5], [5, 6], [6, 7], [7, 8], // 食指
              [0, 9], [9, 10], [10, 11], [11, 12], // 中指
              [0, 13], [13, 14], [14, 15], [15, 16], // 无名指
              [0, 17], [17, 18], [18, 19], [19, 20], // 小指
              [5, 9], [9, 13], [13, 17] // 手掌
            ]

            connections.forEach(([start, end]) => {
              ctx.beginPath()
              ctx.moveTo(
                landmarks[start].x * canvas.width,
                landmarks[start].y * canvas.height
              )
              ctx.lineTo(
                landmarks[end].x * canvas.width,
                landmarks[end].y * canvas.height
              )
              ctx.stroke()
            })

            // 绘制关键点
            ctx.fillStyle = '#FF0000'
            landmarks.forEach((landmark) => {
              ctx.beginPath()
              ctx.arc(
                landmark.x * canvas.width,
                landmark.y * canvas.height,
                5,
                0,
                2 * Math.PI
              )
              ctx.fill()
            })

            // 传递原始 landmarks 数据（用于高级手势识别）
            if (onLandmarks) {
              console.log('📤 [GestureControl] Sending landmarks to callback, count:', results.multiHandLandmarks.length);
              onLandmarks(results.multiHandLandmarks)
            }

            // 识别简单手势（向后兼容）
            const gesture = recognizeGesture(results.multiHandLandmarks)
            if (gesture && gesture !== currentGesture) {
              setCurrentGesture(gesture)
              console.log('🎭 [GestureControl] Simple gesture:', gesture);
              onGesture?.(gesture)
            }
          } else {
            setCurrentGesture(null)
          }

          ctx.restore()
        })

        handsRef.current = hands

        // 启动摄像头 - 使用标准 getUserMedia API 以提高移动端兼容性
        if (videoRef.current) {
          try {
            console.log('开始请求摄像头权限...')

            // 检查浏览器是否支持
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
              throw new Error('您的浏览器不支持摄像头访问')
            }

            // 请求摄像头权限
            const stream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user' // 前置摄像头
              }
            })

            console.log('摄像头权限获取成功')

            videoRef.current.srcObject = stream
            await videoRef.current.play()

            // 创建帧处理循环
            const processFrame = async () => {
              if (videoRef.current && videoRef.current.readyState === 4) {
                await hands.send({ image: videoRef.current })
              }
              if (cameraRef.current) {
                requestAnimationFrame(processFrame)
              }
            }

            cameraRef.current = {
              stream,
              stop: () => {
                stream.getTracks().forEach(track => track.stop())
                cameraRef.current = null
              }
            }

            requestAnimationFrame(processFrame)
            setIsLoading(false)
          } catch (cameraErr) {
            console.error('Camera access error:', cameraErr)
            let errorMsg = '无法访问摄像头'

            if (cameraErr.name === 'NotAllowedError') {
              errorMsg = '摄像头权限被拒绝，请在浏览器设置中允许访问摄像头'
            } else if (cameraErr.name === 'NotFoundError') {
              errorMsg = '未找到摄像头设备'
            } else if (cameraErr.name === 'NotReadableError') {
              errorMsg = '摄像头正在被其他应用使用'
            } else if (cameraErr.name === 'SecurityError') {
              errorMsg = '安全限制：请确保网站使用 HTTPS 访问'
            } else {
              errorMsg = `摄像头访问失败: ${cameraErr.message}`
            }

            throw new Error(errorMsg)
          }
        }
      } catch (err) {
        console.error('Camera initialization error:', err)
        setError(err.message || '无法访问摄像头，请检查权限设置')
        setIsLoading(false)
      }
    }

    initializeCamera()

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop()
      }
      if (handsRef.current) {
        handsRef.current.close()
      }
    }
  }, [isActive])

  if (!isActive) return null

  // 如果 hideUI 为 true，只运行手势识别，不显示界面
  if (hideUI) {
    return (
      <div className="hidden">
        <video
          ref={videoRef}
          className="hidden"
          playsInline
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="hidden"
        />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="relative w-full h-full max-w-2xl max-h-screen p-4">
        {/* 视频和画布 */}
        <div className="relative w-full h-full rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover hidden"
            playsInline
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="w-full h-full object-contain"
          />
        </div>

        {/* 手势提示 */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 rounded-lg px-6 py-3 shadow-lg">
          <div className="text-center">
            <div className="text-4xl mb-2">{currentGesture || '🤚'}</div>
            <div className="text-sm font-medium text-gray-700">
              {currentGesture ? '识别到手势' : '请做出手势'}
            </div>
          </div>
        </div>

        {/* 手势说明 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 rounded-lg px-6 py-4 shadow-lg max-w-md">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">👍</span>
              <span>竖起大拇指 - 发送消息</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">✋</span>
              <span>张开手掌 - 开始录音</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">✊</span>
              <span>握拳 - 停止生成</span>
            </div>
          </div>
        </div>

        {/* 加载状态 */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>正在启动摄像头...</p>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 max-w-sm">
              <div className="text-red-500 text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
