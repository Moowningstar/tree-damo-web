import { useState, useEffect } from 'react'
import GestureControl from './GestureControl'

const CHOICES = {
  ROCK: { emoji: '✊', name: '石头', beats: 'SCISSORS' },
  PAPER: { emoji: '✋', name: '布', beats: 'ROCK' },
  SCISSORS: { emoji: '✌️', name: '剪刀', beats: 'PAPER' }
}

const GAME_STATES = {
  WAITING: 'waiting',
  COUNTDOWN: 'countdown',
  SHOWING: 'showing',
  RESULT: 'result'
}

export default function RockPaperScissors({ onClose }) {
  const [gameState, setGameState] = useState(GAME_STATES.WAITING)
  const [playerChoice, setPlayerChoice] = useState(null)
  const [computerChoice, setComputerChoice] = useState(null)
  const [result, setResult] = useState(null)
  const [score, setScore] = useState({ player: 0, computer: 0, draw: 0 })
  const [countdown, setCountdown] = useState(3)
  const [gestureMode, setGestureMode] = useState(false)
  const [detectedGesture, setDetectedGesture] = useState(null)

  // 倒计时逻辑
  useEffect(() => {
    if (gameState === GAME_STATES.COUNTDOWN && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (gameState === GAME_STATES.COUNTDOWN && countdown === 0) {
      // 倒计时结束，检查是否有玩家选择
      if (!playerChoice) {
        // 如果没有检测到手势，随机选择
        const choices = Object.keys(CHOICES)
        const randomChoice = choices[Math.floor(Math.random() * choices.length)]
        setPlayerChoice(randomChoice)
      }

      // 显示结果
      setGameState(GAME_STATES.SHOWING)
      setTimeout(() => {
        calculateResult()
      }, 500)
    }
  }, [gameState, countdown, playerChoice])

  // 计算游戏结果
  const calculateResult = () => {
    if (!playerChoice || !computerChoice) return

    if (playerChoice === computerChoice) {
      setResult('draw')
      setScore(prev => ({ ...prev, draw: prev.draw + 1 }))
    } else if (CHOICES[playerChoice].beats === computerChoice) {
      setResult('win')
      setScore(prev => ({ ...prev, player: prev.player + 1 }))
    } else {
      setResult('lose')
      setScore(prev => ({ ...prev, computer: prev.computer + 1 }))
    }

    setGameState(GAME_STATES.RESULT)
  }

  // 开始游戏
  const startGame = (choice) => {
    setPlayerChoice(choice)
    
    // 随机选择电脑的选项
    const choices = Object.keys(CHOICES)
    const randomChoice = choices[Math.floor(Math.random() * choices.length)]
    setComputerChoice(randomChoice)

    // 开始倒计时
    setCountdown(3)
    setGameState(GAME_STATES.COUNTDOWN)
  }

  // 重新开始
  const resetGame = () => {
    setGameState(GAME_STATES.WAITING)
    setPlayerChoice(null)
    setComputerChoice(null)
    setResult(null)
    setCountdown(3)
    setDetectedGesture(null)
    setGestureMode(false)  // 关闭手势模式
  }

  // 处理手势
  const handleGesture = (gesture) => {
    // 只接受游戏相关的手势（石头、剪刀、布）
    const validGameGestures = ['✊', '✋', '✌️']
    if (!validGameGestures.includes(gesture)) {
      return // 忽略其他手势（如大拇指 👍）
    }

    setDetectedGesture(gesture)

    // 只在等待状态或倒计时状态接受手势
    if (gameState !== GAME_STATES.WAITING && gameState !== GAME_STATES.COUNTDOWN) return

    let choice = null
    switch (gesture) {
      case '✊':
        choice = 'ROCK'
        break
      case '✋':
        choice = 'PAPER'
        break
      case '✌️':
        choice = 'SCISSORS'
        break
      default:
        return
    }

    // 如果在倒计时中检测到手势，更新玩家选择
    if (choice && gameState === GAME_STATES.COUNTDOWN) {
      setPlayerChoice(choice)
      setDetectedGesture(gesture)
    }
    // 如果在等待状态，开始游戏
    else if (choice && gameState === GAME_STATES.WAITING) {
      startGame(choice)
    }
  }

  // 获取结果文本
  const getResultText = () => {
    if (result === 'win') return '你赢了！🎉'
    if (result === 'lose') return '你输了！😢'
    return '平局！🤝'
  }

  // 获取结果颜色
  const getResultColor = () => {
    if (result === 'win') return 'text-green-500'
    if (result === 'lose') return 'text-red-500'
    return 'text-yellow-500'
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">石头剪刀布 ✊✋✌️</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Score Board */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-100 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{score.player}</div>
            <div className="text-sm text-gray-600 mt-1">你</div>
          </div>
          <div className="bg-gray-100 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-gray-600">{score.draw}</div>
            <div className="text-sm text-gray-600 mt-1">平局</div>
          </div>
          <div className="bg-red-100 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{score.computer}</div>
            <div className="text-sm text-gray-600 mt-1">电脑</div>
          </div>
        </div>

        {/* Game Area */}
        <div className="mb-8">
          {/* Waiting State */}
          {gameState === GAME_STATES.WAITING && (
            <div className="text-center">
              <div className="text-6xl mb-6">🤔</div>
              <p className="text-xl text-gray-700 mb-8">选择你的出招</p>
              
              {/* Choice Buttons */}
              <div className="flex justify-center gap-4 mb-6">
                {Object.entries(CHOICES).map(([key, choice]) => (
                  <button
                    key={key}
                    onClick={() => startGame(key)}
                    className="bg-gradient-to-br from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl p-6 transition-all transform hover:scale-110 shadow-lg"
                  >
                    <div className="text-5xl mb-2">{choice.emoji}</div>
                    <div className="text-sm font-medium">{choice.name}</div>
                  </button>
                ))}
              </div>

              {/* Gesture Control Button */}
              <button
                onClick={() => {
                  setGestureMode(true)
                  // 直接开始倒计时，等待手势识别
                  setCountdown(3)
                  setGameState(GAME_STATES.COUNTDOWN)
                  // 随机选择电脑的选项
                  const choices = Object.keys(CHOICES)
                  const randomChoice = choices[Math.floor(Math.random() * choices.length)]
                  setComputerChoice(randomChoice)
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                <span className="text-xl">🤚</span>
                <span>使用手势控制</span>
              </button>
            </div>
          )}

          {/* Countdown State */}
          {gameState === GAME_STATES.COUNTDOWN && (
            <div className="text-center">
              <div className="text-8xl font-bold text-purple-600 mb-4 animate-pulse">
                {countdown}
              </div>
              {gestureMode ? (
                <div className="space-y-4">
                  <p className="text-xl text-gray-700">请做出手势！</p>
                  {detectedGesture && (
                    <div className="text-6xl animate-bounce">{detectedGesture}</div>
                  )}
                  <p className="text-sm text-gray-500">
                    {playerChoice ? `已识别: ${CHOICES[playerChoice].name}` : '等待识别...'}
                  </p>
                </div>
              ) : (
                <p className="text-xl text-gray-700">准备...</p>
              )}
            </div>
          )}

          {/* Showing State */}
          {gameState === GAME_STATES.SHOWING && (
            <div className="text-center">
              <div className="flex justify-center items-center gap-8 mb-6">
                <div className="text-center">
                  <div className="text-7xl mb-2 animate-bounce">{CHOICES[playerChoice].emoji}</div>
                  <div className="text-lg text-gray-700">你</div>
                </div>
                <div className="text-4xl text-gray-400">VS</div>
                <div className="text-center">
                  <div className="text-7xl mb-2 animate-bounce">{CHOICES[computerChoice].emoji}</div>
                  <div className="text-lg text-gray-700">电脑</div>
                </div>
              </div>
            </div>
          )}

          {/* Result State */}
          {gameState === GAME_STATES.RESULT && (
            <div className="text-center">
              <div className="flex justify-center items-center gap-8 mb-6">
                <div className="text-center">
                  <div className="text-7xl mb-2">{CHOICES[playerChoice].emoji}</div>
                  <div className="text-lg text-gray-700">你</div>
                </div>
                <div className="text-4xl text-gray-400">VS</div>
                <div className="text-center">
                  <div className="text-7xl mb-2">{CHOICES[computerChoice].emoji}</div>
                  <div className="text-lg text-gray-700">电脑</div>
                </div>
              </div>

              <div className={`text-4xl font-bold mb-6 ${getResultColor()}`}>
                {getResultText()}
              </div>

              <button
                onClick={resetGame}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-lg text-lg font-medium transition-all transform hover:scale-105"
              >
                再来一局
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p className="font-medium mb-2">游戏规则：</p>
          <ul className="space-y-1">
            <li>✊ 石头 胜 ✌️ 剪刀</li>
            <li>✋ 布 胜 ✊ 石头</li>
            <li>✌️ 剪刀 胜 ✋ 布</li>
          </ul>
        </div>
      </div>

      {/* Gesture Control - 后台运行，不显示摄像头界面 */}
      {gestureMode && (
        <div className="fixed inset-0 pointer-events-none">
          <GestureControl
            isActive={gestureMode}
            onGesture={handleGesture}
            hideUI={true}
          />
        </div>
      )}
    </div>
  )
}
