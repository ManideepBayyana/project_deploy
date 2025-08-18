// Cart page script (array version)
document.addEventListener("DOMContentLoaded", function() {
  const CART_KEY = "cart";
  const TAX_RATE = 0.05;

  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  }
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }
  function getCartCount(cart) {
    return cart.reduce((sum, i) => sum + i.qty, 0);
  }
  function getCartSubtotal(cart) {
    return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  }
  function formatINR(n) {
    return n.toFixed(2).replace(/\.00$/, "");
  }

  function renderCartPage() {
    const container = document.getElementById("cart-items");
    if (!container) return;
    const subtotalEl = document.getElementById("cart-subtotal");
    const taxEl = document.getElementById("cart-tax");
    const totalEl = document.getElementById("cart-total");
    const cart = loadCart();

    container.innerHTML = "";
    if (cart.length === 0) {
      container.innerHTML = "<p>Your cart is empty.</p>";
      document.getElementById("checkout-btn")?.classList.add("disabled");
    } else {
      document.getElementById("checkout-btn")?.classList.remove("disabled");
      cart.forEach((it, idx) => {
        const row = document.createElement("div");
        row.className = "cart-item";
        row.innerHTML = `
          <img src="${it.img}" alt="${it.name}">
          <div class="cart-item-name">${it.name}</div>
          <div class="qty-controls">
            <button class="qty-btn" data-action="dec" data-id="${it.id}">-</button>
            <span>${it.qty}</span>
            <button class="qty-btn" data-action="inc" data-id="${it.id}">+</button>
          </div>
          <div class="item-price">₹${formatINR(it.price * it.qty)}</div>
          <button class="remove-item-btn" data-action="remove" data-id="${it.id}">🗑️</button>
        `;
        container.appendChild(row);
      });
    }
    subtotalEl.textContent = formatINR(getCartSubtotal(cart));
    const tax = getCartSubtotal(cart) * TAX_RATE;
    taxEl.textContent = formatINR(tax);
    totalEl.textContent = formatINR(getCartSubtotal(cart) + tax);
  }

  function changeQty(id, delta) {
    let cart = loadCart();
    let item = cart.find(it => it.id === id);
    if (item) {
      item.qty += delta;
      if (item.qty <= 0) cart = cart.filter(it => it.id !== id);
      saveCart(cart);
      renderCartPage();
      updateCartBadges();
    }
  }
  function removeItem(id) {
    let cart = loadCart().filter(it => it.id !== id);
    saveCart(cart);
    renderCartPage();
    updateCartBadges();
  }
  function clearCart() {
    saveCart([]);
    renderCartPage();
    updateCartBadges();
  }
  function updateCartBadges() {
    const cart = loadCart();
    document.querySelectorAll("#cart-count").forEach((el) => {
      el.textContent = getCartCount(cart);
    });
  }

  document.getElementById("cart-items")?.addEventListener("click", function(e) {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === "inc") changeQty(id, 1);
    if (btn.dataset.action === "dec") changeQty(id, -1);
    if (btn.dataset.action === "remove") removeItem(id);
  });
  document.getElementById("clear-cart-btn")?.addEventListener("click", clearCart);

  // Checkout click
  document.getElementById('checkout-btn')?.addEventListener('click', function(e) {
    e.preventDefault();
    let cart = loadCart();
    if (!cart.length) return alert("Cart is empty!");
    
    const token = localStorage.getItem('token') || localStorage.getItem('tindi_jwt');
    if (!token) {
      alert('Please login to place an order.');
      window.location.href = 'login.html';
      return;
    }
    
    fetch('http://localhost:3001/api/order/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ cart })
    })
    .then(res => {
      if (res.status === 401) {
        alert('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('tindi_jwt');
        window.location.href = 'login.html';
        return null;
      }
      return res.json();
    })
    .then(data => {
      if (!data) return;
      
      // Save order info for checkout page
      localStorage.setItem('lastOrder', JSON.stringify({
        orderId: data.orderId,
        total: data.total
      }));
      localStorage.setItem('lastOrderId', data.orderId); // For order tracking
      
      alert(`Order placed! Your orderId is ${data.orderId}`);
      localStorage.removeItem(CART_KEY);
      window.location.href = "checkout.html";
    })
    .catch(err => {
      console.error('Checkout error:', err);
      alert('Order failed! Please try again.');
    });
  });

  renderCartPage();
  updateCartBadges();
});
