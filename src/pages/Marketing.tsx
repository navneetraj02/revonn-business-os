import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Sparkles, 
  Share2, 
  Download,
  MessageSquare,
  Instagram,
  Facebook,
  Twitter,
  Loader2,
  Image as ImageIcon,
  Palette,
  Type,
  Gift,
  Percent,
  Store,
  Calendar
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/app-store';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const posterTemplates = [
  { id: 'sale', label: 'Sale Offer', labelHi: 'सेल ऑफर', icon: Percent, color: 'bg-red-500' },
  { id: 'festival', label: 'Festival', labelHi: 'त्योहार', icon: Gift, color: 'bg-orange-500' },
  { id: 'new-arrival', label: 'New Arrival', labelHi: 'नया आगमन', icon: Store, color: 'bg-blue-500' },
  { id: 'event', label: 'Event', labelHi: 'इवेंट', icon: Calendar, color: 'bg-purple-500' },
];

const festivals = [
  'Diwali', 'Holi', 'Eid', 'Christmas', 'New Year', 'Raksha Bandhan', 
  'Durga Puja', 'Ganesh Chaturthi', 'Navratri', 'Independence Day'
];

export default function Marketing() {
  const navigate = useNavigate();
  const { shopSettings } = useAppStore();
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  
  const [selectedTemplate, setSelectedTemplate] = useState('sale');
  const [posterText, setPosterText] = useState('');
  const [discountPercent, setDiscountPercent] = useState('50');
  const [festival, setFestival] = useState('Diwali');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePoster = async () => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please login first');
        return;
      }

      // Call AI to generate poster and caption
      const response = await supabase.functions.invoke('generate-marketing', {
        body: {
          template: selectedTemplate,
          shopName: shopSettings.shopName || 'Your Shop',
          posterText: posterText || `${discountPercent}% OFF`,
          festival: selectedTemplate === 'festival' ? festival : null,
          discount: discountPercent,
          language: isHindi ? 'hindi' : 'english'
        }
      });

      if (response.error) throw response.error;

      const result = response.data;
      if (result.image) {
        setGeneratedImage(result.image);
      }
      if (result.caption) {
        setGeneratedCaption(result.caption);
      }

      toast.success(isHindi ? 'पोस्टर तैयार!' : 'Poster generated!');
    } catch (error) {
      console.error('Error generating poster:', error);
      toast.error(isHindi ? 'पोस्टर बनाने में त्रुटि' : 'Error generating poster');
      
      // Fallback: Generate a simple caption
      const fallbackCaption = selectedTemplate === 'sale' 
        ? `🔥 ${discountPercent}% OFF at ${shopSettings.shopName || 'our store'}! Limited time offer. Visit now!\n\n#Sale #Discount #Shopping`
        : selectedTemplate === 'festival'
        ? `🎉 Happy ${festival}! Special offers at ${shopSettings.shopName || 'our store'}! 🎊\n\n#${festival} #Festival #Celebration`
        : `✨ Check out new arrivals at ${shopSettings.shopName || 'our store'}! 🛍️\n\n#NewArrivals #Shopping`;
      
      setGeneratedCaption(fallbackCaption);
    } finally {
      setIsGenerating(false);
    }
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(generatedCaption);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    toast.success(isHindi ? 'WhatsApp खुल रहा है...' : 'Opening WhatsApp...');
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(generatedCaption.slice(0, 280));
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    toast.success(isHindi ? 'Twitter खुल रहा है...' : 'Opening Twitter...');
  };

  const shareToFacebook = () => {
    const text = encodeURIComponent(generatedCaption);
    window.open(`https://www.facebook.com/sharer/sharer.php?quote=${text}`, '_blank');
    toast.success(isHindi ? 'Facebook खुल रहा है...' : 'Opening Facebook...');
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(generatedCaption);
    toast.success(isHindi ? 'कैप्शन कॉपी हो गया!' : 'Caption copied!');
  };

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `${shopSettings.shopName || 'poster'}-${selectedTemplate}.png`;
      link.click();
      toast.success(isHindi ? 'डाउनलोड हो रहा है...' : 'Downloading...');
    }
  };

  return (
    <AppLayout title={isHindi ? 'मार्केटिंग' : 'Marketing'} hideNav>
      <div className="px-4 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isHindi ? 'मार्केटिंग पोस्टर' : 'Marketing Posters'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isHindi ? 'AI से पोस्टर बनाएं और शेयर करें' : 'Create AI posters and share'}
            </p>
          </div>
        </div>

        {/* AI Badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">
            {isHindi ? 'AI-पावर्ड पोस्टर जेनरेशन' : 'AI-Powered Poster Generation'}
          </span>
        </div>

        {/* Template Selection */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {isHindi ? 'टेम्पलेट चुनें' : 'Select Template'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {posterTemplates.map(({ id, label, labelHi, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => setSelectedTemplate(id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                  selectedTemplate === id 
                    ? "border-primary bg-primary/10" 
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <div className={cn('p-3 rounded-xl', color)}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {isHindi ? labelHi : label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Template Options */}
        <div className="space-y-3">
          {selectedTemplate === 'sale' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {isHindi ? 'डिस्काउंट %' : 'Discount %'}
              </label>
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder="50"
                className="input-field"
                min="1"
                max="100"
              />
            </div>
          )}

          {selectedTemplate === 'festival' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {isHindi ? 'त्योहार' : 'Festival'}
              </label>
              <select
                value={festival}
                onChange={(e) => setFestival(e.target.value)}
                className="input-field"
              >
                {festivals.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {isHindi ? 'कस्टम टेक्स्ट (वैकल्पिक)' : 'Custom Text (Optional)'}
            </label>
            <input
              type="text"
              value={posterText}
              onChange={(e) => setPosterText(e.target.value)}
              placeholder={isHindi ? 'अपना मैसेज यहां लिखें...' : 'Enter your message...'}
              className="input-field"
              maxLength={100}
            />
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={generatePoster}
          disabled={isGenerating}
          className="w-full py-4 rounded-xl btn-gold font-semibold flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {isHindi ? 'बना रहे हैं...' : 'Generating...'}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              {isHindi ? 'पोस्टर बनाएं' : 'Generate Poster'}
            </>
          )}
        </button>

        {/* Generated Result */}
        {(generatedImage || generatedCaption) && (
          <div className="space-y-4 animate-fade-in">
            {/* Generated Image */}
            {generatedImage && (
              <div className="relative rounded-2xl overflow-hidden border border-border">
                <img 
                  src={generatedImage} 
                  alt="Generated Poster" 
                  className="w-full aspect-square object-cover"
                />
                <button
                  onClick={downloadImage}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-background/80 backdrop-blur-sm"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Generated Caption */}
            {generatedCaption && (
              <div className="p-4 rounded-2xl bg-card border border-border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    {isHindi ? 'कैप्शन' : 'Caption'}
                  </h4>
                  <button
                    onClick={copyCaption}
                    className="text-xs text-primary font-medium"
                  >
                    {isHindi ? 'कॉपी करें' : 'Copy'}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {generatedCaption}
                </p>
              </div>
            )}

            {/* Share Buttons */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {isHindi ? 'शेयर करें' : 'Share On'}
              </h4>
              <div className="grid grid-cols-4 gap-3">
                <button
                  onClick={shareToWhatsApp}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                >
                  <MessageSquare className="w-6 h-6" />
                  <span className="text-xs font-medium">WhatsApp</span>
                </button>
                <button
                  onClick={() => window.open(`https://www.instagram.com/`, '_blank')}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-pink-500/10 text-pink-600 hover:bg-pink-500/20 transition-colors"
                >
                  <Instagram className="w-6 h-6" />
                  <span className="text-xs font-medium">Instagram</span>
                </button>
                <button
                  onClick={shareToFacebook}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                >
                  <Facebook className="w-6 h-6" />
                  <span className="text-xs font-medium">Facebook</span>
                </button>
                <button
                  onClick={shareToTwitter}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 transition-colors"
                >
                  <Twitter className="w-6 h-6" />
                  <span className="text-xs font-medium">Twitter</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="p-4 rounded-xl bg-secondary/50">
          <h4 className="font-medium text-foreground mb-2">
            💡 {isHindi ? 'मार्केटिंग टिप्स' : 'Marketing Tips'}
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• {isHindi ? 'त्योहारों पर स्पेशल ऑफर दें' : 'Give special offers on festivals'}</li>
            <li>• {isHindi ? 'WhatsApp स्टेटस पर रोज़ पोस्ट करें' : 'Post on WhatsApp status daily'}</li>
            <li>• {isHindi ? 'Google My Business अपडेट रखें' : 'Keep Google My Business updated'}</li>
            <li>• {isHindi ? 'कस्टमर रिव्यू मांगें' : 'Ask for customer reviews'}</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
