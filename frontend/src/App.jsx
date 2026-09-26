import { useEffect, useState } from "react";
const ADMIN_PHONE = import.meta.env.VITE_ADMIN_PHONE;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
import "./index.css";

const PRODUCT = {
  name: "GoFit Regular Box",
  price: 89,
  protein: "36g Protein",
};
const ADDONS = {
  yogurt: {
    name: "Greek Yogurt",
    price:50 ,
  },

  chia: {
    name: "Flax / Chia",
    price: 10,
  },
};
const SUBSCRIPTION_PLANS = [
  {
    id: "weekly",
    name: "7 Day Starter",
    duration: "7 Boxes",
    oldPrice: 693,
    price: 599,
    save: 94,
    perBox: "₹85.57 / box",
    icon: "⚡",
    tag: "TRY IT",
    description: "Perfect if you want to start eating clean for a week.",
  },
  {
    id: "monthly",
    name: "Monthly Protein Plan",
    duration: "30 Boxes",
    oldPrice: 2970,
    price: 2599,
    save: 371,
    perBox: "₹79.97 / box",
    icon: "🔥",
    tag: "MOST POPULAR",
    description: "Your everyday high-protein routine at a lower price.",
    popular: true,
  },
  {
    id: "quarterly",
    name: "3 Month Transformation",
    duration: "90 Boxes",
    oldPrice: 8910,
    price: 7599,
    save: 1311,
    perBox: "₹73.40 / box",
    icon: "🏆",
    tag: "BEST VALUE",
    description: "Long-term consistency with the biggest subscription saving.",
  },
];

function PageHeading({
  title,
  subtitle,
  badge,
}) {
  return (
    <div className="page-heading">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <span>{badge}</span>
    </div>
  );
}

function FormTitle({
  icon,
  title,
  subtitle,
}) {
  return (
    <div className="form-title">
      <div className="form-icon">{icon}</div>

      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function BillRow({
  title,
  value,
  green,
}) {
  return (
    <div className="bill-row">
      <span>{title}</span>

      <b className={green ? "green" : ""}>{value}</b>
    </div>
  );
}

function Step({
  title,
  text,
  active,
}) {
  return (
    <div className={active ? "step active" : "step"}>
      <div className="step-dot">{active ? "✓" : ""}</div>

      <div>
        <h4>{title}</h4>
        <p>{text}</p>
      </div>
    </div>
  );
}

function NavButton({
  icon,
  label,
  active,
  onClick,
}) {
  return (
    <button
      className={active ? "nav-button active" : "nav-button"}
      onClick={onClick}
    >
      <span>{icon}</span>

      <small>{label}</small>
    </button>
  );
}

function App() {
  const [page, setPage] = useState("menu");
  // ================================
// USER / ADMIN LOGIN
// ================================

const [user, setUser] = useState(() => {
  try {
    const saved = localStorage.getItem("gofit_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
});

const [loginPhone, setLoginPhone] = useState("");
const [loginPassword, setLoginPassword] = useState("");
// ========================================
// CUSTOMER PROFILE
// ========================================

const [profileName, setProfileName] =
  useState("");

const [profileEmail, setProfileEmail] =
  useState("");

const [profileBio, setProfileBio] =
  useState("");

const [profilePhoto, setProfilePhoto] =
  useState("");

const [profileEmailVerified, setProfileEmailVerified] =
  useState(false);

const [profileLoading, setProfileLoading] =
  useState(false);

const [profileSaving, setProfileSaving] =
  useState(false);

const [otp, setOtp] =
  useState("");

const [otpSent, setOtpSent] =
  useState(false);

const [showOtpBox, setShowOtpBox] =
  useState(false);

const [otpLoading, setOtpLoading] =
  useState(false);

const [photoUploading, setPhotoUploading] =
  useState(false);
// ================================
// ADMIN DASHBOARD
// ================================

const [adminOrders, setAdminOrders] = useState([]);
const [adminLoading, setAdminLoading] = useState(false);
const [adminLastChecked, setAdminLastChecked] = useState(null);
const [adminNotificationCount, setAdminNotificationCount] = useState(0);
const [previousOrderCount, setPreviousOrderCount] = useState(0);
const [selectedPlan, setSelectedPlan] = useState(null);
const [quantity, setQuantity] = useState(1);
const [selectedAddons, setSelectedAddons] = useState([]);
const [loyaltyBoxes, setLoyaltyBoxes] = useState(
  Number(localStorage.getItem("gofit_loyalty_boxes") || 0)
);
const [showLoyalty, setShowLoyalty] = useState(false);

const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
const [location, setLocation] = useState("");
const [locationType, setLocationType] = useState("");

const [locationModal, setLocationModal] = useState(false);
const [locationInput, setLocationInput] = useState("");

const [slot] = useState("Delivery");

const [order, setOrder] = useState(null);

const [message, setMessage] = useState("");

// COD PAYMENT
const [paymentModal, setPaymentModal] = useState(false);
const [paymentProcessing, setPaymentProcessing] = useState(false);

const addonTotal = selectedAddons.reduce(
  (total, addon) =>
    total + ADDONS[addon].price,
  0
);

const subtotal =
  PRODUCT.price * quantity;

const packaging = 10;

const total =
  subtotal +
  addonTotal +
  packaging;
  function toggleAddon(addon) {
  setSelectedAddons((current) => {
    if (current.includes(addon)) {
      return current.filter(
        (item) => item !== addon
      );
    }

    return [...current, addon];
  });
  }
  function openLocationModal(type) {
  setLocationType(type);
  setLocationInput("");
  setLocationModal(true);
}

function saveLocation() {
  if (!locationInput.trim()) {
    showMessage("Please enter your location");
    return;
  }

  setLocation(locationInput.trim());
  setLocationModal(false);

  showMessage("Location added ✓");
} 

// ================================
// LOGIN
// ================================

async function loginUser() {
  const cleanPhone = loginPhone.replace(/\D/g, "");

  if (cleanPhone.length !== 10) {
    alert("Please enter a valid 10-digit phone number.");
    return;
  }

  if (!loginPassword.trim()) {
    alert("Please enter your password.");
    return;
  }

  try {
    setMessage("Logging in...");

    // Use VITE_API_URL if available.
    // Otherwise automatically use the local FastAPI server.
    const API_URL =
      import.meta.env.VITE_API_URL || "http://localhost:8000";

    console.log("LOGIN API:", `${API_URL}/api/auth/login`);
    console.log("LOGIN PHONE:", cleanPhone);

    const response = await fetch(
      `${API_URL}/api/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: cleanPhone,
          password: loginPassword,
        }),
      }
    );

    console.log("LOGIN STATUS:", response.status);

    const data = await response.json();

    console.log("LOGIN RESPONSE:", data);

    if (!response.ok) {
      throw new Error(
        data.detail || "Login failed"
      );
    }

    // Save logged-in user
    if (data.user) {
      localStorage.setItem(
        "gofit_user",
        JSON.stringify(data.user)
      );

      setUser(data.user);
    }
    if (
  loggedUser.role === "customer"
) {

  loadCustomerProfile(
    loggedUser.phone
  );

}

    // Save admin token
    if (data.token) {
      localStorage.setItem(
        "gofit_admin_token",
        data.token
      );
    }

    // ADMIN
    if (data.user?.role === "admin") {
      setMessage("Admin login successful!");

      setTimeout(() => {
        setPage("admin");
      }, 100);

      return;
    }

    // CUSTOMER
    setMessage("Login successful!");

    setTimeout(() => {
      setPage("profile");
    }, 100);

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    setMessage(
      `Login failed: ${error.message}`
    );

    alert(
      `Login failed:\n\n${error.message}`
    );
  }
}
// ========================================
// SAVE CUSTOMER PROFILE
// ========================================

async function saveCustomerProfile() {

  if (!user?.phone) {
    return;
  }

  if (!profileName.trim()) {

    showMessage(
      "Please enter your name"
    );

    return;
  }

  if (!profileEmail.trim()) {

    showMessage(
      "Please enter your email"
    );

    return;
  }

  if (!profileEmailVerified) {

    showMessage(
      "Please verify your email first"
    );

    return;
  }

  try {

    setProfileSaving(true);

    const API_URL =
      import.meta.env.VITE_API_URL ||
      "http://localhost:8000";

    const response = await fetch(
      `${API_URL}/api/profile/${user.phone}`,
      {

        method: "PUT",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({

          name:
            profileName.trim(),

          email:
            profileEmail.trim(),

          bio:
            profileBio.trim()
        })
      }
    );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.detail ||
        "Unable to save profile"
      );
    }

    const updatedUser = {

      ...user,

      name:
        data.name ||
        profileName,

      email:
        data.email ||
        profileEmail,

      bio:
        data.bio ||
        profileBio,

      profile_photo_url:
        data.profile_photo_url ||
        profilePhoto
    };

    localStorage.setItem(
      "gofit_user",
      JSON.stringify(
        updatedUser
      )
    );

    setUser(
      updatedUser
    );

    showMessage(
      "Profile saved ✓"
    );

  } catch (error) {

    console.error(
      "PROFILE SAVE ERROR:",
      error
    );

    showMessage(
      error.message ||
      "Unable to save profile"
    );

  } finally {

    setProfileSaving(false);

  }
}
  
  // ========================================
// SEND EMAIL OTP
// ========================================

async function sendProfileOTP() {

  if (!user?.phone) {
    return;
  }

  if (!profileEmail.trim()) {

    showMessage(
      "Enter your email first"
    );

    return;
  }

  try {

    setOtpLoading(true);

    const API_URL =
      import.meta.env.VITE_API_URL ||
      "http://localhost:8000";

    const response = await fetch(
      `${API_URL}/api/profile/${user.phone}/send-otp`,
      {

        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({

          email:
            profileEmail.trim()
        })
      }
    );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.detail ||
        "Unable to send OTP"
      );
    }

    setOtpSent(true);
    setShowOtpBox(true);

    showMessage(
      "OTP sent to your email ✓"
    );

  } catch (error) {

    console.error(
      "SEND OTP ERROR:",
      error
    );

    showMessage(
      error.message ||
      "Unable to send OTP"
    );

  } finally {

    setOtpLoading(false);

  }
}
  // ========================================
// VERIFY EMAIL OTP
// ========================================

async function verifyProfileOTP() {

  if (!user?.phone) {
    return;
  }

  if (otp.length !== 6) {

    showMessage(
      "Enter the 6-digit OTP"
    );

    return;
  }

  try {

    setOtpLoading(true);

    const API_URL =
      import.meta.env.VITE_API_URL ||
      "http://localhost:8000";

    const response = await fetch(
      `${API_URL}/api/profile/${user.phone}/verify-otp`,
      {

        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({

          email:
            profileEmail.trim(),

          otp:
            otp.trim()
        })
      }
    );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.detail ||
        "Invalid OTP"
      );
    }

    setProfileEmailVerified(
      true
    );

    setShowOtpBox(false);

    setOtp("");

    showMessage(
      "Email verified ✓"
    );

  } catch (error) {

    console.error(
      "VERIFY OTP ERROR:",
      error
    );

    showMessage(
      error.message ||
      "OTP verification failed"
    );

  } finally {

    setOtpLoading(false);

  }
}
  // ========================================
// PROFILE PHOTO UPLOAD
// ========================================

async function uploadProfilePhoto(
  event
) {

  const file =
    event.target.files?.[0];

  if (!file || !user?.phone) {
    return;
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (
    !allowedTypes.includes(
      file.type
    )
  ) {

    showMessage(
      "Use JPG, PNG or WEBP"
    );

    return;
  }

  if (
    file.size >
    5 * 1024 * 1024
  ) {

    showMessage(
      "Image must be under 5MB"
    );

    return;
  }

  try {

    setPhotoUploading(true);

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    const API_URL =
      import.meta.env.VITE_API_URL ||
      "http://localhost:8000";

    const response = await fetch(
      `${API_URL}/api/profile/${user.phone}/photo`,
      {

        method: "POST",

        body: formData
      }
    );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.detail ||
        "Photo upload failed"
      );
    }

    const photoURL =
      data.profile_photo_url;

    setProfilePhoto(
      photoURL
    );

    const updatedUser = {

      ...user,

      profile_photo_url:
        photoURL
    };

    localStorage.setItem(
      "gofit_user",
      JSON.stringify(
        updatedUser
      )
    );

    setUser(
      updatedUser
    );

    showMessage(
      "Profile photo updated ✓"
    );

  } catch (error) {

    console.error(
      "PHOTO UPLOAD ERROR:",
      error
    );

    showMessage(
      error.message ||
      "Unable to upload photo"
    );

  } finally {

    setPhotoUploading(false);

    event.target.value = "";
  }
}
// ========================================
// LOAD CUSTOMER PROFILE
// ========================================

async function loadCustomerProfile(
  phoneNumber
) {

  if (!phoneNumber) {
    return;
  }

  try {

    setProfileLoading(true);

    const API_URL =
      import.meta.env.VITE_API_URL ||
      "http://localhost:8000";

    const response = await fetch(
      `${API_URL}/api/profile/${phoneNumber}`
    );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.detail ||
        "Unable to load profile"
      );
    }

    setProfileName(
      data.name || ""
    );

    setProfileEmail(
      data.email || ""
    );

    setProfileBio(
      data.bio || ""
    );

    setProfilePhoto(
      data.profile_photo_url || ""
    );

    setProfileEmailVerified(
      Boolean(
        data.email_verified
      )
    );

  } catch (error) {

    console.error(
      "PROFILE LOAD ERROR:",
      error
    );

  } finally {

    setProfileLoading(false);

  }
}
  
  
async function updateOrderStatus(orderId, status) {
  const token = localStorage.getItem("gofit_admin_token");

  if (!token) {
    showMessage("Admin session expired");
    return;
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/admin/orders/${orderId}/status?token=${encodeURIComponent(token)}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          status: status,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Unable to update order"
      );
    }

    setAdminOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === data.id
          ? data
          : order
      )
    );

    showMessage(
      `Order updated to ${status.replaceAll("_", " ")} ✓`
    );

  } catch (error) {
    console.error(
      "Update order error:",
      error
    );

    showMessage(
      error.message ||
      "Unable to update order"
    );
  }
}
  async function rejectOrder(orderId) {
  const reason = window.prompt(
    "Reason for rejecting this order:"
  );

  if (reason === null) {
    return;
  }

  const token = localStorage.getItem(
    "gofit_admin_token"
  );

  if (!token) {
    showMessage("Admin session expired");
    return;
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/admin/orders/${orderId}/reject?token=${encodeURIComponent(token)}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          reason:
            reason.trim() ||
            "Rejected by GoFit admin",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Unable to reject order"
      );
    }

    setAdminOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === data.id
          ? data
          : order
      )
    );

    showMessage("Order rejected ✓");

  } catch (error) {
    console.error(
      "Reject order error:",
      error
    );

    showMessage(
      error.message ||
      "Unable to reject order"
    );
  }
  }
  async function cancelOrder(orderId) {
  const reason = window.prompt(
    "Reason for cancelling this order:"
  );

  if (reason === null) {
    return;
  }

  const token = localStorage.getItem(
    "gofit_admin_token"
  );

  if (!token) {
    showMessage("Admin session expired");
    return;
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/admin/orders/${orderId}/cancel?token=${encodeURIComponent(token)}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          reason:
            reason.trim() ||
            "Cancelled by GoFit admin",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Unable to cancel order"
      );
    }

    setAdminOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === data.id
          ? data
          : order
      )
    );

    showMessage("Order cancelled ✓");

  } catch (error) {
    console.error(
      "Cancel order error:",
      error
    );

    showMessage(
      error.message ||
      "Unable to cancel order"
    );
  }
}
// ================================
// LOGOUT
// ================================
function logoutUser() {
  localStorage.removeItem("gofit_user");
  localStorage.removeItem("gofit_admin_token");

  setUser(null);
  setLoginPhone("");
  setLoginPassword("");

  setAdminOrders([]);
  setAdminNotificationCount(0);

  setPage("menu");

  showMessage("Logged out successfully");
}

// ================================
// LOAD ALL ORDERS FOR ADMIN
// ================================
async function loadAdminOrders(showLoader = true) {
  if (user?.role !== "admin") {
    return;
  }

  const token = localStorage.getItem("gofit_admin_token");

  if (!token) {
    showMessage("Admin session expired");
    setPage("profile");
    return;
  }

  if (showLoader) {
    setAdminLoading(true);
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/admin/orders?token=${encodeURIComponent(token)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Unable to load orders"
      );
    }

    setAdminOrders(data.orders || []);
    setAdminLastChecked(new Date());

  } catch (error) {
    console.error("Admin orders error:", error);

    showMessage(
      error.message || "Unable to load orders"
    );

  } finally {
    setAdminLoading(false);
  }
}
// ================================
// ENABLE NOTIFICATIONS
// ================================

async function enableAdminNotifications() {
  if (!("Notification" in window)) {
    showMessage(
      "This browser does not support notifications"
    );
    return;
  }

  try {
    const permission =
      await Notification.requestPermission();

    if (permission === "granted") {
      showMessage(
        "Admin notifications enabled ✓"
      );
    } else {
      showMessage(
        "Notification permission was not granted"
      );
    }
  } catch {
    showMessage(
      "Could not enable notifications"
    );
  }
}
  function showMessage(text) {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 2200);
  }

  function addToCart() {
    setPage("cart");
    showMessage("Regular Box added to cart");
  }

  function increaseQuantity() {
    setQuantity((q) => Math.min(q + 1, 10));
  }

  function decreaseQuantity() {
    setQuantity((q) => Math.max(q - 1, 1));
  }
function addLoyaltyBoxes(quantityBought) {
  setLoyaltyBoxes((current) => {
    const updated = Math.min(current + quantityBought, 10);

    localStorage.setItem(
      "gofit_loyalty_boxes",
      updated
    );

    return updated;
  });
}
async function placeCODOrder() {
    setPaymentProcessing(true);

    try {
        const response = await fetch(
            "http://localhost:8000/api/orders",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customer_name: name,
                    phone: phone,
                    pickup_location: location,
                    pickup_slot: slot,

                    quantity: quantity,

                    product_name: PRODUCT.name,
                    unit_price: PRODUCT.price,

                    addons: selectedAddons.map((addon) => ({
                        name: ADDONS[addon].name,
                        price: ADDONS[addon].price,
                    })),

                    addon_total: addonTotal,
                    packaging_fee: packaging,
                    delivery_fee: 0,

                    total_amount: total,

                    payment_method: "COD",
                    payment_status: "pending",
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail || "Order failed"
            );
        }

        setOrder(data);

        addLoyaltyBoxes(quantity);

        setPaymentModal(false);
        setPaymentProcessing(false);

        setPage("track");

        showMessage(
            "COD order sent to GoFit kitchen ✓"
        );

    } catch (error) {

        console.error(error);

        setPaymentProcessing(false);

        showMessage(
            error.message || "Could not place order"
        );
    }
}
  const loyaltyProgress =
  Math.min(loyaltyBoxes, 10) * 10;

const freeBoxUnlocked =
  loyaltyBoxes >= 10;
  async function placeOrder() {
    if (!name.trim()) {
      showMessage("Please enter your name");
      return;
    }
if (!location.trim()) {
  showMessage("Please select a delivery location");
  return;
}
    if (!phone.trim() || phone.length < 10) {
      showMessage("Enter a valid phone number");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: name,
          phone,
          pickup_location: location,
          pickup_slot: slot,
          quantity,
          product_name: PRODUCT.name,
          unit_price: PRODUCT.price,
          addons: selectedAddons.map((addon) => ({
            name: ADDONS[addon].name,
            price: ADDONS[addon].price,
          })),
          addon_total: addonTotal,
          packaging_fee: packaging,
          delivery_fee: 0,
          total_amount: total,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Order failed");
      }

setOrder(data);

addLoyaltyBoxes(quantity);

setPage("track");

showMessage("Order sent to GoFit kitchen ✓");
    } catch (error) {
      showMessage(error.message);
    }
  }

useEffect(() => {
  if (user?.role !== "admin") {
    return;
  }

  loadAdminOrders();

  const apiUrl = import.meta.env.VITE_API_URL;

  const api = new URL(apiUrl);

  const protocol =
    api.protocol === "https:"
      ? "wss:"
      : "ws:";

  const socket = new WebSocket(
    `${protocol}//${api.host}/ws/admin`
  );

  socket.onopen = () => {
    console.log(
      "GoFit admin realtime connected"
    );

    const token = localStorage.getItem(
      "gofit_admin_token"
    );

    socket.send(
      JSON.stringify({
        token: token,
      })
    );
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(
        event.data
      );

      console.log(
        "Admin realtime:",
        data
      );

      if (data.type === "new_order") {
        setAdminOrders((current) => [
          data.order,
          ...current,
        ]);

        setAdminNotificationCount(
          (current) => current + 1
        );

        showAdminNotification(1);
      }

      if (
        data.type === "order_updated" ||
        data.type === "order_cancelled" ||
        data.type === "order_rejected"
      ) {
        setAdminOrders((current) =>
          current.map((order) =>
            order.id === data.order.id
              ? data.order
              : order
          )
        );
      }

    } catch (error) {
      console.error(
        "Realtime message error:",
        error
      );
    }
  };

  socket.onerror = (error) => {
    console.error(
      "GoFit realtime error:",
      error
    );
  };

  socket.onclose = () => {
    console.log(
      "GoFit admin realtime disconnected"
    );
  };

  return () => {
    socket.close();
  };

}, [user]);
  useEffect(() => {
    if (!order?.id) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/orders/${order.id}`
        );

        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        }
      } catch {
        // backend temporarily unavailable
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [order]);

  return (
    <div className="app-shell">

      {/* PHONE */}

      <div className="phone">
        {/* HEADER */}
<header className="header">

  <div className="header-left">

    <div className="brand-logo">
      <img
        src="/gofit-logo.jpg"
        alt="GoFit"
      />
    </div>

    <div className="brand-text">
      <h1>
        GoFit <span>Protein</span>
      </h1>

      <p>
        100% High Protein Boxes
      </p>
    </div>

  </div>

  <button
    type="button"
    className="loyalty-mini"
    onClick={() => setShowLoyalty(true)}
  >

  <div className="loyalty-mini-top">

    <span>🎁</span>

    <div>
      <strong>
        {freeBoxUnlocked
          ? "FREE BOX!"
          : `${loyaltyBoxes}/10 BOXES`}
      </strong>

      <small>
        {freeBoxUnlocked
          ? "Reward unlocked 🎉"
          : `${10 - loyaltyBoxes} more for free`}
      </small>
    </div>

  </div>

  <div className="loyalty-progress">

    <div
      className="loyalty-progress-fill"
      style={{
        width: `${loyaltyProgress}%`
      }}
    />

  </div>

</button>
<button
  type="button"
  className="profile-button"
  onClick={() => setPage("profile")}
  aria-label={
    user?.role === "admin"
      ? "Admin profile"
      : "User profile"
  }
>
  {user?.profile_photo_url ? (
    <img
      src={user.profile_photo_url}
      alt="Profile"
      className="header-profile-image"
    />
  ) : user?.role === "admin" ? (
    "🛡️"
  ) : (
    "👤"
  )}
</button>
        </header>
        {/* MAIN */}

        <main className="content">


          {/* ==========================================
    PROFILE
========================================== */}

{page === "profile" && (
  <>
    {!user ? (
      <form
        className="profile-login"
        onSubmit={(e) => {
          e.preventDefault();
          loginUser();
        }}
      >
        <div className="profile-login-icon">
          👤
        </div>

        <h2>GoFit Account</h2>

        <p>
          Login to manage your GoFit account.
        </p>

        <input
          type="tel"
          value={loginPhone}
          onChange={(e) =>
            setLoginPhone(
              e.target.value
                .replace(/\D/g, "")
                .slice(0, 10)
            )
          }
          placeholder="10-digit phone number"
          autoComplete="username"
          inputMode="numeric"
        />

        <input
          type="password"
          value={loginPassword}
          onChange={(e) =>
            setLoginPassword(e.target.value)
          }
          placeholder="Password"
          autoComplete="current-password"
        />

        <button
          type="submit"
          className="profile-login-button"
        >
          Login →
        </button>
      </form>
    ) : user.role === "admin" ? (
      <section className="admin-profile">
        <div className="admin-profile-header">
          <div className="admin-avatar">
            🛡️
          </div>

          <div>
            <small>
              ADMIN ACCOUNT
            </small>

            <h2>
              GoFit Admin
            </h2>

            <p>
              {user.phone}
            </p>
          </div>
        </div>

        <div className="admin-access-badge">
          🔐 Full Admin Access
        </div>

        <button
          type="button"
          className="admin-dashboard-button"
          onClick={() => {
            setPage("admin");
          }}
        >
          📊 Open Admin Dashboard
        </button>

        <button
          type="button"
          className="admin-notification-button"
          onClick={enableAdminNotifications}
        >
          🔔 Enable Order Notifications
        </button>

        <button
          type="button"
          className="logout-button"
          onClick={logoutUser}
        >
          Logout
        </button>
      </section>
    ) : (
      <section className="customer-profile">
        <div className="customer-profile-title">
          <small>
            GOFIT ACCOUNT
          </small>

          <h2>
            My Profile
          </h2>

          <p>
            Manage your GoFit account
          </p>
        </div>

        <div className="profile-photo-section">
          <label
            className="
              customer-avatar
              profile-avatar-clickable
            "
            title="Change profile photo"
          >
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Profile"
                className="customer-avatar-image"
              />
            ) : (
              <span>
                👤
              </span>
            )}

            <input
              type="file"
              accept="
                image/jpeg,
                image/png,
                image/webp
              "
              onChange={uploadProfilePhoto}
              hidden
            />

            <div className="profile-photo-camera">
              📷
            </div>
          </label>

          <strong>
            {photoUploading
              ? "Uploading..."
              : "Tap photo to change"}
          </strong>

          <small>
            JPG, PNG or WEBP · Max 5MB
          </small>
        </div>

        <div className="profile-phone-card">
          <span>
            📱
          </span>

          <div>
            <small>
              PHONE NUMBER
            </small>

            <strong>
              {user.phone}
            </strong>
          </div>

          <span className="verified-small">
            ✓
          </span>
        </div>

        <div className="profile-edit-field">
          <label>
            Full Name
          </label>

          <input
            type="text"
            value={profileName}
            onChange={(e) =>
              setProfileName(
                e.target.value
              )
            }
            placeholder="Enter your full name"
          />

  </div>


  {/* EMAIL */}

  <div className="profile-edit-field">

    <label>
      Email Address
    </label>

    <div className="email-input-row">

      <input
        type="email"
        value={profileEmail}
        onChange={(e) => {

          setProfileEmail(
            e.target.value
          );

          setProfileEmailVerified(
            false
          );

          setOtpSent(false);

          setShowOtpBox(false);

        }}
        placeholder="yourname@gmail.com"
      />

      {profileEmailVerified && (

        <span className="email-verified">
          ✓
        </span>

      )}

    </div>

    {!profileEmailVerified && (

      <button
        type="button"
        className="verify-email-button"
        onClick={
          sendProfileOTP
        }
        disabled={
          otpLoading ||
          !profileEmail.trim()
        }
      >

        {otpLoading
          ? "Sending..."
          : "Send OTP"}

      </button>

    )}

  </div>


  {/* OTP */}

  {showOtpBox && (

    <div className="otp-card">

      <div className="otp-card-header">

        <span>
          🔐
        </span>

        <div>

          <strong>
            Verify your email
          </strong>

          <small>
            Enter the 6-digit OTP
            sent to {profileEmail}
          </small>

        </div>

      </div>

      <input
        className="otp-input"
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={otp}
        onChange={(e) =>
          setOtp(
            e.target.value
              .replace(/\D/g, "")
              .slice(0, 6)
          )
        }
        placeholder="000000"
      />

      <button
        type="button"
        className="verify-otp-button"
        onClick={
          verifyProfileOTP
        }
        disabled={
          otpLoading ||
          otp.length !== 6
        }
      >

        {otpLoading
          ? "Verifying..."
          : "Verify Email"}

      </button>

      <button
        type="button"
        className="resend-otp-button"
        onClick={
          sendProfileOTP
        }
        disabled={otpLoading}
      >
        Resend OTP
      </button>

    </div>

  )}


  {/* BIO */}

  <div className="profile-edit-field">

    <label>
      About You
    </label>

    <textarea
      value={profileBio}
      onChange={(e) =>
        setProfileBio(
          e.target.value
        )
      }
      placeholder="Tell us a little about yourself..."
      maxLength={250}
      rows={4}
    />

    <small className="bio-count">
      {profileBio.length}/250
    </small>

  </div>


  {/* STATS */}

  <div className="profile-stat-grid">

    <div>

      <strong>
        {loyaltyBoxes}
      </strong>

      <small>
        Boxes
      </small>

    </div>

    <div>

      <strong>
        32g
      </strong>

      <small>
        Protein
      </small>

    </div>

    <div>

      <strong>
        ₹89
      </strong>

      <small>
        Regular
      </small>

    </div>

  </div>


  {/* SAVE */}

  <button
    type="button"
    className="save-profile-button"
    onClick={
      saveCustomerProfile
    }
    disabled={
      profileSaving ||
      !profileEmailVerified
    }
  >

    {profileSaving
      ? "Saving..."
      : "Save Profile →"}

  </button>


  {/* LOGOUT */}

  <button
    type="button"
    className="logout-button"
    onClick={logoutUser}
  >
    Logout
  </button>

</section>
    )}
  </>
)}
          {/* ==========================================
    ADMIN DASHBOARD
========================================== */}

{page === "admin" && user?.role === "admin" && (
  <section className="admin-dashboard">

    {/* HEADER */}

    <div className="admin-dashboard-header">

      <div>
        <small>
          GOFIT ADMIN
        </small>

        <h2>
          Order Dashboard
        </h2>

        <p>
          Manage all GoFit orders
        </p>
      </div>

      <div className="admin-shield">
        🛡️
      </div>

    </div>


    {/* NOTIFICATION */}

    <div className="admin-notification-card">

      <div className="notification-icon">
        🔔
      </div>

      <div>
        <strong>
          New Order Alerts
        </strong>

        <p>
          {adminNotificationCount > 0
            ? `${adminNotificationCount} new order${
                adminNotificationCount > 1
                  ? "s"
                  : ""
              }`
            : "No new orders"}
        </p>
      </div>

      <button
        type="button"
        onClick={enableAdminNotifications}
      >
        Enable
      </button>

    </div>


    {/* STATISTICS */}

    <div className="admin-stats">

      <div className="admin-stat-card">

        <span>
          📦
        </span>

        <strong>
          {adminOrders.length}
        </strong>

        <small>
          Total Orders
        </small>

      </div>


      <div className="admin-stat-card">

        <span>
          🥗
        </span>

        <strong>
          {adminOrders.reduce(
            (total, order) =>
              total +
              Number(order.quantity || 0),
            0
          )}
        </strong>

        <small>
          Boxes Sold
        </small>

      </div>


      <div className="admin-stat-card">

        <span>
          ₹
        </span>

        <strong>
          ₹
          {adminOrders.reduce(
            (total, order) =>
              total +
              Number(
                order.total_amount || 0
              ),
            0
          )}
        </strong>

        <small>
          Revenue
        </small>

      </div>

    </div>


    {/* ORDER HISTORY */}

    <div className="admin-orders-section">

      <div className="admin-section-title">

        <div>
          <small>
            LIVE ORDERS
          </small>

          <h3>
            Order History
          </h3>
        </div>

        <button
          type="button"
          onClick={() => loadAdminOrders()}
        >
          ↻
        </button>

      </div>


      {adminLoading ? (

        <div className="admin-empty">
          <div className="admin-loading">
            ⟳
          </div>

          <p>
            Loading orders...
          </p>
        </div>

      ) : adminOrders.length === 0 ? (

        <div className="admin-empty">

          <div>
            📦
          </div>

          <h3>
            No Orders Yet
          </h3>

          <p>
            New GoFit orders will appear here.
          </p>

        </div>

      ) : (

        <div className="admin-order-list">

          {[...adminOrders]
            .reverse()
            .map((order, index) => (

              <article
                className="admin-order-card"
                key={
                  order.id ||
                  order.order_id ||
                  index
                }
              >

                {/* ORDER TOP */}

                <div className="admin-order-top">

                  <div>

                    <small>
                      ORDER #
                      {order.id ||
                        order.order_id ||
                        index + 1}
                    </small>

                    <h3>
                      {order.customer_name ||
                        "Customer"}
                    </h3>

                  </div>

                  <strong>
                    ₹
                    {Number(
                      order.total_amount || 0
                    )}
                  </strong>

                </div>


                {/* CUSTOMER */}

                <div className="admin-order-info">

                  <div>
                    <span>
                      📱
                    </span>

                    <p>
                      {order.phone ||
                        "No phone"}
                    </p>
                  </div>


                  <div>
                    <span>
                      📦
                    </span>

                    <p>
                      {order.quantity || 0} Box
                      {(Number(
                        order.quantity || 0
                      ) !== 1)
                        ? "es"
                        : ""}
                    </p>
                  </div>


                  <div>
                    <span>
                      📍
                    </span>

                    <p>
                      {order.pickup_location ||
                        "Location not provided"}
                    </p>
                  </div>


                  <div>
                    <span>
                      💳
                    </span>

                    <p>
                      {order.payment_method ||
                        "COD"}
                    </p>
                  </div>

                </div>


                {/* ADDONS */}

                {Array.isArray(
                  order.addons
                ) &&
                  order.addons.length > 0 && (

                    <div className="admin-addons">

                      <small>
                        ADD-ONS
                      </small>

                      <p>
                        {order.addons
                          .map(
                            (addon) =>
                              addon.name
                          )
                          .join(", ")}
                      </p>

                    </div>

                  )}


                {/* STATUS */}

                <div className="admin-order-bottom">
<div className="admin-order-actions">

  <button
    onClick={() =>
      updateOrderStatus(
        order.id,
        "confirmed"
      )
    }
  >
    ✓ Confirm
  </button>

  <button
    onClick={() =>
      updateOrderStatus(
        order.id,
        "preparing"
      )
    }
  >
    👨‍🍳 Preparing
  </button>

  <button
    onClick={() =>
      updateOrderStatus(
        order.id,
        "ready"
      )
    }
  >
    🍱 Ready
  </button>

  <button
    onClick={() =>
      updateOrderStatus(
        order.id,
        "out_for_delivery"
      )
    }
  >
    🚚 Delivery
  </button>

  <button
    onClick={() =>
      updateOrderStatus(
        order.id,
        "completed"
      )
    }
  >
    ✓ Completed
  </button>

  <button
    className="reject-order"
    onClick={() =>
      rejectOrder(order.id)
    }
  >
    ✕ Reject
  </button>

  <button
    className="cancel-order"
    onClick={() =>
      cancelOrder(order.id)
    }
  >
    🗑 Cancel
  </button>

</div>
                  <span
                    className={`order-status ${
                      order.status ||
                      order.order_status ||
                      "new"
                    }`}
                  >
                    {String(
                      order.status ||
                        order.order_status ||
                        "new"
                    ).toUpperCase()}
                  </span>

                  <small>
                    {order.created_at
                      ? new Date(
                          order.created_at
                        ).toLocaleString()
                      : "Recent order"}
                  </small>

                </div>

              </article>

            ))}

        </div>

      )}

    </div>


    {/* BACK */}

    <button
      type="button"
      className="admin-back-button"
      onClick={() => setPage("profile")}
    >
      ← Back to Admin Profile
    </button>

  </section>
)}

{/* SUBSCRIPTIONS */}

{page === "subscriptions" && (
  <>
    <section className="subscription-hero">
      <div>
        <span className="subscription-kicker">
          GOFIT MEMBERSHIP
        </span>

        <h2>
          Eat Protein.<br />
          <span>Save More.</span>
        </h2>

        <p>
          Subscribe to GoFit Regular Boxes and make
          your daily protein routine easier and cheaper.
        </p>
      </div>

      <div className="subscription-hero-icon">
        🥗
      </div>
    </section>

    <div className="subscription-offer">
      <div className="offer-icon">🎁</div>

      <div>
        <strong>Subscription Perks</strong>
        <p>
          Save on every box + FREE delivery
        </p>
      </div>
    </div>

    <section className="subscription-plans">

      <div className="subscription-section-title">
        <div>
          <small>CHOOSE YOUR PLAN</small>
          <h3>Build Your Routine</h3>
        </div>

        <span>36g Protein / Box</span>
      </div>

      {SUBSCRIPTION_PLANS.map((plan) => (
        <article
          key={plan.id}
          className={`subscription-card ${
            plan.popular ? "subscription-popular" : ""
          }`}
        >

          {plan.popular && (
            <div className="popular-ribbon">
              MOST POPULAR
            </div>
          )}

          <div className="subscription-card-top">

            <div className="subscription-plan-icon">
              {plan.icon}
            </div>

            <div>
              <small>{plan.tag}</small>

              <h3>
                {plan.name}
              </h3>

              <p>
                {plan.duration}
              </p>
            </div>

          </div>

          <p className="subscription-description">
            {plan.description}
          </p>

          <div className="subscription-price">

            <div>
              <span className="old-price">
                ₹{plan.oldPrice}
              </span>

              <strong>
                ₹{plan.price}
              </strong>
            </div>

            <span className="save-badge">
              SAVE ₹{plan.save}
            </span>

          </div>

          <div className="per-box">
            {plan.perBox}
          </div>

          <div className="subscription-features">

            <span>✓ 36g protein every box</span>
            <span>✓ Free delivery</span>
            <span>✓ Flexible delivery location</span>
            <span>✓ Add-ons available</span>

          </div>

          <button
            className="subscribe-button"
            onClick={() => {
              setSelectedPlan(plan);
              showMessage(
                `${plan.name} selected ✓`
              );
            }}
          >
            Subscribe Now →
          </button>

        </article>
      ))}

    </section>

    {/* SPECIAL DISCOUNTS */}

    <section className="special-discounts">

      <div className="discount-heading">
        <small>SPECIAL GOFIT OFFERS</small>
        <h3>Made For Your Routine</h3>
      </div>

      <div className="discount-grid">

        <div className="discount-card student-discount">

          <div className="discount-icon">
            🎓
          </div>

          <div>
            <strong>
              Student Discount
            </strong>

            <p>
              Extra <b>5% OFF</b> for students
              with a valid student ID.
            </p>
          </div>

          <span>
            STUDENT
          </span>

        </div>

        <div className="discount-card office-discount">

          <div className="discount-icon">
            💼
          </div>

          <div>
            <strong>
              Office Plans
            </strong>

            <p>
              Special group pricing for
              <b> 5+ office subscriptions.</b>
            </p>
          </div>

          <span>
            OFFICE
          </span>

        </div>

      </div>

    </section>

    {/* WHY SUBSCRIBE */}

    <section className="subscription-benefits">

      <h3>
        Why Subscribe?
      </h3>

      <div className="benefit-row">

        <div>
          <span>💰</span>
          <strong>Save More</strong>
          <small>
            Lower price per box
          </small>
        </div>

        <div>
          <span>🥗</span>
          <strong>Eat Better</strong>
          <small>
            36g protein every box
          </small>
        </div>

        <div>
          <span>📦</span>
          <strong>Stay Consistent</strong>
          <small>
            No daily ordering
          </small>
        </div>

      </div>

    </section>

    <div className="subscription-note">
      🎁 Buy 10 paid GoFit boxes and unlock your
      <strong> next Regular Box FREE.</strong>
    </div>

  </>
)}
          {/* MENU */}

          {page === "menu" && (
            <>
              <section className="menu-heading">
                <div>
                  <h2>GoFit Regular Box</h2>
                  <p>Fresh. Simple. High Protein.</p>
                </div>

                <span className="protein-badge">
                  {PRODUCT.protein}
                </span>
              </section>

              <section className="product-card">
                <div className="food-photo">
                  <video
                    src="/gofit-box.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                  />

                  <span>HIGH PROTEIN</span>
                </div>

                <div className="product-info">
                  <div className="product-top">
                    <div>
                      <small>GOFIT ORIGINAL</small>
                      <h3>Regular Box</h3>
                    </div>

                    <strong>₹89</strong>
                  </div>

                  <div className="tags">
                    <span>🥣 Protein Oats</span>
                    <span>🌱 Sprouts</span>
                    <span>🥜 Nuts</span>
                    <span>🍌 Fruit</span>
                  </div>
                  <button
  className="add-button"
  onClick={addToCart}
>
  Add Regular Box
  <span>+</span>
                  </button>
                  <section className="custom-card">

  <div className="section-heading">

    <div>
      <h3>☷ GoFit Regular Box</h3>

      <p>
        Make your box your way
      </p>
    </div>

    <span>
      36g Protein
    </span>

  </div>


  <label>
    INCLUDED IN YOUR BOX
  </label>

  <div className="included-grid">

    <div className="included-item">
      🥣 <span>Protein Oats</span>
    </div>

    <div className="included-item">
      🌱 <span>Sprouts</span>
    </div>

    <div className="included-item">
      🥒 <span>Cucumber</span>
    </div>

    <div className="included-item">
      🥜 <span>Roasted Chana</span>
    </div>

    <div className="included-item">
      🥜 <span>Peanuts</span>
    </div>

    <div className="included-item">
      🍎 <span>Fresh Fruits</span>
    </div>

    <div className="included-item">
      🥜 <span>Peanut Butter</span>
    </div>
    <div className="included-item">
    <span>🌰</span>
    <span>Dry Fruits </span>
</div>
  </div>


  <label>
    OPTIONAL ADD-ONS
  </label>

  <div className="addon-row">

    <button
      className={
        selectedAddons.includes("yogurt")
          ? "addon selected-addon"
          : "addon"
      }

      onClick={() =>
        toggleAddon("yogurt")
      }
    >
      <span>
        🥛 Greek Yogurt
      </span>

      {selectedAddons.includes("yogurt") && (
        <b>✓</b>
      )}
    </button>


    <button
      className={
        selectedAddons.includes("chia")
          ? "addon selected-addon"
          : "addon"
      }

      onClick={() =>
        toggleAddon("chia")
      }
    >
      <span>
        🌱 Flax / Chia
      </span>

      {selectedAddons.includes("chia") && (
        <b>✓</b>
      )}
    </button>

  </div>

</section>

                </div>
              </section>
            </>
          )}

          {/* CART */}

          {page === "cart" && (
            <>
              <PageHeading
                title="Your Meal Order"
                subtitle="Review your GoFit box"
                badge={`${quantity} Item${quantity > 1 ? "s" : ""}`}
              />

              <section className="cart-card">
                <div className="cart-product">
                  <div className="cart-product-info">
                    <small>GOFIT ORIGINAL</small>
                    <h3>GoFit Regular Box</h3>
                    <p>Your regular GoFit protein box</p>
                  </div>

                  <strong>₹{PRODUCT.price * quantity}</strong>
                </div>

                <div className="cart-quantity">
                  <span>Quantity</span>

                  <div>
                    <button onClick={decreaseQuantity}>−</button>
                    <b>{quantity}</b>
                    <button onClick={increaseQuantity}>+</button>
                  </div>
                </div>

                {selectedAddons.length > 0 && (
                  <div className="cart-addons">
                    <small>ADD-ONS</small>

                    {selectedAddons.map((addon) => (
                      <div className="cart-addon" key={addon}>
                        <span>{ADDONS[addon].name}</span>
                        <strong>₹{ADDONS[addon].price}</strong>
                      </div>
                    ))}
                  </div>
                )}

<section className="form-card location-card">

  <div className="location-header">

    <div className="location-icon">
      📍
    </div>

    <div>
      <h3>Delivery Location</h3>
      <p>Choose where you want your GoFit box</p>
    </div>

  </div>


  <div className="location-options">

    {/* LIVE LOCATION */}

    <button
      type="button"
      className={
        locationType === "live"
          ? "location-option selected-location"
          : "location-option"
      }
      onClick={() => {

        if (!navigator.geolocation) {
          showMessage("Location is not supported");
          return;
        }

        showMessage("Getting your location...");

        navigator.geolocation.getCurrentPosition(

          (position) => {

            const lat =
              position.coords.latitude;

            const lng =
              position.coords.longitude;

            setLocationType("live");

            setLocation(
              `Live Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`
            );

            showMessage("Live location selected ✓");
          },

          () => {
            showMessage(
              "Please allow location access"
            );
          },

          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }

        );

      }}
    >

      <span>📍</span>

      <div>
        <strong>Live Location</strong>
        <small>Use my current location</small>
      </div>

      {locationType === "live" && (
        <b>✓</b>
      )}

    </button>


    {/* ADD YOUR LOCATION */}

    <button
      type="button"
      className={
        locationType === "add"
          ? "location-option selected-location"
          : "location-option"
      }
     onClick={() => openLocationModal("add")}
    >

      <span>🗺️</span>

      <div>
        <strong>Add Your Location</strong>
        <small>Enter your delivery address</small>
      </div>

      {locationType === "add" && (
        <b>✓</b>
      )}

    </button>


    {/* OTHER */}

    <button
      type="button"
      className={
        locationType === "other"
          ? "location-option selected-location"
          : "location-option"
      }
onClick={() => openLocationModal("other")}
    >

      <span>📌</span>

      <div>
        <strong>Other</strong>
        <small>Enter another delivery point</small>
      </div>

      {locationType === "other" && (
        <b>✓</b>
      )}

    </button>

  </div>

</section>

                <section className="form-card">
                  <FormTitle
                    icon="👤"
                    title="CUSTOMER DETAILS"
                    subtitle="Used for your order"
                  />

                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />

                  <input
                    value={phone}
                    onChange={(e) =>
                      setPhone(
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    placeholder="10-digit phone number"
                    type="tel"
                  />
                </section>

                <section className="bill">
                  <BillRow
                    title="Regular Box"
                    value={`₹${PRODUCT.price * quantity}`}
                  />

                  {selectedAddons.length > 0 && (
                    <>
                      {selectedAddons.map((addon) => (
                        <BillRow
                          key={addon}
                          title={ADDONS[addon].name}
                          value={`₹${ADDONS[addon].price}`}
                        />
                      ))}
                    </>
                  )}

                  <BillRow title="Packaging & Eco-Box" value="₹10" />
                  <BillRow title="Delivery" value="FREE" green />

                  <div className="line"></div>

                  <div className="total">
                    <span>To Pay</span>
                    <strong>₹{total}</strong>
                  </div>
                </section>

<button
    type="button"
    className="confirm"
    onClick={() => setPaymentModal(true)}
>
    ➤ &nbsp; Confirm & Send Order to Kitchen
</button>
              </section>
            </>
          )}

          {/* TRACK */}

          {page === "track" && (
            <>
              <PageHeading
                title="Active Order Tracker"
                subtitle="Follow your GoFit meal"
                badge={order ? order.status : "No Active Order"}
              />

              {!order ? (
                <section className="empty-order">
                  <div className="empty-icon">🍴</div>

                  <h3>No Active Meals Pending</h3>

                  <p>
                    Order a fresh GoFit protein box to see real-time updates here!
                  </p>

                  <button onClick={() => setPage("menu")}>Order Now</button>
                </section>
              ) : (
                <>
                  <section className="active-order">
                    <div>
                      <small>CURRENT ORDER</small>
                      <h3>GoFit Regular Box</h3>
                    </div>

                    <strong>₹{order.total_amount}</strong>
                  </section>

                  <div className="order-location">
                    📍 {order.pickup_location}
                    <br />
                    ⏱ {order.pickup_slot}
                  </div>

                  <section className="timeline">
                    <Step
                      title="Order Received"
                      text="Your order has been received"
                      active
                    />

                    <Step
                      title="Preparing"
                      text="GoFit kitchen is preparing your meal"
                      active={
                        order.status === "preparing" ||
                        order.status === "ready" ||
                        order.status === "completed"
                      }
                    />

                    <Step
                      title="Ready for Pickup"
                      text="Your meal is ready"
                      active={
                        order.status === "ready" ||
                        order.status === "completed"
                      }
                    />

                    <Step
                      title="Completed"
                      text="Enjoy your GoFit meal!"
                      active={order.status === "completed"}
                    />
                  </section>
                </>
              )}
            </>
          )}
        </main>


        {/* NAVIGATION */}
        {paymentModal && (
    <div
        className="payment-modal-overlay"
        onClick={() => !paymentProcessing && setPaymentModal(false)}
    >
        <div
            className="payment-modal"
            onClick={(e) => e.stopPropagation()}
        >

            <button
                type="button"
                className="payment-modal-close"
                onClick={() => setPaymentModal(false)}
            >
                ×
            </button>

            <div className="payment-icon">
                💵
            </div>

            <h2>Cash on Delivery</h2>

            <p className="payment-subtitle">
                Pay for your GoFit order when your box is delivered.
            </p>

            <div className="payment-total">
                <span>Order Total</span>
                <strong>₹{total}</strong>
            </div>

            <div className="cod-info">
                <span>✓</span>

                <div>
                    <strong>Pay when you receive</strong>
                    <small>
                        Keep ₹{total} ready at the time of delivery.
                    </small>
                </div>
            </div>

            <button
                type="button"
                className="payment-continue"
                onClick={placeCODOrder}
                disabled={paymentProcessing}
            >
                {paymentProcessing
                    ? "Sending Order..."
                    : `Confirm COD Order • ₹${total}`}
            </button>

        </div>
    </div>
)}
        {showLoyalty && (
  <div
    className="loyalty-modal-overlay"
    onClick={() => setShowLoyalty(false)}
  >

    <div
      className="loyalty-modal"
      onClick={(e) => e.stopPropagation()}
    >

      {/* CLOSE */}

      <button
        type="button"
        className="loyalty-modal-close"
        onClick={() => setShowLoyalty(false)}
      >
        ×
      </button>


      {/* ICON */}

      <div className="loyalty-modal-icon">
        🎁
      </div>


      {/* TITLE */}

      <h2>
        GoFit Rewards
      </h2>

      <p className="loyalty-modal-subtitle">
        Buy 10 GoFit boxes and get your
        next GoFit Regular Box FREE.
      </p>


      {/* PROGRESS */}

      <div className="loyalty-big-progress">

        <div className="loyalty-progress-header">

          <strong>
            {loyaltyBoxes}/10 Boxes
          </strong>

          <span>
            {freeBoxUnlocked
              ? "100%"
              : `${loyaltyProgress}%`}
          </span>

        </div>

        <div className="loyalty-big-bar">

          <div
            className="loyalty-big-fill"
            style={{
              width: `${loyaltyProgress}%`
            }}
          />

        </div>

      </div>


      {/* STATUS */}

      <div className="loyalty-status">

        <span>🎯</span>

        <div>

          <strong>
            {freeBoxUnlocked
              ? "Reward Unlocked!"
              : `${10 - loyaltyBoxes} boxes to go`}
          </strong>

          <small>
            {freeBoxUnlocked
              ? "Your free GoFit box is ready to claim."
              : "Every paid GoFit box moves you closer."}
          </small>

        </div>

      </div>


      {/* HOW IT WORKS */}

      <div className="loyalty-how">

        <h3>
          How it works
        </h3>


        <div className="loyalty-step">

          <span>1</span>

          <div>
            <strong>Order a GoFit Box</strong>
            <small>
              Every paid Regular Box counts as 1 reward.
            </small>
          </div>

        </div>


        <div className="loyalty-step">

          <span>2</span>

          <div>
            <strong>Collect 10 Boxes</strong>
            <small>
              Your progress is automatically saved.
            </small>
          </div>

        </div>


        <div className="loyalty-step">

          <span>3</span>

          <div>
            <strong>Get 1 Free Box 🎉</strong>
            <small>
              Once you reach 10, your free reward unlocks.
            </small>
          </div>

        </div>

      </div>


      {/* RULES */}

      <div className="loyalty-rules">

        <h3>
          Reward Rules
        </h3>

        <p>✓ Only paid GoFit boxes count.</p>

        <p>✓ Multiple boxes in one order count individually.</p>

        <p>✓ Add-ons do not count as boxes.</p>

        <p>✓ Reach 10 boxes to unlock 1 free box.</p>

      </div>


      {/* CLAIM */}

      {freeBoxUnlocked && (
        <button
          type="button"
          className="claim-reward"
          onClick={() => {
            setLoyaltyBoxes(0);

            localStorage.setItem(
              "gofit_loyalty_boxes",
              "0"
            );

            setShowLoyalty(false);

            showMessage(
              "Free GoFit Box claimed 🎉"
            );
          }}
        >
          🎁 Claim Free Box
        </button>
      )}

    </div>

  </div>
)}
{/* LOCATION MODAL */}

{locationModal && (
  <div className="location-modal-overlay">

    <div className="location-modal">

      <button
        className="location-modal-close"
        onClick={() => setLocationModal(false)}
      >
        ×
      </button>

      <div className="location-modal-icon">
        {locationType === "add" ? "🗺️" : "📌"}
      </div>

      <h3>
        {locationType === "add"
          ? "Add Your Location"
          : "Other Location"}
      </h3>

      <p>
        Enter the location where you want
        your GoFit box delivered.
      </p>

      <label>
        DELIVERY LOCATION
      </label>

      <input
        type="text"
        value={locationInput}
        onChange={(e) =>
          setLocationInput(e.target.value)
        }
        placeholder={
          locationType === "add"
            ? "Enter your address..."
            : "Enter another location..."
        }
        autoFocus
      />

      <div className="location-modal-actions">

        <button
          className="location-cancel"
          onClick={() =>
            setLocationModal(false)
          }
        >
          Cancel
        </button>

        <button
          className="location-save"
          onClick={saveLocation}
        >
          Save Location
        </button>

      </div>

    </div>

  </div>
)}

    {user?.role !== "admin" && (
      <nav className="bottom-nav">
        <NavButton
          icon="🍴"
          label="Menu"
          active={page === "menu"}
          onClick={() => setPage("menu")}
        />

        <NavButton
          icon="🛒"
          label="Cart"
          active={page === "cart"}
          onClick={() => setPage("cart")}
        />

        <NavButton
          icon="🎟️"
          label="Subscribe"
          active={page === "subscriptions"}
          onClick={() => setPage("subscriptions")}
        />

        <NavButton
          icon="↻"
          label="Track"
          active={page === "track"}
          onClick={() => setPage("track")}
        />
      </nav>
    )}
  </div>
</div>
  );
}

export default App; 