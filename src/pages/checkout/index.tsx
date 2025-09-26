import { useState } from "react";
import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import Button from "@/components/button";
import HorizontalDivider from "@/components/horizontal-divider";
import { checkoutItemsState, cartTotalState } from "@/state";
import { createOrder } from "@/services/orders";
import { useAuthStatus } from "@/services/auth";
import toast from "react-hot-toast";

export default function CheckoutPage() {
    const navigate = useNavigate();
    const checkoutItems = useAtomValue(checkoutItemsState);
    const { totalAmount } = useAtomValue(cartTotalState);
    const isLoggedIn = useAuthStatus();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        shipping_name: "",
        shipping_phone: "",
        shipping_address: "",
        shipping_note: "",
        payment_method: "zalo_pay" as const,
    });

    const shippingFee = 30000;
    const finalAmount = totalAmount + shippingFee;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isLoggedIn) {
            toast.error("Vui lòng đăng nhập để đặt hàng");
            return;
        }

        if (!formData.shipping_name || !formData.shipping_phone || !formData.shipping_address) {
            toast.error("Vui lòng điền đầy đủ thông tin giao hàng");
            return;
        }

        setLoading(true);
        try {
            // Get user ID from localStorage or auth context
            const userId = localStorage.getItem("zma_user_id") || "temp_user";

            console.log("Creating order with:", { userId, checkoutItems, formData });

            await createOrder(userId, checkoutItems, formData);

            toast.success("Đặt hàng thành công!");
            navigate("/profile");
        } catch (error) {
            console.error("Order creation failed:", error);
            toast.error(`Đặt hàng thất bại: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    if (!checkoutItems.length) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                <div className="text-lg font-medium">Giỏ hàng trống</div>
                <Button onClick={() => navigate("/")}>Tiếp tục mua sắm</Button>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Order Summary */}
                <div className="bg-white rounded-lg p-4 border-[0.5px] border-black/15">
                    <h2 className="text-lg font-medium mb-3">Đơn hàng của bạn</h2>
                    {checkoutItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 py-2">
                            <img
                                src={item.product.image}
                                alt={item.product.name}
                                className="w-12 h-12 rounded object-cover"
                            />
                            <div className="flex-1">
                                <div className="text-sm font-medium">{item.product.name}</div>
                                <div className="text-2xs text-subtitle">
                                    {item.options.size && `Size: ${item.options.size}`}
                                    {item.options.size && item.options.color && " • "}
                                    {item.options.color && `Màu: ${item.options.color}`}
                                </div>
                                <div className="text-sm text-primary">
                                    {item.quantity} × {item.product.price.toLocaleString()}đ
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Shipping Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border-[0.5px] border-black/15">
                        <h2 className="text-lg font-medium mb-3">Thông tin giao hàng</h2>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">Họ và tên *</label>
                                <input
                                    type="text"
                                    name="shipping_name"
                                    value={formData.shipping_name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Nhập họ và tên"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Số điện thoại *</label>
                                <input
                                    type="tel"
                                    name="shipping_phone"
                                    value={formData.shipping_phone}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Nhập số điện thoại"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Địa chỉ giao hàng *</label>
                                <textarea
                                    name="shipping_address"
                                    value={formData.shipping_address}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Nhập địa chỉ giao hàng"
                                    rows={3}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Ghi chú</label>
                                <textarea
                                    name="shipping_note"
                                    value={formData.shipping_note}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Ghi chú thêm (tùy chọn)"
                                    rows={2}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Phương thức thanh toán</label>
                                <select
                                    name="payment_method"
                                    value={formData.payment_method}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="zalo_pay">Zalo Pay</option>
                                    <option value="cod">Thanh toán khi nhận hàng</option>
                                    <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Order Summary Footer */}
            <div className="flex-none border-t bg-white p-4">
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                        <span>Tạm tính:</span>
                        <span>{totalAmount.toLocaleString()}đ</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Phí vận chuyển:</span>
                        <span>{shippingFee.toLocaleString()}đ</span>
                    </div>
                    <HorizontalDivider />
                    <div className="flex justify-between text-lg font-medium">
                        <span>Tổng cộng:</span>
                        <span className="text-primary">{finalAmount.toLocaleString()}đ</span>
                    </div>
                </div>

                <Button
                    primary
                    large
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full"
                >
                    {loading ? "Đang xử lý..." : "Đặt hàng"}
                </Button>
            </div>
        </div>
    );
}
