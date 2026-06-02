import { useState, useEffect } from 'react'
import type { ContractResponse } from '../../../types/Contract'
import type { TenantCompanyResponse } from '../../../types/TenantCompany'
import type { UserResponse } from '../../../types/Account'
import type { Role } from '../../../types/Account'
import { tenantCompanyApi } from '../../../service/tenantCompany'
import { warehouseApi } from '../../../service/warehouseApi'
import { contractApi } from '../../../service/contractApi'
import { accountApi } from '../../../service/accountApi'
import { productApi } from '../../../service/productApi' 
import type { Status } from '../../../types/Inbound' 
import type { InboundRequestResponse } from '../../../types/Inbound'

interface FormSkuItem {
    skuId: string
    skuCode?: string
    productName?: string
    expectedQuantity: number
}

type Mode = 'view' | 'edit' | 'create'

type Props = {
    mode: Mode
    data?: InboundRequestResponse
    onClose: () => void
    onSubmit?: (data: any) => void
}

export const InboundModal: React.FC<Props> = ({
    mode,
    data,
    onClose,
    onSubmit,
}) => {
    const isView = mode === 'view'
    const isCreate = mode === 'create'
    const isEditMode = !isCreate && !isView

    const [tenants, setTenants] = useState<TenantCompanyResponse[]>([])
    const [loadingTenants, setLoadingTenants] = useState(false)
    const [warehouseName, setWarehouseName] = useState('')
    const [contracts, setContracts] = useState<ContractResponse[]>([])
    const [loadingContracts, setLoadingContracts] = useState(false)
    const [userMap, setUserMap] = useState<Record<string, string>>({})
    const [userRole, setUserRole] = useState<Role | null>(null)
    const [currentUser, setCurrentUser] = useState<{ userId: string; fullName: string; tenantId?: string; warehouseId?: string } | null>(null)

    // State danh mục hàng hóa từ hệ thống
    const [systemSkus, setSystemSkus] = useState<any[]>([])
    const [selectedSkuId, setSelectedSkuId] = useState('')
    const [expectedQuantity, setExpectedQuantity] = useState<number>(1)

    const [form, setForm] = useState({
        tenantId: '',
        contractId: '',
        warehouseId: '',
        inboundCode: '',
        expectedArrivalDate: '',
        actualArrivalAt: '',
        status: 'DRAFT' as Status,
        createdBy: '',
        approvedBy: '',
        receivedBy: '',
        skus: [] as FormSkuItem[] // Lưu mảng hàng hóa tạm thời
    })

    // Load tenants
    useEffect(() => {
        const fetchTenants = async () => {
            try {
                setLoadingTenants(true)
                const response = await tenantCompanyApi.getAll()
                if (response.data.success && response.data.data) {
                    setTenants(response.data.data)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoadingTenants(false)
            }
        }
        fetchTenants()
    }, [])

    // Fetch SKUs hệ thống theo tenantId để hiển thị trong thẻ select box
    useEffect(() => {
        const fetchSkus = async () => {
            if (!form.tenantId) {
                setSystemSkus([])
                return
            }
            try {
                const response = await productApi.getAllSkus(form.tenantId)
                if (response.data.success && response.data.data) {
                    const skuListData = Array.isArray(response.data.data) 
                        ? response.data.data 
                        : (response.data.data as any).skus || []
                    setSystemSkus(skuListData)
                }
            } catch (err) {
                console.error('Lỗi tải danh mục SKU:', err)
            }
        }
        fetchSkus()
    }, [form.tenantId])

    // Load User info
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

                setForm(prev => ({ ...prev, createdBy: user.userId }))

                const fetchUsers = async () => {
                    try {
                        const response = await accountApi.getAll()
                        if (response.data.success && response.data.data) {
                            const map: Record<string, string> = {}
                            response.data.data.forEach((u) => { map[u.userId] = u.fullName })
                            setUserMap(map)
                        }
                    } catch (err) {
                        console.error(err)
                    }
                }
                fetchUsers()

                if (user.role === 'TENANT_ADMIN' && user.tenantId) {
                    setForm(prev => ({ ...prev, tenantId: user.tenantId }))
                    const fetchContracts = async () => {
                        try {
                            setLoadingContracts(true)
                            const response = await contractApi.getAllContractsByWarehouse('')
                            if (response.data.success && response.data.data) {
                                const filteredContracts = response.data.data.filter(
                                    (c) => c.tenantId === user.tenantId && c.status === 'ACTIVE'
                                )
                                setContracts(filteredContracts)

                                if (filteredContracts.length > 0) {
                                    const warehouseId = filteredContracts[0].warehouseId
                                    setForm(prev => ({ ...prev, warehouseId: warehouseId }))
                                    const whResponse = await warehouseApi.getById(warehouseId)
                                    if (whResponse.data.data?.warehouseName) {
                                        setWarehouseName(whResponse.data.data.warehouseName)
                                    }
                                }
                            }
                        } catch (err) {
                            console.error(err)
                        } finally {
                            setLoadingContracts(false)
                        }
                    }
                    fetchContracts()
                } else if (user.role === 'WH_ADMIN' && user.warehouseId) {
                    const fetchContracts = async () => {
                        try {
                            setLoadingContracts(true)
                            const response = await contractApi.getAllContractsByWarehouse(user.warehouseId)
                            if (response.data.success && response.data.data) {
                                setContracts(response.data.data)
                            }
                        } catch (err) {
                            console.error(err)
                        } finally {
                            setLoadingContracts(false)
                        }
                    }
                    fetchContracts()

                    const fetchWarehouse = async () => {
                        try {
                            const response = await warehouseApi.getById(user.warehouseId)
                            if (response.data.data?.warehouseName) {
                                setWarehouseName(response.data.data.warehouseName)
                            }
                        } catch (err) {
                            console.error(err)
                        }
                    }
                    fetchWarehouse()
                    setForm(prev => ({ ...prev, warehouseId: user.warehouseId }))
                }
            } catch (err) {
                console.error(err)
            }
        }
    }, [])

    // Đổ dữ liệu có sẵn từ API (Chế độ Xem / Sửa chi tiết)
    useEffect(() => {
        if (data) {
            const mappedSkus: FormSkuItem[] = (data.skus || []).map((item: any) => ({
                skuId: item.skuId,
                skuCode: item.skuCode,
                productName: item.productName,
                expectedQuantity: item.expectedQuantity || 1 
            }))

            setForm({
                tenantId: data.tenantId,
                contractId: data.contractId,
                warehouseId: data.warehouseId,
                inboundCode: data.inboundCode,
                expectedArrivalDate: data.expectedArrivalDate ? data.expectedArrivalDate.split('T')[0] : '',
                actualArrivalAt: data.actualArrivalAt ? data.actualArrivalAt.split('T')[0] : '',
                status: data.status,
                createdBy: data.createdBy,
                approvedBy: data.approvedBy,
                receivedBy: data.receivedBy,
                skus: mappedSkus
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
                    tenantId: selectedContract.tenantId
                }))
                const fetchWarehouse = async () => {
                    try {
                        const response = await warehouseApi.getById(selectedContract.warehouseId)
                        if (response.data.data?.warehouseName) {
                            setWarehouseName(response.data.data.warehouseName)
                        }
                    } catch (err) {
                        console.error(err)
                    }
                }
                fetchWarehouse()
            }
        }
    }, [form.contractId, contracts])

    // Logic nút Thêm Hàng hóa
    const handleAddProduct = () => {
        if (!selectedSkuId) {
            alert('Vui lòng chọn một mặt hàng/SKU!')
            return
        }
        if (expectedQuantity <= 0) {
            alert('Số lượng dự kiến phải lớn hơn 0!')
            return
        }

        const targetSystemSku = systemSkus.find(s => s.skuId === selectedSkuId)
        const existingIndex = form.skus.findIndex(item => item.skuId === selectedSkuId)

        if (existingIndex >= 0) {
            const updatedSkus = [...form.skus]
            updatedSkus[existingIndex].expectedQuantity += expectedQuantity
            setForm(prev => ({ ...prev, skus: updatedSkus }))
        } else {
            const newDetail: FormSkuItem = {
                skuId: selectedSkuId,
                skuCode: targetSystemSku?.skuCode || '',
                productName: targetSystemSku?.skuName || targetSystemSku?.productName || '',
                expectedQuantity: expectedQuantity
            }
            setForm(prev => ({ ...prev, skus: [...prev.skus, newDetail] }))
        }

        setSelectedSkuId('')
        setExpectedQuantity(1)
    }

    // Xóa hàng hóa ra khỏi danh sách tạm thời
    const handleRemoveProduct = (skuIdToRemove: string) => {
        setForm(prev => ({
            ...prev,
            skus: prev.skus.filter(item => item.skuId !== skuIdToRemove)
        }))
    }

    const handleSubmit = () => {
        if (isView) return

        if (!form.tenantId) { alert('Vui lòng chọn thương nhân'); return }
        if (!form.contractId) { alert('Vui lòng chọn hợp đồng'); return }
        if (!form.inboundCode) { alert('Vui lòng điền mã phiếu nhập'); return }
        if (!form.expectedArrivalDate) { alert('Vui lòng chọn ngày dự kiến nhập'); return }
        if (form.skus.length === 0) { alert('Vui lòng thêm ít nhất một mặt hàng hàng hóa'); return }

        const userString = localStorage.getItem('user')
        const user = userString ? JSON.parse(userString) : null

        const submitData = {
            tenantId: form.tenantId,
            contractId: form.contractId,
            warehouseId: form.warehouseId,
            inboundCode: form.inboundCode,
            expectedArrivalDate: form.expectedArrivalDate,
            actualArrivalAt: form.actualArrivalAt,
            status: form.status,
            createdBy: form.createdBy,
            approvedBy: user?.role === 'WH_ADMIN' ? user.userId : form.approvedBy,
            receivedBy: form.receivedBy,
            skus: form.skus // Mảng này sẽ được ManageInbound bóc tách xử lý vòng lặp
        }

        onSubmit?.(submitData)
        onClose()
    }

    const isTenantAdmin = userRole === 'TENANT_ADMIN'
    const isWHAdmin = userRole === 'WH_ADMIN'
    const getUserName = (userId: string) => userMap[userId] || userId

    const renderSkuText = (item: FormSkuItem) => {
        if (item.skuCode || item.productName) {
            return `${item.skuCode || ''} - ${item.productName || ''}`
        }
        const matched = systemSkus.find(s => s.skuId === item.skuId)
        return matched ? `${matched.skuCode} - ${matched.skuName || matched.productName}` : item.skuId
    }

    const labelStyle = 'text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block'
    const inputStyle = 'w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all disabled:bg-slate-50 disabled:opacity-60'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative z-10 w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl flex flex-col">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                        <span className="material-symbols-outlined text-cyan-600">{isCreate ? 'inbox' : isView ? 'info' : 'edit'}</span>
                        {isCreate ? 'Tạo phiếu nhập mới' : isView ? 'Chi tiết phiếu nhập' : 'Cập nhật phiếu nhập'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
                    {/* Cơ bản */}
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
                                {contracts.map((c) => (
                                    <option key={c.contractId} value={c.contractId}>{c.contractCode} - {c.contractName}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Thương nhân *</label>
                                <input disabled className={inputStyle} value={tenants.find(t => t.tenantId === form.tenantId)?.companyName || ''} placeholder="Sẽ tự động điền" />
                            </div>
                            <div>
                                <label className={labelStyle}>Kho hàng</label>
                                <input disabled className={inputStyle} value={warehouseName || 'Đang tải...'} />
                            </div>
                            <div>
                                <label className={labelStyle}>Mã phiếu nhập *</label>
                                <input disabled={isView || isEditMode || isWHAdmin} className={inputStyle} value={form.inboundCode} onChange={(e) => setForm({ ...form, inboundCode: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelStyle}>Trạng thái</label>
                                <select disabled={isView || isTenantAdmin} className={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
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

                    {/* DANH SÁCH CHI TIẾT HÀNG HÓA */}
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                        <h3 className="text-[10px] font-black text-cyan-700 tracking-[2px]">DANH SÁCH CHI TIẾT HÀNG HÓA</h3>

                        {!isView && (
                            <div className="flex flex-col md:flex-row gap-3 items-end bg-white p-4 rounded-xl border border-slate-200">
                                <div className="flex-1 w-full">
                                    <label className={labelStyle}>Chọn sản phẩm / SKU *</label>
                                    <select className={inputStyle} value={selectedSkuId} onChange={(e) => setSelectedSkuId(e.target.value)}>
                                        <option value="">-- Chọn mặt hàng --</option>
                                        {systemSkus.map((sku) => (
                                            <option key={sku.skuId} value={sku.skuId}>
                                                {sku.skuCode} - {sku.skuName || sku.productName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-full md:w-44">
                                    <label className={labelStyle}>Số lượng dự kiến *</label>
                                    <input type="number" min={1} className={inputStyle} value={expectedQuantity} onChange={(e) => setExpectedQuantity(Math.max(1, Number(e.target.value)))} />
                                </div>
                                <button type="button" onClick={handleAddProduct} className="h-[45px] px-5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold text-sm flex items-center gap-1.5 whitespace-nowrap">
                                    <span className="material-symbols-outlined text-sm">add</span> Thêm hàng
                                </button>
                            </div>
                        )}

                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-center w-16">STT</th>
                                        <th className="px-4 py-3">Thông tin Sản phẩm / SKU</th>
                                        <th className="px-4 py-3 text-center w-40">Số lượng dự kiến</th>
                                        {!isView && <th className="px-4 py-3 text-center w-24">Hành động</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {form.skus.length === 0 ? (
                                        <tr>
                                            <td colSpan={isView ? 3 : 4} className="text-center py-8 text-slate-400 italic">Chưa có mặt hàng nào.</td>
                                        </tr>
                                    ) : (
                                        form.skus.map((item, index) => (
                                            <tr key={item.skuId} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3 text-center text-slate-400">{index + 1}</td>
                                                <td className="px-4 py-3 font-semibold text-slate-800">{renderSkuText(item)}</td>
                                                <td className="px-4 py-3 text-center font-bold text-slate-900 bg-slate-50/30">{item.expectedQuantity}</td>
                                                {!isView && (
                                                    <td className="px-4 py-3 text-center">
                                                        <button type="button" onClick={() => handleRemoveProduct(item.skuId)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                                                            <span className="material-symbols-outlined text-xl">delete</span>
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Thời gian */}
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                        <h3 className="text-[10px] font-black text-orange-700 tracking-[2px]">THỜI GIAN NHẬP HÀNG</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Ngày nhập (dự kiến) *</label>
                                <input disabled={isView || isEditMode || isWHAdmin} type="date" className={inputStyle} value={form.expectedArrivalDate} onChange={(e) => setForm({ ...form, expectedArrivalDate: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelStyle}>Ngày thực tế tới</label>
                                <input disabled={isView || !isWHAdmin} type="date" className={inputStyle} value={form.actualArrivalAt} onChange={(e) => setForm({ ...form, actualArrivalAt: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Người xử lý */}
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                        <h3 className="text-[10px] font-black text-emerald-700 tracking-[2px]">THÔNG TIN NGƯỜI XỬ LÝ</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Người tạo</label>
                                <input disabled className={inputStyle} value={currentUser?.fullName || getUserName(form.createdBy) || '---'} />
                            </div>
                            <div>
                                <label className={labelStyle}>Người phê duyệt</label>
                                <input disabled className={inputStyle} value={getUserName(form.approvedBy) || (isTenantAdmin ? 'Chưa phê duyệt' : '---')} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <button onClick={onClose} className="px-5 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-semibold">Hủy bỏ</button>
                    {!isView && (
                        <button onClick={handleSubmit} className="bg-cyan-600 hover:bg-cyan-700 px-6 py-2.5 rounded-lg text-sm font-bold text-white flex items-center gap-2 shadow-sm">
                            <span className="material-symbols-outlined text-[18px]">save</span>
                            {isCreate ? 'Tạo phiếu nhập' : 'Lưu thay đổi'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}