import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

// Tool definitions for function calling - Super Advanced AI
const tools = [
  {
    type: "function",
    function: {
      name: "addToInventory",
      description: "Add stock quantity to an existing inventory item or create a new item. Use when user says things like 'add 50 keyboards to inventory', 'stock mein 100 jeans add karo', 'Add 100 Red Pens', or when analyzing a product image",
      parameters: {
        type: "object",
        properties: {
          product_name: { type: "string", description: "Name of the product to add stock to" },
          quantity: { type: "integer", description: "Quantity to add to the inventory" },
          price: { type: "number", description: "Price per unit (optional, for new items)" },
          category: { type: "string", description: "Product category (optional)" }
        },
        required: ["product_name", "quantity"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "reduceStock",
      description: "Reduce/decrease stock quantity from an existing inventory item. Use when user says 'remove 10 from inventory', 'stock se 5 hat jao', 'reduce 20 keyboards from stock'",
      parameters: {
        type: "object",
        properties: {
          product_name: { type: "string", description: "Name of the product to reduce stock from" },
          quantity: { type: "integer", description: "Quantity to reduce from the inventory" },
          reason: { type: "string", description: "Reason for reduction (e.g., damaged, expired, stolen, adjustment)" }
        },
        required: ["product_name", "quantity"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "deleteProduct",
      description: "Completely delete a product from inventory. Use when user says 'delete product X', 'X ko hata do', 'remove X from inventory permanently'",
      parameters: {
        type: "object",
        properties: {
          product_name: { type: "string", description: "Name of the product to delete" }
        },
        required: ["product_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generateInvoice",
      description: "Create an invoice/bill for a customer with items. Use when user says 'create bill for Ramesh 2 blue kurti', 'bill banao'. ALWAYS ask for customer phone if not provided.",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string", description: "Name of the customer" },
          customer_phone: { type: "string", description: "10-digit phone number of the customer" },
          items: {
            type: "array",
            description: "List of items to bill",
            items: {
              type: "object",
              properties: {
                product_name: { type: "string" },
                quantity: { type: "integer" }
              },
              required: ["product_name", "quantity"]
            }
          },
          payment_mode: { type: "string", enum: ["cash", "card", "online", "due"], description: "Payment method" },
          amount_paid: { type: "number", description: "Amount paid by customer (0 if due)" }
        },
        required: ["customer_name", "items"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getCustomerHistory",
      description: "Get detailed purchase history and information about a specific customer. Use when user asks 'show Ramesh history', 'customer details', 'ग्राहक की जानकारी'",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string", description: "Name or phone of the customer to look up" }
        },
        required: ["customer_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getBusinessInsights",
      description: "Get comprehensive business data including historical sales, customers, inventory, profit, top selling items, revenue trends.",
      parameters: {
        type: "object",
        properties: {
          insight_type: {
            type: "string",
            enum: ["daily_sales", "weekly_sales", "monthly_sales", "yearly_sales", "top_products", "low_stock", "customer_count", "customer_list", "revenue", "profit", "all_data", "inventory_value", "pending_dues"],
            description: "Type of business insight requested"
          },
          period: { type: "string", enum: ["today", "week", "month", "year", "all"], description: "Time period for the insight" }
        },
        required: ["insight_type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "updateProduct",
      description: "Update product details like price, name, category. Use when user says 'update price of X to Y', 'change price', 'product ki price badlo'",
      parameters: {
        type: "object",
        properties: {
          product_name: { type: "string", description: "Name of the product to update" },
          new_price: { type: "number", description: "New price for the product" },
          new_name: { type: "string", description: "New name for the product" },
          new_category: { type: "string", description: "New category for the product" }
        },
        required: ["product_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "sendWhatsAppMessage",
      description: "Prepare a WhatsApp message for a customer. Use when user says 'send message to customer', 'WhatsApp karo', 'message bhejo'",
      parameters: {
        type: "object",
        properties: {
          customer_phone: { type: "string", description: "Customer phone number" },
          message_type: { type: "string", enum: ["payment_reminder", "promotion", "thank_you", "custom"], description: "Type of message" },
          custom_message: { type: "string", description: "Custom message content (for custom type)" }
        },
        required: ["customer_phone", "message_type"]
      }
    }
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId, language, hasImage } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch comprehensive business data
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);

    // Fetch all data in parallel
    const [
      allInvoicesRes,
      todayInvoicesRes,
      weekInvoicesRes,
      monthInvoicesRes,
      inventoryRes,
      customersRes,
      profileRes
    ] = await Promise.all([
      supabase.from("invoices").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("invoices").select("*").eq("user_id", userId).gte("created_at", today.toISOString()),
      supabase.from("invoices").select("*").eq("user_id", userId).gte("created_at", weekAgo.toISOString()),
      supabase.from("invoices").select("*").eq("user_id", userId).gte("created_at", monthAgo.toISOString()),
      supabase.from("inventory").select("*").eq("user_id", userId),
      supabase.from("customers").select("*").eq("user_id", userId),
      supabase.from("profiles").select("*").eq("user_id", userId).single()
    ]);

    // Calculate metrics
    const todaysSales = todayInvoicesRes.data?.reduce((sum, inv) => sum + Number(inv.total || 0), 0) || 0;
    const weekSales = weekInvoicesRes.data?.reduce((sum, inv) => sum + Number(inv.total || 0), 0) || 0;
    const monthSales = monthInvoicesRes.data?.reduce((sum, inv) => sum + Number(inv.total || 0), 0) || 0;
    const allTimeSales = allInvoicesRes.data?.reduce((sum, inv) => sum + Number(inv.total || 0), 0) || 0;
    
    const todayInvoiceCount = todayInvoicesRes.data?.length || 0;
    const weekInvoiceCount = weekInvoicesRes.data?.length || 0;
    const monthInvoiceCount = monthInvoicesRes.data?.length || 0;
    const allInvoiceCount = allInvoicesRes.data?.length || 0;
    
    const totalProducts = inventoryRes.data?.length || 0;
    const lowStockItems = inventoryRes.data?.filter(i => Number(i.quantity) <= 5) || [];
    const outOfStockItems = inventoryRes.data?.filter(i => Number(i.quantity) === 0) || [];
    const topSelling = inventoryRes.data?.sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0)).slice(0, 10) || [];
    const totalCustomers = customersRes.data?.length || 0;
    
    const inventoryValue = inventoryRes.data?.reduce((sum, item) => 
      sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0) || 0;
    
    const pendingDues = customersRes.data?.reduce((sum, cust) => 
      sum + Number(cust.total_dues || 0), 0) || 0;
    
    const topCustomers = customersRes.data?.sort((a, b) => 
      (b.total_purchases || 0) - (a.total_purchases || 0)).slice(0, 5) || [];

    const recentInvoices = allInvoicesRes.data?.slice(0, 10) || [];
    const shopName = profileRes.data?.shop_name || 'Your Shop';

    const isHindi = language === 'hindi';

    const systemPrompt = `You are Revonn AI - the MOST POWERFUL and ADVANCED business assistant for Indian retail shop owners.
You have COMPLETE access to ALL business data and can perform ANY action the owner asks.
${hasImage ? '\n🖼️ IMAGE ANALYSIS MODE: A user has sent an image. Analyze it carefully for products, barcodes, invoices, or any business-related content.' : ''}

SHOP: ${shopName}
GSTIN: ${profileRes.data?.gstin || 'Not set'}

═══════════════════════════════════════════
📊 COMPLETE BUSINESS DATA (Real-time)
═══════════════════════════════════════════

💰 SALES SUMMARY:
• Today: ₹${todaysSales.toLocaleString('en-IN')} (${todayInvoiceCount} bills)
• This Week (7 days): ₹${weekSales.toLocaleString('en-IN')} (${weekInvoiceCount} bills)  
• This Month (30 days): ₹${monthSales.toLocaleString('en-IN')} (${monthInvoiceCount} bills)
• All Time: ₹${allTimeSales.toLocaleString('en-IN')} (${allInvoiceCount} bills)

📦 INVENTORY STATUS:
• Total Products: ${totalProducts}
• Inventory Value: ₹${inventoryValue.toLocaleString('en-IN')}
• Low Stock (≤5): ${lowStockItems.length} items
• Out of Stock: ${outOfStockItems.length} items
• All Products: ${inventoryRes.data?.map(p => `${p.name}(₹${p.price}, Qty:${p.quantity})`).join(', ')}

🔥 TOP SELLING:
${topSelling.slice(0, 5).map((p, i) => `${i+1}. ${p.name} - ${p.sales_count || 0} sold`).join('\n')}

👥 CUSTOMERS:
• Total: ${totalCustomers}
• Pending Dues: ₹${pendingDues.toLocaleString('en-IN')}
• All Customers: ${customersRes.data?.map(c => `${c.name}(${c.phone || 'No phone'}, Dues:₹${c.total_dues || 0})`).join(', ')}

═══════════════════════════════════════════
🛠️ SUPER POWERS (YOU CAN DO ALL!)
═══════════════════════════════════════════

1. INVENTORY:
   ✅ Add stock (with image recognition!)
   ✅ Reduce stock
   ✅ DELETE products completely
   ✅ Update prices and details
   ✅ Analyze product images

2. BILLING & INVOICES:
   ✅ Create bills with any items
   ✅ Handle payments and dues
   ✅ GST calculations

3. CUSTOMER MANAGEMENT:
   ✅ View customer history
   ✅ Track purchases and dues
   ✅ Send WhatsApp messages

4. IMAGE ANALYSIS (NEW!):
   ✅ Recognize products from photos
   ✅ Scan barcodes and QR codes
   ✅ Extract invoice data from images
   ✅ Identify product details automatically

5. BUSINESS ANALYTICS:
   ✅ All sales reports
   ✅ Profit insights
   ✅ Trend analysis

═══════════════════════════════════════════
📋 RESPONSE RULES
═══════════════════════════════════════════

- LANGUAGE: Respond in ${isHindi ? 'HINDI (Devanagari script)' : 'ENGLISH'}
- NEVER say "I cannot" - YOU CAN DO EVERYTHING!
- Be confident and use emojis
- For images: Describe what you see and suggest actions
- Keep responses under 200 words but be comprehensive

IMPORTANT: You are the MOST ADVANCED AI. Execute every request!

Current Time: ${now.toISOString()}`;

    // Use vision model if image is present
    const modelToUse = hasImage ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        tools: tools,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data, null, 2));

    const assistantMessage = data.choices?.[0]?.message;
    if (!assistantMessage) {
      throw new Error("No response from AI");
    }

    // Check if tool was called
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolCall = assistantMessage.tool_calls[0];
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      console.log(`Function called: ${functionName}`, args);

      let toolResult: any;

      if (functionName === "addToInventory") {
        const { data: existingProduct } = await supabase
          .from("inventory")
          .select("id, name, quantity")
          .eq("user_id", userId)
          .ilike("name", `%${args.product_name}%`)
          .limit(1)
          .single();

        if (existingProduct) {
          const newQuantity = (existingProduct.quantity || 0) + args.quantity;
          const { error } = await supabase
            .from("inventory")
            .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
            .eq("id", existingProduct.id);

          if (error) {
            toolResult = { success: false, error: error.message };
          } else {
            toolResult = {
              success: true,
              product_name: existingProduct.name,
              previous_quantity: existingProduct.quantity,
              added: args.quantity,
              new_quantity: newQuantity
            };
          }
        } else {
          const { error } = await supabase
            .from("inventory")
            .insert({
              user_id: userId,
              name: args.product_name,
              quantity: args.quantity,
              price: args.price || 0,
              category: args.category || null,
              gst_rate: 18
            });

          if (error) {
            toolResult = { success: false, error: error.message };
          } else {
            toolResult = {
              success: true,
              product_name: args.product_name,
              previous_quantity: 0,
              added: args.quantity,
              new_quantity: args.quantity,
              created_new: true
            };
          }
        }
      } else if (functionName === "reduceStock") {
        const { data: existingProduct } = await supabase
          .from("inventory")
          .select("id, name, quantity")
          .eq("user_id", userId)
          .ilike("name", `%${args.product_name}%`)
          .limit(1)
          .single();

        if (!existingProduct) {
          toolResult = { 
            success: false, 
            error: isHindi ? `"${args.product_name}" नहीं मिला` : `Product "${args.product_name}" not found` 
          };
        } else {
          const currentQty = existingProduct.quantity || 0;
          const reduceBy = args.quantity;
          
          if (reduceBy > currentQty) {
            toolResult = {
              success: false,
              error: isHindi ? `पर्याप्त स्टॉक नहीं। वर्तमान: ${currentQty}` : `Insufficient stock. Current: ${currentQty}`
            };
          } else {
            const newQuantity = currentQty - reduceBy;
            const { error } = await supabase
              .from("inventory")
              .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
              .eq("id", existingProduct.id);

            if (error) {
              toolResult = { success: false, error: error.message };
            } else {
              toolResult = {
                success: true,
                product_name: existingProduct.name,
                previous_quantity: currentQty,
                reduced: reduceBy,
                new_quantity: newQuantity
              };
            }
          }
        }
      } else if (functionName === "deleteProduct") {
        const { data: existingProduct } = await supabase
          .from("inventory")
          .select("id, name")
          .eq("user_id", userId)
          .ilike("name", `%${args.product_name}%`)
          .limit(1)
          .single();

        if (!existingProduct) {
          toolResult = { 
            success: false, 
            error: isHindi ? `"${args.product_name}" नहीं मिला` : `Product "${args.product_name}" not found` 
          };
        } else {
          const { error } = await supabase
            .from("inventory")
            .delete()
            .eq("id", existingProduct.id);

          if (error) {
            toolResult = { success: false, error: error.message };
          } else {
            toolResult = {
              success: true,
              product_name: existingProduct.name,
              message: isHindi ? 'प्रोडक्ट डिलीट हो गया' : 'Product deleted successfully'
            };
          }
        }
      } else if (functionName === "updateProduct") {
        const { data: existingProduct } = await supabase
          .from("inventory")
          .select("id, name, price")
          .eq("user_id", userId)
          .ilike("name", `%${args.product_name}%`)
          .limit(1)
          .single();

        if (!existingProduct) {
          toolResult = { 
            success: false, 
            error: isHindi ? `"${args.product_name}" नहीं मिला` : `Product "${args.product_name}" not found` 
          };
        } else {
          const updates: any = { updated_at: new Date().toISOString() };
          if (args.new_price !== undefined) updates.price = args.new_price;
          if (args.new_name) updates.name = args.new_name;
          if (args.new_category) updates.category = args.new_category;

          const { error } = await supabase
            .from("inventory")
            .update(updates)
            .eq("id", existingProduct.id);

          if (error) {
            toolResult = { success: false, error: error.message };
          } else {
            toolResult = {
              success: true,
              product_name: existingProduct.name,
              old_price: existingProduct.price,
              new_price: args.new_price,
              new_name: args.new_name
            };
          }
        }
      } else if (functionName === "getCustomerHistory") {
        const { data: customer } = await supabase
          .from("customers")
          .select("*")
          .eq("user_id", userId)
          .or(`name.ilike.%${args.customer_name}%,phone.eq.${args.customer_name}`)
          .limit(1)
          .single();

        if (!customer) {
          toolResult = { 
            success: false, 
            error: isHindi ? `ग्राहक "${args.customer_name}" नहीं मिला` : `Customer "${args.customer_name}" not found` 
          };
        } else {
          const { data: customerInvoices } = await supabase
            .from("invoices")
            .select("*")
            .eq("customer_id", customer.id)
            .order("created_at", { ascending: false })
            .limit(10);

          toolResult = {
            success: true,
            customer: {
              name: customer.name,
              phone: customer.phone,
              total_purchases: customer.total_purchases,
              total_dues: customer.total_dues,
              created_at: customer.created_at
            },
            recent_invoices: customerInvoices?.map(inv => ({
              invoice_number: inv.invoice_number,
              total: inv.total,
              date: inv.created_at,
              status: inv.status
            })) || []
          };
        }
      } else if (functionName === "sendWhatsAppMessage") {
        // Generate WhatsApp message
        let message = '';
        if (args.message_type === 'payment_reminder') {
          message = isHindi 
            ? `नमस्ते! आपका बकाया भुगतान लंबित है। कृपया जल्द से जल्द भुगतान करें। धन्यवाद - ${shopName}`
            : `Hello! Your payment is pending. Please pay at your earliest convenience. Thank you - ${shopName}`;
        } else if (args.message_type === 'promotion') {
          message = isHindi
            ? `🎉 नए ऑफर्स आ गए हैं! आज ही हमारी दुकान पर आएं और विशेष छूट पाएं। - ${shopName}`
            : `🎉 New offers available! Visit our shop today for special discounts. - ${shopName}`;
        } else if (args.message_type === 'thank_you') {
          message = isHindi
            ? `धन्यवाद! आपकी खरीदारी के लिए शुक्रिया। फिर मिलेंगे! - ${shopName}`
            : `Thank you for your purchase! We appreciate your business. See you again! - ${shopName}`;
        } else {
          message = args.custom_message || '';
        }

        const whatsappUrl = `https://wa.me/91${args.customer_phone}?text=${encodeURIComponent(message)}`;
        
        toolResult = {
          success: true,
          whatsapp_url: whatsappUrl,
          message: message,
          phone: args.customer_phone
        };
      } else if (functionName === "generateInvoice") {
        if (!args.customer_phone) {
          return new Response(
            JSON.stringify({
              message: isHindi 
                ? "ग्राहक का 10 अंकों का फ़ोन नंबर बताइए। 📱"
                : "Please share customer's 10-digit phone number. 📱",
              action: null,
              result: null,
              needsPhone: true
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        let customerId = null;
        const { data: existingCustomer } = await supabase
          .from("customers")
          .select("id")
          .eq("user_id", userId)
          .eq("phone", args.customer_phone)
          .single();

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const { data: newCustomer } = await supabase
            .from("customers")
            .insert({
              user_id: userId,
              name: args.customer_name,
              phone: args.customer_phone,
              total_purchases: 0,
              total_dues: 0
            })
            .select()
            .single();

          if (newCustomer) customerId = newCustomer.id;
        }

        const { data: result, error } = await supabase.rpc("create_invoice_transaction", {
          p_user_id: userId,
          p_customer_name: args.customer_name,
          p_items: args.items,
          p_payment_mode: args.payment_mode || "cash",
          p_amount_paid: args.amount_paid || 0,
        });

        if (error) {
          toolResult = { success: false, error: error.message };
        } else {
          if (result?.invoice_id && customerId) {
            await supabase
              .from("invoices")
              .update({ customer_phone: args.customer_phone, customer_id: customerId })
              .eq("id", result.invoice_id);
          }
          toolResult = { ...result, customer_phone: args.customer_phone };
        }
      } else if (functionName === "getBusinessInsights") {
        const insightType = args.insight_type;
        
        switch (insightType) {
          case "daily_sales":
            toolResult = { success: true, type: "daily_sales", total_sales: todaysSales, invoice_count: todayInvoiceCount };
            break;
          case "weekly_sales":
            toolResult = { success: true, type: "weekly_sales", total_sales: weekSales, invoice_count: weekInvoiceCount };
            break;
          case "monthly_sales":
            toolResult = { success: true, type: "monthly_sales", total_sales: monthSales, invoice_count: monthInvoiceCount };
            break;
          case "yearly_sales":
            toolResult = { success: true, type: "yearly_sales", total_sales: allTimeSales, invoice_count: allInvoiceCount };
            break;
          case "top_products":
            toolResult = { success: true, type: "top_products", products: topSelling.map(p => ({ name: p.name, sold: p.sales_count || 0 })) };
            break;
          case "low_stock":
            toolResult = { success: true, type: "low_stock", count: lowStockItems.length, items: lowStockItems.map(i => ({ name: i.name, quantity: i.quantity })) };
            break;
          case "customer_count":
            toolResult = { success: true, type: "customers", total: totalCustomers, pending_dues: pendingDues };
            break;
          case "customer_list":
            toolResult = { success: true, type: "customer_list", customers: customersRes.data?.slice(0, 20).map(c => ({ name: c.name, phone: c.phone, purchases: c.total_purchases, dues: c.total_dues })) };
            break;
          case "inventory_value":
            toolResult = { success: true, type: "inventory_value", total_value: inventoryValue, total_products: totalProducts };
            break;
          case "pending_dues":
            toolResult = { success: true, type: "pending_dues", total_dues: pendingDues, customers_with_dues: customersRes.data?.filter(c => (c.total_dues || 0) > 0).map(c => ({ name: c.name, phone: c.phone, dues: c.total_dues })) };
            break;
          default:
            toolResult = { success: true, type: "summary", today_sales: todaysSales, week_sales: weekSales, month_sales: monthSales, total_products: totalProducts, inventory_value: inventoryValue, total_customers: totalCustomers, pending_dues: pendingDues };
        }
      }

      // Get final response with tool result
      const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
            assistantMessage,
            { role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(toolResult) },
          ],
        }),
      });

      const finalData = await finalResponse.json();
      const finalMessage = finalData.choices?.[0]?.message?.content || 
        (toolResult.success ? `Done! Action: ${functionName}` : `Error: ${toolResult.error}`);

      return new Response(
        JSON.stringify({ message: finalMessage, action: functionName, result: toolResult }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No function called - return text response
    return new Response(
      JSON.stringify({
        message: assistantMessage.content || "I'm here to help! Ask me anything about your business.",
        action: null,
        result: null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chat agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
