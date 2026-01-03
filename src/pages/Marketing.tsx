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
  Calendar,
  Wand2,
  Copy,
  Check
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/app-store';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const posterTemplates = [
  { id: 'sale', label: 'Sale Offer', labelHi: 'सेल ऑफर', icon: Percent, color: 'bg-gradient-to-br from-red-500 to-pink-500' },
  { id: 'festival', label: 'Festival', labelHi: 'त्योहार', icon: Gift, color: 'bg-gradient-to-br from-orange-500 to-amber-500' },
  { id: 'new-arrival', label: 'New Arrival', labelHi: 'नया आगमन', icon: Store, color: 'bg-gradient-to-br from-blue-500 to-indigo-500' },
  { id: 'event', label: 'Event', labelHi: 'इवेंट', icon: Calendar, color: 'bg-gradient-to-br from-purple-500 to-violet-500' },
];

const festivals = [
  'Diwali', 'Holi', 'Eid', 'Christmas', 'New Year', 'Raksha Bandhan', 
  'Durga Puja', 'Ganesh Chaturthi', 'Navratri', 'Independence Day',
  'Republic Day', 'Makar Sankranti', 'Pongal', 'Onam', 'Baisakhi'
];

const colorThemes = [
  { id: 'vibrant', label: 'Vibrant', labelHi: 'जीवंत', colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'] },
  { id: 'elegant', label: 'Elegant', labelHi: 'सुंदर', colors: ['#2C3E50', '#E74C3C', '#ECF0F1'] },
  { id: 'festive', label: 'Festive', labelHi: 'उत्सवी', colors: ['#FF9F43', '#EE5A24', '#F8C291'] },
  { id: 'modern', label: 'Modern', labelHi: 'आधुनिक', colors: ['#6C5CE7', '#A29BFE', '#FFEAA7'] },
];

export default function Marketing() {
  const navigate = useNavigate();
  const { shopSettings } = useAppStore();
  const { language, t } = useLanguage();
  const isHindi = language === 'hi';
  
  const [selectedTemplate, setSelectedTemplate] = useState('sale');
  const [selectedTheme, setSelectedTheme] = useState('vibrant');
  const [posterText, setPosterText] = useState('');
  const [discountPercent, setDiscountPercent] = useState('50');
  const [festival, setFestival] = useState('Diwali');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generatePoster = async () => {
    setIsGenerating(true);
    setGeneratedImage(null);
    setGeneratedCaption('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(isHindi ? 'कृपया पहले लॉगिन करें' : 'Please login first');
        return;
      }

      const response = await supabase.functions.invoke('generate-marketing', {
        body: {
          template: selectedTemplate,
          shopName: shopSettings.shopName || 'Your Shop',
          posterText: posterText || `${discountPercent}% OFF`,
          festival: selectedTemplate === 'festival' ? festival : null,
          discount: discountPercent,
          language: isHindi ? 'hindi' : 'english',
          theme: selectedTheme
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
      
      // Fallback caption
      const fallbackCaption = selectedTemplate === 'sale' 
        ? isHindi 
          ? `🔥 ${discountPercent}% की भारी छूट ${shopSettings.shopName || 'हमारी दुकान'} पर! सीमित समय के लिए। अभी विजिट करें!\n\n#Sale #Discount #Shopping #${shopSettings.shopName?.replace(/\s/g, '') || 'Shop'}`
          : `🔥 ${discountPercent}% OFF at ${shopSettings.shopName || 'our store'}! Limited time offer. Visit now!\n\n#Sale #Discount #Shopping #${shopSettings.shopName?.replace(/\s/g, '') || 'Shop'}`
        : selectedTemplate === 'festival'
        ? isHindi
          ? `🎉 ${festival} की हार्दिक शुभकामनाएं! ${shopSettings.shopName || 'हमारी दुकान'} पर विशेष ऑफर! 🎊\n\n#${festival} #Festival #Shopping`
          : `🎉 Happy ${festival}! Special offers at ${shopSettings.shopName || 'our store'}! 🎊\n\n#${festival} #Festival #Celebration`
        : isHindi
        ? `✨ ${shopSettings.shopName || 'हमारी दुकान'} पर नए आइटम आ गए हैं! 🛍️\n\n#NewArrivals #Shopping`
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

  const shareToInstagram = () => {
    // Instagram doesn't have direct share, open Instagram
    window.open(`https://www.instagram.com/`, '_blank');
    toast.info(isHindi ? 'Instagram खुल रहा है - कृपया मैन्युअल रूप से पोस्ट करें' : 'Opening Instagram - please post manually');
  };

  const copyCaption = async () => {
    await navigator.clipboard.writeText(generatedCaption);
    setCopied(true);
    toast.success(isHindi ? 'कैप्शन कॉपी हो गया!' : 'Caption copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `${shopSettings.shopName || 'poster'}-${selectedTemplate}-${Date.now()}.png`;
      link.click();
      toast.success(isHindi ? 'डाउनलोड हो रहा है...' : 'Downloading...');
    }
  };

  return (
    <AppLayout title={isHindi ? 'मार्केटिंग' : 'Marketing'} hideNav>
      <div className="px-4 py-4 space-y-5 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">
              {isHindi ? 'AI मार्केटिंग स्टूडियो' : 'AI Marketing Studio'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isHindi ? 'प्रोफेशनल पोस्टर बनाएं और शेयर करें' : 'Create professional posters and share'}
            </p>
          </div>
        </div>

        {/* AI Badge */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="text-sm text-primary font-semibold">
              {isHindi ? 'AI-पावर्ड पोस्टर जेनरेशन' : 'AI-Powered Poster Generation'}
            </span>
            <p className="text-xs text-muted-foreground">
              {isHindi ? 'सोशल मीडिया के लिए तैयार' : 'Ready for social media'}
            </p>
          </div>
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
                  "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200",
                  selectedTemplate === id 
                    ? "border-primary bg-primary/10 scale-[1.02] shadow-lg" 
                    : "border-border bg-card hover:border-primary/50 hover:shadow-md"
                )}
              >
                <div className={cn('p-3 rounded-xl shadow-md', color)}>
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
        <div className="space-y-4">
          {selectedTemplate === 'sale' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                {isHindi ? 'डिस्काउंट प्रतिशत' : 'Discount Percentage'}
              </label>
              <div className="flex gap-2">
                {['10', '20', '30', '50', '70'].map(d => (
                  <button
                    key={d}
                    onClick={() => setDiscountPercent(d)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all",
                      discountPercent === d 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    {d}%
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder={isHindi ? 'कस्टम %' : 'Custom %'}
                className="input-field mt-2"
                min="1"
                max="100"
              />
            </div>
          )}

          {selectedTemplate === 'festival' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                {isHindi ? 'त्योहार चुनें' : 'Select Festival'}
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

          {/* Color Theme */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              {isHindi ? 'कलर थीम' : 'Color Theme'}
            </label>
            <div className="flex gap-2">
              {colorThemes.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={cn(
                    "flex-1 py-3 rounded-xl transition-all flex flex-col items-center gap-2",
                    selectedTheme === theme.id 
                      ? "ring-2 ring-primary bg-primary/10" 
                      : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  <div className="flex gap-1">
                    {theme.colors.map((color, i) => (
                      <div 
                        key={i} 
                        className="w-4 h-4 rounded-full shadow-sm" 
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    {isHindi ? theme.labelHi : theme.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              {isHindi ? 'कस्टम टेक्स्ट (वैकल्पिक)' : 'Custom Text (Optional)'}
            </label>
            <textarea
              value={posterText}
              onChange={(e) => setPosterText(e.target.value)}
              placeholder={isHindi ? 'अपना मैसेज यहां लिखें... जैसे "मेगा सेल - सभी आइटम पर छूट"' : 'Enter your message... e.g. "Mega Sale - Discount on all items"'}
              className="input-field min-h-[80px] resize-none"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {posterText.length}/200
            </p>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={generatePoster}
          disabled={isGenerating}
          className="w-full py-4 rounded-2xl btn-gold font-semibold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all disabled:opacity-70"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {isHindi ? 'AI से बना रहे हैं...' : 'AI is generating...'}
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
              <div className="relative rounded-2xl overflow-hidden border-2 border-border shadow-xl">
                <img 
                  src={generatedImage} 
                  alt="Generated Poster" 
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={downloadImage}
                    className="p-2.5 rounded-xl bg-background/90 backdrop-blur-sm shadow-lg hover:bg-background transition-colors"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white text-sm font-medium">
                    {isHindi ? 'आपका पोस्टर तैयार है!' : 'Your poster is ready!'}
                  </p>
                </div>
              </div>
            )}

            {/* Generated Caption */}
            {generatedCaption && (
              <div className="p-4 rounded-2xl bg-card border border-border shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Type className="w-4 h-4 text-primary" />
                    {isHindi ? 'कैप्शन' : 'Caption'}
                  </h4>
                  <button
                    onClick={copyCaption}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      copied 
                        ? "bg-green-500/20 text-green-600" 
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? (isHindi ? 'कॉपी हुआ!' : 'Copied!') : (isHindi ? 'कॉपी करें' : 'Copy')}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed bg-secondary/50 p-3 rounded-xl">
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
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-all hover:scale-105 shadow-sm"
                >
                  <MessageSquare className="w-7 h-7" />
                  <span className="text-xs font-medium">WhatsApp</span>
                </button>
                <button
                  onClick={shareToInstagram}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 text-pink-600 hover:from-pink-500/20 hover:to-purple-500/20 transition-all hover:scale-105 shadow-sm"
                >
                  <Instagram className="w-7 h-7" />
                  <span className="text-xs font-medium">Instagram</span>
                </button>
                <button
                  onClick={shareToFacebook}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-all hover:scale-105 shadow-sm"
                >
                  <Facebook className="w-7 h-7" />
                  <span className="text-xs font-medium">Facebook</span>
                </button>
                <button
                  onClick={shareToTwitter}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 transition-all hover:scale-105 shadow-sm"
                >
                  <Twitter className="w-7 h-7" />
                  <span className="text-xs font-medium">Twitter</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Marketing Tips */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-secondary/80 to-secondary/40 border border-border/50">
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            💡 {isHindi ? 'मार्केटिंग टिप्स' : 'Marketing Tips'}
          </h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              {isHindi ? 'त्योहारों पर 3-5 दिन पहले से पोस्ट करना शुरू करें' : 'Start posting 3-5 days before festivals'}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              {isHindi ? 'WhatsApp स्टेटस पर रोज़ सुबह 9-11 बजे पोस्ट करें' : 'Post on WhatsApp status daily at 9-11 AM'}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              {isHindi ? 'Google My Business पर फोटो और ऑफर अपडेट रखें' : 'Keep Google My Business updated with photos & offers'}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              {isHindi ? 'खुश ग्राहकों से रिव्यू मांगें - विश्वास बढ़ता है' : 'Ask happy customers for reviews - builds trust'}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              {isHindi ? 'लोकल हैशटैग का उपयोग करें जैसे #DelhiShopping' : 'Use local hashtags like #DelhiShopping'}
            </li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
