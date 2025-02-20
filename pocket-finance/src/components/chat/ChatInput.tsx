import { Send, Paperclip, Mic } from 'lucide-react';
import { AIModelSelector } from './AIModelSelector';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { AudioRecorder } from './AudioRecorder';

interface ChatInputProps {
  message: string;
  setMessage: (message: string) => void;
  selectedModel: string;
  isOpen: boolean;
  setSelectedModel: (id: string) => void;
  setIsOpen: (isOpen: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  onSendMessage: (content: string, agentId: string) => Promise<void>;
  isChatStarted?: boolean;
}

export function ChatInput({
  message,
  setMessage,
  selectedModel,
  isOpen,
  setSelectedModel,
  setIsOpen,
  dropdownRef,
  onSendMessage,
  isChatStarted
}: ChatInputProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  
  const handleSend = async () => {
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('text', message);
        // Send file and message to API
        await apiClient.sendMessage(agentId, message, selectedFile);
      } else {
        await onSendMessage(message, agentId);
      }
      setMessage('');
      setSelectedFile(null);
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    // try {
    //   const response = await apiClient.whisper(selectedModel, audioBlob);
    //   if (response?.text) {
    //     setMessage(response.text);
    //   }
    // } catch (error) {
    //   toast.error('Failed to process audio. Please try again.');
    // }
    toast.error('Audio chat is not supported yet', {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#222831',
        color: '#fff',
        borderRadius: '8px',
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // const file = e.target.files?.[0];
    // if (file) {
    //   if (file.size > 5 * 1024 * 1024) { // 5MB limit
    //     toast.error('File size should be less than 5MB');
    //     return;
    //   }
    //   setSelectedFile(file);
    // }
    toast.error('File upload not supported yet', {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#222831',
        color: '#fff',
        borderRadius: '8px',
      },
    });
  };

  const handleRecordToggle = () => {
    setIsRecording(!isRecording);
    // Audio recording logic will go here
  };

  return (
    <div className="relative">
      {selectedFile && (
        <div className="absolute -top-16 left-0 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
            <button 
              onClick={() => setSelectedFile(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <textarea
        placeholder="Ask anything..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={isRecording}
        className="w-full p-4 pr-24 rounded-lg 
          border-2 border-[#007BFF] dark:border-[#007BFF] 
          focus:ring-2 focus:ring-[#007BFF] focus:border-[#007BFF] 
          resize-none min-h-[120px] bg-white dark:bg-gray-800 
          text-[#222831] dark:text-white placeholder-gray-500 dark:placeholder-gray-400
          disabled:opacity-50 disabled:cursor-not-allowed"
      />
      
      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isRecording}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Paperclip size={20} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx"
          className="hidden"
        />
        
        <AudioRecorder
          onRecordingComplete={handleRecordingComplete}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
        />
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <AIModelSelector
          selectedModel={selectedModel}
          isOpen={isOpen}
          setSelectedModel={setSelectedModel}
          setIsOpen={setIsOpen}
          dropdownRef={dropdownRef}
          disabled={isChatStarted}
        />

        <button 
          onClick={handleSend}
          className="p-1.5 rounded-lg bg-[#007BFF] text-white hover:bg-[#0056b3] transition-colors"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
} 