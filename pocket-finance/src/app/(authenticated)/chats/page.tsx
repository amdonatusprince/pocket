/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useRef, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { ChatView } from '@/components/chat/ChatView';
import { QuickActions } from '@/components/chat/QuickActions';
import { AI_MODELS } from '@/components/chat/AIModelSelector';
import { ChatInput } from '@/components/chat/ChatInput';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
  isLoading?: boolean;
}

interface AIResponse {
  text: string;
  user: string;
  action?: string;
}

export default function ChatsPage() {
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [agentId, setAgentId] = useState<string>('');

  useEffect(() => {
    const fetchAgents = async () => {
      const { agents } = await apiClient.getAgents();
      if (agents && agents.length > 0) {
        setAgentId(agents[0].id);
      }
    };
    
    fetchAgents();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      // Add user message
      const userMessage: Message = {
        id: nanoid(),
        content,
        isBot: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setMessage('');
      setIsChatStarted(true);

      // Show loading message
      setIsLoading(true);
      const loadingMessage: Message = {
        id: nanoid(),
        content: "PocketFinance Bot is thinking...",
        isBot: true,
        timestamp: new Date(),
        isLoading: true
      };
      setMessages(prev => [...prev, loadingMessage]);

      // Send to AI agent
      const responses = await apiClient.sendMessage(agentId, content);
      
      // Remove loading message and add responses
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      responses.forEach((response: AIResponse) => {
        const botMessage: Message = {
          id: nanoid(),
          content: response.text,
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      });

      setError(null);

    } catch (error) {
      setError('Failed to connect to AI agent. Please try again later.');
      toast.error('Failed to connect to AI agent');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg max-w-md">
          <h3 className="text-red-600 dark:text-red-400 font-medium mb-2">Connection Error</h3>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-4 px-4 py-2 bg-[#007BFF] text-white rounded-lg hover:bg-[#0056b3] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!isChatStarted) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col min-h-screen pt-32">
        <div className="text-center mb-12 px-4">
          <h1 className="text-4xl font-bold mb-4 text-[#222831] dark:text-white">
            How can I help you?
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-12">
            Simplifying payments through composable and modular <br />
            network of interoperable on-chain AI agents.
          </p>

          <div className="relative max-w-3xl mx-auto mb-16">
            <ChatInput
              message={message}
              setMessage={setMessage}
              selectedModel={selectedModel}
              isOpen={isOpen}
              setSelectedModel={setSelectedModel}
              setIsOpen={setIsOpen}
              dropdownRef={dropdownRef}
              onSendMessage={handleSendMessage}
            />
          </div>

          <QuickActions />
        </div>
      </div>
    );
  }

  return (
    <ChatView
      messages={messages}
      message={message}
      setMessage={setMessage}
      selectedModel={selectedModel}
      isOpen={isOpen}
      setSelectedModel={setSelectedModel}
      setIsOpen={setIsOpen}
      dropdownRef={dropdownRef}
      isChatStarted={isChatStarted}
      onSendMessage={handleSendMessage}
      agentId={selectedModel}
    />
  );
} 