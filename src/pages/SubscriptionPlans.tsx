import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, Sparkles, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SubscriptionPlansProps {
  trigger?: string;
  onClose?: () => void;
}

const plans = [
  {
    id: 'basic',
    name: 'Revonn Basic',
    icon: Zap,
    monthlyPrice: 219,
    yearlyPrice: 2199,
    popular: false,
    features: [
      { name: 'Unlimited billing (Non-GST)', included: true },
      { name: 'Unlimited inventory items', included: true },
      { name: 'Unlimited customers', included: true },
      { name: 'Daily sales & expense tracking', included: true },
      { name: 'Basic reports & analytics', included: true },
      { name: 'PDF invoices', included: true },
      { name: 'Manual WhatsApp sharing', included: true },
      { name: 'GST invoices & compliance', included: false },
      { name: 'Staff management', included: false },
      { name: 'Advanced analytics', included: false },
    ]
  },
  {
    id: 'pro',
    name: 'Revonn Pro',
    icon: Crown,
    monthlyPrice: 349,
    yearlyPrice: 3499,
    popular: true,
    features: [
      { name: 'Everything in Basic', included: true },
      { name: 'GST invoices (CGST/SGST/IGST)', included: true },
      { name: 'HSN/SAC code support', included: true },
      { name: 'Staff management & attendance', included: true },
      { name: 'Role-based access control', included: true },
      { name: 'Advanced reports & analytics', included: true },
      { name: 'Monthly/category-wise reports', included: true },
      { name: 'Multi-user login', included: true },
      { name: 'Priority support', included: true },
    ]
  }
];

const aiAddon = {
  name: 'AI Add-on',
  icon: Sparkles,
  price: 99,
  features: [
    'Voice & text billing commands',
    'Smart inventory insights',
    'Low-stock predictions',
    'Daily profit analysis',
    'Hindi & English support',
    'Festival marketing content',
  ]
};

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ trigger, onClose }) => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = React.useState<string | null>(null);
  const [includeAI, setIncludeAI] = React.useState(false);

  const handleSubscribe = (planId: string) => {
    // For now, show coming soon message
    // In production, this would integrate with payment gateway
    alert(`Subscription to ${planId} plan will be available soon. Contact support for early access.`);
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Choose Your Plan</h1>
            {trigger && (
              <p className="text-muted-foreground text-sm mt-1">
                {trigger === 'bills' && "You've reached the demo limit of 5 bills."}
                {trigger === 'inventory' && "You've reached the demo limit of 10 inventory items."}
                {trigger === 'customers' && "You've reached the demo limit of 10 customers."}
                {trigger === 'gst' && "GST features require a Pro subscription."}
                {trigger === 'staff' && "Staff management requires a Pro subscription."}
                {trigger === 'reports' && "Advanced reports require a paid subscription."}
                {!['bills', 'inventory', 'customers', 'gst', 'staff', 'reports'].includes(trigger) && 
                  "Subscribe to unlock all features."}
              </p>
            )}
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              billingCycle === 'monthly' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              billingCycle === 'yearly' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}
          >
            Yearly
            <Badge variant="secondary" className="ml-2 text-xs">Save 15%</Badge>
          </button>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            
            return (
              <Card 
                key={plan.id}
                className={`p-6 relative ${
                  plan.popular ? 'border-primary ring-2 ring-primary/20' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${plan.popular ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`h-6 w-6 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <h2 className="text-xl font-bold">{plan.name}</h2>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-bold">₹{price}</span>
                  <span className="text-muted-foreground">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? 'text-foreground' : 'text-muted-foreground'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full" 
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  Subscribe to {plan.name}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* AI Add-on */}
        <Card className="p-6 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/30">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Sparkles className="h-6 w-6 text-violet-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{aiAddon.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Add AI intelligence to any plan
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold">+₹{aiAddon.price}</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
            {aiAddon.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Demo Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Demo mode includes: 5 bills, 10 inventory items, 10 customers</p>
          <p>All demo data will be preserved after subscription.</p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
