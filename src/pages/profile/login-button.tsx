import Button from "@/components/button";
import { autoLoginAndUpsert, useAuthStatus } from "@/services/auth";
import { useState } from "react";

export default function LoginButton() {
    const [loading, setLoading] = useState(false);
    const loggedIn = useAuthStatus();
    if (loggedIn) {
        return null;
    }
    const onLogin = async () => {
        try {
            setLoading(true);
            await autoLoginAndUpsert();
            alert("Đăng nhập thành công");
        } catch (e) {
            console.error(e);
            alert("Đăng nhập thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg p-4 border-[0.5px] border-black/15 flex justify-center">
            <Button primary small className="mx-auto" onClick={onLogin} disabled={loading}>
                {loading ? "Đang đăng nhập..." : "Đăng nhập bằng Zalo"}
            </Button>
        </div>
    );
}


