type PermissionInfoProps = {
    missingFields?: ("name" | "avatar" | "phone")[];
    onRetry?: () => void;
};

export default function PermissionInfo({ missingFields = [], onRetry }: PermissionInfoProps) {
    if (!missingFields.length) {
        return null;
    }

    const messages = {
        name: "Tên hiển thị",
        avatar: "Ảnh đại diện",
        phone: "Số điện thoại",
    } as const;

    return (
        <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700 space-y-2">
            <div className="font-semibold">Ứng dụng cần thêm quyền:</div>
            <ul className="list-disc list-inside text-yellow-800">
                {missingFields.map((field) => (
                    <li key={field}>{messages[field]}</li>
                ))}
            </ul>
            <div className="text-xs text-yellow-600">
                Hãy cấp quyền cho mini app trong Zalo &gt; Cài đặt &gt; Ứng dụng để chúng tôi có thể đồng bộ thông tin của bạn.
            </div>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-2 inline-flex items-center justify-center rounded-lg bg-yellow-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-yellow-700"
                >
                    Thử lại yêu cầu quyền
                </button>
            )}
        </div>
    );
}

