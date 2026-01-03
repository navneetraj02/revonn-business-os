import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

const translations: Translations = {
  // Header
  'ai_business_os': { en: 'AI Business OS', hi: 'AI बिज़नेस OS' },
  
  // Dashboard
  'good_morning': { en: 'Good Morning!', hi: 'सुप्रभात!' },
  'good_afternoon': { en: 'Good Afternoon!', hi: 'नमस्कार!' },
  'good_evening': { en: 'Good Evening!', hi: 'शुभ संध्या!' },
  'quick_access': { en: 'Quick Access', hi: 'त्वरित पहुँच' },
  'todays_summary': { en: "Today's Summary", hi: 'आज का सारांश' },
  'total_sales': { en: 'Total Sales', hi: 'कुल बिक्री' },
  'items_sold': { en: 'Items Sold', hi: 'बेचे गए आइटम' },
  'invoices': { en: 'invoices', hi: 'बिल' },
  'cash_in': { en: 'Cash In', hi: 'नकद प्राप्त' },
  'tax_collected': { en: 'Tax Collected', hi: 'कर एकत्रित' },
  'todays_revenue': { en: "Today's Revenue", hi: 'आज का राजस्व' },
  'top_selling_items': { en: 'Top Selling Items', hi: 'सबसे ज़्यादा बिकने वाले' },
  'sold': { en: 'sold', hi: 'बिके' },
  'low_stock_alerts': { en: 'Low Stock Alerts', hi: 'कम स्टॉक अलर्ट' },
  'view_all': { en: 'View All', hi: 'सभी देखें' },
  'only_left': { en: 'Only', hi: 'सिर्फ' },
  'left': { en: 'left', hi: 'बचे' },
  'restock': { en: 'Restock', hi: 'रीस्टॉक' },
  'recent_bills': { en: 'Recent Bills', hi: 'हाल के बिल' },
  'no_bills_today': { en: 'No bills today yet', hi: 'आज कोई बिल नहीं' },
  'create_first_bill': { en: 'Create your first bill', hi: 'पहला बिल बनाएं' },
  'walk_in_customer': { en: 'Walk-in Customer', hi: 'वॉक-इन ग्राहक' },
  'items': { en: 'items', hi: 'आइटम' },
  'welcome_back': { en: 'Welcome back', hi: 'स्वागत है' },
  'your_store': { en: 'Your Store', hi: 'आपकी दुकान' },
  'dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड' },
  
  // Navigation tabs
  'bill': { en: 'Bill', hi: 'बिल' },
  'inventory': { en: 'Inventory', hi: 'इन्वेंट्री' },
  'finance': { en: 'Finance', hi: 'वित्त' },
  'customer': { en: 'Customer', hi: 'ग्राहक' },
  'gst': { en: 'GST', hi: 'जीएसटी' },
  'marketing': { en: 'Marketing', hi: 'मार्केटिंग' },
  'staff': { en: 'Staff', hi: 'कर्मचारी' },
  'soon': { en: 'Soon', hi: 'जल्द' },
  
  // Bottom Nav
  'home': { en: 'Home', hi: 'होम' },
  'reports': { en: 'Reports', hi: 'रिपोर्ट' },
  'settings': { en: 'Settings', hi: 'सेटिंग्स' },
  
  // Inventory
  'search_items': { en: 'Search items...', hi: 'आइटम खोजें...' },
  'add_item': { en: 'Add Item', hi: 'आइटम जोड़ें' },
  'upload_bom': { en: 'Upload BOM', hi: 'BOM अपलोड करें' },
  'all': { en: 'All', hi: 'सभी' },
  'top_selling': { en: 'Top Selling', hi: 'टॉप सेलिंग' },
  'low_stock': { en: 'Low Stock', hi: 'कम स्टॉक' },
  'no_items_found': { en: 'No items found', hi: 'कोई आइटम नहीं मिला' },
  'loading': { en: 'Loading...', hi: 'लोड हो रहा है...' },
  'stock': { en: 'Stock', hi: 'स्टॉक' },
  'price': { en: 'Price', hi: 'कीमत' },
  'save': { en: 'Save', hi: 'सेव करें' },
  'cancel': { en: 'Cancel', hi: 'रद्द करें' },
  'update': { en: 'Update', hi: 'अपडेट करें' },
  'delete': { en: 'Delete', hi: 'हटाएं' },
  'add_new_item': { en: 'Add New Item', hi: 'नया आइटम जोड़ें' },
  'item_name': { en: 'Item Name', hi: 'आइटम का नाम' },
  'product_name': { en: 'Product Name', hi: 'उत्पाद का नाम' },
  'add': { en: 'Add', hi: 'जोड़ें' },
  
  // Billing
  'create_bill': { en: 'Create Bill', hi: 'बिल बनाएं' },
  'customer_details': { en: 'Customer Details', hi: 'ग्राहक विवरण' },
  'search_existing': { en: 'Search existing', hi: 'मौजूदा खोजें' },
  'customer_name': { en: 'Customer name', hi: 'ग्राहक का नाम' },
  'phone_number': { en: 'Phone number', hi: 'फ़ोन नंबर' },
  'add_items': { en: 'Add Items', hi: 'आइटम जोड़ें' },
  'no_items_added': { en: 'No items added yet', hi: 'अभी कोई आइटम नहीं' },
  'subtotal': { en: 'Subtotal', hi: 'उप-कुल' },
  'discount': { en: 'Discount', hi: 'छूट' },
  'tax': { en: 'Tax', hi: 'कर' },
  'total': { en: 'Total', hi: 'कुल' },
  'payment_mode': { en: 'Payment Mode', hi: 'भुगतान का तरीका' },
  'cash': { en: 'Cash', hi: 'नकद' },
  'card': { en: 'Card', hi: 'कार्ड' },
  'online': { en: 'Online', hi: 'ऑनलाइन' },
  'due': { en: 'Due', hi: 'बकाया' },
  'amount_received': { en: 'Amount Received', hi: 'प्राप्त राशि' },
  'balance': { en: 'Balance', hi: 'शेष' },
  'save_print': { en: 'Save & Print', hi: 'सेव और प्रिंट' },
  'billing': { en: 'Billing', hi: 'बिलिंग' },
  'new_bill': { en: 'New Bill', hi: 'नया बिल' },
  'select_customer': { en: 'Select Customer', hi: 'ग्राहक चुनें' },
  'add_product': { en: 'Add Product', hi: 'उत्पाद जोड़ें' },
  'bill_summary': { en: 'Bill Summary', hi: 'बिल सारांश' },
  'generate_bill': { en: 'Generate Bill', hi: 'बिल बनाएं' },
  'print_bill': { en: 'Print Bill', hi: 'बिल प्रिंट करें' },
  'share_bill': { en: 'Share Bill', hi: 'बिल शेयर करें' },
  
  // Reports
  'today': { en: 'Today', hi: 'आज' },
  'days_7': { en: '7 Days', hi: '7 दिन' },
  'days_30': { en: '30 Days', hi: '30 दिन' },
  'gross_profit': { en: 'Gross Profit', hi: 'सकल लाभ' },
  'export_report': { en: 'Export Report as PDF', hi: 'PDF के रूप में निर्यात करें' },
  'recent_invoices': { en: 'Recent Invoices', hi: 'हाल के बिल' },
  'no_invoices_period': { en: 'No invoices in this period', hi: 'इस अवधि में कोई बिल नहीं' },
  'sales_report': { en: 'Sales Report', hi: 'बिक्री रिपोर्ट' },
  'revenue': { en: 'Revenue', hi: 'राजस्व' },
  'profit': { en: 'Profit', hi: 'लाभ' },
  'expenses': { en: 'Expenses', hi: 'खर्च' },
  'analytics': { en: 'Analytics', hi: 'विश्लेषण' },
  'weekly': { en: 'Weekly', hi: 'साप्ताहिक' },
  'monthly': { en: 'Monthly', hi: 'मासिक' },
  'yearly': { en: 'Yearly', hi: 'वार्षिक' },
  
  // Customers
  'customers': { en: 'Customers', hi: 'ग्राहक' },
  'add_customer': { en: 'Add Customer', hi: 'ग्राहक जोड़ें' },
  'search_customers': { en: 'Search customers...', hi: 'ग्राहक खोजें...' },
  'total_purchases': { en: 'Total Purchases', hi: 'कुल खरीदारी' },
  'total_dues': { en: 'Total Dues', hi: 'कुल बकाया' },
  'customer_history': { en: 'Customer History', hi: 'ग्राहक इतिहास' },
  'new_customer': { en: 'New Customer', hi: 'नया ग्राहक' },
  'customer_phone': { en: 'Customer Phone', hi: 'ग्राहक फ़ोन' },
  'customer_email': { en: 'Customer Email', hi: 'ग्राहक ईमेल' },
  'customer_address': { en: 'Customer Address', hi: 'ग्राहक पता' },
  'no_customers': { en: 'No customers yet', hi: 'अभी कोई ग्राहक नहीं' },
  'purchase_history': { en: 'Purchase History', hi: 'खरीदारी इतिहास' },
  
  // Settings
  'shop_settings': { en: 'Shop Settings', hi: 'दुकान सेटिंग्स' },
  'ai_settings': { en: 'AI Settings', hi: 'AI सेटिंग्स' },
  'invoice_settings': { en: 'Invoice Settings', hi: 'बिल सेटिंग्स' },
  'notifications': { en: 'Notifications', hi: 'सूचनाएं' },
  'backup_restore': { en: 'Backup & Restore', hi: 'बैकअप और रिस्टोर' },
  'privacy': { en: 'Privacy', hi: 'गोपनीयता' },
  'help': { en: 'Help', hi: 'सहायता' },
  'business': { en: 'Business', hi: 'व्यवसाय' },
  'features': { en: 'Features', hi: 'सुविधाएं' },
  'data': { en: 'Data', hi: 'डेटा' },
  'support': { en: 'Support', hi: 'सहायता' },
  'subscription': { en: 'Subscription', hi: 'सब्सक्रिप्शन' },
  'shop_profile': { en: 'Shop Profile', hi: 'दुकान प्रोफाइल' },
  'name_gstin_address': { en: 'Name, GSTIN, Address', hi: 'नाम, जीएसटीआईएन, पता' },
  'invoice_prefix': { en: 'Prefix, templates', hi: 'प्रीफिक्स, टेम्पलेट' },
  'ai_assistant': { en: 'AI Assistant', hi: 'AI सहायक' },
  'ai_toggle': { en: 'Mock AI / Real AI toggle', hi: 'मॉक AI / रियल AI टॉगल' },
  'alerts_reminders': { en: 'Alerts & reminders', hi: 'अलर्ट और रिमाइंडर' },
  'export_import': { en: 'Export/import your data', hi: 'डेटा एक्सपोर्ट/इम्पोर्ट करें' },
  'sync_status': { en: 'Sync Status', hi: 'सिंक स्टेटस' },
  'pending_items': { en: 'Pending: 0 items', hi: 'बकाया: 0 आइटम' },
  'help_faq': { en: 'Help & FAQ', hi: 'सहायता और FAQ' },
  'get_help': { en: 'Get help using Revonn', hi: 'रेवॉन उपयोग में सहायता प्राप्त करें' },
  'privacy_security': { en: 'Privacy & Security', hi: 'गोपनीयता और सुरक्षा' },
  'data_protection': { en: 'Data protection', hi: 'डेटा सुरक्षा' },
  'pricing': { en: 'Pricing', hi: 'मूल्य निर्धारण' },
  'view_plans': { en: 'View subscription plans', hi: 'सब्सक्रिप्शन प्लान देखें' },
  'export_backup': { en: 'Export Backup', hi: 'बैकअप एक्सपोर्ट करें' },
  'import_backup': { en: 'Import Backup', hi: 'बैकअप इम्पोर्ट करें' },
  'language': { en: 'Language', hi: 'भाषा' },
  'english': { en: 'English', hi: 'अंग्रेज़ी' },
  'hindi': { en: 'Hindi', hi: 'हिंदी' },
  'theme': { en: 'Theme', hi: 'थीम' },
  'dark_mode': { en: 'Dark Mode', hi: 'डार्क मोड' },
  'light_mode': { en: 'Light Mode', hi: 'लाइट मोड' },
  'logout': { en: 'Logout', hi: 'लॉगआउट' },
  'profile': { en: 'Profile', hi: 'प्रोफाइल' },
  'account_settings': { en: 'Account Settings', hi: 'खाता सेटिंग्स' },
  
  // Common
  'loading_inventory': { en: 'Loading inventory...', hi: 'इन्वेंट्री लोड हो रही है...' },
  'error': { en: 'Error', hi: 'त्रुटि' },
  'success': { en: 'Success', hi: 'सफल' },
  'confirm': { en: 'Confirm', hi: 'पुष्टि करें' },
  'back': { en: 'Back', hi: 'वापस' },
  'close': { en: 'Close', hi: 'बंद करें' },
  'open': { en: 'Open', hi: 'खोलें' },
  'edit': { en: 'Edit', hi: 'संपादित करें' },
  'view': { en: 'View', hi: 'देखें' },
  'search': { en: 'Search', hi: 'खोजें' },
  'filter': { en: 'Filter', hi: 'फ़िल्टर' },
  'sort': { en: 'Sort', hi: 'क्रमबद्ध करें' },
  'refresh': { en: 'Refresh', hi: 'रिफ्रेश' },
  'retry': { en: 'Retry', hi: 'पुनः प्रयास करें' },
  'submit': { en: 'Submit', hi: 'जमा करें' },
  'next': { en: 'Next', hi: 'अगला' },
  'previous': { en: 'Previous', hi: 'पिछला' },
  'continue': { en: 'Continue', hi: 'जारी रखें' },
  'skip': { en: 'Skip', hi: 'छोड़ें' },
  'done': { en: 'Done', hi: 'हो गया' },
  'yes': { en: 'Yes', hi: 'हाँ' },
  'no': { en: 'No', hi: 'नहीं' },
  'ok': { en: 'OK', hi: 'ठीक है' },
  'apply': { en: 'Apply', hi: 'लागू करें' },
  'reset': { en: 'Reset', hi: 'रीसेट करें' },
  'clear': { en: 'Clear', hi: 'साफ़ करें' },
  
  // Product Detail
  'product_details': { en: 'Product Details', hi: 'उत्पाद विवरण' },
  'edit_product': { en: 'Edit Product', hi: 'उत्पाद संपादित करें' },
  'sku': { en: 'SKU', hi: 'SKU' },
  'category': { en: 'Category', hi: 'श्रेणी' },
  'size': { en: 'Size', hi: 'साइज़' },
  'color': { en: 'Color', hi: 'रंग' },
  'cost_price': { en: 'Cost Price', hi: 'लागत मूल्य' },
  'selling_price': { en: 'Selling Price', hi: 'बिक्री मूल्य' },
  'gst_rate': { en: 'GST Rate', hi: 'जीएसटी दर' },
  'quantity': { en: 'Quantity', hi: 'मात्रा' },
  'sales_count': { en: 'Sales Count', hi: 'बिक्री गणना' },
  'hsn_code': { en: 'HSN Code', hi: 'HSN कोड' },
  'last_sold': { en: 'Last Sold', hi: 'अंतिम बिक्री' },
  'never': { en: 'Never', hi: 'कभी नहीं' },
  'product_updated': { en: 'Product updated successfully', hi: 'उत्पाद सफलतापूर्वक अपडेट हुआ' },
  'update_error': { en: 'Error updating product', hi: 'उत्पाद अपडेट करने में त्रुटि' },
  
  // Subscription
  'demo_limit_reached': { en: 'Demo Limit Reached', hi: 'डेमो सीमा पूरी' },
  'continue_demo': { en: 'Continue Demo', hi: 'डेमो जारी रखें' },
  'choose_plan': { en: 'Choose your plan', hi: 'अपना प्लान चुनें' },
  'month': { en: 'month', hi: 'महीना' },
  'year': { en: 'year', hi: 'वर्ष' },
  'save_15': { en: 'Save 15%', hi: '15% बचाएं' },
  'most_popular': { en: 'Most Popular', hi: 'सबसे लोकप्रिय' },
  'proceed_to_checkout': { en: 'Proceed to Checkout', hi: 'चेकआउट पर जाएं' },
  'current_plan': { en: 'Current Plan', hi: 'वर्तमान प्लान' },
  'upgrade': { en: 'Upgrade', hi: 'अपग्रेड करें' },
  'downgrade': { en: 'Downgrade', hi: 'डाउनग्रेड करें' },
  'free_trial': { en: 'Free Trial', hi: 'मुफ़्त ट्रायल' },
  'per_month': { en: 'per month', hi: 'प्रति माह' },
  'per_year': { en: 'per year', hi: 'प्रति वर्ष' },
  'features_included': { en: 'Features Included', hi: 'शामिल सुविधाएं' },
  'unlimited': { en: 'Unlimited', hi: 'असीमित' },
  
  // Checkout
  'checkout': { en: 'Checkout', hi: 'चेकआउट' },
  'complete_purchase': { en: 'Complete your purchase', hi: 'अपनी खरीदारी पूरी करें' },
  'order_summary': { en: 'Order Summary', hi: 'ऑर्डर सारांश' },
  'billing_cycle': { en: 'Billing Cycle', hi: 'बिलिंग साइकिल' },
  'payment_method': { en: 'Payment Method', hi: 'भुगतान का तरीका' },
  'enter_upi_id': { en: 'Enter UPI ID', hi: 'UPI ID दर्ज करें' },
  'credit_debit_card': { en: 'Credit/Debit Card', hi: 'क्रेडिट/डेबिट कार्ड' },
  'net_banking': { en: 'Net Banking', hi: 'नेट बैंकिंग' },
  'all_major_banks': { en: 'All major banks', hi: 'सभी प्रमुख बैंक' },
  'pay_now': { en: 'Pay Now', hi: 'अभी भुगतान करें' },
  'processing': { en: 'Processing...', hi: 'प्रोसेसिंग...' },
  
  // Policies
  'terms_conditions': { en: 'Terms & Conditions', hi: 'नियम और शर्तें' },
  'refund_policy': { en: 'Refund & Cancellation Policy', hi: 'रिफंड और रद्दीकरण नीति' },
  'privacy_policy': { en: 'Privacy Policy', hi: 'गोपनीयता नीति' },
  'our_policies': { en: 'Our Policies', hi: 'हमारी नीतियां' },
  
  // Privacy & Security
  'your_account_secure': { en: 'Your account is secure', hi: 'आपका खाता सुरक्षित है' },
  'security_enabled': { en: 'All security measures are enabled', hi: 'सभी सुरक्षा उपाय सक्षम हैं' },
  'data_encryption': { en: 'Data Encryption', hi: 'डेटा एन्क्रिप्शन' },
  'data_encrypted': { en: 'All your data is encrypted in transit and at rest', hi: 'आपका सभी डेटा ट्रांजिट और रेस्ट में एन्क्रिप्टेड है' },
  'enabled': { en: 'Enabled', hi: 'सक्षम' },
  'data_access': { en: 'Data Access', hi: 'डेटा एक्सेस' },
  'only_you_access': { en: 'Only you can access your business data', hi: 'केवल आप अपने व्यावसायिक डेटा तक पहुंच सकते हैं' },
  'private': { en: 'Private', hi: 'निजी' },
  'data_storage': { en: 'Data Storage', hi: 'डेटा स्टोरेज' },
  'secure_cloud': { en: 'Data stored securely on cloud servers', hi: 'क्लाउड सर्वर पर सुरक्षित रूप से संग्रहीत डेटा' },
  'india_region': { en: 'India Region', hi: 'भारत क्षेत्र' },
  'account': { en: 'Account', hi: 'खाता' },
  'sign_out': { en: 'Sign Out', hi: 'साइन आउट' },
  'sign_out_device': { en: 'Sign out from this device', hi: 'इस डिवाइस से साइन आउट करें' },
  'delete_account': { en: 'Delete Account', hi: 'खाता हटाएं' },
  'delete_permanently': { en: 'This will permanently delete all your data', hi: 'यह आपके सभी डेटा को स्थायी रूप से हटा देगा' },
  
  // AI Assistant
  'ai_assistant_name': { en: 'Revonn AI', hi: 'रेवॉन AI' },
  'ai_listening': { en: 'Listening...', hi: 'सुन रहा हूं...' },
  'ai_thinking': { en: 'Thinking...', hi: 'सोच रहा हूं...' },
  'ai_greeting': { en: 'Hi! How can I help you today?', hi: 'नमस्ते! आज मैं आपकी कैसे मदद कर सकता हूं?' },
  'type_message': { en: 'Type a message...', hi: 'संदेश लिखें...' },
  'quick_actions': { en: 'Quick Actions', hi: 'त्वरित कार्य' },
  'voice_text': { en: 'Voice + Text', hi: 'आवाज़ + टेक्स्ट' },
  'speak_now': { en: 'Speak now', hi: 'अभी बोलें' },
  'type_or_speak': { en: 'Type or speak...', hi: 'टाइप करें या बोलें...' },
  
  // Invoice
  'tax_invoice': { en: 'TAX INVOICE', hi: 'टैक्स इनवॉयस' },
  'invoice_no': { en: 'Invoice No', hi: 'इनवॉयस नंबर' },
  'invoice_date': { en: 'Invoice Date', hi: 'इनवॉयस तिथि' },
  'bill_to': { en: 'Bill To', hi: 'प्राप्तकर्ता' },
  'qty': { en: 'Qty', hi: 'मात्रा' },
  'rate': { en: 'Rate', hi: 'दर' },
  'amount': { en: 'Amount', hi: 'राशि' },
  'taxable_amount': { en: 'Taxable Amount', hi: 'कर योग्य राशि' },
  'cgst': { en: 'CGST', hi: 'CGST' },
  'sgst': { en: 'SGST', hi: 'SGST' },
  'total_discount': { en: 'Total Discount', hi: 'कुल छूट' },
  'grand_total': { en: 'Grand Total', hi: 'महायोग' },
  'amount_received_invoice': { en: 'Amount Received', hi: 'प्राप्त राशि' },
  'thank_you_shopping': { en: 'Thank you for shopping with us!', hi: 'हमारे साथ खरीदारी के लिए धन्यवाद!' },
  'powered_by': { en: 'Powered by Revonn', hi: 'रेवॉन द्वारा संचालित' },
  'invoice_not_found': { en: 'Invoice not found', hi: 'इनवॉयस नहीं मिला' },
  'download_pdf': { en: 'Download PDF', hi: 'PDF डाउनलोड करें' },
  'share_whatsapp': { en: 'Share on WhatsApp', hi: 'WhatsApp पर शेयर करें' },
  
  // Marketing
  'marketing_posters': { en: 'Marketing Posters', hi: 'मार्केटिंग पोस्टर' },
  'create_poster': { en: 'Create Poster', hi: 'पोस्टर बनाएं' },
  'ai_powered': { en: 'AI-Powered', hi: 'AI-पावर्ड' },
  'select_template': { en: 'Select Template', hi: 'टेम्पलेट चुनें' },
  'sale_offer': { en: 'Sale Offer', hi: 'सेल ऑफर' },
  'festival': { en: 'Festival', hi: 'त्योहार' },
  'new_arrival': { en: 'New Arrival', hi: 'नया आगमन' },
  'event': { en: 'Event', hi: 'इवेंट' },
  'discount_percent': { en: 'Discount %', hi: 'डिस्काउंट %' },
  'custom_text': { en: 'Custom Text', hi: 'कस्टम टेक्स्ट' },
  'optional': { en: 'Optional', hi: 'वैकल्पिक' },
  'generate_poster': { en: 'Generate Poster', hi: 'पोस्टर बनाएं' },
  'generating': { en: 'Generating...', hi: 'बना रहे हैं...' },
  'poster_ready': { en: 'Poster Ready!', hi: 'पोस्टर तैयार!' },
  'caption': { en: 'Caption', hi: 'कैप्शन' },
  'copy': { en: 'Copy', hi: 'कॉपी करें' },
  'share_on': { en: 'Share On', hi: 'शेयर करें' },
  'marketing_tips': { en: 'Marketing Tips', hi: 'मार्केटिंग टिप्स' },
  'enter_message': { en: 'Enter your message...', hi: 'अपना मैसेज यहां लिखें...' },
  'download': { en: 'Download', hi: 'डाउनलोड करें' },
  
  // Staff
  'staff_management': { en: 'Staff Management', hi: 'कर्मचारी प्रबंधन' },
  'add_staff': { en: 'Add Staff', hi: 'कर्मचारी जोड़ें' },
  'staff_name': { en: 'Staff Name', hi: 'कर्मचारी का नाम' },
  'staff_phone': { en: 'Staff Phone', hi: 'कर्मचारी फ़ोन' },
  'staff_role': { en: 'Role', hi: 'भूमिका' },
  'staff_salary': { en: 'Salary', hi: 'वेतन' },
  'staff_username': { en: 'Username', hi: 'यूज़रनेम' },
  'staff_password': { en: 'Password', hi: 'पासवर्ड' },
  'permissions': { en: 'Permissions', hi: 'अनुमतियां' },
  'can_create_bills': { en: 'Can Create Bills', hi: 'बिल बना सकते हैं' },
  'can_view_reports': { en: 'Can View Reports', hi: 'रिपोर्ट देख सकते हैं' },
  'can_manage_inventory': { en: 'Can Manage Inventory', hi: 'इन्वेंट्री प्रबंधित कर सकते हैं' },
  'can_manage_customers': { en: 'Can Manage Customers', hi: 'ग्राहक प्रबंधित कर सकते हैं' },
  'active': { en: 'Active', hi: 'सक्रिय' },
  'inactive': { en: 'Inactive', hi: 'निष्क्रिय' },
  'attendance': { en: 'Attendance', hi: 'उपस्थिति' },
  'present': { en: 'Present', hi: 'उपस्थित' },
  'absent': { en: 'Absent', hi: 'अनुपस्थित' },
  'half_day': { en: 'Half Day', hi: 'आधा दिन' },
  
  // Auth
  'login': { en: 'Login', hi: 'लॉगिन' },
  'signup': { en: 'Sign Up', hi: 'साइन अप' },
  'email': { en: 'Email', hi: 'ईमेल' },
  'password': { en: 'Password', hi: 'पासवर्ड' },
  'confirm_password': { en: 'Confirm Password', hi: 'पासवर्ड की पुष्टि करें' },
  'forgot_password': { en: 'Forgot Password?', hi: 'पासवर्ड भूल गए?' },
  'dont_have_account': { en: "Don't have an account?", hi: 'खाता नहीं है?' },
  'already_have_account': { en: 'Already have an account?', hi: 'पहले से खाता है?' },
  'login_as_owner': { en: 'Login as Owner', hi: 'मालिक के रूप में लॉगिन' },
  'login_as_staff': { en: 'Login as Staff', hi: 'कर्मचारी के रूप में लॉगिन' },
  'shop_name': { en: 'Shop Name', hi: 'दुकान का नाम' },
  'owner_name': { en: 'Owner Name', hi: 'मालिक का नाम' },
  'create_account': { en: 'Create Account', hi: 'खाता बनाएं' },
  
  // BOM Upload
  'bom_upload': { en: 'BOM Upload', hi: 'BOM अपलोड' },
  'upload_bill': { en: 'Upload Bill', hi: 'बिल अपलोड करें' },
  'upload_image': { en: 'Upload Image', hi: 'छवि अपलोड करें' },
  'upload_excel': { en: 'Upload Excel', hi: 'एक्सेल अपलोड करें' },
  'parsing': { en: 'Parsing...', hi: 'पार्स हो रहा है...' },
  'items_found': { en: 'Items Found', hi: 'आइटम मिले' },
  'import_all': { en: 'Import All', hi: 'सभी इम्पोर्ट करें' },
  'import_selected': { en: 'Import Selected', hi: 'चुने हुए इम्पोर्ट करें' },
  
  // Errors & Success Messages
  'error_occurred': { en: 'An error occurred', hi: 'एक त्रुटि हुई' },
  'try_again': { en: 'Please try again', hi: 'कृपया पुनः प्रयास करें' },
  'saved_successfully': { en: 'Saved successfully', hi: 'सफलतापूर्वक सेव हुआ' },
  'deleted_successfully': { en: 'Deleted successfully', hi: 'सफलतापूर्वक हटाया गया' },
  'updated_successfully': { en: 'Updated successfully', hi: 'सफलतापूर्वक अपडेट हुआ' },
  'added_successfully': { en: 'Added successfully', hi: 'सफलतापूर्वक जोड़ा गया' },
  'please_login': { en: 'Please login first', hi: 'कृपया पहले लॉगिन करें' },
  'invalid_input': { en: 'Invalid input', hi: 'अमान्य इनपुट' },
  'required_field': { en: 'This field is required', hi: 'यह फ़ील्ड आवश्यक है' },
  'no_data': { en: 'No data available', hi: 'कोई डेटा उपलब्ध नहीं' },
  'coming_soon': { en: 'Coming Soon', hi: 'जल्द आ रहा है' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('revonn-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('revonn-language', language);
    // Update document lang attribute
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || translation.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
