import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { CartItem } from "@/types";

export interface CreateOrderData {
    shipping_name: string;
    shipping_phone: string;
    shipping_address: string;
    shipping_note?: string;
    payment_method: 'zalo_pay' | 'cod' | 'bank_transfer';
}

export interface Order {
    id: string;
    user_id: string;
    order_number: string;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
    total_amount: number;
    shipping_fee: number;
    discount_amount: number;
    final_amount: number;
    shipping_name: string;
    shipping_phone: string;
    shipping_address: string;
    shipping_note?: string;
    payment_method: 'zalo_pay' | 'cod' | 'bank_transfer';
    payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
    zalo_transaction_id?: string;
    created_at: string;
    updated_at: string;
    completed_at?: string;
}

export interface OrderWithItems extends Order {
    items: Array<{
        id: string;
        product_name: string;
        product_image: string;
        product_price: number;
        selected_size?: string;
        quantity: number;
        subtotal: number;
    }>;
}

export async function createOrder(
    userId: string,
    cartItems: CartItem[],
    orderData: CreateOrderData
): Promise<Order> {
    console.log("createOrder called with:", { userId, cartItems, orderData });

    if (!isSupabaseConfigured) {
        throw new Error("Supabase not configured");
    }

    if (!cartItems.length) {
        throw new Error("Cart is empty");
    }

    // Calculate totals
    const totalAmount = cartItems.reduce(
        (sum, item) => sum + (item.product.price * item.quantity),
        0
    );
    const shippingFee = 30000; // Fixed shipping fee
    const discountAmount = 0; // No discount for now
    const finalAmount = totalAmount + shippingFee - discountAmount;

    // Generate order number
    const orderNumber = `ORD${Date.now()}`;

    // Create order
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
            user_id: userId,
            order_number: orderNumber,
            status: "pending",
            total_amount: totalAmount,
            shipping_fee: shippingFee,
            discount_amount: discountAmount,
            final_amount: finalAmount,
            shipping_name: orderData.shipping_name,
            shipping_phone: orderData.shipping_phone,
            shipping_address: orderData.shipping_address,
            shipping_note: orderData.shipping_note,
            payment_method: orderData.payment_method,
            payment_status: "pending",
        })
        .select()
        .single();

    if (orderError) {
        throw new Error(`Failed to create order: ${orderError.message}`);
    }

    // Create order items
    const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.image,
        product_price: item.product.price,
        selected_size: item.options.size,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
    }));

    const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

    if (itemsError) {
        // Không rollback để dễ truy vết; báo lỗi chi tiết để người dùng cấu hình RLS
        const details = [itemsError.message, itemsError.details, itemsError.hint].filter(Boolean).join(' | ');
        console.error('❌ order_items insert failed. Order kept for debugging. Configure RLS for public.order_items.');
        throw new Error(`Failed to create order items: ${details || 'unknown error'}`);
    }

    // Add initial status to history
    await supabase.from("order_status_history").insert({
        order_id: order.id,
        status: "pending",
        note: "Order created",
        created_by: "user",
    });

    return order;
}

export async function getUserOrders(userId: string): Promise<Order[]> {
    console.log('🔍 getUserOrders called with userId:', userId);
    console.log('🔗 Supabase configured:', isSupabaseConfigured);
    console.log('🔗 Supabase client exists:', !!supabase);

    if (!isSupabaseConfigured) {
        console.error('❌ Supabase not configured');
        throw new Error("Supabase not configured");
    }

    if (!userId) {
        console.error('❌ No userId provided');
        throw new Error("User ID is required");
    }

    console.log('📡 Querying orders table...');
    const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .order("updated_at", { ascending: false });

    console.log('📊 Query result:', { orders, error });
    console.log('📦 Orders count:', orders?.length || 0);

    if (error) {
        console.error('❌ Database error:', error);
        console.error('❌ Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    console.log('✅ Orders fetched successfully:', orders);
    return orders || [];
}

export async function getUserOrdersWithItems(userId: string) {
    console.log('🔍 getUserOrdersWithItems called with userId:', userId);

    if (!isSupabaseConfigured) {
        console.error('❌ Supabase not configured');
        throw new Error("Supabase not configured");
    }

    if (!userId) {
        console.error('❌ No userId provided');
        throw new Error("User ID is required");
    }

    try {
        // Get orders
        console.log('📡 Querying orders table...');
        const { data: orders, error: ordersError } = await supabase
            .from("orders")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .order("updated_at", { ascending: false });

        if (ordersError) {
            console.error('❌ Orders query error:', ordersError);
            throw new Error(`Failed to fetch orders: ${ordersError.message}`);
        }

        console.log('📦 Orders fetched:', orders?.length || 0);

        if (!orders || orders.length === 0) {
            return [];
        }

        // Get order items for each order
        const ordersWithItems = await Promise.all(
            orders.map(async (order) => {
                console.log(`📡 Fetching items for order ${order.id}...`);

                const { data: items, error: itemsError } = await supabase
                    .from("order_items")
                    .select("*")
                    .eq("order_id", order.id);

                if (itemsError) {
                    console.error(`❌ Items query error for order ${order.id}:`, itemsError);
                    return { ...order, items: [] };
                }

                console.log(`📦 Items for order ${order.id}:`, items?.length || 0);
                return { ...order, items: items || [] };
            })
        );

        console.log('✅ Orders with items fetched successfully');
        return ordersWithItems;
    } catch (error) {
        console.error('❌ Error in getUserOrdersWithItems:', error);
        throw error;
    }
}

export async function getOrderDetails(orderId: string) {
    if (!isSupabaseConfigured) {
        throw new Error("Supabase not configured");
    }

    // Get order
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

    if (orderError) {
        throw new Error(`Failed to fetch order: ${orderError.message}`);
    }

    // Get order items
    const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

    if (itemsError) {
        throw new Error(`Failed to fetch order items: ${itemsError.message}`);
    }

    return {
        order,
        items: items || [],
    };
}

export async function getActiveOrders(userId: string): Promise<Order[]> {
    if (!isSupabaseConfigured) {
        throw new Error("Supabase not configured");
    }

    console.log('🔍 Getting active orders for user:', userId);
    console.log('🔗 Supabase configured:', isSupabaseConfigured);

    const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["pending", "confirmed", "processing", "shipped"])
        .order("updated_at", { ascending: false });

    console.log('📊 Active orders query result:', { orders, error });

    if (error) {
        console.error('❌ Error fetching active orders:', error);
        throw new Error(`Failed to fetch active orders: ${error.message}`);
    }

    console.log('✅ Active orders returned:', orders || []);
    return orders || [];
}

export async function getOrderStatusHistory(orderId: string) {
    if (!isSupabaseConfigured) {
        throw new Error("Supabase not configured");
    }

    const { data: history, error } = await supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

    if (error) {
        throw new Error(`Failed to fetch order status history: ${error.message}`);
    }

    return history || [];
}

export async function updateOrderStatus(
    orderId: string,
    status: Order['status'],
    note?: string
): Promise<void> {
    if (!isSupabaseConfigured) {
        throw new Error("Supabase not configured");
    }

    console.log('🔄 Updating order status:', { orderId, status, note });

    try {
        // Update order status
        const { data: updateData, error: updateError } = await supabase
            .from("orders")
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq("id", orderId)
            .select();

        if (updateError) {
            console.error('❌ Error updating order status:', updateError);
            throw new Error(`Failed to update order status: ${updateError.message}`);
        }

        console.log('✅ Order status updated successfully:', updateData);

        // Add to status history
        const { data: historyData, error: historyError } = await supabase
            .from("order_status_history")
            .insert({
                order_id: orderId,
                status,
                note: note || `Status updated to ${status}`,
                created_by: "system",
                created_at: new Date().toISOString()
            })
            .select();

        if (historyError) {
            console.error("❌ Failed to add status history:", historyError);
        } else {
            console.log('✅ Status history added successfully:', historyData);
        }
    } catch (error) {
        console.error('❌ Error updating order status:', error);
        throw error;
    }
}

