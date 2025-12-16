import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PlanType = 'demo' | 'basic' | 'pro';

export interface Subscription {
  plan_type: PlanType;
  ai_addon: boolean;
  billing_cycle: 'monthly' | 'yearly' | null;
  is_active: boolean;
  expires_at: string | null;
}

export interface DemoUsage {
  bills_created: number;
  inventory_items: number;
  customers_added: number;
}

export interface DemoLimits {
  bills: { current: number; max: number };
  inventory: { current: number; max: number };
  customers: { current: number; max: number };
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  demoUsage: DemoUsage | null;
  isDemo: boolean;
  isPro: boolean;
  hasAI: boolean;
  loading: boolean;
  checkLimit: (limitType: 'bills' | 'inventory' | 'customers') => Promise<{ allowed: boolean; current: number; max: number }>;
  incrementUsage: (limitType: 'bills' | 'inventory' | 'customers') => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const DEMO_LIMITS = {
  bills: 5,
  inventory: 10,
  customers: 10
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [demoUsage, setDemoUsage] = useState<DemoUsage | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch subscription
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subError);
      }

      if (subData) {
        setSubscription({
          plan_type: subData.plan_type as PlanType,
          ai_addon: subData.ai_addon,
          billing_cycle: subData.billing_cycle as 'monthly' | 'yearly' | null,
          is_active: subData.is_active,
          expires_at: subData.expires_at
        });
      } else {
        // Create default demo subscription
        const { data: newSub } = await supabase
          .from('user_subscriptions')
          .insert({ user_id: user.id, plan_type: 'demo' })
          .select()
          .single();
        
        if (newSub) {
          setSubscription({
            plan_type: 'demo',
            ai_addon: false,
            billing_cycle: null,
            is_active: true,
            expires_at: null
          });
        }
      }

      // Fetch demo usage
      const { data: usageData, error: usageError } = await supabase
        .from('demo_usage')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (usageError && usageError.code !== 'PGRST116') {
        console.error('Error fetching demo usage:', usageError);
      }

      if (usageData) {
        setDemoUsage({
          bills_created: usageData.bills_created,
          inventory_items: usageData.inventory_items,
          customers_added: usageData.customers_added
        });
      } else {
        // Create default demo usage
        const { data: newUsage } = await supabase
          .from('demo_usage')
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (newUsage) {
          setDemoUsage({
            bills_created: 0,
            inventory_items: 0,
            customers_added: 0
          });
        }
      }
    } catch (error) {
      console.error('Error in fetchSubscription:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(() => {
      fetchSubscription();
    });

    return () => authSub.unsubscribe();
  }, []);

  const isDemo = subscription?.plan_type === 'demo' || !subscription;
  const isPro = subscription?.plan_type === 'pro' && subscription?.is_active;
  const hasAI = subscription?.ai_addon || false;

  const checkLimit = async (limitType: 'bills' | 'inventory' | 'customers') => {
    if (!isDemo) {
      return { allowed: true, current: 0, max: Infinity };
    }

    const currentMap = {
      bills: demoUsage?.bills_created || 0,
      inventory: demoUsage?.inventory_items || 0,
      customers: demoUsage?.customers_added || 0
    };

    const current = currentMap[limitType];
    const max = DEMO_LIMITS[limitType];

    return {
      allowed: current < max,
      current,
      max
    };
  };

  const incrementUsage = async (limitType: 'bills' | 'inventory' | 'customers') => {
    if (!isDemo) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updateField = {
      bills: 'bills_created',
      inventory: 'inventory_items',
      customers: 'customers_added'
    }[limitType];

    const currentValue = demoUsage?.[updateField as keyof DemoUsage] || 0;

    await supabase
      .from('demo_usage')
      .update({ [updateField]: currentValue + 1, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    // Refresh usage
    setDemoUsage(prev => prev ? {
      ...prev,
      [updateField]: (prev[updateField as keyof DemoUsage] || 0) + 1
    } : null);
  };

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      demoUsage,
      isDemo,
      isPro,
      hasAI,
      loading,
      checkLimit,
      incrementUsage,
      refreshSubscription: fetchSubscription
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
