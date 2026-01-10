import { useState, useRef, useEffect } from 'react';
import { X, Send, Mic, MicOff, Sparkles, Loader2, Maximize2, Minimize2, Image, Camera, FileVideo } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/app-store';
import { useVoiceRecognition, speakText } from '@/hooks/useVoiceRecognition';
import { supabase } from '@/integrations/supabase/client';
import type { AIMessage } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface ImageAttachment {
  base64: string;
  type: string;
  name: string;
}

export function AIAssistant() {
  const navigate = useNavigate();
  const { isAIOpen, setIsAIOpen } = useAppStore();
  const { language, t } = useLanguage();
  const isHindi = language === 'hi';
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: isHindi 
        ? "नमस्ते! मैं रेवॉन AI हूं, आपका सुपर एडवांस बिज़नेस असिस्टेंट। 👋\n\n🖼️ **नया फीचर!** अब आप मुझे इमेज/वीडियो भेज सकते हैं और मैं:\n• प्रोडक्ट की तस्वीर से इन्वेंट्री में जोड़ सकता हूं\n• इनवॉइस स्कैन करके बिल बना सकता हूं\n• बारकोड/QR कोड पढ़ सकता हूं\n\nबोलिए, टाइप कीजिए, या फोटो भेजिए!"
        : "Hi! I'm Revonn AI, your super advanced business assistant. 👋\n\n🖼️ **New Feature!** You can now send me images/videos and I can:\n• Add products from photos to inventory\n• Scan invoices and create bills\n• Read barcodes/QR codes\n\nSpeak, type, or send a photo!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageAttachment, setImageAttachment] = useState<ImageAttachment | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isListening, isSupported, transcript, toggleListening, stopListening } = useVoiceRecognition({
    lang: isHindi ? 'hi-IN' : 'en-IN',
    onResult: (result) => {
      if (result.isFinal) {
        setInput(result.transcript);
        stopListening();
        setTimeout(() => handleSend(result.transcript), 500);
      }
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isAIOpen) inputRef.current?.focus();
  }, [isAIOpen]);

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  const detectLanguage = (text: string): 'hindi' | 'english' => {
    const hindiPattern = /[\u0900-\u097F]|kya|hai|kaise|kitna|kitni|mera|aaj|kal|hoon|karo|batao|dikhao|banao|bech|sale|bikri/i;
    return hindiPattern.test(text) ? 'hindi' : 'english';
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(isHindi ? 'फाइल 5MB से छोटी होनी चाहिए' : 'File must be less than 5MB');
      return;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      toast.error(isHindi ? 'केवल JPG, PNG, GIF, WebP या MP4 फाइल' : 'Only JPG, PNG, GIF, WebP or MP4 files');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImageAttachment({
        base64: base64.split(',')[1], // Remove data:image/...;base64, prefix
        type: file.type,
        name: file.name
      });
      toast.success(isHindi ? 'फाइल जोड़ी गई' : 'File attached');
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.capture = 'environment';
      fileInputRef.current.click();
    }
  };

  const handleGallerySelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*,video/*';
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const clearAttachment = () => {
    setImageAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input.trim();
    if ((!messageText && !imageAttachment) || isLoading) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText || (isHindi ? '📷 इमेज भेजी' : '📷 Image sent'),
      timestamp: new Date(),
      image: imageAttachment ? `data:${imageAttachment.type};base64,${imageAttachment.base64}` : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    const currentAttachment = imageAttachment;
    clearAttachment();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Build message content with image if present
      let messageContent: any = messageText || 'Analyze this image and help me with my business task.';
      
      if (currentAttachment) {
        messageContent = [
          {
            type: 'text',
            text: messageText || (isHindi 
              ? 'इस इमेज को देखें और बताएं कि इसमें क्या है। अगर यह कोई प्रोडक्ट है तो उसकी जानकारी दें।' 
              : 'Analyze this image and tell me what you see. If it is a product, provide its details.')
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${currentAttachment.type};base64,${currentAttachment.base64}`
            }
          }
        ];
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          messages: [
            ...messages.filter(m => m.role !== 'assistant' || m.id !== '1').map(m => ({
              role: m.role,
              content: m.content
            })),
            { role: 'user', content: messageContent }
          ],
          userId: user.id,
          language: detectLanguage(messageText || ''),
          hasImage: !!currentAttachment
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI service error');
      }

      const data = await response.json();
      
      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.action && data.result?.success) {
        if (data.action === 'addToInventory') {
          toast.success(isHindi 
            ? `${data.result.added} ${data.result.product_name} इन्वेंट्री में जोड़ा गया`
            : `Added ${data.result.added} ${data.result.product_name} to inventory`);
        } else if (data.action === 'generateInvoice') {
          toast.success(isHindi 
            ? `बिल ${data.result.invoice_number} बनाया! कुल: ₹${data.result.total}`
            : `Invoice ${data.result.invoice_number} created! Total: ₹${data.result.total}`);
          setTimeout(() => { setIsAIOpen(false); navigate('/billing'); }, 2000);
        } else if (data.action === 'deleteProduct') {
          toast.success(isHindi 
            ? `${data.result.product_name} डिलीट किया गया`
            : `Deleted ${data.result.product_name}`);
        }
      }
      
      const lang = detectLanguage(messageText || '');
      speakText(data.message.replace(/[*#\[\]{}]/g, '').slice(0, 500), lang === 'hindi' ? 'hi-IN' : 'en-IN');

    } catch (error) {
      console.error('AI error:', error);
      const lang = detectLanguage(messageText || '');
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: lang === 'hindi' 
          ? "माफ कीजिए, अभी कुछ समस्या है। कृपया थोड़ी देर बाद प्रयास करें।" 
          : "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = isHindi ? [
    { label: 'आज की बिक्री?', icon: '📊' },
    { label: '7 दिन की बिक्री', icon: '📈' },
    { label: 'कम स्टॉक', icon: '📦' },
    { label: 'बिल बनाओ', icon: '🧾' },
    { label: 'टॉप सेलिंग', icon: '🔥' },
    { label: 'मार्केटिंग टिप', icon: '💡' },
    { label: 'प्रोडक्ट डिलीट करो', icon: '🗑️' },
    { label: 'ग्राहक हिस्ट्री', icon: '👤' }
  ] : [
    { label: "Today's sales?", icon: '📊' },
    { label: '7 day sales', icon: '📈' },
    { label: 'Low stock', icon: '📦' },
    { label: 'Create bill', icon: '🧾' },
    { label: 'Top selling', icon: '🔥' },
    { label: 'Marketing tip', icon: '💡' },
    { label: 'Delete product', icon: '🗑️' },
    { label: 'Customer history', icon: '👤' }
  ];

  if (!isAIOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md animate-fade-in">
      <div className={cn(
        "fixed bg-card shadow-2xl border border-border flex flex-col transition-all duration-300",
        isFullScreen 
          ? "inset-0 rounded-none" 
          : "inset-x-0 bottom-0 h-[90vh] rounded-t-3xl"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">Revonn AI</h2>
              <p className="text-xs text-muted-foreground">
                {isListening 
                  ? (isHindi ? '🎤 सुन रहा हूं...' : '🎤 Listening...') 
                  : (isHindi ? '🖼️ इमेज + आवाज़ + टेक्स्ट' : '🖼️ Image + Voice + Text')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsFullScreen(!isFullScreen)} 
              className="p-2 rounded-xl hover:bg-secondary transition-colors"
            >
              {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setIsAIOpen(false)} 
              className="p-2 rounded-xl hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                message.role === 'user' ? 'user-bubble' : 'ai-bubble',
                'animate-scale-in max-w-[85%] shadow-md'
              )}>
                {message.image && (
                  <img 
                    src={message.image} 
                    alt="Attached" 
                    className="max-w-full max-h-48 rounded-lg mb-2 object-cover"
                  />
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="ai-bubble flex items-center gap-2 shadow-md">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  {isHindi ? 'सोच रहा हूं...' : 'Thinking...'}
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide border-t border-border/50">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => { setInput(action.label); inputRef.current?.focus(); }}
              className="px-4 py-2 text-xs font-medium rounded-full bg-secondary text-secondary-foreground whitespace-nowrap hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        {/* Image Attachment Preview */}
        {imageAttachment && (
          <div className="px-4 py-2 border-t border-border/50">
            <div className="relative inline-block">
              <img 
                src={`data:${imageAttachment.type};base64,${imageAttachment.base64}`}
                alt="Attachment preview"
                className="h-20 w-20 object-cover rounded-lg border border-border"
              />
              <button
                onClick={clearAttachment}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Input */}
        <div className="p-4 border-t border-border bg-card/50">
          {isListening && (
            <div className="mb-3 p-3 rounded-xl bg-primary/10 border border-primary/30 text-center animate-pulse">
              <p className="text-sm text-primary font-medium flex items-center justify-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary animate-ping" />
                {isHindi ? 'सुन रहा हूं... अभी बोलें' : 'Listening... Speak now'}
              </p>
              {transcript && <p className="text-xs text-muted-foreground mt-1">{transcript}</p>}
            </div>
          )}
          <div className="flex items-center gap-2">
            {/* Camera Button */}
            <button
              onClick={handleCameraCapture}
              className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-all"
              title={isHindi ? 'कैमरा' : 'Camera'}
            >
              <Camera className="w-5 h-5" />
            </button>

            {/* Gallery Button */}
            <button
              onClick={handleGallerySelect}
              className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-all"
              title={isHindi ? 'गैलरी' : 'Gallery'}
            >
              <Image className="w-5 h-5" />
            </button>

            {/* Voice Button */}
            {isSupported && (
              <button
                onClick={toggleListening}
                className={cn(
                  'p-3 rounded-xl transition-all shadow-md',
                  isListening 
                    ? 'bg-primary text-primary-foreground animate-pulse scale-110' 
                    : 'bg-secondary hover:bg-secondary/80'
                )}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}

            {/* Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isHindi ? "टाइप करें..." : "Type a message..."}
              className="input-field flex-1 text-base py-3"
              disabled={isLoading}
            />

            {/* Send Button */}
            <button 
              onClick={() => handleSend()} 
              disabled={(!input.trim() && !imageAttachment) || isLoading} 
              className="p-3 rounded-xl btn-gold disabled:opacity-50 transition-all shadow-md"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
