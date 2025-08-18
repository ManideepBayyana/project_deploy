// js/index.js

// Helper: Load cart from localStorage
function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch (e) {
    return [];
  }
}
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}
function updateCartBadge() {
  const cart = loadCart();
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll("#cart-count").forEach(el => el.textContent = count);
}

// Render menu with proper categories and add-to-cart
function renderMenu(menu) {
  // Group items by category for sections
  const cats = ["Starters", "Main Course", "Desserts", "Beverages"];
  let html = "";
  
  cats.forEach(cat => {
    const items = menu.filter(i => i.category === cat);
    if (!items.length) return;
    
    html += `<section class="menu-section" id="${cat.toLowerCase().replace(" ", "-")}">
      <h2>${cat}</h2>
      <div class="menu-grid">`;
      
    items.forEach(item => {
      // Use _id from database or create a unique id
      const itemId = item._id || item.id || `${item.name.replace(/\s+/g, '-').toLowerCase()}`;
      
      // Fix image path - ensure it starts with /
      const imgPath = item.img.startsWith('/') ? item.img : `/${item.img}`;
      
      html += `
        <div class="menu-card" data-id="${itemId}" data-name="${item.name}" data-price="${item.price}" data-img="${item.img}">
          <img src="${imgPath}" alt="${item.name}" onerror="this.src='/assets/images/download.jpg'" />
          <h3>${item.name}</h3>
          <div class="icons">
            ${item.veg === true ? `<img src="/assets/images/veg.webp" alt="Vegetarian" />` : ""}
            ${item.veg === false ? `<img src="/assets/images/nonveg.png" alt="Non veg" />` : ""}
            ${item.spicy ? `<img src="/assets/images/spicy.png" alt="Spicy" />` : ""}
            ${item.popular ? `<img src="/assets/images/popular.png" alt="Popular item" />` : ""}
          </div>
          <span class="price">₹${item.price}</span>
          <button class="add-to-cart-btn">Add to Cart</button>
        </div>`;
    });
    html += `</div></section>`;
  });
  document.getElementById("menu").innerHTML = html;

  // Attach event listeners to new Add to Cart buttons
  document.querySelectorAll(".add-to-cart-btn").forEach(btn => {
    btn.onclick = function (e) {
      const card = e.target.closest(".menu-card");
      const id = card.dataset.id;
      const name = card.dataset.name;
      const price = Number(card.dataset.price);
      const img = card.dataset.img;
      // Update cart
      let cart = loadCart();
      let found = cart.find(i => i.id === id);
      if (found) found.qty += 1;
      else cart.push({ id, name, price, img, qty: 1 });
      saveCart(cart);
      updateCartBadge();
      btn.textContent = "Added!";
      setTimeout(() => (btn.textContent = "Add to Cart"), 800);
    };
  });
}

// Add search functionality
function attachSearch() {
  const searchInput = document.getElementById('global-search');
  if (!searchInput) return;
  
  let allMenuItems = [];
  
  searchInput.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
      renderMenu(allMenuItems);
      return;
    }
    
    const filtered = allMenuItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm)
    );
    
    renderMenu(filtered);
  });
  
  return function setMenuData(menu) {
    allMenuItems = menu;
  };
}

// On page load, fetch menu and render
document.addEventListener("DOMContentLoaded", function () {
  const setMenuData = attachSearch();
  
  fetch("/api/menu")
    .then(res => {
      if (!res.ok) {
        throw new Error('Failed to fetch menu');
      }
      return res.json();
    })
    .then(menu => {
      console.log('Menu loaded:', menu);
      renderMenu(menu);
      updateCartBadge();
      if (setMenuData) setMenuData(menu);
    })
    .catch(error => {
      console.error('Error loading menu:', error);
      document.getElementById("menu").innerHTML = 
        `<div style="text-align: center; padding: 2rem;">\r
           <h2>Unable to load menu</h2>\r
           <p>Please refresh the page or try again later.</p>\r
         </div>`;
    });
});
