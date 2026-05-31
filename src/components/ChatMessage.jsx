export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-2 sm:px-0`}>
      <div
        className={`max-w-[85%] sm:max-w-[70%] rounded-lg px-3 py-2 sm:px-4 sm:py-3 ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-white text-gray-800 shadow-sm border border-gray-200'
        }`}
      >
        <div className="flex items-start gap-2">
          <div className="text-xl sm:text-2xl flex-shrink-0">
            {isUser ? '👤' : '🤖'}
          </div>
          <div className="flex-1 whitespace-pre-wrap break-words text-sm sm:text-base">
            {message.content || '...'}
          </div>
        </div>
      </div>
    </div>
  )
}
