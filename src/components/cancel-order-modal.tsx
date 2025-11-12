import React, { useState, useEffect } from 'react';
import { useSnackbar } from 'zmp-ui';

interface CancelOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    orderNumber: string;
    loading?: boolean;
}

const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    orderNumber,
    loading = false
}) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { openSnackbar } = useSnackbar();

    // Reset state khi modal mở lại
    useEffect(() => {
        if (isOpen) {
            setReason('');
            setIsSubmitting(false);
            setIsSubmitted(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reason.trim()) {
            openSnackbar({
                text: 'Vui lòng nhập lý do hủy đơn hàng',
                type: 'error'
            });
            return;
        }

        if (reason.trim().length < 10) {
            openSnackbar({
                text: 'Lý do hủy đơn hàng phải có ít nhất 10 ký tự',
                type: 'error'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await onConfirm(reason.trim());
            setIsSubmitted(true);
            setReason('');
            // Hiển thị "Đã gửi" trong 1.5 giây trước khi đóng modal
            setTimeout(() => {
                onClose();
                setIsSubmitted(false);
            }, 1500);
        } catch (error) {
            console.error('Error cancelling order:', error);
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting && !isSubmitted) {
            setReason('');
            setIsSubmitted(false);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Hủy đơn hàng
                        </h3>
                        <button
                            onClick={handleClose}
                            disabled={isSubmitting || isSubmitted}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Order Info */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                            <strong>Mã đơn hàng:</strong> #{orderNumber}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Bạn có chắc chắn muốn gửi yêu cầu hủy đơn hàng này không?
                        </p>
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                            <strong>Lưu ý:</strong> Yêu cầu hủy đơn hàng sẽ được gửi đến hệ thống và lưu trữ thông tin chi tiết.
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="cancel-reason" className="block text-sm font-medium text-gray-700 mb-2">
                                Lý do hủy đơn hàng <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="cancel-reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Vui lòng nhập lý do hủy đơn hàng (tối thiểu 10 ký tự)..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                                rows={4}
                                maxLength={500}
                                disabled={isSubmitting || isSubmitted}
                                required
                            />
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-500">
                                    Tối thiểu 10 ký tự
                                </span>
                                <span className="text-xs text-gray-400">
                                    {reason.length}/500
                                </span>
                            </div>
                        </div>

                        {/* Common reasons */}
                        <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                                Lý do phổ biến:
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    'Thay đổi ý định mua hàng',
                                    'Sản phẩm không phù hợp',
                                    'Tìm thấy giá tốt hơn',
                                    'Thông tin giao hàng sai',
                                    'Không còn nhu cầu',
                                    'Lý do khác'
                                ].map((commonReason) => (
                                    <button
                                        key={commonReason}
                                        type="button"
                                        onClick={() => setReason(commonReason)}
                                        disabled={isSubmitting || isSubmitted}
                                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 disabled:opacity-50"
                                    >
                                        {commonReason}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isSubmitting || isSubmitted}
                                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || isSubmitted || !reason.trim() || reason.trim().length < 10}
                                className={`flex-1 px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center ${
                                    isSubmitted 
                                        ? 'bg-green-600 hover:bg-green-700' 
                                        : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                {isSubmitted ? (
                                    <>
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Đã gửi
                                    </>
                                ) : isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Đang gửi yêu cầu...
                                    </>
                                ) : (
                                    'Gửi yêu cầu hủy'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CancelOrderModal;
