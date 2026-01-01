import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Download, 
  Share2, 
  FileText,
  User,
  Phone,
  Calendar,
  IndianRupee,
  Package
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/app-store';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};

interface InvoiceData {
  id: string;
  invoice_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  items: any[];
  subtotal: number;
  tax_amount: number;
  discount: number;
  total: number;
  payment_mode: string;
  amount_paid: number;
  due_amount: number;
  status: string;
  created_at: string;
}

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shopSettings } = useAppStore();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadInvoice(id);
    }
  }, [id]);

  const loadInvoice = async (invoiceId: string) => {
    try {
      // Load from Supabase instead of IndexedDB
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (error) {
        console.error('Error loading invoice:', error);
        setInvoice(null);
      } else if (data) {
        // Parse items if it's a string
        const items = typeof data.items === 'string' ? JSON.parse(data.items) : (Array.isArray(data.items) ? data.items : []);
        setInvoice({ ...data, items } as InvoiceData);
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      setInvoice(null);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = (): Blob | null => {
    if (!invoice) return null;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(shopSettings.shopName || 'Revonn Store', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (shopSettings.address) {
      doc.text(shopSettings.address, 105, 28, { align: 'center' });
    }
    if (shopSettings.gstin) {
      doc.text(`GSTIN: ${shopSettings.gstin}`, 105, 34, { align: 'center' });
    }
    if (shopSettings.phone) {
      doc.text(`Phone: ${shopSettings.phone}`, 105, 40, { align: 'center' });
    }
    
    // Invoice title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', 105, 52, { align: 'center' });
    
    // Invoice details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${invoice.invoice_number}`, 20, 65);
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString('en-IN')}`, 150, 65);
    
    // Customer details
    if (invoice.customer_name) {
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', 20, 78);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.customer_name, 20, 85);
      if (invoice.customer_phone) {
        doc.text(`Phone: ${invoice.customer_phone}`, 20, 91);
      }
    }
    
    // Items table
    let y = 105;
    doc.setFillColor(218, 165, 32);
    doc.rect(20, y, 170, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Item', 22, y + 7);
    doc.text('Size', 85, y + 7);
    doc.text('Qty', 110, y + 7);
    doc.text('Rate', 130, y + 7);
    doc.text('Amount', 160, y + 7);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    y += 15;
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    items.forEach((item: any) => {
      const itemName = (item.itemName || item.name || 'Item').substring(0, 30);
      doc.text(itemName, 22, y);
      doc.text(item.size || '-', 85, y);
      doc.text((item.quantity || 1).toString(), 110, y);
      doc.text(formatCurrency(item.unitPrice || item.price || 0).replace('₹', ''), 130, y);
      doc.text(formatCurrency(item.total || (item.quantity * item.unitPrice) || 0).replace('₹', ''), 160, y);
      y += 8;
    });
    
    // Totals
    y += 5;
    doc.line(20, y, 190, y);
    y += 10;
    
    doc.text('Subtotal:', 130, y);
    doc.text(formatCurrency(invoice.subtotal || invoice.total), 160, y);
    
    if (invoice.discount > 0) {
      y += 8;
      doc.text('Discount:', 130, y);
      doc.text(`-${formatCurrency(invoice.discount)}`, 160, y);
    }
    
    if (invoice.tax_amount > 0) {
      y += 8;
      doc.text('GST:', 130, y);
      doc.text(formatCurrency(invoice.tax_amount), 160, y);
    }
    
    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Grand Total:', 130, y);
    doc.text(formatCurrency(invoice.total), 160, y);
    
    // Payment info
    y += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment: ${(invoice.payment_mode || 'cash').toUpperCase()}`, 20, y);
    if (invoice.due_amount > 0) {
      doc.text(`Due: ${formatCurrency(invoice.due_amount)}`, 100, y);
    }
    doc.text(`Status: ${(invoice.status || 'completed').toUpperCase()}`, 150, y);
    
    // Footer
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', 105, 270, { align: 'center' });
    doc.text('Powered by Revonn', 105, 276, { align: 'center' });
    
    return doc.output('blob');
  };

  const handleDownload = () => {
    const pdfBlob = generatePDF();
    if (pdfBlob && invoice) {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Invoice downloaded!');
    }
  };

  const handleShare = async () => {
    const pdfBlob = generatePDF();
    if (pdfBlob && invoice) {
      try {
        await navigator.share({
          title: `Invoice ${invoice.invoice_number}`,
          text: `Invoice from ${shopSettings.shopName}\nTotal: ${formatCurrency(invoice.total)}`,
          files: [new File([pdfBlob], `${invoice.invoice_number}.pdf`, { type: 'application/pdf' })]
        });
      } catch (error) {
        // Fallback to download if share fails
        handleDownload();
      }
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Invoice" hideNav>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!invoice) {
    return (
      <AppLayout title="Invoice" hideNav>
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground">Invoice not found</h3>
          <p className="text-sm text-muted-foreground mt-1">This invoice may have been deleted or doesn't exist.</p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-4 text-primary font-medium"
          >
            Go back
          </button>
        </div>
      </AppLayout>
    );
  }

  const items = Array.isArray(invoice.items) ? invoice.items : [];

  return (
    <AppLayout title="Invoice Details" hideNav>
      <div className="px-4 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-secondary"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">{invoice.invoice_number}</h1>
              <p className="text-sm text-muted-foreground">
                {new Date(invoice.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleDownload}
              className="p-2 rounded-xl bg-secondary"
            >
              <Download className="w-5 h-5 text-muted-foreground" />
            </button>
            <button 
              onClick={handleShare}
              className="p-2 rounded-xl bg-primary text-primary-foreground"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customer Info Card */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-secondary">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {invoice.customer_name || 'Walk-in Customer'}
              </p>
              {invoice.customer_phone && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {invoice.customer_phone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 bg-secondary/50 border-b border-border">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Package className="w-4 h-4" />
              Items ({items.length})
            </h3>
          </div>
          <div className="divide-y divide-border">
            {items.map((item: any, index: number) => (
              <div key={item.id || index} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{item.itemName || item.name || 'Item'}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.size && `Size: ${item.size} • `}
                    {formatCurrency(item.unitPrice || item.price || 0)} × {item.quantity || 1}
                  </p>
                </div>
                <p className="font-semibold text-foreground">{formatCurrency(item.total || (item.quantity * (item.unitPrice || item.price || 0)))}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bill Summary */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <IndianRupee className="w-4 h-4" />
            Bill Summary
          </h3>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(invoice.subtotal || invoice.total)}</span>
          </div>
          
          {invoice.discount > 0 && (
            <div className="flex justify-between text-sm text-success">
              <span>Discount</span>
              <span>-{formatCurrency(invoice.discount)}</span>
            </div>
          )}
          
          {invoice.tax_amount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST</span>
              <span>{formatCurrency(invoice.tax_amount)}</span>
            </div>
          )}
          
          <div className="pt-3 border-t border-border flex justify-between">
            <span className="text-lg font-bold text-foreground">Grand Total</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(invoice.total)}</span>
          </div>
          
          <div className="flex justify-between text-sm pt-2">
            <span className="text-muted-foreground">Payment Method</span>
            <span className="capitalize font-medium">{invoice.payment_mode || 'cash'}</span>
          </div>
          
          {invoice.amount_paid > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="font-medium text-success">{formatCurrency(invoice.amount_paid)}</span>
            </div>
          )}
          
          {invoice.due_amount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Due Amount</span>
              <span className="font-medium text-destructive">{formatCurrency(invoice.due_amount)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className={`font-medium ${invoice.status === 'completed' ? 'text-success' : 'text-warning'}`}>
              {(invoice.status || 'completed').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 py-3 px-4 rounded-xl bg-secondary text-secondary-foreground font-medium flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-3 px-4 rounded-xl btn-gold font-medium flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share via WhatsApp
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
