import { useState, useRef, useEffect } from 'react'
import ChatMessage from './components/ChatMessage'
import ChatInput from './components/ChatInput'
import GestureControl from './components/GestureControl'
import RockPaperScissors from './components/RockPaperScissors'
import { chatService } from './services/chatService'

function App() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [gestureMode, setGestureMode] = useState(false)
  const [pendingMessage, setPendingMessage] = useState('')
  const [showGame, setShowGame] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (text) => {
    if (!text.trim()) return

    // Add user message
    const userMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Add placeholder for assistant message
      const assistantMessage = { role: 'assistant', content: '' }
      setMessages(prev => [...prev, assistantMessage])

      // Stream response
      await chatService.chat(
        text,
        sessionId,
        (chunk, newSessionId) => {
          if (newSessionId && !sessionId) {
            setSessionId(newSessionId)
          }
          setMessages(prev => {
            const newMessages = [...prev]
            const lastMessage = newMessages[newMessages.length - 1]
            if (lastMessage.role === 'assistant') {
              lastMessage.content += chunk
            }
            return newMessages
          })
        }
      )
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1].content = '抱歉，发生了错误。请稍后重试。'
        return newMessages
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGesture = (gesture) => {
    console.log('Detected gesture:', gesture)
    
    switch (gesture) {
      case '👍': // 竖起大拇指 - 发送消息
        if (pendingMessage.trim()) {
          handleSendMessage(pendingMessage)
          setPendingMessage('')
          setGestureMode(false)
        }
        break
      case '✋': // 张开手掌 - 准备输入
        // 可以触发语音输入或其他输入方式
        break
      case '✊': // 握拳 - 停止/取消
        setGestureMode(false)
        setPendingMessage('')
        break
      default:
        break
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 p-3 sm:p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">AI Chat Demo</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">基于 RAG 的智能对话系统</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGame(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors text-sm sm:text-base"
            >
              <span className="text-lg">🎮</span>
              <span className="hidden sm:inline">游戏</span>
            </button>
            <button
              onClick={() => setGestureMode(!gestureMode)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
            >
              <span className="text-lg">🤚</span>
              <span className="hidden sm:inline">手势控制</span>
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 pb-safe">
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-10 sm:mt-20">
              <div className="text-4xl sm:text-6xl mb-4">💬</div>
              <p className="text-base sm:text-lg">开始对话吧！</p>
              <p className="text-xs sm:text-sm mt-2">我可以基于知识库回答你的问题</p>
              <p className="text-xs sm:text-sm mt-2 text-blue-500">点击右上角启用手势控制 🤚</p>
              <p className="text-xs sm:text-sm mt-2 text-purple-500">或者玩一局石头剪刀布 🎮</p>
            </div>
          )}
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="bg-white border-t border-gray-200 p-3 sm:p-4 pb-safe">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
      </footer>

      {/* Gesture Control */}
      <GestureControl 
        isActive={gestureMode} 
        onGesture={handleGesture}
      />

      {/* Rock Paper Scissors Game */}
      {showGame && (
        <RockPaperScissors onClose={() => setShowGame(false)} />
      )}
    </div>
  )
}

export default App
