import React, { useEffect, useState } from 'react';
import { Input, Button, useSnackbar, Avatar } from 'zmp-ui';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { useAuthStatus, updateProfile, ZaloUserProfile, autoLoginAndUpsert } from '@/services/auth';

const AccountInfoPage: React.FC = () => {
    const { user, setUser, refreshUser, loading: userLoading } = useAuth();
    const loggedIn = useAuthStatus();
    const navigate = useNavigate();
    const { openSnackbar } = useSnackbar();

    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [defaultAddress, setDefaultAddress] = useState(user?.default_address || '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!loggedIn) {
            openSnackbar({
                text: 'Bạn cần đăng nhập để xem thông tin tài khoản.',
                type: 'warning',
            });
            navigate('/profile');
        }
    }, [loggedIn, navigate, openSnackbar]);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setPhone(user.phone || '');
            setDefaultAddress(user.default_address || '');
        }
    }, [user]);

    const handleUpdateProfile = async () => {
        if (!user) return;

        // Validate required fields
        if (!name.trim()) {
            openSnackbar({
                text: 'Vui lòng nhập tên của bạn',
                type: 'warning',
            });
            return;
        }

        if (!phone || !phone.trim()) {
            openSnackbar({
                text: 'Vui lòng nhập số điện thoại',
                type: 'warning',
            });
            return;
        }

        setSaving(true);
        try {
            // Prepare data - always send all fields
            const updatedUser: Partial<ZaloUserProfile> = {
                id: user.id,
                name: name.trim(),
                phone: phone.trim() || null,
                default_address: defaultAddress.trim() || null,
            };

            console.log('💾 Saving profile to database:', updatedUser);
            console.log('📝 Raw form data:', { name, phone, defaultAddress });
            console.log('📱 Phone processing:', {
                original: phone,
                trimmed: phone.trim(),
                final: phone.trim() || null,
                isEmpty: phone.trim() === ''
            });

            // Update profile in database
            const updatedProfile = await updateProfile(updatedUser);

            console.log('✅ Profile saved to database successfully:', updatedProfile);

            // Update local state immediately
            setUser(updatedProfile);

            // Dispatch event to notify other components
            window.dispatchEvent(new CustomEvent('user-updated'));

            // Show success message
            openSnackbar({
                text: `✅ Đã lưu thông tin thành công! Thông tin đã được cập nhật trong trang thành viên.`,
                type: 'success',
            });

            // Navigate back to profile page to show updated info
            setTimeout(() => {
                navigate('/profile');
            }, 1500);

        } catch (error) {
            console.error('❌ Failed to save profile to database:', error);
            openSnackbar({
                text: `❌ Không thể lưu thông tin: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
                type: 'error',
            });
        } finally {
            setSaving(false);
        }
    };

    if (!loggedIn || userLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Đang tải thông tin tài khoản...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">Không thể tải thông tin người dùng</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary text-white rounded"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">Thông tin tài khoản</h1>

                <div className="flex flex-col items-center mt-6 mb-8">
                    <Avatar story="default" size={96} src={user.avatar} />
                    <h2 className="mt-4 text-xl font-bold">{user.name || 'Người dùng'}</h2>
                    <p className="text-gray-500">{user.phone || 'Chưa có số điện thoại'}</p>
                    {user.default_address && (
                        <p className="text-gray-500 text-sm text-center mt-1 max-w-xs">
                            📍 {user.default_address}
                        </p>
                    )}
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs text-green-700">
                            💡 Thông tin này sẽ được tự động điền khi bạn đặt hàng
                        </p>
                    </div>
                    {/* Last updated indicator */}
                    <div className="mt-2 p-1 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs text-blue-600">
                            🕒 Cập nhật lần cuối: {user.updated_at ? new Date(user.updated_at).toLocaleString('vi-VN') : 'Chưa có'}
                        </p>
                    </div>
                </div>

                <div className="mt-4 space-y-4">
                    <Input
                        label="Tên của bạn *"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mb-4"
                        placeholder="Nhập tên của bạn"
                    />
                    <Input
                        label="Số điện thoại *"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mb-4"
                        placeholder="Nhập số điện thoại"
                    />
                    <div>
                        <label className="block text-sm font-medium mb-1">Địa chỉ nhận hàng mặc định</label>
                        <textarea
                            value={defaultAddress}
                            onChange={(e) => setDefaultAddress(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Nhập địa chỉ nhận hàng mặc định"
                            rows={3}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Địa chỉ này sẽ được tự động điền khi bạn đặt hàng
                        </p>
                    </div>
                </div>

                <Button
                    fullWidth
                    className="mt-8"
                    onClick={handleUpdateProfile}
                    loading={saving}
                    disabled={saving}
                >
                    Cập nhật thông tin
                </Button>


                {/* Usage Instructions */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">💡 Cách sử dụng</h3>
                    <ul className="text-xs text-blue-700 space-y-1">
                        <li>• Thông tin ở đây sẽ được tự động điền khi bạn đặt hàng</li>
                        <li>• Bạn vẫn có thể chỉnh sửa thông tin trong trang thanh toán</li>
                        <li>• Địa chỉ mặc định giúp bạn không cần nhập lại mỗi lần đặt hàng</li>
                        <li>• Có thể lưu thông tin mới ngay trong trang thanh toán</li>
                        <li>• Thông tin được lưu an toàn trong database và đồng bộ trên tất cả thiết bị</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AccountInfoPage;
