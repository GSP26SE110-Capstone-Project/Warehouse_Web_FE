import { useState, useEffect } from 'react'
import type { ContractResponse } from '../../../types/Contract'
import type { TenantCompanyResponse } from '../../../types/TenantCompany'
import type { UserResponse } from '../../../types/Account'
import type { Role } from '../../../types/Account'
import { tenantCompanyApi } from '../../../service/tenantCompany'
import { warehouseApi } from '../../../service/warehouseApi'
import { contractApi } from '../../../service/contractApi'
import { accountApi } from '../../../service/accountApi'
import type { OutboundRequestRequest, OutboundRequestResponse, Status } from '../../../types/Outbound'

type Mode = 'view' | 'edit' | 'create'

type Props = {
    mode: Mode
    data?: OutboundRequestResponse
    onClose: () => void
    onSubmit?: (data: OutboundRequestRequest) => void
}

export const OutboundModal: React.FC<Props> = ({
    mode,
    data,
    onClose,
    onSubmit,
}) => {
    const isView = mode === 'view'
    const isCreate = mode === 'create'

    const [tenants, setTenants] = useState<TenantCompanyResponse[]>([])
    const [loadingTenants, setLoadingTenants] = useState(false)
    const [warehouseName, setWarehouseName] = useState('')
    const [contracts, setContracts] = useState<ContractResponse[]>([])
    const [loadingContracts, setLoadingContracts] = useState(false)
    const [warehouseStaff, setWarehouseStaff] = useState<UserResponse[]>([])
    const [loadingStaff, setLoadingStaff] = useState(false)
    const [userMap, setUserMap] = useState<Record<string, string>>({}) // userId -> fullName
    const [userRole, setUserRole] = useState<Role | null>(null)
    const [currentUser, setCurrentUser] = useState<{ userId: string; fullName: string; tenantId?: string; warehouseId?: string } | null>(null)

    // Fetch tenants on component mount
    useEffect(() => {
        const fetchTenants = async () => {
            try {
                setLoadingTenants(true)
                const response = await tenantCompanyApi.getAll()
                if (response.data.success && response.data.data) {
                    setTenants(response.data.data)
                }
            } catch (err) {
                console.error('Lỗi tải danh sách thương nhân:', err)
            } finally {
                setLoadingTenants(false)
            }
        }

        fetchTenants()
    }, [])

    // Get user info from localStorage and fetch data based on role
    useEffect(() => {
        const userString = localStorage.getItem('user')
        if (userString) {
            try {
                const user = JSON.parse(userString)
                setUserRole(user.role)
                setCurrentUser({
                    userId: user.userId,
                    fullName: user.fullName,
                    tenantId: user.tenantId,
                    warehouseId: user.warehouseId,
                })

                // Initialize form with common fields
                setForm(prev => ({
                    ...prev,
                    createdBy: user.userId,
                }))

                // Fetch all users and build userMap
                const fetchUsers = async () => {
                    try {
                        setLoadingStaff(true)
                        const response = await accountApi.getAll()
                        if (response.data.success && response.data.data) {
                            // Build userMap for all users
                            const map: Record<string, string> = {}
                            response.data.data.forEach((u) => {
                                map[u.userId] = u.fullName
                            })
                            setUserMap(map)
                        }
                    } catch (err) {
                        console.error('Lỗi tải danh sách nhân viên:', err)
                    } finally {
                        setLoadingStaff(false)
                    }
                }
                fetchUsers()

                // Role-based data fetching
                if (user.role === 'TENANT_ADMIN' && user.tenantId) {
                    setForm(prev => ({
                        ...prev,
                        tenantId: user.tenantId,
                        createdBy: user.userId,
                    }))

                    // Fetch contracts by tenantId with ACTIVE status
                    const fetchContracts = async () => {
                        try {
                            setLoadingContracts(true)
                            const response = await contractApi.getAllContractsByWarehouse('')
                            if (response.data.success && response.data.data) {
                                // Filter contracts by tenantId and ACTIVE status
                                const filteredContracts = response.data.data.filter(
                                    (c) => c.tenantId === user.tenantId && c.status === 'ACTIVE'
                                )
                                setContracts(filteredContracts)

                                // Get warehouseId from first active contract
                                if (filteredContracts.length > 0) {
                                    const warehouseId = filteredContracts[0].warehouseId
                                    setForm(prev => ({
                                        ...prev,
                                        warehouseId: warehouseId,
                                    }))

                                    // Fetch warehouse name
                                    try {
                                        const whResponse = await warehouseApi.getById(warehouseId)
                                        if (whResponse.data.data?.warehouseName) {
                                            setWarehouseName(whResponse.data.data.warehouseName)
                                        }
                                    } catch (err) {
                                        console.error('Lỗi tải thông tin kho hàng:', err)
                                    }
                                }
                            }
                        } catch (err) {
                            console.error('Lỗi tải danh sách hợp đồng:', err)
                        } finally {
                            setLoadingContracts(false)
                        }
                    }
                    fetchContracts()
                } else if (user.role === 'WH_ADMIN' && user.warehouseId) {
                    // Fetch contracts by warehouse for WH_ADMIN
                    const fetchContracts = async () => {
                        try {
                            setLoadingContracts(true)
                            const response = await contractApi.getAllContractsByWarehouse(user.warehouseId)
                            if (response.data.success && response.data.data) {
                                setContracts(response.data.data)
                            }
                        } catch (err) {
                            console.error('Lỗi tải danh sách hợp đồng:', err)
                        } finally {
                            setLoadingContracts(false)
                        }
                    }
                    fetchContracts()

                    // Fetch warehouse name
                    const fetchWarehouse = async () => {
                        try {
                            const response = await warehouseApi.getById(user.warehouseId)
                            if (response.data.data?.warehouseName) {
                                setWarehouseName(response.data.data.warehouseName)
                            }
                        } catch (err) {
                            console.error('Lỗi tải thông tin kho hàng:', err)
                        }
                    }
                    fetchWarehouse()

                    setForm(prev => ({
                        ...prev,
                        warehouseId: user.warehouseId,
                    }))
                }
            } catch (err) {
                console.error('Lỗi lấy thông tin user:', err)
            }
        }
    }, [])

    const [form, setForm] = useState({
        tenantId: '',
        contractId: '',
        warehouseId: '',
        outboundCode: '',
        requestedShipDate: '',
        actualShippedAt: '',
        status: 'DRAFT' as Status,
        createdBy: '',
        approvedBy: '',
    })

    // Update form when data is provided (View/Edit mode)
    useEffect(() => {
        if (data) {
            setForm({
                tenantId: data.tenantId,
                contractId: data.contractId,
                warehouseId: data.warehouseId,
                outboundCode: data.outboundCode,
                requestedShipDate: data.requestedShipDate ? data.requestedShipDate.split('T')[0] : '',
                actualShippedAt: data.actualShippedAt ? data.actualShippedAt.split('T')[0] : '',
                status: data.status,
                createdBy: data.createdBy,
                approvedBy: data.approvedBy,
            })
        }
    }, [data])

    useEffect(() => {
        if (form.contractId && contracts.length > 0) {
            const selectedContract = contracts.find(c => c.contractId === form.contractId)
            if (selectedContract) {
                setForm(prev => ({
                    ...prev,
                    warehouseId: selectedContract.warehouseId,
                }))

                // Fetch warehouse name for the selected contract
                const fetchWarehouse = async () => {
                    try {
                        const response = await warehouseApi.getById(selectedContract.warehouseId)
                        if (response.data.data?.warehouseName) {
                            setWarehouseName(response.data.data.warehouseName)
                        }
                    } catch (err) {
                        console.error('Lỗi tải thông tin kho hàng:', err)
                    }
                }
                fetchWarehouse()
            }
        }
    }, [form.contractId, contracts])

    const handleSubmit = () => {
        if (isView) return

        if (!form.tenantId) {
            alert('Vui lòng chọn thương nhân')
            return
        }

        if (!form.contractId) {
            alert('Vui lòng chọn hợp đồng')
            return
        }

        if (!form.outboundCode) {
            alert('Vui lòng điền mã phiếu xuất')
            return
        }

        if (!form.requestedShipDate) {
            alert('Vui lòng chọn ngày dự kiến xuất')
            return
        }

        // For WH_ADMIN, auto-fill approvedBy with current user
        const submitData: OutboundRequestRequest = {
            tenantId: form.tenantId,
            contractId: form.contractId,
            warehouseId: form.warehouseId,
            outboundCode: form.outboundCode,
            requestedShipDate: form.requestedShipDate,
            actualShippedAt: form.actualShippedAt,
            status: form.status,
            createdBy: form.createdBy,
            approvedBy: userRole === 'WH_ADMIN' && currentUser ? currentUser.userId : form.approvedBy,
        }

        onSubmit?.(submitData)
        onClose()
    }

    const isEditMode = !isCreate && !isView
    const isTenantAdmin = userRole === 'TENANT_ADMIN'
    const isWHAdmin = userRole === 'WH_ADMIN'
    const getUserName = (userId: string) => userMap[userId] || userId

    const labelStyle = 'text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block'
    const inputStyle = 'w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all disabled:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl flex flex-col">

                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                            <span className="material-symbols-outlined text-cyan-600">
                                {isCreate ? 'inbox' : isView ? 'info' : 'edit'}
                            </span>
                            {isCreate ? 'Tạo phiếu xuất hàng mới' : isView ? 'Chi tiết phiếu xuất hàng' : 'Cập nhật phiếu xuất hàng'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">

                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                        <h3 className="text-[10px] font-black text-cyan-700 tracking-[2px]">THÔNG TIN CƠ BẢN</h3>

                        <div>
                            <label className={labelStyle}>Hợp đồng *</label>
                            <select
                                disabled={isView || loadingContracts || isEditMode || isWHAdmin}
                                className={inputStyle}
                                value={form.contractId}
                                onChange={(e) => setForm({ ...form, contractId: e.target.value })}
                            >
                                <option value="">-- Chọn hợp đồng --</option>
                                {contracts.map((contract) => (
                                    <option key={contract.contractId} value={contract.contractId}>
                                        {contract.contractCode} - {contract.contractName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Thương nhân *</label>
                                <input
                                    disabled={isView || loadingTenants || isEditMode || isWHAdmin || isTenantAdmin}
                                    className={inputStyle}
                                    value={tenants.find(t => t.tenantId === form.tenantId)?.companyName || ''}
                                    placeholder="Sẽ tự động điền"
                                />
                            </div>

                            <div>
                                <label className={labelStyle}>Kho hàng</label>
                                <input
                                    disabled
                                    className={inputStyle}
                                    value={warehouseName || 'Đang tải...'}
                                    placeholder="Sẽ tự động điền"
                                />
                            </div>


                            <div>
                                <label className={labelStyle}>Mã phiếu xuất *</label>
                                <input
                                    disabled={isView || isEditMode || isWHAdmin}
                                    className={inputStyle}
                                    placeholder="OUT-001"
                                    value={form.outboundCode}
                                    onChange={(e) => setForm({ ...form, outboundCode: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className={labelStyle}>Trạng thái</label>
                                <select
                                    disabled={isView}
                                    className={inputStyle}
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                                >
                                    <option value="DRAFT">Chờ xử lý</option>
                                    <option value="PENDING">Đang chờ</option>
                                    <option value="APPROVED">Đã phê duyệt</option>
                                    <option value="ARRIVED">Đã tới</option>
                                    <option value="RECEIVED">Đã nhận</option>
                                    <option value="COMPLETED">Hoàn thành</option>
                                    <option value="CANCELED">Đã hủy</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                        <h3 className="text-[10px] font-black text-orange-700 tracking-[2px]">THỜI GIAN XUẤT HÀNG</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Ngày xuất (dự kiến) *</label>
                                <input
                                    disabled={isView || isEditMode || isWHAdmin}
                                    type="date"
                                    className={inputStyle}
                                    value={form.requestedShipDate}
                                    onChange={(e) => setForm({ ...form, requestedShipDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className={labelStyle}>Ngày thực tế tới</label>
                                <input
                                    disabled={isView || !isWHAdmin}
                                    type="date"
                                    className={inputStyle}
                                    value={form.actualShippedAt}
                                    onChange={(e) => setForm({ ...form, actualShippedAt: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                        <h3 className="text-[10px] font-black text-emerald-700 tracking-[2px]">THÔNG TIN NGƯỜI XỬ LÝ</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Người tạo</label>
                                <input
                                    disabled
                                    className={inputStyle}
                                    value={currentUser?.fullName || getUserName(form.createdBy) || '---'}
                                />
                            </div>

                            <div>
                                <label className={labelStyle}>Người phê duyệt</label>
                                <div>
                                    {isTenantAdmin ? (
                                        <input
                                            disabled
                                            className={inputStyle}
                                            value="Chưa phê duyệt"
                                        />
                                    ) : isWHAdmin ? (
                                        <input
                                            disabled
                                            className={inputStyle}
                                            value={currentUser?.fullName || '---'}
                                        />
                                    ) : (
                                        <select
                                            disabled={isView}
                                            className={inputStyle}
                                            value={form.approvedBy}
                                            onChange={(e) => setForm({ ...form, approvedBy: e.target.value })}
                                        >
                                            <option value="">-- Chọn người phê duyệt --</option>
                                            {Object.entries(userMap).map(([userId, fullName]) => (
                                                <option key={userId} value={userId}>
                                                    {fullName}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {!isCreate && data && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                            <div>
                                <label className={labelStyle}>Ngày tạo</label>
                                <input
                                    disabled
                                    className={inputStyle}
                                    value={data.createdAt ? new Date(data.createdAt).toLocaleString('vi-VN') : '---'}
                                />
                            </div>
                            <div>
                                <label className={labelStyle}>Cập nhật cuối</label>
                                <input
                                    disabled
                                    className={inputStyle}
                                    value={data.updatedAt ? new Date(data.updatedAt).toLocaleString('vi-VN') : '---'}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                        Hủy bỏ
                    </button>
                    {!isView && (
                        <button
                            onClick={handleSubmit}
                            className="bg-cyan-600 hover:bg-cyan-700 px-6 py-2.5 rounded-lg text-sm font-bold text-white flex items-center gap-2 shadow-sm shadow-cyan-500/20 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[18px]">save</span>
                            {isCreate ? 'Tạo phiếu xuất' : 'Lưu thay đổi'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}