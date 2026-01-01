import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

// Tool definitions for function calling
const tools = [
  {
    type: "function",
    function: {
      name: "addToInventory",
      description: "Add stock quantity to an existing inventory item or create a new item. Use when user says things like 'add 50 keyboards to inventory', 'stock mein 100 jeans add karo', or 'Add 100 Red Pens'",
      parameters: {
        type: "object",
        properties: {
          product_name: {
            type: "string",
            description: "Name of the product to add stock to"
          },
          quantity: {
            type: "integer",
            description: "Quantity to add to the inventory"
          },
          price: {
            type: "number",
            description: "Price per unit (optional, for new items)"
          }
        },
        required: ["product_name", "quantity"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generateInvoice",
      description: "Create an invoice/bill for a customer with items. Use when user says things like 'create bill for Ramesh 2 blue kurti', 'bill banao customer Amit ke liye', or 'Make a bill for John for 5 apples'. ALWAYS ask for customer phone if not provided.",
      parameters: {
        type: "object",
        properties: {
          customer_name: {
            type: "string",
            description: "Name of the customer"
          },
          customer_phone: {
            type: "string",
            description: "10-digit phone number of the customer"
          },
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
          payment_mode: {
            type: "string",
            enum: ["cash", "card", "online", "due"],
            description: "Payment method"
          },
          amount_paid: {
            type: "number",
            description: "Amount paid by customer (0 if due)"
          }
        },
        required: ["customer_name", "items"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getBusinessInsights",
      description: "Get business data like sales, customers, inventory, profit, top selling items. Use when user asks about their business performance, sales, revenue, profit, customers, stock levels etc.",
      parameters: {
        type: "object",
        properties: {
          insight_type: {
            type: "string",
            enum: ["daily_sales", "monthly_sales", "top_products", "low_stock", "customer_count", "revenue", "profit", "all"],
            description: "Type of business insight requested"
          },
          period: {
            type: "string",
            enum: ["today", "week", "month", "year"],
            description: "Time period for the insight"
          }
        },
        required: ["insight_type"]
      }
    }
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch business data for context
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [invoicesRes, inventoryRes, customersRes] = await Promise.all([
      supabase.from("invoices").select("*").eq("user_id", userId).gte("created_at", today.toISOString()),
      supabase.from("inventory").select("*").eq("user_id", userId),
      supabase.from("customers").select("*").eq("user_id", userId)
    ]);

    const todaysSales = invoicesRes.data?.reduce((sum, inv) => sum + Number(inv.total || 0), 0) || 0;
    const totalProducts = inventoryRes.data?.length || 0;
    const lowStockItems = inventoryRes.data?.filter(i => Number(i.quantity) <= 5) || [];
    const topSelling = inventoryRes.data?.sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0)).slice(0, 5) || [];
    const totalCustomers = customersRes.data?.length || 0;
    const invoiceCount = invoicesRes.data?.length || 0;

    const systemPrompt = `You are Revonn AI - an advanced, intelligent business assistant for Indian retail shop owners.
You help manage stock, create invoices, provide business insights, and give marketing advice in Hindi and English.

YOUR BUSINESS CONTEXT (Real-time Data):
- Today's Sales: ₹${todaysSales.toLocaleString('en-IN')} from ${invoiceCount} invoices
- Total Products: ${totalProducts}
- Low Stock Items: ${lowStockItems.length} (${lowStockItems.slice(0, 3).map(i => i.name).join(', ')})
- Top Selling: ${topSelling.slice(0, 3).map(i => `${i.name} (${i.sales_count || 0} sold)`).join(', ')}
- Total Customers: ${totalCustomers}

CAPABILITIES:
1. ADD INVENTORY: "Add 50 keyboards", "100 jeans stock add karo"
   - Use addToInventory function
   
2. CREATE INVOICE: "Create bill for Ramesh 2 kurtis", "Bill banao"
   - Use generateInvoice function
   - IMPORTANT: ALWAYS ask for customer phone number if not provided
   - Ask: "Customer ka phone number bataiye" or "Please share customer's phone number"
   
3. BUSINESS INSIGHTS: "Aaj ki sale?", "Low stock", "Top selling items", "Total customers"
   - Use getBusinessInsights function
   - Provide specific numbers from your context

4. BUSINESS ADVICE & MARKETING:
   - Give practical marketing tips for Indian retail
   - Festival marketing ideas (Diwali, Holi, etc.)
   - WhatsApp marketing tips
   - Customer retention strategies
   - Pricing strategies
   - Display and visual merchandising tips
   - Seasonal stock planning
   - GST compliance basics

5. GENERAL BUSINESS KNOWLEDGE:
   - Indian retail market trends
   - E-commerce integration tips
   - Digital payment solutions (UPI, Paytm, etc.)
   - Social media marketing for local shops
   - Google My Business optimization
   - Customer service best practices

RULES:
- Always respond in the SAME LANGUAGE as the user (Hindi/English/Hinglish)
- Keep responses helpful, friendly, and practical
- For greetings, be warm and ask how you can help
- When creating bills, ALWAYS get customer phone number
- Provide specific numbers when discussing sales/inventory
- For marketing advice, give actionable tips
- Use emojis sparingly to make responses friendly
- Maximum response length: 200 words

GST RATES KNOWLEDGE (Indian):
- Clothing <1000: 5%
- Clothing >1000: 12%
- Electronics: 18%
- Footwear <1000: 5%
- Footwear >1000: 18%
- Food items: 5% or 0%
- Cosmetics: 18%
- Furniture: 18%

Current Time: ${new Date().toISOString()}`;

    // Call Lovable AI Gateway with function calling
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
        // First try to find existing product
        const { data: existingProduct } = await supabase
          .from("inventory")
          .select("id, name, quantity")
          .eq("user_id", userId)
          .ilike("name", `%${args.product_name}%`)
          .limit(1)
          .single();

        if (existingProduct) {
          // Update existing product
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
          // Create new product
          const { error } = await supabase
            .from("inventory")
            .insert({
              user_id: userId,
              name: args.product_name,
              quantity: args.quantity,
              price: args.price || 0,
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
      } else if (functionName === "generateInvoice") {
        // First check if customer phone is provided
        if (!args.customer_phone) {
          return new Response(
            JSON.stringify({
              message: "Customer ka phone number bataiye please. Bill banane ke liye phone number zaroori hai. 📱\n\nPlease share customer's 10-digit phone number.",
              action: null,
              result: null,
              needsPhone: true
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create or find customer first
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
          const { data: newCustomer, error: custError } = await supabase
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

          if (!custError && newCustomer) {
            customerId = newCustomer.id;
          }
        }

        const { data: result, error } = await supabase.rpc("create_invoice_transaction", {
          p_user_id: userId,
          p_customer_name: args.customer_name,
          p_items: args.items,
          p_payment_mode: args.payment_mode || "cash",
          p_amount_paid: args.amount_paid || 0,
        });

        if (error) {
          console.error("RPC error:", error);
          toolResult = { success: false, error: error.message };
        } else {
          // Update invoice with customer phone and customer_id
          if (result?.invoice_id) {
            await supabase
              .from("invoices")
              .update({ 
                customer_phone: args.customer_phone,
                customer_id: customerId
              })
              .eq("id", result.invoice_id);

            // Update customer totals
            if (customerId) {
              const { data: custData } = await supabase
                .from("customers")
                .select("total_purchases, total_dues")
                .eq("id", customerId)
                .single();

              if (custData) {
                await supabase
                  .from("customers")
                  .update({
                    total_purchases: Number(custData.total_purchases || 0) + Number(result.total || 0),
                    total_dues: Number(custData.total_dues || 0) + Number(result.due_amount || 0)
                  })
                  .eq("id", customerId);
              }
            }
          }
          toolResult = { ...result, customer_phone: args.customer_phone };
        }
      } else if (functionName === "getBusinessInsights") {
        // Return insights based on the current context
        const insightType = args.insight_type;
        
        switch (insightType) {
          case "daily_sales":
          case "revenue":
            toolResult = {
              success: true,
              type: "daily_sales",
              total_sales: todaysSales,
              invoice_count: invoiceCount,
              period: "today"
            };
            break;
          case "top_products":
            toolResult = {
              success: true,
              type: "top_products",
              products: topSelling.map(p => ({ name: p.name, sold: p.sales_count || 0 }))
            };
            break;
          case "low_stock":
            toolResult = {
              success: true,
              type: "low_stock",
              count: lowStockItems.length,
              items: lowStockItems.map(i => ({ name: i.name, quantity: i.quantity }))
            };
            break;
          case "customer_count":
            toolResult = {
              success: true,
              type: "customers",
              total: totalCustomers
            };
            break;
          case "all":
          default:
            toolResult = {
              success: true,
              type: "summary",
              today_sales: todaysSales,
              invoice_count: invoiceCount,
              total_products: totalProducts,
              low_stock_count: lowStockItems.length,
              total_customers: totalCustomers,
              top_selling: topSelling.slice(0, 3).map(p => p.name)
            };
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
            {
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult),
            },
          ],
        }),
      });

      const finalData = await finalResponse.json();
      const finalMessage = finalData.choices?.[0]?.message?.content || 
        (toolResult.success 
          ? `Done! ${functionName === "addToInventory" ? `Added ${args.quantity} ${args.product_name}` : functionName === "generateInvoice" ? `Bill created for ${args.customer_name}` : "Here are your insights"}`
          : `Error: ${toolResult.error}`);

      return new Response(
        JSON.stringify({
          message: finalMessage,
          action: functionName,
          result: toolResult,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No function called - return text response
    return new Response(
      JSON.stringify({
        message: assistantMessage.content || "I'm here to help with inventory, billing, and business advice. Ask me anything!",
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
