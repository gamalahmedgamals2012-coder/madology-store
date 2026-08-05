window.MADOLOGY_CART = (() => {
  const STORAGE_PREFIX = "madology_cart";

  function getSessionKey() {
    const token = localStorage.getItem("token");
    return token ? `${STORAGE_PREFIX}_${token}` : `${STORAGE_PREFIX}_guest`;
  }

  function readCart() {
    try {
      return JSON.parse(localStorage.getItem(getSessionKey())) || [];
    } catch (error) {
      return [];
    }
  }

  function writeCart(items) {
    localStorage.setItem(getSessionKey(), JSON.stringify(items));
    return items;
  }

  function getItems() {
    return readCart();
  }

  function setItems(items) {
    return writeCart(items);
  }

  function getItemCount() {
    return readCart().reduce((total, item) => total + Number(item.quantity || 0), 0);
  }

  function addItem(item) {
    const items = readCart();
    const existingItem = items.find((entry) => entry.id === item.id);

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      items.push(item);
    }

    return writeCart(items);
  }

  function updateQuantity(id, quantity) {
    const items = readCart()
      .map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item));

    return writeCart(items);
  }

  function removeItem(id) {
    return writeCart(readCart().filter((item) => item.id !== id));
  }

  function clearCart() {
    return writeCart([]);
  }

  return {
    getItems,
    setItems,
    getItemCount,
    addItem,
    updateQuantity,
    removeItem,
    clearCart
  };
})();
