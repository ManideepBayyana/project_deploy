(function () {
  // --------- CART BADGE ---------
  // Updates the cart item count on all #cart-count spans in the header
  function updateCartBadges() {
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem("cart")) || []; } catch { cart = []; }
    document.querySelectorAll("#cart-count").forEach((el) => {
      el.textContent = cart.reduce((sum, i) => sum + i.qty, 0);
    });
  }

  // --------- CHECKOUT PAGE: ORDER STATUS ---------
  // Shows the current order status and updates the progress bar
  function showOrderStatus() {
    const orderInfo = JSON.parse(localStorage.getItem('lastOrder') || '{}');
    if (orderInfo.orderId) {
      const idEl = document.getElementById('order-id');
      const totalEl = document.getElementById('order-total');
      if (idEl) idEl.textContent = orderInfo.orderId;
      if (totalEl) totalEl.textContent = orderInfo.total;
    }

    // Real-time status tracking using Socket.io (if loaded)
    if (orderInfo.orderId && typeof io === 'function') {
      const socket = io();
      socket.emit('trackOrder', orderInfo.orderId);

      const steps = Array.from(document.querySelectorAll('.progress-bar .step'));
      socket.on('orderStatus', data => {
        const statusEl = document.getElementById('order-status');
        if (statusEl) statusEl.innerText = `Order Status: ${data.status}`;
        // Update progress bar
        steps.forEach(s => s.classList.remove('active'));
        if (data.status === 'Preparing') steps[0]?.classList.add('active');
        if (data.status === 'On the Way') steps[1]?.classList.add('active');
        if (data.status === 'Delivered') steps[2]?.classList.add('active');
      });
    }
  }

  // --------- USER PROFILE MANAGEMENT ---------
  function setupHeaderProfile() {
    console.log('Setting up header profile...');
    
    // Get elements
    const authButtons = document.getElementById("auth-buttons");
    const profileMenu = document.getElementById("profile-menu");
    const profileIcon = document.getElementById("profile-icon");
    const profileIconSmall = document.getElementById("profile-icon-small");
    const profileDropdown = document.getElementById("profile-dropdown");
    const profileName = document.getElementById("profile-name");
    const profileEmail = document.getElementById("profile-email");
    const profilePhone = document.getElementById("profile-phone");
    const logoutBtn = document.getElementById("logoutBtn");
    
    // Check authentication
    const jwt = localStorage.getItem("tindi_jwt");
    const initials = localStorage.getItem("userInitials");
    const userStr = localStorage.getItem("user");
    
    console.log('Auth check:', { jwt: !!jwt, initials, userStr: !!userStr });
    
    let user = {};
    try {
      user = userStr ? JSON.parse(userStr) : {};
    } catch (e) {
      console.error('Error parsing user data:', e);
      user = {};
    }

    // Clear any existing event listeners
    if (profileIcon) {
      const newProfileIcon = profileIcon.cloneNode(true);
      profileIcon.parentNode.replaceChild(newProfileIcon, profileIcon);
    }
    if (logoutBtn) {
      const newLogoutBtn = logoutBtn.cloneNode(true);
      logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
    }
    
    // Re-get elements after cloning
    const newProfileIcon = document.getElementById("profile-icon");
    const newLogoutBtn = document.getElementById("logoutBtn");

    // More flexible authentication check
    const isAuthenticated = jwt || (user.username || user.email || user.name);
    const displayName = user.name || user.username || user.email || 'User';
    
    // Generate initials from available data
    let displayInitials = initials;
    if (!displayInitials && displayName) {
      if (displayName.includes('@')) {
        // Email - use first letter and letter after @
        displayInitials = displayName.charAt(0).toUpperCase() + displayName.split('@')[0].slice(-1).toUpperCase();
      } else {
        // Name - use first letters of words
        displayInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().substr(0, 2);
      }
    }
    
    if (isAuthenticated && displayInitials) {
      console.log('User is authenticated, showing profile');
      
      // Hide auth buttons, show profile
      if (authButtons) {
        authButtons.style.display = "none";
        console.log('Hidden auth buttons');
      }
      if (profileMenu) {
        profileMenu.style.display = "inline-block";
        console.log('Shown profile menu');
      }
      
      // Set profile data
      if (newProfileIcon) {
        newProfileIcon.textContent = displayInitials;
        console.log('Set profile icon:', displayInitials);
      }
      if (profileIconSmall) profileIconSmall.textContent = displayInitials;
      if (profileName) profileName.textContent = displayName;
      if (profileEmail) {
        const email = user.email || (user.username && user.username.includes('@') ? user.username : '');
        profileEmail.textContent = email;
      }
      if (profilePhone) {
        profilePhone.textContent = user.phone ? `📱 ${user.phone}` : "📱 Not provided";
      }

      // Profile icon click handler
      if (newProfileIcon && profileDropdown) {
        newProfileIcon.addEventListener('click', function(e) {
          console.log('Profile icon clicked');
          profileDropdown.style.display = (profileDropdown.style.display === "block") ? "none" : "block";
          e.stopPropagation();
        });
      }

      // Logout handler
      if (newLogoutBtn) {
        newLogoutBtn.addEventListener('click', function(e) {
          console.log('Logout clicked');
          e.preventDefault();
          localStorage.removeItem("tindi_jwt");
          localStorage.removeItem("userInitials");
          localStorage.removeItem("user");
          window.location.reload();
        });
      }
      
      // Dropdown click prevention
      if (profileDropdown) {
        profileDropdown.addEventListener('click', function(e) {
          e.stopPropagation();
        });
      }
      
    } else {
      console.log('User not authenticated, showing login buttons');
      
      // Show auth buttons, hide profile
      if (authButtons) {
        authButtons.style.display = "flex";
        console.log('Shown auth buttons');
      }
      if (profileMenu) {
        profileMenu.style.display = "none";
        console.log('Hidden profile menu');
      }
    }
    
    // Global click handler to close dropdown
    document.addEventListener("click", function() {
      if (profileDropdown) profileDropdown.style.display = "none";
    });
  }


  // --------- CHATBOT ---------
  // Handles the chatbot popup and sending messages
  function attachChatbot() {
    const button = document.querySelector(".chatbot-button");
    const windowEl = document.querySelector(".chatbot-window");
    if (!button || !windowEl) return;

    button.addEventListener("click", () => {
      windowEl.style.display = windowEl.style.display === "block" ? "none" : "block";
    });

    // Chat input handling
    const input = windowEl.querySelector("input");
    input?.addEventListener("keydown", function (e) {
      if (e.key === "Enter") sendChatbotMessage();
    });

    function sendChatbotMessage() {
      const text = input.value.trim();
      if (!text) return;
      handleChatbotInput(text);
      input.value = "";
    }
  }

  // Displays your message and a basic reply (enhanced with dynamic menu data)
  async function handleChatbotInput(text) {
    const body = document.querySelector(".chat-body");
    const p = document.createElement("p");
    p.textContent = `You: ${text}`;
    p.style.fontWeight = "bold";
    body.appendChild(p);

    let reply = "I'm not sure about that. Try asking about 'popular', 'discount', 'veg', or specific dishes!";
    
    try {
      // Fetch current menu for dynamic responses
      const response = await fetch('/api/menu');
      const menu = await response.json();
      
      if (text.toLowerCase().includes("popular")) {
        const popular = menu.filter(item => item.popular).map(item => item.name);
        reply = popular.length ? `🔥 Popular items: ${popular.join(", ")}` : "🔥 Our chicken biryani and paneer tikka are crowd favorites!";
      } else if (text.toLowerCase().includes("discount") || text.toLowerCase().includes("offer")) {
        reply = "🎉 Special Offer: Get 10% off on orders above ₹500! Use code: SAVE10";
      } else if (text.toLowerCase().includes("veg")) {
        const vegItems = menu.filter(item => item.veg).map(item => item.name);
        reply = vegItems.length ? `🥬 Vegetarian options: ${vegItems.slice(0, 5).join(", ")}${vegItems.length > 5 ? '...' : ''}` : "🥬 We have great vegetarian options including paneer dishes and veg rice!";
      } else if (text.toLowerCase().includes("spicy")) {
        const spicyItems = menu.filter(item => item.spicy).map(item => item.name);
        reply = spicyItems.length ? `🌶️ Spicy dishes: ${spicyItems.slice(0, 3).join(", ")}` : "🌶️ Try our Chicken 65 for something spicy!";
      } else if (text.toLowerCase().includes("dessert")) {
        const desserts = menu.filter(item => item.category === "Desserts").map(item => item.name);
        reply = desserts.length ? `🍰 Sweet endings: ${desserts.join(", ")}` : "🍰 End your meal with our delicious desserts!";
      } else if (text.toLowerCase().includes("price") || text.toLowerCase().includes("cost")) {
        reply = "💰 Our dishes start from ₹60. Check individual items for exact pricing!";
      }
    } catch (error) {
      console.error('Chatbot error:', error);
    }

    const r = document.createElement("p");
    r.textContent = reply;
    r.style.color = "#666";
    body.appendChild(r);
    body.scrollTop = body.scrollHeight;
  }

  // --------- INIT ---------
  document.addEventListener("DOMContentLoaded", function () {
    updateCartBadges();
    setupHeaderProfile();
    if (document.getElementById('order-id')) showOrderStatus();
    attachChatbot();
  });

})();
