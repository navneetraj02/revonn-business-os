import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';

export default function PaymentStatus() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { refreshSubscription } = useSubscription();
  const isHindi = language === 'hi';
  
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      // Get pending transaction from localStorage
      const pendingData = localStorage.getItem('pendingTransaction');
      if (!pendingData) {
        setStatus('failed');
        setMessage(isHindi ? 'ट्रांजैक्शन जानकारी नहीं मिली' : 'Transaction information not found');
        return;
      }

      const transaction = JSON.parse(pendingData);

      // Verify payment with PhonePe
      const response = await supabase.functions.invoke('phonepe-payment', {
        body: {
          action: 'verify',
          transactionId: transaction.transactionId,
          userId: transaction.userId,
          planType: transaction.planType,
          billingCycle: transaction.billingCycle
        }
      });

      if (response.error) throw response.error;

      const result = response.data;

      if (result.success && result.paymentStatus === 'SUCCESS') {
        setStatus('success');
        setMessage(isHindi 
          ? 'आपका Revonn Pro प्लान सक्रिय हो गया है!'
          : 'Your Revonn Pro plan is now active!'
        );
        
        // Clear pending transaction
        localStorage.removeItem('pendingTransaction');
        
        // Refresh subscription status
        await refreshSubscription();
      } else {
        setStatus('failed');
        setMessage(result.message || (isHindi ? 'भुगतान विफल' : 'Payment failed'));
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setStatus('failed');
      setMessage(isHindi ? 'भुगतान सत्यापन में त्रुटि' : 'Payment verification error');
    }
  };

  return (
    <AppLayout title={isHindi ? 'पेमेंट स्टेटस' : 'Payment Status'} hideNav>
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <Card className="p-8 text-center max-w-sm w-full">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
              <h2 className="text-xl font-bold mb-2">
                {isHindi ? 'भुगतान सत्यापित हो रहा है...' : 'Verifying payment...'}
              </h2>
              <p className="text-muted-foreground">
                {isHindi ? 'कृपया प्रतीक्षा करें' : 'Please wait'}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 mx-auto bg-success/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-success" />
              </div>
              <h2 className="text-xl font-bold text-success mb-2">
                {isHindi ? 'भुगतान सफल!' : 'Payment Successful!'}
              </h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Button 
                onClick={() => navigate('/dashboard')} 
                className="w-full btn-gold"
              >
                {isHindi ? 'डैशबोर्ड पर जाएं' : 'Go to Dashboard'}
              </Button>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-20 h-20 mx-auto bg-destructive/20 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-12 h-12 text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-destructive mb-2">
                {isHindi ? 'भुगतान विफल' : 'Payment Failed'}
              </h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/subscription')} 
                  className="w-full"
                >
                  {isHindi ? 'पुनः प्रयास करें' : 'Try Again'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/dashboard')} 
                  className="w-full"
                >
                  {isHindi ? 'डैशबोर्ड पर जाएं' : 'Go to Dashboard'}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
