import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useRef, useEffect } from 'react';

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

interface ChatViewProps {
  messages: Message[];
  message: string;
  setMessage: (message: string) => void;
  selectedModel: string;
  isOpen: boolean;
  setSelectedModel: (id: string) => void;
  setIsOpen: (isOpen: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  isChatStarted: boolean;
  onSendMessage: (content: string, agentId: string) => Promise<void>;
  agentId: string;
}

export function ChatView({
  messages,
  message,
  setMessage,
  selectedModel,
  isOpen,
  setSelectedModel,
  setIsOpen,
  dropdownRef,
  isChatStarted,
  onSendMessage,
  agentId
}: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              content={msg.content}
              isBot={msg.isBot}
              timestamp={msg.timestamp}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            message={message}
            setMessage={setMessage}
            selectedModel={selectedModel}
            isOpen={isOpen}
            setSelectedModel={setSelectedModel}
            setIsOpen={setIsOpen}
            dropdownRef={dropdownRef}
            isChatStarted={true}
            onSendMessage={onSendMessage}
          />
        </div>
      </div>
    </div>
  );
} 