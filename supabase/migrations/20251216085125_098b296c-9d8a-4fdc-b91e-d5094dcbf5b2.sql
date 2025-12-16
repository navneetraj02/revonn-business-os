-- Create user_subscriptions table for tracking subscription status
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'demo' CHECK (plan_type IN ('demo', 'basic', 'pro')),
  ai_addon BOOLEAN NOT NULL DEFAULT false,
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create demo_usage table for tracking demo limits
CREATE TABLE public.demo_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  bills_created INTEGER NOT NULL DEFAULT 0,
  inventory_items INTEGER NOT NULL DEFAULT 0,
  customers_added INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_subscriptions
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON public.user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for demo_usage
CREATE POLICY "Users can view own demo usage" ON public.demo_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own demo usage" ON public.demo_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own demo usage" ON public.demo_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to initialize demo user on signup
CREATE OR REPLACE FUNCTION public.initialize_demo_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_type)
  VALUES (NEW.id, 'demo')
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.demo_usage (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-initialize demo for new users
CREATE TRIGGER on_auth_user_created_demo
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_demo_user();

-- Function to check and increment demo usage
CREATE OR REPLACE FUNCTION public.check_demo_limit(
  p_user_id UUID,
  p_limit_type TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription RECORD;
  v_usage RECORD;
  v_limit_reached BOOLEAN := false;
  v_current_count INTEGER;
  v_max_limit INTEGER;
BEGIN
  -- Get subscription
  SELECT * INTO v_subscription FROM user_subscriptions WHERE user_id = p_user_id;
  
  -- If no subscription or active paid plan, allow
  IF v_subscription IS NULL OR (v_subscription.plan_type != 'demo' AND v_subscription.is_active) THEN
    RETURN json_build_object('allowed', true, 'is_demo', false);
  END IF;
  
  -- Get demo usage
  SELECT * INTO v_usage FROM demo_usage WHERE user_id = p_user_id;
  
  IF v_usage IS NULL THEN
    INSERT INTO demo_usage (user_id) VALUES (p_user_id);
    SELECT * INTO v_usage FROM demo_usage WHERE user_id = p_user_id;
  END IF;
  
  -- Check limits based on type
  CASE p_limit_type
    WHEN 'bills' THEN
      v_current_count := v_usage.bills_created;
      v_max_limit := 5;
    WHEN 'inventory' THEN
      v_current_count := v_usage.inventory_items;
      v_max_limit := 10;
    WHEN 'customers' THEN
      v_current_count := v_usage.customers_added;
      v_max_limit := 10;
    ELSE
      RETURN json_build_object('allowed', true, 'is_demo', true);
  END CASE;
  
  v_limit_reached := v_current_count >= v_max_limit;
  
  RETURN json_build_object(
    'allowed', NOT v_limit_reached,
    'is_demo', true,
    'current_count', v_current_count,
    'max_limit', v_max_limit,
    'limit_type', p_limit_type
  );
END;
$$;

-- Function to increment demo usage
CREATE OR REPLACE FUNCTION public.increment_demo_usage(
  p_user_id UUID,
  p_limit_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE p_limit_type
    WHEN 'bills' THEN
      UPDATE demo_usage SET bills_created = bills_created + 1, updated_at = now() WHERE user_id = p_user_id;
    WHEN 'inventory' THEN
      UPDATE demo_usage SET inventory_items = inventory_items + 1, updated_at = now() WHERE user_id = p_user_id;
    WHEN 'customers' THEN
      UPDATE demo_usage SET customers_added = customers_added + 1, updated_at = now() WHERE user_id = p_user_id;
  END CASE;
END;
$$;