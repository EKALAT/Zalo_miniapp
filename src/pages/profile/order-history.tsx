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

const OrderHistoryPage: React.FC = () => {
    const { user } = useAuth();
    const loggedIn = useAuthStatus();
    const navigate = useNavigate();
    const { openSnackbar } = useSnackbar();
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'status'>('newest');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        if (!loggedIn || !user) {
            setError('Bạn cần đăng nhập để xem lịch sử mua hàng.');
            setLoading(false);
            return;
        }

        const fetchOrders = async () => {
            try {
                setLoading(true);
                setError(null);
                const userOrdersWithItems = await getUserOrdersWithItems(user.id);
                setOrders(userOrdersWithItems);
            } catch (err) {
                console.error('Failed to fetch orders:', err);
                setError('Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [loggedIn, user]);

    // Sort and filter orders - show all orders for now
    const sortedAndFilteredOrders = React.useMemo(() => {
        let filtered = orders;

        // Show all orders for now - no filtering
        if (filterStatus !== 'all') {
            filtered = orders.filter(order => order.status === filterStatus);
        }

        // Sort orders
        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case 'oldest':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'status':
                    return a.status.localeCompare(b.status);
                default:
                    return 0;
            }
        });
    }, [orders, sortBy, filterStatus]);

    // Get delivered orders count for statistics
    const deliveredOrdersCount = orders.filter(order => order.status === 'delivered').length;
    const inProgressOrdersCount = orders.filter(order =>
        order.status === 'pending' ||
        order.status === 'confirmed' ||
        order.status === 'processing' ||
        order.status === 'shipped'
    ).length;

    if (loading || !loggedIn || !user) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <p>Đang tải lịch sử đơn hàng...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Lịch sử mua hàng</h1>
                    <button
                        onClick={() => navigate('/profile/order-tracking')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                        Theo dõi đơn hàng
                    </button>
                </div>

                {/* Info box */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                        📦 <strong>Lịch sử mua hàng:</strong> Hiển thị tất cả đơn hàng của bạn
                    </p>
                </div>

                {/* Thống kê đơn hàng */}
                <div className="mb-4 grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-100 border border-green-200 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {deliveredOrdersCount}
                        </div>
                        <div className="text-sm text-green-700">Đã hoàn thành (Delivered)</div>
                    </div>
                    <div className="p-3 bg-blue-100 border border-blue-200 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {inProgressOrdersCount}
                        </div>
                        <div className="text-sm text-blue-700">Đang xử lý</div>
                    </div>
                </div>


                {/* Filter and Sort Controls */}
                <div className="mb-4 flex flex-wrap gap-2">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                        <option value="all">Tất cả đơn hàng</option>
                        <option value="delivered">Đã nhận hàng</option>
                        <option value="pending">Đang chờ xử lý</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="processing">Đang xử lý</option>
                        <option value="shipped">Đã giao hàng</option>
                        <option value="cancelled">Đã hủy</option>
                        <option value="refunded">Đã hoàn tiền</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'status')}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="status">Theo trạng thái</option>
                    </select>
                </div>

                {sortedAndFilteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48">
                        <div className="text-gray-400 text-6xl mb-4">📦</div>
                        <p className="text-gray-500 text-center mb-4">
                            Chưa có đơn nào
                        </p>
                        <button
                            onClick={() => navigate('/profile/order-tracking')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Xem đơn hàng đang xử lý
                        </button>
                    </div>
                ) : (
                    <div className="mt-4 space-y-4">
                        {sortedAndFilteredOrders.map((order) => (
                            <div
                                key={order.id}
                                className={`shadow-md rounded-lg mb-4 p-4 flex flex-col cursor-pointer hover:shadow-lg transition-shadow ${order.status === 'delivered' ? 'border-l-4 border-green-500 bg-green-50' : ''
                                    }`}
                                onClick={() => {
                                    // Không navigate đến trang chi tiết vì đã xóa
                                    console.log('Order clicked:', order.id);
                                }}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold">#{order.order_number}</h3>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                                order.status === 'processing' ? 'bg-purple-100 text-purple-800' :
                                                    order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                                                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                order.status === 'refunded' ? 'bg-orange-100 text-orange-800' :
                                                                    'bg-gray-100 text-gray-800'
                                        }`}>
                                        {order.status === 'pending' && '⏳ Đang chờ xử lý'}
                                        {order.status === 'confirmed' && '✅ Đã xác nhận'}
                                        {order.status === 'processing' && '🔄 Đang xử lý'}
                                        {order.status === 'shipped' && '🚚 Đã giao hàng'}
                                        {order.status === 'delivered' && '🎉 Hoàn thành'}
                                        {order.status === 'cancelled' && '❌ Đã hủy'}
                                        {order.status === 'refunded' && '💰 Đã hoàn tiền'}
                                    </span>
                                </div>

                                {/* Order Items */}
                                <div className="mb-3">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Sản phẩm đã mua:</h4>
                                    <div className="space-y-2">
                                        {order.items && order.items.map((item) => (
                                            <div key={item.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                                                    {item.product_image ? (
                                                        <img
                                                            src={item.product_image}
                                                            alt={item.product_name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                target.nextElementSibling?.classList.remove('hidden');
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 text-xs hidden">
                                                        📦
                                                    </div>
                                                </div>
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
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {formatPrice(item.subtotal)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="text-gray-600 text-sm mb-2">
                                    <p>Ngày đặt: {new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                                    <p>Cập nhật: {new Date(order.updated_at).toLocaleDateString('vi-VN')}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">Tổng tiền:</span>
                                    <span className="text-lg font-bold text-primary">{formatPrice(order.final_amount)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
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

export default OrderHistoryPage;
