document.addEventListener("DOMContentLoaded", function() {
  // Try to get orderId from localStorage (from checkout.js or cart.js)
  const orderId = localStorage.getItem("lastOrderId");
  const statusDiv = document.getElementById('order-status');

  if (!orderId || !statusDiv) {
    statusDiv.innerText = "No order to track. Place an order first!";
    return;
  }

  // Connect to Socket.io
  const socket = io();

  socket.emit('trackOrder', orderId);

  socket.on('orderStatus', data => {
    // Show status text
    statusDiv.innerText = `Order Status: ${data.status}`;

    // OPTIONAL: Animate steps if you have a progress bar:
    // (Assume: .progress-bar .step elements in your HTML)
    const steps = document.querySelectorAll('.progress-bar .step');
    if (steps.length) {
      steps.forEach(s => s.classList.remove('active'));
      if (data.status === 'Preparing') steps[0].classList.add('active');
      if (data.status === 'On the Way') steps[1].classList.add('active');
      if (data.status === 'Delivered') steps[2].classList.add('active');
    }
  });

  // Optionally handle errors
  socket.on('connect_error', () => {
    statusDiv.innerText = "Real-time status unavailable (server offline?)";
  });
});
