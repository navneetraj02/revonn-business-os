import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Phone, Store, FileText, Eye, EyeOff, Loader2, User, Briefcase, Key, Users } from 'lucide-react';
import revonnLogo from '@/assets/revonn-logo.jpeg';
import { useLanguage } from '@/contexts/LanguageContext';

type LoginMode = 'owner' | 'staff';

export default function Auth() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isHindi = language === 'hi';
  
  const [isLogin, setIsLogin] = useState(true);
  const [loginMode, setLoginMode] = useState<LoginMode>('owner');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Owner login/signup form
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    shopName: '',
    ownerName: '',
    businessType: 'retail' as 'retail' | 'service',
    gstin: ''
  });

  // Staff login form
  const [staffLoginData, setStaffLoginData] = useState({
    storePhone: '', // Owner's phone number to identify the store
    username: '',
    password: ''
  });

  useEffect(() => {
    // Check if already logged in (owner)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    // Check if staff is logged in
    const staffSession = localStorage.getItem('revonn-staff-session');
    if (staffSession) {
      navigate('/');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone || !formData.password) {
      toast.error(isHindi ? 'कृपया सभी आवश्यक फ़ील्ड भरें' : 'Please fill in all required fields');
      return;
    }

    const email = `${formData.phone}@revonn.app`;
    
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: formData.password
        });

        if (error) {
          if (error.message.includes('Invalid login')) {
            toast.error(isHindi ? 'गलत फ़ोन नंबर या पासवर्ड' : 'Invalid phone number or password');
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success(isHindi ? 'स्वागत है!' : 'Welcome back!');
      } else {
        if (!formData.shopName) {
          toast.error(isHindi ? 'कृपया दुकान का नाम दर्ज करें' : 'Please enter your shop name');
          return;
        }

        if (!formData.ownerName) {
          toast.error(isHindi ? 'कृपया मालिक का नाम दर्ज करें' : 'Please enter owner name');
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              shop_name: formData.shopName,
              owner_name: formData.ownerName,
              business_type: formData.businessType,
              gstin: formData.gstin,
              phone: formData.phone
            }
          }
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast.error(isHindi ? 'यह फ़ोन नंबर पहले से पंजीकृत है। कृपया लॉगिन करें।' : 'This phone number is al[...]
            setIsLogin(true);
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success(isHindi ? 'खाता बन गया! Revonn डेमो मोड में आपका स्वागत है।' : 'Account created! Welcome to Revonn Demo Mode.[...]
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(isHindi ? 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।' : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!staffLoginData.storePhone || !staffLoginData.username || !staffLoginData.password) {
      toast.error(isHindi ? 'कृपया सभी फ़ील्ड भरें' : 'Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      // Use the staff_login RPC to avoid RLS issues. The RPC runs as a SECURITY DEFINER
      // and returns a JSON object with { success: boolean, data?: {...}, error?: string }
      const passwordHash = btoa(staffLoginData.password);

      const { data: rpcResult, error: rpcError } = await supabase.rpc('staff_login', {
        p_store_phone: staffLoginData.storePhone,
        p_username: staffLoginData.username,
        p_password_hash: passwordHash
      });

      if (rpcError) {
        console.error('RPC error:', rpcError);
        toast.error(isHindi ? 'लॉगिन में त्रुटि' : 'Login error');
        setIsLoading(false);
        return;
      }

      // rpcResult is expected to be the JSON returned by the function
      if (!rpcResult || rpcResult.success !== true) {
        const errMsg = rpcResult?.error || (isHindi ? 'गलत यूज़रनेम या पासवर्ड' : 'Invalid username or password');
        toast.error(errMsg);
        setIsLoading(false);
        return;
      }

      const staffData = rpcResult.data;

      // Build and store staff session
      const staffSession = {
        staffId: staffData.id,
        staffName: staffData.name,
        username: staffData.username,
        ownerId: staffData.user_id,
        shopName: staffData.shop_name,
        permissions: staffData.permissions,
        loginTime: new Date().toISOString()
      };

      localStorage.setItem('revonn-staff-session', JSON.stringify(staffSession));

      toast.success(isHindi ? `स्वागत है, ${staffData.name}!` : `Welcome, ${staffData.name}!`);
      navigate('/');
    } catch (error) {
      console.error('Staff login error:', error);
      toast.error(isHindi ? 'लॉगिन में त्रुटि' : 'Login error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 shadow-lg">
              <img src={revonnLogo} alt="Revonn" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-bold gold-text">Revonn</h1>
            <p className="text-muted-foreground mt-2">
              {isHindi ? 'AI-पावर्ड बिज़नेस OS' : 'AI-Powered Business OS'}
            </p>
          </div>

          {/* Login Mode Toggle - Only show for login */}
          {isLogin && (
            <div className="flex rounded-xl bg-secondary p-1">
              <button
                type="button"
                onClick={() => setLoginMode('owner')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  loginMode === 'owner' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="w-4 h-4" />
                {isHindi ? 'मालिक' : 'Owner'}
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('staff')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  loginMode === 'staff' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="w-4 h-4" />
                {isHindi ? 'कर्मचारी' : 'Staff'}
              </button>
            </div>
          )}

          {/* Owner Login/Signup Form */}
          {(loginMode === 'owner' || !isLogin) && (
            <form onSubmit={handleOwnerSubmit} className="space-y-4">
              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {isHindi ? 'मोबाइल नंबर' : 'Mobile Number'}
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder={isHindi ? '10 अंकों का मोबाइल नंबर' : 'Enter 10-digit mobile number'}
                    className="input-field pl-12"
                    maxLength={10}
                  />
                </div>
              </div>

              {/* Owner Name - Only for signup */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {isHindi ? 'मालिक का नाम' : 'Owner Name'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      placeholder={isHindi ? 'आपका नाम' : 'Your name'}
                      className="input-field pl-12"
                    />
                  </div>
                </div>
              )}

              {/* Shop Name - Only for signup */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {isHindi ? 'व्यवसाय का नाम' : 'Business Name'}
                  </label>
                  <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.shopName}
                      onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                      placeholder={isHindi ? 'आपकी दुकान/व्यवसाय का नाम' : 'Your shop/business name'}
                      className="input-field pl-12"
                    />
                  </div>
                </div>
              )}

              {/* Business Type - Only for signup */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {isHindi ? 'व्यवसाय का प्रकार' : 'Business Type'}
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <select
                      value={formData.businessType}
                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value as 'retail' | 'service' })}
                      className="input-field pl-12 appearance-none"
                    >
                      <option value="retail">{isHindi ? 'रिटेल / दुकान' : 'Retail / Shop'}</option>
                      <option value="service">{isHindi ? 'सेवा व्यवसाय' : 'Service Business'}</option>
                    </select>
                  </div>
                </div>
              )}

              {/* GSTIN - Only for signup, optional */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    GSTIN <span className="text-muted-foreground text-xs">({isHindi ? 'वैकल्पिक' : 'Optional'})</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                      placeholder="22AAAAA0000A1Z5"
                      className="input-field pl-12"
                      maxLength={15}
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {isHindi ? 'पासवर्ड' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={isLogin 
                      ? (isHindi ? 'अपना पासवर्ड दर्ज करें' : 'Enter your password')
                      : (isHindi ? 'पासवर्ड बनाएं (कम से कम 6 अक्षर)' : 'Create a password (min 6 chars)')
                    }
                    className="input-field pr-12"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl btn-gold font-semibold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isLogin 
                      ? (isHindi ? 'साइन इन हो रहा है...' : 'Signing in...')
                      : (isHindi ? 'खाता बन रहा है...' : 'Creating account...')
                    }
                  </>
                ) : (
                  isLogin 
                    ? (isHindi ? 'साइन इन करें' : 'Sign In')
                    : (isHindi ? 'मुफ़्त खाता बनाएं' : 'Create Free Account')
                )}
              </button>

              {/* Demo Info */}
              {!isLogin && (
                <p className="text-xs text-center text-muted-foreground">
                  {isHindi 
                    ? 'मुफ़्त डेमो मोड से शुरू करें। कोई भुगतान नहीं।'
                    : 'Start with free demo mode. No payment required.'
                  }
                </p>
              )}
            </form>
          )}

          {/* Staff Login Form */}
          {isLogin && loginMode === 'staff' && (
            <form onSubmit={handleStaffLogin} className="space-y-4">
              {/* Store Phone Number */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {isHindi ? 'दुकान का फ़ोन नंबर' : 'Store Phone Number'}
                </label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="tel"
                    value={staffLoginData.storePhone}
                    onChange={(e) => setStaffLoginData({ ...staffLoginData, storePhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder={isHindi ? 'मालिक का मोबाइल नंबर' : "Owner's mobile number"}
                    className="input-field pl-12"
                    maxLength={10}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isHindi ? 'मालिक से अपनी दुकान का नंबर पूछें' : 'Ask owner for store phone number'}
                </p>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {isHindi ? 'यूज़रनेम' : 'Username'}
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={staffLoginData.username}
                    onChange={(e) => setStaffLoginData({ ...staffLoginData, username: e.target.value })}
                    placeholder={isHindi ? 'अपना यूज़रनेम दर्ज करें' : 'Enter your username'}
                    className="input-field pl-12"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {isHindi ? 'पासवर्ड' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={staffLoginData.password}
                    onChange={(e) => setStaffLoginData({ ...staffLoginData, password: e.target.value })}
                    placeholder={isHindi ? 'अपना पासवर्ड दर्ज करें' : 'Enter your password'}
                    className="input-field pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl btn-gold font-semibold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isHindi ? 'लॉगिन हो रहा है...' : 'Logging in...'}
                  </>
                ) : (
                  <>
                    <Key className="w-5 h-5" />
                    {isHindi ? 'स्टाफ लॉगिन' : 'Staff Login'}
                  </>
                )}
              </button>
            </form>
          )}

          {/* Toggle Login/Signup - Only for owner mode */}
          {loginMode === 'owner' && (
            <div className="text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-medium hover:underline"
              >
                {isLogin 
                  ? (isHindi ? "खाता नहीं है? साइन अप करें" : "Don't have an account? Sign Up")
                  : (isHindi ? 'पहले से खाता है? साइन इन करें' : 'Already have an account? Sign In')
                }
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer with Policy Links */}
      <div className="py-4 text-center space-y-2">
        <p className="text-xs text-muted-foreground">
          {isHindi ? 'जारी रखकर, आप हमारी शर्तों से सहमत हैं' : 'By continuing, you agree to our'}
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
          <Link to="/policy/terms" className="text-primary hover:underline">
            {isHindi ? 'नियम और शर्तें' : 'Terms & Conditions'}
          </Link>
          <span className="text-muted-foreground">•</span>
          <Link to="/policy/privacy" className="text-primary hover:underline">
            {isHindi ? 'गोपनीयता नीति' : 'Privacy Policy'}
          </Link>
          <span className="text-muted-foreground">��</span>
          <Link to="/policy/refund" className="text-primary hover:underline">
            {isHindi ? 'रिफंड नीति' : 'Refund Policy'}
          </Link>
        </div>
      </div>
    </div>
  );
}
