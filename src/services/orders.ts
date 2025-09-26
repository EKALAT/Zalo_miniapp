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
        selected_color: item.options.color,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
    }));

    const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

    if (itemsError) {
        // Rollback order if items creation fails
        await supabase.from("orders").delete().eq("id", order.id);
        throw new Error(`Failed to create order items: ${itemsError.message}`);
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
    if (!isSupabaseConfigured) {
        throw new Error("Supabase not configured");
    }

    const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    return orders || [];
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
