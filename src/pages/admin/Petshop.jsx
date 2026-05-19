import { useState, useMemo } from 'react'
import { ShoppingCart, Search, Plus, Minus, Trash2, Package, CheckCircle, X, Percent, Tag, Inbox } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'

const Q = (n) => `Q${Number(n || 0).toFixed(2)}`

function applyDiscount(price, qty, disc) {
  const base = price * qty
  if (!disc || !disc.value) return base
  if (disc.type === 'percent') return Math.max(0, base * (1 - disc.value / 100))
  return Math.max(0, base - disc.value)
}

export default function Petshop() {
  const { inventoryActive, addSale, owners, inbox, addToInboxItem } = useApp()
  const [search, setSearch]           = useState('')
  const [cart, setCart]               = useState([])       // [{inventoryId,name,price,qty,maxQty,sku,discount:{type,value}}]
  const [showCheckout, setShowCheckout] = useState(false)
  const [sold, setSold]               = useState(false)
  const [payAmounts, setPayAmounts]   = useState({ cash: '', card: '', transfer: '' })
  const [selectedOwner, setSelectedOwner] = useState('')
  const [catFilter, setCatFilter]     = useState('Todos')
  // Per-item discount editor
  const [discModal, setDiscModal]     = useState(null)     // inventoryId or null
  const [discType, setDiscType]       = useState('percent')
  const [discValue, setDiscValue]     = useState('')
  // Invoice-level discount
  const [invoiceDisc, setInvoiceDisc] = useState({ type: 'percent', value: '' })
  const [showInvoiceDisc, setShowInvoiceDisc] = useState(false)
  // Open account
  const [accountMode, setAccountMode] = useState('independent') // 'independent' | 'account'
  const [selectedInboxId, setSelectedInboxId] = useState('')

  // Active inventory only (no inactive items)
  const salesInventory = (inventoryActive || []).filter(i => (i.quantity || 0) > 0)
  const categories = useMemo(() => ['Todos', ...new Set(salesInventory.map(i => i.category || i.type || 'General'))], [salesInventory])

  const filtered = salesInventory.filter(item => {
    const matchCat = catFilter === 'Todos' || (item.category || item.type || 'General') === catFilter
    const q = search.toLowerCase()
    const matchQ = !q || item.name?.toLowerCase().includes(q) || item.sku?.toLowerCase().includes(q)
    return matchCat && matchQ
  })

  // Pending inbox items (for open account)
  const pendingInbox = inbox.filter(i => i.status === 'pending')

  // ── Cart math ────────────────────────────────────────────
  const cartSubtotal = cart.reduce((s, c) => s + applyDiscount(c.price, c.qty, c.discount), 0)

  const invoiceDiscAmt = (() => {
    const v = Number(invoiceDisc.value) || 0
    if (!v) return 0
    if (invoiceDisc.type === 'percent') return cartSubtotal * v / 100
    return Math.min(v, cartSubtotal)
  })()

  const cartTotal = Math.max(0, cartSubtotal - invoiceDiscAmt)
  const paySum  = (Number(payAmounts.cash) || 0) + (Number(payAmounts.card) || 0) + (Number(payAmounts.transfer) || 0)
  const payOk   = accountMode === 'account'
    ? !!selectedInboxId
    : (Math.abs(paySum - cartTotal) < 0.01 && cartTotal > 0)

  // ── Cart actions ─────────────────────────────────────────
  function addToCart(item) {
    setCart(prev => {
      const ex = prev.find(c => c.inventoryId === item.id)
      if (ex) return prev.map(c => c.inventoryId === item.id ? { ...c, qty: Math.min(c.qty + 1, item.quantity) } : c)
      return [...prev, { inventoryId: item.id, name: item.name, price: item.price || 0, qty: 1, maxQty: item.quantity, sku: item.sku, discount: null }]
    })
  }
  function removeFromCart(id) { setCart(p => p.filter(c => c.inventoryId !== id)) }
  function updateQty(id, delta) {
    setCart(p => p.map(c => {
      if (c.inventoryId !== id) return c
      const newQty = Math.max(1, Math.min(c.qty + delta, c.maxQty))
      return { ...c, qty: newQty }
    }))
  }

  function openDiscModal(item) {
    setDiscModal(item.inventoryId)
    setDiscType(item.discount?.type || 'percent')
    setDiscValue(String(item.discount?.value || ''))
  }

  function applyItemDiscount() {
    const v = Number(discValue) || 0
    setCart(p => p.map(c =>
      c.inventoryId === discModal
        ? { ...c, discount: v ? { type: discType, value: v } : null }
        : c
    ))
    setDiscModal(null)
    setDiscValue('')
  }

  // ── Checkout ─────────────────────────────────────────────
  function handleCheckout() {
    const cartForSale = cart.map(c => ({
      inventoryId: c.inventoryId,
      name: c.name,
      price: c.price,
      quantity: c.qty,
      discount: c.discount,
      lineTotal: applyDiscount(c.price, c.qty, c.discount),
    }))

    if (accountMode === 'account' && selectedInboxId) {
      // Append to existing inbox entry (open account)
      addToInboxItem(selectedInboxId, cartForSale)
    } else {
      const payments = {
        cash:     Number(payAmounts.cash)     || 0,
        card:     Number(payAmounts.card)     || 0,
        transfer: Number(payAmounts.transfer) || 0,
      }
      addSale({
        items:     cartForSale,
        discount:  { type: invoiceDisc.type, value: Number(invoiceDisc.value) || 0 },
        subtotal:  cartSubtotal,
        discountAmt: invoiceDiscAmt,
        total:     cartTotal,
        payments,
        paymentMethod: Object.entries(payments).filter(([, v]) => v > 0).map(([k]) => k).join('+') || 'cash',
        ownerId:   selectedOwner || null,
        type:      'sale',
        status:    'paid',
      })
    }

    setSold(true)
    setTimeout(() => {
      setSold(false)
      setCart([])
      setShowCheckout(false)
      setPayAmounts({ cash: '', card: '', transfer: '' })
      setSelectedOwner('')
      setInvoiceDisc({ type: 'percent', value: '' })
      setShowInvoiceDisc(false)
      setAccountMode('independent')
      setSelectedInboxId('')
    }, 2500)
  }

  if (sold) return (
    <div className="max-w-xl mx-auto text-center py-20">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <CheckCircle size={40} className="text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {accountMode === 'account' ? '¡Agregado a cuenta!' : '¡Venta registrada!'}
      </h2>
      <p className="text-gray-500">
        {accountMode === 'account' ? 'Los productos fueron agregados a la cuenta abierta.' : 'Inventario actualizado automáticamente.'}
      </p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart size={20} className="text-blue-600" /> Petshop / Ventas
          </h2>
          <p className="text-sm text-gray-500">Venta directa de productos sin consulta médica</p>
        </div>
        {cart.length > 0 && (
          <Button icon={ShoppingCart} onClick={() => setShowCheckout(true)}>
            Carrito ({cart.length}) · {Q(cartTotal)}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
        {/* Products */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button key={cat} onClick={() => setCatFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${catFilter === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <Package size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">{search ? `Sin resultados para "${search}"` : 'Sin productos en inventario'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map(item => {
                const inCart = cart.find(c => c.inventoryId === item.id)
                return (
                  <div key={item.id} className={`bg-white rounded-2xl border-2 p-4 transition-all ${inCart ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:border-blue-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="gray" className="text-xs">{item.category || item.type || 'General'}</Badge>
                      {(item.quantity || 0) <= (item.minStock || 3) && <Badge variant="yellow">Bajo</Badge>}
                    </div>
                    <p className="font-bold text-gray-900 text-sm leading-tight">{item.name}</p>
                    {item.sku && <p className="text-xs text-gray-400 mt-0.5">{item.sku}</p>}
                    <div className="flex items-end justify-between mt-3">
                      <div>
                        <p className="text-lg font-bold text-blue-700">{Q(item.price || 0)}</p>
                        <p className="text-xs text-gray-400">Stock: {item.quantity}</p>
                      </div>
                      {inCart ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-colors"><Minus size={12} /></button>
                          <span className="w-7 text-center text-sm font-bold text-blue-800">{inCart.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} disabled={inCart.qty >= item.quantity} className="w-7 h-7 bg-blue-500 text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-40"><Plus size={12} /></button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(item)}
                          className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
                          <Plus size={12} /> Agregar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Cart sidebar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-t-2xl px-4 py-4">
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Carrito</p>
            <p className="text-white text-3xl font-bold mt-1">{Q(cartTotal)}</p>
            {invoiceDiscAmt > 0 && (
              <p className="text-blue-200 text-xs">Subtotal: {Q(cartSubtotal)} · Desc: -{Q(invoiceDiscAmt)}</p>
            )}
            <p className="text-blue-200 text-xs">{cart.length} producto(s)</p>
          </div>
          <div className="p-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Carrito vacío</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => {
                  const lineTotal = applyDiscount(item.price, item.qty, item.discount)
                  const original = item.price * item.qty
                  return (
                    <div key={item.inventoryId} className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.discount?.value ? (
                            <span className="text-xs text-gray-400 line-through">{Q(original)}</span>
                          ) : null}
                          <span className="text-xs text-gray-500">{Q(item.price)} × {item.qty} = {Q(lineTotal)}</span>
                          {item.discount?.value ? (
                            <span className="text-xs text-emerald-600 font-semibold">
                              -{item.discount.type === 'percent' ? `${item.discount.value}%` : Q(item.discount.value)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <button onClick={() => openDiscModal(item)} className="text-gray-300 hover:text-blue-400 p-1 transition-colors" title="Descuento"><Tag size={12} /></button>
                      <button onClick={() => removeFromCart(item.inventoryId)} className="text-gray-300 hover:text-red-400 p-1 transition-colors"><X size={14} /></button>
                    </div>
                  )
                })}

                {/* Invoice-level discount */}
                {!showInvoiceDisc ? (
                  <button
                    onClick={() => setShowInvoiceDisc(true)}
                    className="w-full text-xs text-blue-600 hover:text-blue-800 font-semibold py-1.5 border border-dashed border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                  >
                    <Percent size={11} /> Agregar descuento a factura
                  </button>
                ) : (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-blue-800">Descuento en factura</p>
                      <button onClick={() => { setShowInvoiceDisc(false); setInvoiceDisc({ type: 'percent', value: '' }) }} className="text-blue-400 hover:text-blue-600"><X size={12} /></button>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={invoiceDisc.type}
                        onChange={e => setInvoiceDisc(d => ({ ...d, type: e.target.value }))}
                        className="text-xs border border-blue-200 rounded-lg px-2 py-1 bg-white focus:outline-none"
                      >
                        <option value="percent">%</option>
                        <option value="fixed">Q fijo</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        value={invoiceDisc.value}
                        onChange={e => setInvoiceDisc(d => ({ ...d, value: e.target.value }))}
                        placeholder="0"
                        className="flex-1 text-xs border border-blue-200 rounded-lg px-2 py-1 focus:outline-none"
                      />
                    </div>
                    {invoiceDiscAmt > 0 && (
                      <div className="text-xs text-blue-700 space-y-0.5">
                        <div className="flex justify-between"><span>Subtotal:</span><span>{Q(cartSubtotal)}</span></div>
                        <div className="flex justify-between text-emerald-700"><span>Descuento:</span><span>-{Q(invoiceDiscAmt)}</span></div>
                        <div className="flex justify-between font-bold"><span>Total:</span><span>{Q(cartTotal)}</span></div>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t border-gray-100 pt-3">
                  <Button className="w-full justify-center" onClick={() => setShowCheckout(true)}>Cobrar {Q(cartTotal)}</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Per-item discount modal */}
      {discModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><Tag size={16} />Descuento por ítem</h3>
              <button onClick={() => setDiscModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-600 mb-3">{cart.find(c => c.inventoryId === discModal)?.name}</p>
            <div className="flex gap-2 mb-3">
              <select value={discType} onChange={e => setDiscType(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                <option value="percent">Porcentaje (%)</option>
                <option value="fixed">Monto fijo (Q)</option>
              </select>
              <input type="number" min="0" value={discValue} onChange={e => setDiscValue(e.target.value)}
                placeholder="0"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => setDiscModal(null)}>Cancelar</Button>
              <Button className="flex-1 justify-center" onClick={applyItemDiscount} icon={CheckCircle}>Aplicar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Finalizar venta</h3>
              <button onClick={() => setShowCheckout(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {/* Order summary */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                {cart.map(item => {
                  const lineTotal = applyDiscount(item.price, item.qty, item.discount)
                  const original = item.price * item.qty
                  return (
                    <div key={item.inventoryId} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.name} × {item.qty}</span>
                      <div className="text-right">
                        {item.discount?.value ? <span className="text-xs text-gray-400 line-through mr-1">{Q(original)}</span> : null}
                        <span className="font-semibold text-gray-900">{Q(lineTotal)}</span>
                      </div>
                    </div>
                  )
                })}
                <div className="border-t border-gray-200 pt-1.5 space-y-0.5">
                  {invoiceDiscAmt > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Subtotal</span><span>{Q(cartSubtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-emerald-700">
                        <span>Descuento factura</span><span>-{Q(invoiceDiscAmt)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between font-bold">
                    <span>Total</span><span className="text-blue-700">{Q(cartTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Account mode selector */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Inbox size={14} />Modo de cobro</p>
                <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-3">
                  <button
                    onClick={() => setAccountMode('independent')}
                    className={`flex-1 py-2 text-xs font-semibold transition-colors ${accountMode === 'independent' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  >
                    Cobrar independiente
                  </button>
                  <button
                    onClick={() => setAccountMode('account')}
                    className={`flex-1 py-2 text-xs font-semibold transition-colors ${accountMode === 'account' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  >
                    Cuenta abierta
                  </button>
                </div>
                {accountMode === 'account' && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Agregar a cuenta de consulta/grooming:</p>
                    {pendingInbox.length === 0 ? (
                      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">No hay consultas/sesiones pendientes de pago</p>
                    ) : (
                      <select
                        value={selectedInboxId}
                        onChange={e => setSelectedInboxId(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">— Seleccionar cuenta —</option>
                        {pendingInbox.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.type === 'consultation' ? 'Consulta' : 'Grooming'} · {item.petName || 'Mascota'} · {item.date}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* Payment section (only for independent) */}
              {accountMode === 'independent' && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Método de pago (puede ser mixto)</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ key: 'cash', label: 'Efectivo', icon: '💵' }, { key: 'card', label: 'Tarjeta', icon: '💳' }, { key: 'transfer', label: 'Transfer.', icon: '🏦' }].map(m => (
                      <div key={m.key}>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">{m.icon} {m.label}</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Q</span>
                          <input type="number" min="0" step="0.01" value={payAmounts[m.key]}
                            onChange={e => setPayAmounts(p => ({ ...p, [m.key]: e.target.value }))}
                            className={`w-full pl-5 pr-1 py-2 border-2 rounded-xl text-sm focus:outline-none ${Number(payAmounts[m.key]) > 0 ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
                            placeholder="0.00" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={`mt-2 rounded-xl px-3 py-2 text-sm ${payOk ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-gray-50 border border-gray-200 text-gray-600'}`}>
                    Ingresado: {Q(paySum)} / Total: {Q(cartTotal)}
                    {!payOk && cartTotal > 0 && <span className="text-red-600 ml-2">Pendiente: {Q(Math.abs(cartTotal - paySum))}</span>}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowCheckout(false)}>Cancelar</Button>
                <Button className="flex-1 justify-center" disabled={!payOk} onClick={handleCheckout} icon={CheckCircle}>
                  {accountMode === 'account' ? 'Agregar a cuenta' : 'Confirmar venta'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
