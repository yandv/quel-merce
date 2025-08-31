import Alpine from 'alpinejs'

document.addEventListener('alpine:init', () => {
  Alpine.store('cart', {
    items: JSON.parse(localStorage.getItem('cart') || '[]'),
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
    clearItems() {
      this.items = []
      localStorage.removeItem('cart')
    },
  })
})

Alpine.start()
