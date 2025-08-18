// login.js

document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const emailOrUsername = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const emailError = document.getElementById("loginEmailError");
  const passwordError = document.getElementById("loginPasswordError");

  // Clear previous errors
  emailError.textContent = "";
  passwordError.textContent = "";

  // --- Simple validation ---
  if (!emailOrUsername) {
    emailError.textContent = "Enter your email or username.";
    return;
  }
  if (password.length < 8) {
    passwordError.textContent = "Password must be 8+ characters.";
    return;
  }

  // --- Backend API call for login ---
  try {
    const response = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: emailOrUsername, password }),
    });
    const data = await response.json();

    if (data.token) {
      // Save JWT for API requests
      localStorage.setItem("tindi_jwt", data.token);

      // 1. Save user details from backend if sent (recommended)
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        // Compute initials
        const name = data.user.fullName || data.user.name || data.user.firstName + ' ' + data.user.lastName || emailOrUsername;
        let initials = name.split(" ").map(w => w[0]?.toUpperCase()).join("");
        if (initials.length === 0) {
          initials = emailOrUsername[0]?.toUpperCase() || "U";
        }
        localStorage.setItem("userInitials", initials);
      } else {
        // 2. If backend doesn't send user details, save minimal info
        const fallbackName = emailOrUsername.includes("@") ? emailOrUsername.split("@")[0] : emailOrUsername;
        const fallbackUser = {
          name: fallbackName,
          email: emailOrUsername.includes("@") ? emailOrUsername : "",
          username: emailOrUsername.includes("@") ? "" : emailOrUsername,
          dob: "",
          phone: ""
        };
        localStorage.setItem("user", JSON.stringify(fallbackUser));
        let initials = fallbackName[0]?.toUpperCase() || "U";
        localStorage.setItem("userInitials", initials);
      }

      alert("Login successful!");
      window.location.href = "index.html";
    } else {
      // Show backend error message
      passwordError.textContent = data.error || "Invalid credentials.";
    }
  } catch (err) {
    passwordError.textContent = "Server error. Try again later.";
  }
});
