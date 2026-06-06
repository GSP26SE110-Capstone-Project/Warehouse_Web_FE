import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { LoadingOverlay } from '../../components/ui/LoadingOverlay'
import { AlertModal } from '../../components/ui/modal/AlertModal'
import { InlineAlert } from '../../components/ui/FeedbackAlert'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../api/client'
import * as inboundApi from '../../api/inboundRequests'
import * as contractsApi from '../../api/contracts'
import * as skusApi from '../../api/skus'
import * as warehousesApi from '../../api/warehouses'
import type { ApiSku } from '../../api/skus'
import * as deliveryApi from '../../api/inboundDeliveries'
import {
  InboundDeliveryForm,
  emptyDeliveryForm,
  type DeliveryFormState,
} from '../../components/inbound/InboundDeliveryForm'
import {
  InboundPickupForm,
  emptyPickupForm,
  type PickupFormState,
} from '../../components/inbound/InboundPickupForm'
import { DELIVERY_MODE_OPTIONS, type DeliveryMode } from '../../data/deliveryMode'
import * as tenantsApi from '../../api/tenants'
import { SkuModal, type SkuFormPayload } from '../../components/ui/modal/SkuModal'
import { fetchProductKindCatalogTree, fetchSizeFactors } from '../../api/productCatalog'
import type { ApiProductKindTreeNode, ApiSizeFactor } from '../../api/productCatalog'
import * as collectionsApi from '../../api/collections'
import * as seasonsApi from '../../api/seasons'
import { DateTimePickerField } from '../../components/ui/DateTimePickerField'
import {
  contractStartDatetimeLocal,
  formatContractDateLabel,
  isArrivalBeforeContractStart,
} from '../../utils/contractDates'

type LineDraft = { skuId: string; expectedQuantity: number }

function normalizeSize(size?: string | null) {
  return String(size ?? '').trim().toUpperCase()
}

function commitmentKey(productKind?: string | null, size?: string | null) {
  return `${String(productKind ?? '').trim()}|${normalizeSize(size)}`
}

function formatCommitmentLine(line: {
  productKind?: string | null
  size?: string | null
}) {
  const size = normalizeSize(line.size)
  return `${line.productKind ?? 'Chưa rõ loại hàng'}${size ? ` · size ${size}` : ''}`
}

export function InboundCreatePage({ basePath }: { basePath: string }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const tenantId = user?.tenantId ?? ''
  const isTenantAdmin = user?.role === 'TENANT_ADMIN'

  const [contracts, setContracts] = useState<
    Awaited<ReturnType<typeof contractsApi.listContracts>>['items']
  >([])
  const [warehouseCodes, setWarehouseCodes] = useState<Map<string, string>>(new Map())
  const [skus, setSkus] = useState<ApiSku[]>([])
  const [commitment, setCommitment] = useState<contractsApi.ApiContractInboundCommitment | null>(null)
  const [commitmentLoading, setCommitmentLoading] = useState(false)
  const [showOnlyAllowedSkus, setShowOnlyAllowedSkus] = useState(false)
  const [catalogTree, setCatalogTree] = useState<ApiProductKindTreeNode[]>([])
  const [sizeFactors, setSizeFactors] = useState<ApiSizeFactor[]>([])
  const [collections, setCollections] = useState<
    Awaited<ReturnType<typeof collectionsApi.listCollections>>['items']
  >([])
  const [seasons, setSeasons] = useState<
    Awaited<ReturnType<typeof seasonsApi.listSeasons>>['items']
  >([])
  const [skuModal, setSkuModal] = useState<{
    open: boolean
    productLineKey?: string
  }>({ open: false })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const submitLockRef = useRef(false)
  const [error, setError] = useState('')

  const [contractId, setContractId] = useState('')
  const [expectedArrivalDate, setExpectedArrivalDate] = useState('')
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('TENANT_SELF')
  const [deliveryForm, setDeliveryForm] = useState<DeliveryFormState>(emptyDeliveryForm())
  const [pickupForm, setPickupForm] = useState<PickupFormState>(emptyPickupForm())
  const [lines, setLines] = useState<LineDraft[]>([{ skuId: '', expectedQuantity: 1 }])

  const [alert, setAlert] = useState<{
    open: boolean
    type?: 'success' | 'error' | 'warning'
    title?: string
    message: string
  }>({
    open: false,
    message: '',
  })

  const load = useCallback(async () => {
    if (!tenantId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [cRes, sRes, whRes, catalog, sizes, colRes, seasonRes] = await Promise.all([
        contractsApi.listContracts({ tenantId, status: 'ACTIVE', limit: 100 }),
        skusApi.listSkus({ tenantId, status: 'ACTIVE', limit: 200 }),
        warehousesApi.listWarehouses({ limit: 200 }),
        fetchProductKindCatalogTree(),
        fetchSizeFactors(),
        collectionsApi.listCollections({ tenantId, limit: 100 }),
        seasonsApi.listSeasons({ limit: 100 }),
      ])
      setContracts(cRes.items)
      setSkus(sRes.items)
      setCatalogTree(catalog.tree ?? [])
      setSizeFactors(sizes)
      setCollections(colRes.items)
      setSeasons(seasonRes.items)
      setWarehouseCodes(
        new Map(whRes.items.map((w) => [w.warehouseId, w.warehouseCode]))
      )
      if (cRes.items.length === 1) setContractId(cRes.items[0].contractId)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!contractId) {
      setCommitment(null)
      return
    }
    let cancelled = false
    setCommitmentLoading(true)
    contractsApi
      .getContractInboundCommitment(contractId)
      .then((data) => {
        if (!cancelled) setCommitment(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setCommitment(null)
          setError(err instanceof ApiError ? err.message : 'Không tải được hạn mức nhập kho')
        }
      })
      .finally(() => {
        if (!cancelled) setCommitmentLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [contractId])

  useEffect(() => {
    if (deliveryMode !== 'WAREHOUSE_TRANSPORT' || !tenantId) return
    let cancelled = false
    tenantsApi
      .getTenant(tenantId)
      .then((tenant) => {
        if (cancelled) return
        setPickupForm((prev) => ({
          ...prev,
          pickupAddress: prev.pickupAddress || tenant.address || '',
          pickupContactName: prev.pickupContactName || tenant.contactName || '',
          pickupContactPhone: prev.pickupContactPhone || tenant.contactPhone || '',
          pickupNotes: prev.pickupNotes ?? '',
        }))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [deliveryMode, tenantId])

  const selectedContract = contracts.find((c) => c.contractId === contractId)
  const contractStartMin = contractStartDatetimeLocal(selectedContract?.startDate)
  const commitmentByKey = useMemo(() => {
    const map = new Map<string, contractsApi.ApiContractInboundCommitmentLine>()
    for (const line of commitment?.productLines ?? []) {
      if (!line.uncommitted && line.productKind) map.set(line.key, line)
    }
    return map
  }, [commitment])
  const commitmentApplies = Boolean(commitment?.applies && commitmentByKey.size > 0)
  const productKindLabelMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const group of catalogTree) {
      for (const kind of group.productKinds ?? []) {
        map.set(kind.productKind, kind.displayName)
      }
    }
    return map
  }, [catalogTree])
  const selectedSkuById = useMemo(
    () => new Map(skus.map((sku) => [sku.skuId, sku])),
    [skus]
  )
  const isSkuAllowed = useCallback(
    (sku: ApiSku) => {
      if (!commitmentApplies) return true
      return commitmentByKey.has(commitmentKey(sku.productKind, sku.size))
    },
    [commitmentApplies, commitmentByKey]
  )
  const visibleSkus = useMemo(
    () => (showOnlyAllowedSkus ? skus.filter(isSkuAllowed) : skus),
    [isSkuAllowed, showOnlyAllowedSkus, skus]
  )
  const selectedSkuCountsByKey = useMemo(() => {
    const map = new Map<string, number>()
    for (const line of lines) {
      if (!line.skuId || line.expectedQuantity <= 0) continue
      const sku = selectedSkuById.get(line.skuId)
      if (!sku) continue
      const key = commitmentKey(sku.productKind, sku.size)
      map.set(key, (map.get(key) ?? 0) + line.expectedQuantity)
    }
    return map
  }, [lines, selectedSkuById])
  const remainingForSku = useCallback(
    (skuId: string, currentLineQty = 0) => {
      if (!commitmentApplies) return null
      const sku = selectedSkuById.get(skuId)
      if (!sku) return null
      const key = commitmentKey(sku.productKind, sku.size)
      const committedLine = commitmentByKey.get(key)
      if (!committedLine) return 0
      const totalInForm = selectedSkuCountsByKey.get(key) ?? 0
      return committedLine.remainingPieces - totalInForm + currentLineQty
    },
    [commitmentApplies, commitmentByKey, selectedSkuById, selectedSkuCountsByKey]
  )
  const skuModalLine = skuModal.productLineKey
    ? commitmentByKey.get(skuModal.productLineKey)
    : undefined
  const skuModalInitialValues = useMemo<Partial<SkuFormPayload> | undefined>(() => {
    if (!skuModalLine) return undefined
    const label = productKindLabelMap.get(skuModalLine.productKind ?? '') ?? skuModalLine.productKind ?? ''
    const size = normalizeSize(skuModalLine.size)
    return {
      skuCode: `${String(skuModalLine.productKind ?? 'SKU').replace(/[^a-z0-9]+/gi, '-').toUpperCase()}${size ? `-${size}` : ''}-${Date.now().toString(36).toUpperCase()}`,
      productName: `${label}${size ? ` size ${size}` : ''}`,
      productKind: skuModalLine.productKind ?? '',
      size,
      movementCategory: 'NORMAL',
      status: 'ACTIVE',
    }
  }, [productKindLabelMap, skuModalLine])

  useEffect(() => {
    if (!commitmentApplies) return
    setLines((prev) =>
      prev.map((line) => {
        if (!line.skuId) return line
        const sku = selectedSkuById.get(line.skuId)
        return sku && isSkuAllowed(sku) ? line : { ...line, skuId: '' }
      })
    )
  }, [commitmentApplies, isSkuAllowed, selectedSkuById])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId || !contractId || !selectedContract) {
      setAlert({ open: true, type: 'warning', message: 'Chọn hợp đồng ACTIVE' })
      return
    }
    const validLines = lines.filter((l) => l.skuId && l.expectedQuantity > 0)
    if (validLines.length === 0) {
      setAlert({ open: true, type: 'warning', message: 'Thêm ít nhất một dòng SKU' })
      return
    }

    if (commitmentApplies) {
      for (const line of validLines) {
        const sku = selectedSkuById.get(line.skuId)
        if (!sku || !isSkuAllowed(sku)) {
          setAlert({
            open: true,
            type: 'warning',
            message: 'Chỉ được nhập SKU thuộc hàng hóa đã đăng ký trong rental request.',
          })
          return
        }
        const maxQty = remainingForSku(line.skuId, line.expectedQuantity)
        if (maxQty != null && line.expectedQuantity > maxQty) {
          const commitmentLine = commitmentByKey.get(commitmentKey(sku.productKind, sku.size))
          const lineLabel = commitmentLine
            ? formatCommitmentLine(commitmentLine)
            : sku.productName
          setAlert({
            open: true,
            type: 'warning',
            title: 'Vượt hạn mức rental request',
            message: `Mã ${sku.skuCode} (${lineLabel}) chỉ còn được nhập tối đa ${Math.max(0, maxQty).toLocaleString('vi-VN')} cái theo cam kết thuê kho, nhưng bạn đã khai ${line.expectedQuantity.toLocaleString('vi-VN')} cái. Vui lòng giảm số lượng trước khi gửi yêu cầu.`,
          })
          return
        }
      }
    }

    if (deliveryMode === 'WAREHOUSE_TRANSPORT') {
      if (!pickupForm.pickupAddress.trim()) {
        setAlert({ open: true, type: 'warning', message: 'Nhập địa chỉ lấy hàng' })
        return
      }
      if (!pickupForm.pickupContactName.trim() || !pickupForm.pickupContactPhone.trim()) {
        setAlert({
          open: true,
          type: 'warning',
          message: 'Nhập người liên hệ và SĐT tại điểm lấy hàng',
        })
        return
      }
    }

    if (
      expectedArrivalDate &&
      isArrivalBeforeContractStart(expectedArrivalDate, selectedContract.startDate)
    ) {
      setAlert({
        open: true,
        type: 'warning',
        message: `Ngày dự kiến đến kho không được trước ngày bắt đầu hợp đồng (${formatContractDateLabel(selectedContract.startDate)}).`,
      })
      return
    }

    if (submitLockRef.current) return
    submitLockRef.current = true
    setSubmitting(true)
    try {
      const inbound = await inboundApi.createInboundRequest({
        tenantId,
        contractId,
        warehouseId: selectedContract.warehouseId,
        deliveryMode,
        expectedArrivalDate: expectedArrivalDate
          ? new Date(expectedArrivalDate).toISOString()
          : undefined,
        status: 'PENDING',
        createdBy: user?.userId,
        items: validLines.map((line) => ({
          skuId: line.skuId,
          expectedQuantity: line.expectedQuantity,
        })),
      })

      if (deliveryMode === 'TENANT_SELF' && deliveryForm.vehiclePlate?.trim()) {
        await deliveryApi.upsertInboundDelivery(inbound.inboundRequestId, {
          vehiclePlate: deliveryForm.vehiclePlate.trim(),
          driverName: deliveryForm.driverName?.trim() || undefined,
          driverPhone: deliveryForm.driverPhone?.trim() || undefined,
          driverIdNumber: deliveryForm.driverIdNumber?.trim() || undefined,
          carrierName: deliveryForm.carrierName?.trim() || undefined,
          notes: deliveryForm.notes?.trim() || undefined,
        })
      }

      if (deliveryMode === 'WAREHOUSE_TRANSPORT') {
        await deliveryApi.upsertInboundDelivery(inbound.inboundRequestId, {
          pickupAddress: pickupForm.pickupAddress.trim(),
          pickupContactName: pickupForm.pickupContactName.trim(),
          pickupContactPhone: pickupForm.pickupContactPhone.trim(),
          pickupNotes: pickupForm.pickupNotes?.trim() || undefined,
        })
      }

      navigate(`${basePath}/${inbound.inboundRequestId}`)
    } catch (err) {
      setAlert({
        open: true,
        type: 'error',
        message: err instanceof ApiError ? err.message : 'Tạo yêu cầu thất bại',
      })
    } finally {
      submitLockRef.current = false
      setSubmitting(false)
    }
  }

  const handleCreateSku = async (form: SkuFormPayload) => {
    if (!tenantId) return
    const created = await skusApi.createSku({
      tenantId,
      skuCode: form.skuCode,
      productName: form.productName,
      productKind: form.productKind,
      collectionId: form.collectionId || undefined,
      seasonId: form.seasonId || undefined,
      color: form.color || undefined,
      size: form.size || undefined,
      material: form.material || undefined,
      movementCategory: form.movementCategory,
      status: form.status,
    })
    setSkus((prev) => [created, ...prev.filter((sku) => sku.skuId !== created.skuId)])
    setSkuModal({ open: false })
    setAlert({ open: true, type: 'success', message: 'Đã tạo SKU, bạn có thể chọn ngay trong phiếu nhập.' })
  }

  if (!isTenantAdmin) {
    return <Navigate to={basePath} replace />
  }

  return (
    <div className="flex max-w-screen overflow-hidden bg-[#0b101a] text-slate-100">
      <LoadingOverlay show={loading || submitting} text={submitting ? 'Đang tạo...' : 'Đang tải...'} />
      <main className="relative flex flex-1 flex-col overflow-hidden bg-[#0b101a]">
        <div className="relative z-10 mx-auto w-full max-w-3xl p-8">
          <button
            type="button"
            onClick={() => navigate(basePath)}
            className="mb-4 text-sm text-cyan-400 hover:underline"
          >
            ← Quay lại danh sách
          </button>

          <h1 className="mb-6 text-2xl font-bold">Tạo yêu cầu nhập kho</h1>

          {error && (
            <InlineAlert
              variant="error"
              message={error}
              onDismiss={() => setError('')}
              className="mb-4"
            />
          )}

          <form
            noValidate
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 rounded-xl border border-white/10 bg-white/5 p-6"
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Hợp đồng (ACTIVE)</span>
              <select
                required
                value={contractId}
                onChange={(e) => {
                  const nextId = e.target.value
                  setContractId(nextId)
                  const next = contracts.find((c) => c.contractId === nextId)
                  if (
                    next?.startDate &&
                    expectedArrivalDate &&
                    isArrivalBeforeContractStart(expectedArrivalDate, next.startDate)
                  ) {
                    setExpectedArrivalDate('')
                  }
                }}
                className="rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2"
              >
                <option value="">— Chọn hợp đồng —</option>
                {contracts.map((c) => {
                  const whCode = warehouseCodes.get(c.warehouseId) ?? '—'
                  return (
                    <option key={c.contractId} value={c.contractId}>
                      {c.contractCode} — {whCode}
                    </option>
                  )
                })}
              </select>
            </label>

            <div className="flex flex-col gap-2 text-sm">
              <span className="text-slate-400">Ngày dự kiến đến kho</span>
              <DateTimePickerField
                id="expected-arrival"
                value={expectedArrivalDate}
                onChange={setExpectedArrivalDate}
                min={contractStartMin || undefined}
                disabled={!contractId}
                placeholder="Chọn ngày và giờ dự kiến"
              />
              {selectedContract?.startDate && (
                <p className="flex items-start gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs text-slate-400">
                  <span className="material-symbols-outlined mt-0.5 shrink-0 text-base text-cyan-400">
                    info
                  </span>
                  <span>
                    Không được chọn trước ngày bắt đầu hợp đồng{' '}
                    <strong className="text-cyan-300">
                      {formatContractDateLabel(selectedContract.startDate)}
                    </strong>
                    . Chọn ngày trên lịch, giờ bên phải, rồi bấm <strong>Xác nhận</strong>.
                  </span>
                </p>
              )}
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Hình thức vận chuyển</span>
              <select
                value={deliveryMode}
                onChange={(e) => setDeliveryMode(e.target.value as DeliveryMode)}
                className="rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2"
              >
                {DELIVERY_MODE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-500">
                {DELIVERY_MODE_OPTIONS.find((o) => o.value === deliveryMode)?.hint}
              </span>
            </label>

            {deliveryMode === 'TENANT_SELF' && (
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="mb-3 text-sm font-medium text-slate-300">
                  Thông tin xe (khuyến nghị trước khi xe vào cổng)
                </p>
                <InboundDeliveryForm
                  deliveryMode={deliveryMode}
                  value={deliveryForm}
                  onChange={setDeliveryForm}
                  compact
                />
              </div>
            )}

            {deliveryMode === 'WAREHOUSE_TRANSPORT' && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="mb-3 text-sm font-medium text-emerald-200">Điểm lấy hàng</p>
                <InboundPickupForm value={pickupForm} onChange={setPickupForm} />
              </div>
            )}

            {contractId && (
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-200">Hàng hóa theo rental request</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {commitmentLoading
                        ? 'Đang tải hạn mức...'
                        : commitmentApplies
                          ? 'SKU nhập kho phải khớp loại hàng và size đã đăng ký; số lượng tính theo hạn mức còn lại lũy kế.'
                          : 'Hợp đồng này chưa có product lines từ rental request, form giữ cách chọn SKU hiện tại.'}
                    </p>
                  </div>
                  {commitmentApplies && (
                    <label className="flex items-center gap-2 text-xs text-slate-400">
                      <input
                        type="checkbox"
                        checked={showOnlyAllowedSkus}
                        onChange={(e) => setShowOnlyAllowedSkus(e.target.checked)}
                        className="h-4 w-4 rounded border-white/10 bg-[#0f172a]"
                      />
                      Chỉ hiện SKU hợp lệ
                    </label>
                  )}
                </div>

                {commitmentApplies && (
                  <div className="mt-3 grid gap-2">
                    {commitment?.productLines
                      .filter((line) => !line.uncommitted)
                      .map((line) => {
                        const label =
                          productKindLabelMap.get(line.productKind ?? '') ??
                          formatCommitmentLine(line)
                        const hasMatchingSku = skus.some(
                          (sku) => commitmentKey(sku.productKind, sku.size) === line.key
                        )
                        return (
                          <div
                            key={line.key}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/3 px-3 py-2"
                          >
                            <div>
                              <p className="text-xs font-medium text-slate-200">
                                {label}
                                {line.size ? (
                                  <span className="ml-1 text-slate-500">
                                    · size {normalizeSize(line.size)}
                                  </span>
                                ) : null}
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                Cam kết {line.effectiveCommittedPieces ?? line.committedPieces}
                                {line.writtenOffPieces ? ` (${line.committedPieces} gốc, đã đóng ${line.writtenOffPieces})` : ''}
                                {' · '}đang dùng {line.usedPieces} · còn {line.remainingPieces}
                              </p>
                              {line.isTailRemaining && (
                                <p className="mt-1 text-[11px] text-amber-300/90">
                                  Lần nhập cuối — còn {line.remainingPieces} cái (≤ {line.tailCloseThreshold ?? 5}).
                                  Có thể tạo phiếu nhập đúng số còn lại hoặc tenant admin đóng cam kết dòng.
                                </p>
                              )}
                            </div>
                            {!hasMatchingSku && (
                              <button
                                type="button"
                                onClick={() => setSkuModal({ open: true, productLineKey: line.key })}
                                className="rounded-lg border border-cyan-400/30 px-3 py-1.5 text-xs text-cyan-300 hover:bg-cyan-500/10"
                              >
                                Tạo SKU từ dòng này
                              </button>
                            )}
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-300">Dòng hàng (SKU)</p>
                  <p className="mt-1 max-w-xl text-xs text-slate-500">
                    Mỗi dòng là một mã hàng kèm{' '}
                    <strong className="font-medium text-slate-400">
                      số lượng dự kiến nhập kho
                    </strong>{' '}
                    — số đơn vị bạn khai báo trước khi hàng tới; kho sẽ đối chiếu khi kiểm đếm.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLines((prev) => [...prev, { skuId: '', expectedQuantity: 1 }])}
                  className="shrink-0 text-xs text-cyan-400 hover:text-cyan-300"
                >
                  + Thêm dòng
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                <div
                  className="hidden gap-3 border-b border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500 sm:grid sm:grid-cols-[minmax(0,1fr)_10.5rem_2.5rem]"
                  aria-hidden
                >
                  <span>Mã hàng (SKU)</span>
                  <span>Số lượng dự kiến nhập kho</span>
                  <span />
                </div>

                <div className="divide-y divide-white/5">
                  {lines.map((line, idx) => {
                    const skuSelectId = `inbound-line-sku-${idx}`
                    const qtyInputId = `inbound-line-qty-${idx}`
                    const selectedSku = line.skuId ? selectedSkuById.get(line.skuId) : undefined
                    const selectedMaxQty = line.skuId
                      ? remainingForSku(line.skuId, line.expectedQuantity)
                      : null
                    const selectedCommitmentLine = selectedSku
                      ? commitmentByKey.get(commitmentKey(selectedSku.productKind, selectedSku.size))
                      : null
                    const qtyOverLimit =
                      commitmentApplies &&
                      selectedMaxQty != null &&
                      line.expectedQuantity > selectedMaxQty
                    return (
                      <div
                        key={idx}
                        className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_10.5rem_2.5rem] sm:items-start"
                      >
                        {lines.length > 1 && (
                          <p className="col-span-full text-xs font-medium text-slate-500 sm:hidden">
                            Dòng {idx + 1}
                          </p>
                        )}

                        <label htmlFor={skuSelectId} className="flex min-w-0 flex-col gap-1.5">
                          <span className="text-xs text-slate-400 sm:sr-only">Mã hàng (SKU)</span>
                          <span className="text-xs font-medium text-slate-400 sm:hidden">
                            Mã hàng (SKU)
                          </span>
                          <select
                            id={skuSelectId}
                            required
                            title="Chọn mã hàng SKU"
                            value={line.skuId}
                            onChange={(e) => {
                              const skuId = e.target.value
                              setLines((prev) =>
                                prev.map((l, i) => (i === idx ? { ...l, skuId } : l))
                              )
                            }}
                            className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-sm"
                          >
                            <option value="">— Chọn mã hàng —</option>
                            {visibleSkus.map((s) => {
                              const allowed = isSkuAllowed(s)
                              const lineInfo = commitmentByKey.get(commitmentKey(s.productKind, s.size))
                              return (
                              <option key={s.skuId} value={s.skuId} disabled={!allowed}>
                                {s.skuCode} — {s.productName}
                                {commitmentApplies && allowed && lineInfo
                                  ? ` (còn ${lineInfo.remainingPieces})`
                                  : ''}
                                {commitmentApplies && !allowed
                                  ? ' (không thuộc rental request)'
                                  : ''}
                              </option>
                              )
                            })}
                          </select>
                          {commitmentApplies && selectedSku && !isSkuAllowed(selectedSku) && (
                            <span className="text-[11px] text-amber-300">
                              SKU này không thuộc hàng hóa đã đăng ký trong rental request.
                            </span>
                          )}
                        </label>

                        <label htmlFor={qtyInputId} className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-slate-400">
                            Số lượng dự kiến nhập kho
                          </span>
                          <div className="relative">
                            <input
                              id={qtyInputId}
                              type="number"
                              min={1}
                              step={1}
                              required
                              inputMode="numeric"
                              aria-describedby={`${qtyInputId}-hint`}
                              value={line.expectedQuantity}
                              onChange={(e) => {
                                const n = Number(e.target.value)
                                setLines((prev) =>
                                  prev.map((l, i) =>
                                    i === idx ? { ...l, expectedQuantity: n } : l
                                  )
                                )
                              }}
                              className={`w-full rounded-lg border bg-[#0f172a] py-2 pl-3 pr-14 text-sm tabular-nums transition-colors ${
                                qtyOverLimit
                                  ? 'border-amber-400/50 ring-1 ring-amber-400/25 focus:border-amber-400/70 focus:outline-none focus:ring-amber-400/30'
                                  : 'border-white/10 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/20'
                              }`}
                              placeholder="VD: 100"
                            />
                            <span
                              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500"
                              aria-hidden
                            >
                              đơn vị
                            </span>
                          </div>
                          {qtyOverLimit && selectedCommitmentLine ? (
                            <div id={`${qtyInputId}-hint`}>
                            <InlineAlert
                              compact
                              hideTitle
                              variant="warning"
                              className="mt-0.5"
                              message={
                                <>
                                  Bạn nhập{' '}
                                  <strong className="font-semibold text-amber-100">
                                    {line.expectedQuantity.toLocaleString('vi-VN')} cái
                                  </strong>
                                  , nhưng theo rental request chỉ còn được nhập tối đa{' '}
                                  <strong className="font-semibold text-amber-100">
                                    {Math.max(0, selectedMaxQty ?? 0).toLocaleString('vi-VN')} cái
                                  </strong>{' '}
                                  cho {formatCommitmentLine(selectedCommitmentLine)}.
                                </>
                              }
                            />
                            </div>
                          ) : (
                            <span id={`${qtyInputId}-hint`} className="text-[11px] leading-snug text-slate-600">
                              {commitmentApplies && selectedCommitmentLine
                                ? `Còn được nhập tối đa ${Math.max(0, selectedMaxQty ?? 0).toLocaleString('vi-VN')} cái cho ${formatCommitmentLine(selectedCommitmentLine)}.`
                                : 'Tổng số cái/thùng/kiện bạn dự kiến giao cho mã này.'}
                            </span>
                          )}
                        </label>

                        <div className="flex items-end justify-end sm:justify-center sm:pt-7">
                          {lines.length > 1 && (
                            <button
                              type="button"
                              title="Xóa dòng hàng"
                              onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                              className="rounded-lg px-2 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-cyan-500 py-2 font-semibold text-slate-900 hover:bg-cyan-400 disabled:opacity-50"
            >
              Gửi yêu cầu nhập
            </button>
          </form>
        </div>
      </main>

      {alert.open && (
        <AlertModal
          title={alert.title}
          message={alert.message}
          type={alert.type ?? 'success'}
          onClose={() => setAlert({ open: false, message: '' })}
        />
      )}

      {skuModal.open && (
        <SkuModal
          mode="create"
          existingSkuCodes={skus.map((s) => s.skuCode)}
          catalogTree={catalogTree}
          sizeFactors={sizeFactors}
          collections={collections}
          seasons={seasons}
          tenantId={tenantId}
          onCollectionCreated={(c) =>
            setCollections((prev) =>
              prev.some((x) => x.collectionId === c.collectionId) ? prev : [...prev, c]
            )
          }
          onSeasonCreated={(s) =>
            setSeasons((prev) =>
              prev.some((x) => x.seasonId === s.seasonId) ? prev : [...prev, s]
            )
          }
          initialValues={skuModalInitialValues}
          onClose={() => setSkuModal({ open: false })}
          onSubmit={handleCreateSku}
        />
      )}
    </div>
  )
}
