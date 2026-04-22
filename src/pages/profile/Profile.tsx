import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom' // Dùng để lấy ID từ URL
import { authApi } from '../../service/authApi'

export const Profile: React.FC = () => {
    // Lấy id từ route path="/profile/:id"
    const { id } = useParams<{ id: string }>(); 

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [role, setRole] = useState('')
    const [loading, setLoading] = useState(false)

    // 1. Hàm gọi API lấy thông tin user theo ID
    const fetchUserData = async () => {
        if (!id) return; // Nếu không có ID thì thoát
        
        setLoading(true);
        try {
            const res = await authApi.getUserById(id);
            const data = res.data;
            
            // Map dữ liệu từ API vào State (kiểm tra kỹ tên field backend trả về)
            setName(data.fullName || data.name || '');
            setEmail(data.email || '');
            setPhone(data.phoneNumber || data.phone || '');
            setRole(data.role || 'User');
        } catch (err) {
            console.error("Lỗi khi lấy thông tin user:", err);
            alert("Không tìm thấy người dùng này!");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchUserData();
    }, [id]); // Chạy lại nếu ID trên URL thay đổi

    // 2. Hàm lưu cập nhật
    const handleSaveProfile = async () => {
        if (!id) return;
        setLoading(true);
        try {
            await authApi.updateProfile(id, { 
                fullName: name, 
                phoneNumber: phone 
            });
            alert('Cập nhật thành công!');
        } catch (err: any) {
            alert('Lỗi cập nhật: ' + (err.response?.data?.message || 'Server error'));
        } finally {
            setLoading(false);
        }
    }

    if (loading && !name) return <div className="p-8 text-white">Đang tải dữ liệu...</div>

    return (
        // Giữ nguyên phần JSX giao diện cũ của bạn...
        // Thay đổi phần hiển thị Avatar và Input như sau:
        
        <div className="relative z-10 p-8">
             {/* Header */}
             <div className="glass-panel rounded-xl border border-white/5 p-6 flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold uppercase">
                    {name ? name.charAt(0) : '?'}
                </div>
                <div>
                    <h2 className="text-xl font-bold">{name || 'N/A'}</h2>
                    <p className="text-slate-400">{email}</p>
                    <span className="text-xs px-2 py-1 bg-cyan-400/10 text-cyan-400 rounded mt-1 inline-block uppercase">
                        {role}
                    </span>
                </div>
            </div>

            {/* Các ô Input giữ nguyên logic onChange={(e) => setName(e.target.value)} */}
            {/* Nút Lưu gọi handleSaveProfile */}
        </div>
    )
}