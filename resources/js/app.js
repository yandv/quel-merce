import Alpine from 'alpinejs'

document.addEventListener('alpine:init', () => {
  Alpine.store('toast', {
    toasts: [],

    toast(message, type = 'info', duration = 3000, className = '') {
      const id =
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      const classNameMap = {
        success: 'border-l-4 border-green-500',
        error: 'border-l-4 border-red-500',
        info: 'border-l-4 border-blue-500',
        warning: 'border-l-4 border-yellow-500',
      }

      this.toasts.push({
        id,
        message,
        type,
        duration,
        className: classNameMap[type] + ' ' + className,
      })

      setTimeout(() => {
        this.removeToast(id)
      }, duration)

      return id
    },

    removeToast(id) {
      this.toasts = this.toasts.filter((toast) => toast.id !== id)
    },
  })

  Alpine.store('cart', {
    items: JSON.parse(localStorage.getItem('cart') || '[]'),
    isDrawerOpen: false,
    isInitialized: false,
    coupon: JSON.parse(localStorage.getItem('cartCoupon') || 'null'),
    couponLoading: false,
    couponError: null,
    couponCode: '',
    isCreatingOrder: false,
    selectedPaymentMethod: null,

    getItems() {
      return this.items
    },

    addItem(item, quantity = 1) {
      const existingItem = this.items.find((i) => i.id === item.id)
      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        this.items.push({
          ...item,
          quantity: quantity,
        })
      }
      localStorage.setItem('cart', JSON.stringify(this.items))
    },

    removeItem(item) {
      this.items = this.items.filter((i) => i.id !== item.id)
      localStorage.setItem('cart', JSON.stringify(this.items))
    },

    removeQuantity(item, quantity = 1) {
      const existingItem = this.items.find((i) => i.id === item.id)
      if (existingItem) {
        existingItem.quantity -= quantity
      }
      if (existingItem.quantity <= 0) {
        this.removeItem(item)
        return
      }
      localStorage.setItem('cart', JSON.stringify(this.items))
    },

    updateQuantity(item, quantity) {
      const existingItem = this.items.find((i) => i.id === item.id)
      if (existingItem) {
        if (quantity <= 0) {
          this.removeItem(item)
        } else {
          existingItem.quantity = quantity
          localStorage.setItem('cart', JSON.stringify(this.items))
        }
      }
    },

    clearItems() {
      this.items = []
      localStorage.removeItem('cart')
    },

    init() {
      if (!this.isInitialized) {
        this.isInitialized = true
        this.isDrawerOpen = false
      }
    },

    toggle() {
      this.init()
      this.isDrawerOpen = !this.isDrawerOpen
    },

    close() {
      this.isDrawerOpen = false
    },

    async validateCoupon(code) {
      if (!code || this.items.length === 0) return false

      this.couponLoading = true
      this.couponError = null

      try {
        const response = await fetch(`/api/coupons/${code}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
          },
        })

        if (response.ok) {
          const data = await response.json()
          this.coupon = data
          localStorage.setItem('cartCoupon', JSON.stringify(this.coupon))
          return true
        } else {
          const errorData = await response.json()
          this.couponError = errorData.message
          this.coupon = null
          return false
        }
      } catch (error) {
        this.couponError = 'Erro ao validar cupom'
        this.coupon = null
        return false
      } finally {
        this.couponLoading = false
      }
    },

    removeCoupon() {
      this.coupon = null
      this.couponError = null
      localStorage.removeItem('cartCoupon')
    },

    getSubtotal() {
      return this.items.reduce((total, item) => total + (item.price || 0) * item.quantity, 0)
    },

    getDiscount() {
      if (!this.coupon) return 0

      const coupon = this.coupon

      if (coupon.minimumOrderValue && this.getSubtotal() < coupon.minimumOrderValue) {
        return 0
      }

      let discount = 0

      if (coupon.discountType === 'PERCENTAGE') {
        discount = Math.round((this.getSubtotal() * coupon.discountValue) / 100)
      } else {
        discount = coupon.discountValue
      }
      
      if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
        discount = coupon.maximumDiscount
      }

      return Math.min(discount, this.getSubtotal())
    },

    getTotal() {
      return this.getSubtotal() - this.getDiscount()
    },

    async applyCoupon() {
      if (!this.couponCode || !this.couponCode.trim()) return

      const success = await this.validateCoupon(this.couponCode)

      if (success) {
        this.couponCode = ''
      }
    },

    async createOrder(paymentMethod) {
      if (this.isCreatingOrder) return

      this.isCreatingOrder = true

      try {
        const orderData = {
          paymentMethod: paymentMethod,
          couponId: this.coupon?.id,
          items: this.items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }

        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
          },
          body: JSON.stringify(orderData),
        })

        if (response.ok) {
          const order = await response.json()
          this.clearItems()
          this.removeCoupon()
          window.location.href = `/checkout/${order.id}`
        } else {
          const errorData = await response.json()
          Alpine.store('toast').toast(errorData.message || 'Erro ao criar pedido', 'error')
        }
      } catch (error) {
        Alpine.store('toast').toast('Erro ao criar pedido', 'error')
      } finally {
        this.isCreatingOrder = false
      }
    },
  })
})

Alpine.start()

window.Alpine = Alpine