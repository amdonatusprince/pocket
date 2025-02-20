import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Loader2 } from 'lucide-react';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface ChatMessageProps {
  content: string;
  isBot: boolean;
  timestamp: Date;
  isLoading?: boolean;
}

const CustomLink = (props: any) => {
  const href = props.href;
  const isInternalLink = href && (href.startsWith('/') || href.startsWith('#'));

  if (isInternalLink) {
    return <a {...props} className="text-blue-500 hover:text-blue-600 underline" />;
  }
  return (
    <a
      {...props}
      className="text-blue-500 hover:text-blue-600 underline"
      target="_blank"
      rel="noopener noreferrer"
    />
  );
};

const CustomCode = (props: any) => {
  const { children, className, inline } = props;
  if (inline) {
    return <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5" {...props} />;
  }
  return (
    <code className={`${className} block bg-gray-100 dark:bg-gray-800 rounded-md p-3 my-2 overflow-x-auto`}>
      {children}
    </code>
  );
};

export function ChatMessage({ content, isBot, timestamp, isLoading }: ChatMessageProps) {
  return (
    <div className={`flex gap-3 mb-8 ${isBot ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isBot ? (
          <Image
            src="/aiBot.svg"
            alt="Pocket Finance"
            width={50}
            height={50}
            className="rounded-full bg-white p-1"
          />
        ) : (
          <Image
            src="/user.svg"
            alt="User"
            width={45}
            height={45}
            className="rounded-full bg-[#007BFF] p-1"
          />
        )}
      </div>

      <div className="flex flex-col max-w-[85%]">
        <div className={`rounded-2xl px-6 py-4 shadow-lg ${
          isBot ? 
            'bg-white dark:bg-gray-800 border-2 border-[#aab0b5] dark:border-white text-gray-900 dark:text-white shadow-[#007BFF]/10' : 
            'bg-[#007BFF] text-white border-2 border-[#81a9d3] shadow-[#007BFF]/20'
        }`}>
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="text-sm break-words">{content}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <ReactMarkdown 
                className="text-sm prose dark:prose-invert max-w-none
                  prose-headings:font-semibold prose-h1:text-lg prose-h2:text-base
                  prose-p:my-2 prose-p:break-words prose-ul:my-2 prose-li:my-1
                  prose-strong:text-[#007BFF] dark:prose-strong:text-blue-400
                  prose-code:text-sm prose-pre:my-3
                  prose-pre:max-w-full prose-pre:overflow-x-auto
                  prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4"
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  a: CustomLink,
                  code: CustomCode,
                  pre: ({ children, ...props }) => (
                    <pre {...props} className="whitespace-pre-wrap">
                      {children}
                    </pre>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-2">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
} 