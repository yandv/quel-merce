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
      console.log(this.items.map((i) => i))
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
        // Garantir que o drawer comece fechado
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
  })
})

Alpine.start()

window.Alpine = Alpine
