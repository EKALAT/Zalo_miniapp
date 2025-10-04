import React, { useEffect, useState } from 'react';
import { useSnackbar } from 'zmp-ui';
import { useNavigate } from 'react-router-dom';
import { getUserOrdersWithItems, Order } from '@/services/orders';
import { useAuth } from '@/hooks';
import { useAuthStatus } from '@/services/auth';
import { formatPrice } from '@/utils/format';

interface OrderWithItems extends Order {
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

const OrderTrackingPage: React.FC = () => {
    const { user } = useAuth();
    const loggedIn = useAuthStatus();
    const navigate = useNavigate();
    const { openSnackbar } = useSnackbar();
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {

        if (!loggedIn) {
            setError('Bạn cần đăng nhập để theo dõi đơn hàng.');
            setLoading(false);
            return;
        }

        if (!user) {
            setError('Không tìm thấy thông tin người dùng.');
            setLoading(false);
            return;
        }

        const fetchUserOrders = async () => {
            try {
                setLoading(true);
                setError(null);
                const userOrdersWithItems = await getUserOrdersWithItems(user.id);

                // Lọc bỏ các đơn hàng đã hoàn thành (delivered, cancelled, refunded)
                const activeOrders = userOrdersWithItems.filter(order =>
                    order.status !== 'delivered' &&
                    order.status !== 'cancelled' &&
                    order.status !== 'refunded'
                );

                setOrders(activeOrders);
            } catch (err) {
                setError(`Lỗi: ${err}`);
            } finally {
                setLoading(false);
            }
        };

        fetchUserOrders();
    }, [loggedIn, user]);




    const getStatusDisplayName = (status: Order['status']) => {
        switch (status) {
            case 'pending': return 'Đang chờ xử lý';
            case 'confirmed': return 'Đã xác nhận';
            case 'processing': return 'Đang xử lý';
            case 'shipped': return 'Đã giao hàng';
            case 'delivered': return 'Đã nhận hàng';
            case 'cancelled': return 'Đã hủy';
            case 'refunded': return 'Đã hoàn tiền';
            default: return status;
        }
    };

    const getStatusColorClass = (status: Order['status']) => {
        switch (status) {
            case 'pending': return 'text-yellow-500 bg-yellow-50';
            case 'confirmed': return 'text-blue-500 bg-blue-50';
            case 'processing': return 'text-purple-500 bg-purple-50';
            case 'shipped': return 'text-indigo-500 bg-indigo-50';
            case 'delivered': return 'text-green-500 bg-green-50';
            case 'cancelled': return 'text-red-500 bg-red-50';
            case 'refunded': return 'text-orange-500 bg-orange-50';
            default: return 'text-gray-500 bg-gray-50';
        }
    };

    const getStatusIcon = (status: Order['status']) => {
        switch (status) {
            case 'pending': return '⏳';
            case 'confirmed': return '✅';
            case 'processing': return '🔄';
            case 'shipped': return '🚚';
            case 'delivered': return '📦';
            case 'cancelled': return '❌';
            case 'refunded': return '💰';
            default: return '📋';
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Đang tải đơn hàng...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">Theo dõi đơn hàng</h1>


                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
                        >
                            Thử lại
                        </button>
                    </div>
                )}

                {!error && (
                    <>
                        {/* Thông tin user */}
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-700">
                                👤 Đơn hàng của: <strong>{user?.name || 'Người dùng'}</strong>
                            </p>
                            <p className="text-xs text-blue-600">
                                Tổng số đơn hàng: {orders.length}
                            </p>
                        </div>


                        {orders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48">
                                <div className="text-gray-400 text-6xl mb-4">📦</div>
                                <p className="text-gray-500 text-center">Bạn chưa có đơn hàng nào</p>
                                <button
                                    onClick={() => navigate('/')}
                                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                                >
                                    Mua sắm ngay
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        {/* Header đơn hàng */}
                                        <div className="mb-3">
                                            <h3 className="font-bold text-lg">#{order.order_number}</h3>
                                            <p className="text-sm text-gray-600">
                                                Đặt ngày: {new Date(order.created_at).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>

                                        {/* Trạng thái đơn hàng */}
                                        <div className="mb-3 flex items-center justify-between">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColorClass(order.status)}`}>
                                                {getStatusIcon(order.status)} {getStatusDisplayName(order.status)}
                                            </span>

                                            {/* Status display only - no action buttons */}
                                            <div className="flex gap-2">
                                                {/* Thông báo cho các trạng thái */}
                                                {order.status === 'pending' && (
                                                    <div className="inline-flex items-center px-3 py-2 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-lg">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Đang chờ xử lý
                                                    </div>
                                                )}

                                                {order.status === 'confirmed' && (
                                                    <div className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Đã xác nhận
                                                    </div>
                                                )}

                                                {order.status === 'processing' && (
                                                    <div className="inline-flex items-center px-3 py-2 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg">
                                                        <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                        Đang xử lý
                                                    </div>
                                                )}

                                                {order.status === 'shipped' && (
                                                    <div className="inline-flex items-center px-3 py-2 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                        </svg>
                                                        Đã giao hàng
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Danh sách sản phẩm */}
                                        {order.items && order.items.length > 0 && (
                                            <div className="mb-3">
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Sản phẩm đã đặt:</h4>
                                                <div className="space-y-2">
                                                    {order.items.map((item) => (
                                                        <div key={item.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                                                            {/* Hình ảnh sản phẩm */}
                                                            <div className="flex-shrink-0">
                                                                <img
                                                                    src={item.product_image}
                                                                    alt={item.product_name}
                                                                    className="w-12 h-12 object-cover rounded bg-gray-200"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.style.display = 'none';
                                                                        target.nextElementSibling?.classList.remove('hidden');
                                                                    }}
                                                                />
                                                                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs hidden">
                                                                    📦
                                                                </div>
                                                            </div>

                                                            {/* Thông tin sản phẩm */}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                                    {item.product_name}
                                                                </p>
                                                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                                    <span>Số lượng: {item.quantity}</span>
                                                                    {item.selected_size && (
                                                                        <span>• Size: {item.selected_size}</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm font-medium text-primary">
                                                                    {formatPrice(item.subtotal)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Thông tin đơn hàng */}
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-600">Tổng tiền:</p>
                                                <p className="font-bold text-primary">{formatPrice(order.final_amount)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Cập nhật:</p>
                                                <p className="font-medium">
                                                    {new Date(order.updated_at).toLocaleDateString('vi-VN')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="mt-3 mb-3">
                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                                <span className={order.status === 'pending' ? 'text-yellow-600 font-medium' : ''}>Đặt hàng</span>
                                                <span className={order.status === 'confirmed' ? 'text-blue-600 font-medium' : ''}>Xác nhận</span>
                                                <span className={order.status === 'processing' ? 'text-purple-600 font-medium' : ''}>Xử lý</span>
                                                <span className={order.status === 'shipped' ? 'text-indigo-600 font-medium' : ''}>Giao hàng</span>
                                                <span className={order.status === 'delivered' ? 'text-green-600 font-medium' : ''}>Hoàn thành</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-500 ${order.status === 'pending' ? 'bg-yellow-400 w-1/5' :
                                                        order.status === 'confirmed' ? 'bg-blue-400 w-2/5' :
                                                            order.status === 'processing' ? 'bg-purple-400 w-3/5' :
                                                                order.status === 'shipped' ? 'bg-indigo-400 w-4/5' :
                                                                    order.status === 'delivered' ? 'bg-green-400 w-full' :
                                                                        'bg-gray-400 w-1/5'
                                                        }`}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Thông tin giao hàng */}
                                        <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                                            <p><strong>Người nhận:</strong> {order.shipping_name}</p>
                                            <p><strong>Địa chỉ:</strong> {order.shipping_address}</p>
                                            <p><strong>SĐT:</strong> {order.shipping_phone}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Nút xem lịch sử */}
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => navigate('/profile/order-history')}
                                className="text-blue-600 hover:text-blue-800 underline"
                            >
                                Xem lịch sử đơn hàng
                            </button>
                        </div>
                    </>
                )}

                {/* Nút quay lại */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate('/profile')}
                        className="text-blue-600 hover:text-blue-800 underline"
                    >
                        Quay lại Profile
                    </button>
                </div>
            </div>

        </div>
    );
};

export default OrderTrackingPage;