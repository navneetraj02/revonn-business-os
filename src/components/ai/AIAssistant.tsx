import { useState, useRef, useEffect } from 'react';
import { X, Send, Mic, MicOff, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/app-store';
import { generateAIResponse, detectLanguage } from '@/lib/ai-assistant';
import type { AIMessage } from '@/types';
import { cn } from '@/lib/utils';

export function AIAssistant() {
  const navigate = useNavigate();
  const { isAIOpen, setIsAIOpen } = useAppStore();
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your Revonn Assistant. 👋\n\nMain aapki madad kar sakta hoon:\n\n• Stock check karna\n• Sales & profit reports\n• Bills banana\n• Marketing messages\n• Customer history\n• Staff attendance\n\nPuchiye, kya jaanna chahte hain?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isAIOpen) {
      inputRef.current?.focus();
    }
  }, [isAIOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateAIResponse(input.trim());
      
      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        action: response.action as AIMessage['action']
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle navigation actions
      if (response.action?.type === 'create_bill') {
        setTimeout(() => {
          setIsAIOpen(false);
          navigate('/billing');
        }, 1500);
      } else if (response.action?.type === 'navigate') {
        setTimeout(() => {
          setIsAIOpen(false);
          navigate(response.action?.data?.path || '/');
        }, 1500);
      }
    } catch (error) {
      const lang = detectLanguage(input);
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: lang === 'hindi' 
          ? "Maaf kijiye, kuch problem hui. Dobara try karein."
          : "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoice = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsListening(!isListening);
      // Voice recognition would be implemented here
    }
  };

  // Quick action suggestions based on language
  const quickActions = [
    { en: 'Sales today?', hi: 'Aaj ki sale?' },
    { en: 'Low stock items', hi: 'Low stock' },
    { en: 'Create bill', hi: 'Bill banao' },
    { en: "Today's profit", hi: 'Aaj ka profit' },
    { en: 'Marketing message', hi: 'WhatsApp message' }
  ];

  if (!isAIOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-x-0 bottom-0 h-[85vh] bg-card rounded-t-3xl shadow-lg animate-slide-up flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Revonn Assistant</h2>
              <p className="text-xs text-muted-foreground">AI-powered • Hindi/English</p>
            </div>
          </div>
          <button
            onClick={() => setIsAIOpen(false)}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  message.role === 'user' ? 'user-bubble' : 'ai-bubble',
                  'animate-scale-in max-w-[85%]'
                )}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="ai-bubble flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => {
                setInput(action.hi);
                inputRef.current?.focus();
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground whitespace-nowrap hover:bg-secondary/80 transition-colors"
            >
              {action.hi}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleVoice}
              className={cn(
                'p-3 rounded-xl transition-colors',
                isListening ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground'
              )}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Puchiye kuch bhi... / Ask anything..."
              className="input-field flex-1"
            />
            
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-3 rounded-xl btn-gold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
