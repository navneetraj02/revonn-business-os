import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Crown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DemoLimitModalProps {
  open: boolean;
  onClose: () => void;
  limitType: 'bills' | 'inventory' | 'customers' | 'gst' | 'staff' | 'reports' | 'export';
  currentCount?: number;
  maxLimit?: number;
}

const limitMessages = {
  bills: {
    title: 'Demo Limit Reached',
    description: "You've created 5 demo invoices. Subscribe to create unlimited bills.",
    icon: Lock
  },
  inventory: {
    title: 'Demo Limit Reached',
    description: "You've added 10 demo items. Subscribe to add unlimited inventory.",
    icon: Lock
  },
  customers: {
    title: 'Demo Limit Reached',
    description: "You've added 10 demo customers. Subscribe to add more.",
    icon: Lock
  },
  gst: {
    title: 'Pro Feature',
    description: 'GST invoices and compliance features require Revonn Pro.',
    icon: Crown
  },
  staff: {
    title: 'Pro Feature',
    description: 'Staff management and attendance require Revonn Pro.',
    icon: Crown
  },
  reports: {
    title: 'Upgrade Required',
    description: 'Advanced reports and weekly/monthly analytics require a subscription.',
    icon: Lock
  },
  export: {
    title: 'Upgrade Required',
    description: 'Export features require a subscription.',
    icon: Lock
  }
};

export const DemoLimitModal: React.FC<DemoLimitModalProps> = ({
  open,
  onClose,
  limitType,
  currentCount,
  maxLimit
}) => {
  const navigate = useNavigate();
  const config = limitMessages[limitType];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center">{config.title}</DialogTitle>
          <DialogDescription className="text-center">
            {config.description}
            {currentCount !== undefined && maxLimit !== undefined && (
              <span className="block mt-2 text-sm">
                Used: {currentCount}/{maxLimit}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          <Button 
            onClick={() => {
              onClose();
              navigate('/subscription', { state: { trigger: limitType } });
            }}
            className="w-full"
          >
            View Plans
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            Continue Demo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoLimitModal;
