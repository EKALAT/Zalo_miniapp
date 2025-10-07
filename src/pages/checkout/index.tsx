import { useState, useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import Button from "@/components/button";
import HorizontalDivider from "@/components/horizontal-divider";
import { checkoutItemsState, cartTotalState, cartState, selectedCartItemIdsState } from "@/state";
import { createOrder } from "@/services/orders";
import { useAuthStatus } from "@/services/auth";
import { useAuth } from "@/hooks";
import { clearCartFromStorage } from "@/utils/cart";
import toast from "react-hot-toast";

export default function CheckoutPage() {
    const navigate = useNavigate();
    const checkoutItems = useAtomValue(checkoutItemsState);
    const { totalAmount } = useAtomValue(cartTotalState);
    const isLoggedIn = useAuthStatus();
    const { user, refreshUser, loading: userLoading } = useAuth();

    // State setters for clearing cart
    const setCart = useSetAtom(cartState);
    const setSelectedCartItemIds = useSetAtom(selectedCartItemIdsState);

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

    // Auto-fill form data from user profile
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                shipping_name: user.name || prev.shipping_name,
                shipping_phone: user.phone || prev.shipping_phone,
                shipping_address: user.default_address || prev.shipping_address,
            }));
            console.log('🔄 Auto-filled form with user data:', {
                name: user.name,
                phone: user.phone,
                address: user.default_address
            });
        }
    }, [user]);

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
            // Lấy userId thực từ context hoặc localStorage; không dùng temp_user
            const userId = user?.id || localStorage.getItem("zma_user_id");
            if (!userId) {
                toast.error("Không tìm thấy người dùng. Vui lòng đăng nhập lại.");
                setLoading(false);
                return;
            }

            console.log("Creating order with:", { userId, checkoutItems, formData });

            await createOrder(userId, checkoutItems, formData);

            // Clear cart after successful order
            console.log("🛒 Clearing cart after successful order");
            setCart([]);
            setSelectedCartItemIds([]);
            clearCartFromStorage();

            toast.success("Đặt hàng thành công! Giỏ hàng đã được xóa.");
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
                        {user && (user.name || user.phone || user.default_address) && (
                            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-green-700 font-medium mb-1">
                                            ✅ Thông tin đã được tự động điền từ hồ sơ của bạn
                                        </p>
                                        <p className="text-xs text-green-600">
                                            Bạn có thể chỉnh sửa bất kỳ thông tin nào bên dưới
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/profile/account-info')}
                                        className="text-xs text-green-600 hover:text-green-800 underline whitespace-nowrap ml-2"
                                    >
                                        Cập nhật hồ sơ
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium">Họ và tên *</label>
                                    {user?.name && formData.shipping_name !== user.name && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, shipping_name: user.name || '' }));
                                                toast.success('Đã sử dụng tên từ hồ sơ');
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                                        >
                                            Sử dụng từ hồ sơ
                                        </button>
                                    )}
                                </div>
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
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium">Số điện thoại *</label>
                                    {user?.phone && formData.shipping_phone !== user.phone && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, shipping_phone: user.phone || '' }));
                                                toast.success('Đã sử dụng số điện thoại từ hồ sơ');
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                                        >
                                            Sử dụng từ hồ sơ
                                        </button>
                                    )}
                                </div>
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
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium">Địa chỉ giao hàng *</label>
                                    <div className="flex gap-2">
                                        {user?.default_address && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, shipping_address: user.default_address || '' }));
                                                    toast.success('Đã sử dụng địa chỉ mặc định');
                                                }}
                                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                                            >
                                                Sử dụng địa chỉ mặc định
                                            </button>
                                        )}
                                        {formData.shipping_address && formData.shipping_address !== user?.default_address && (
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (user) {
                                                        try {
                                                            const { updateProfile } = await import('@/services/auth');
                                                            const updatedProfile = await updateProfile({
                                                                id: user.id,
                                                                default_address: formData.shipping_address
                                                            });
                                                            // Refresh user data to show updated information
                                                            await refreshUser();
                                                            toast.success('✅ Đã lưu địa chỉ làm mặc định');
                                                        } catch (error) {
                                                            toast.error('Không thể lưu địa chỉ mặc định');
                                                        }
                                                    }
                                                }}
                                                className="text-xs text-green-600 hover:text-green-800 underline"
                                            >
                                                Lưu địa chỉ mặc định
                                            </button>
                                        )}
                                    </div>
                                </div>
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

                            {/* Save to Profile Section */}
                            {user && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-blue-700">💾 Lưu thông tin vào hồ sơ</p>
                                            <p className="text-xs text-blue-600">Cập nhật thông tin cá nhân và địa chỉ mặc định để sử dụng cho lần sau</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (user) {
                                                    try {
                                                        const { updateProfile } = await import('@/services/auth');
                                                        const updatedProfile = await updateProfile({
                                                            id: user.id,
                                                            name: formData.shipping_name,
                                                            phone: formData.shipping_phone,
                                                            default_address: formData.shipping_address
                                                        });
                                                        // Refresh user data to show updated information
                                                        await refreshUser();
                                                        toast.success('✅ Đã lưu thông tin vào hồ sơ thành công! Thông tin đã được cập nhật trong trang thành viên.');

                                                        // Dispatch event to notify other components
                                                        window.dispatchEvent(new CustomEvent('user-updated'));
                                                    } catch (error) {
                                                        console.error('Failed to save profile:', error);
                                                        toast.error('❌ Không thể lưu thông tin vào hồ sơ');
                                                    }
                                                }
                                            }}
                                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                        >
                                            Lưu vào hồ sơ
                                        </button>
                                    </div>
                                </div>
                            )}
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
