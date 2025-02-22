import { ChevronDown } from 'lucide-react';
import Image from 'next/image';

export const AI_MODELS = [
  { 
    id: 'gpt4', 
    name: 'Open AI',
    icon: '/openAI_icon.svg'
  },
  { 
    id: 'claude', 
    name: 'Anthropic',
    icon: '/anthropic_icon.svg'
  },
  { 
    id: 'deepseek', 
    name: 'DeepSeek',
    icon: '/deepseek_icon.svg'
  },
  { 
    id: 'perplexity', 
    name: 'Perplexity',
    icon: '/perplexity_icon.svg'
  },
];

interface AIModelSelectorProps {
  selectedModel: string;
  isOpen: boolean;
  setSelectedModel: (id: string) => void;
  setIsOpen: (isOpen: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  disabled?: boolean;
}

export function AIModelSelector({ 
  selectedModel, 
  isOpen, 
  setSelectedModel, 
  setIsOpen,
  dropdownRef,
  disabled 
}: AIModelSelectorProps) {
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center gap-2 p-1.5 pl-8 pr-4 rounded-lg border 
          ${disabled ? 'cursor-default opacity-75' : 'cursor-pointer'}
          border-gray-200 dark:border-gray-700 text-sm text-[#222831] 
          dark:text-white bg-white dark:bg-gray-800`}
        disabled={disabled}
      >
        <Image
          src={AI_MODELS.find(m => m.id === selectedModel)?.icon || ''}
          alt=""
          width={16}
          height={16}
          className="absolute left-2 dark:invert"
        />
        {AI_MODELS.find(m => m.id === selectedModel)?.name}
        {!disabled && (
          <ChevronDown 
            size={16} 
            className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        )}
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full mt-1 left-0 w-full bg-white dark:bg-gray-800 
          border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          {AI_MODELS.map(model => (
            <button
              key={model.id}
              onClick={() => {
                setSelectedModel(model.id);
                setIsOpen(false);
              }}
              className={`flex items-center gap-2 w-full p-2 pl-8 text-sm hover:bg-gray-50 
                dark:hover:bg-gray-700 relative ${
                  selectedModel === model.id ? 'bg-gray-50 dark:bg-gray-700' : ''
                }`}
            >
              <Image
                src={model.icon}
                alt=""
                width={16}
                height={16}
                className="absolute left-2 dark:invert"
              />
              {model.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 