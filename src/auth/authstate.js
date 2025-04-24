// src/auth/authState.js
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase.js";

// Protected pages by role
const PROTECTED_PAGES = {
  "admin.html": ["admin"],
  "employer.html": ["employer"],
  "create-job.html": ["employer"],
  "profile.html": ["student"],
};

// Check if there's a hardcoded user in localStorage
const checkForHardcodedUser = async () => {
  const hardcodedUser = localStorage.getItem("currentUser");
  if (hardcodedUser) {
    const user = JSON.parse(hardcodedUser);
    // Get user role from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      return { user, userData: userDoc.data() };
    }
  }
  return null;
};

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
  // Get current page
  const currentPage = window.location.pathname.split("/").pop();

  // First check if Firebase has an authenticated user
  if (!user) {
    // If no Firebase user, check for hardcoded user
    const hardcodedUserData = await checkForHardcodedUser();

    if (hardcodedUserData) {
      // Handle hardcoded user authentication
      const { user, userData } = hardcodedUserData;

      // Check if user has access to this page
      if (
        PROTECTED_PAGES[currentPage] &&
        !PROTECTED_PAGES[currentPage].includes(userData.role)
      ) {
        // Redirect to appropriate page based on role
        redirectBasedOnRole(userData.role);
      }

      // Update UI with user info if on a page with user info
      updateUserUI(userData);
      return;
    }

    // No Firebase user and no hardcoded user - redirect to login if trying to access protected page
    if (PROTECTED_PAGES[currentPage]) {
      window.location.href = currentPage.includes("employer")
        ? "employer-login.html"
        : "student-login.html";
    }
    return;
  }

  // User is logged in
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (userDoc.exists()) {
      const userData = userDoc.data();

      // Check if user has access to this page
      if (
        PROTECTED_PAGES[currentPage] &&
        !PROTECTED_PAGES[currentPage].includes(userData.role)
      ) {
        // Redirect to appropriate page based on role
        redirectBasedOnRole(userData.role);
      }

      // Update UI with user info if on a page with user info
      updateUserUI(userData);
    }
  } catch (error) {
    console.error("Error getting user data:", error);
  }
});

function redirectBasedOnRole(role) {
  if (role === "student") {
    window.location.href = "jobs.html";
  } else if (role === "employer") {
    window.location.href = "employer.html";
  } else if (role === "admin") {
    window.location.href = "admin.html";
  }
}

function updateUserUI(userData) {
  // Update user avatar, name, etc. if those elements exist
  const userNameElements = document.querySelectorAll(".user-name");
  userNameElements.forEach((el) => {
    el.textContent = userData.displayName || userData.email;
  });

  const userAvatarElements = document.querySelectorAll(".user-avatar");
  userAvatarElements.forEach((el) => {
    if (userData.photoURL) {
      // If element is an img
      if (el.tagName === "IMG") {
        el.src = userData.photoURL;
      } else {
        // If element is a div with initials
        const initials = userData.displayName
          ? userData.displayName.charAt(0).toUpperCase()
          : userData.email.charAt(0).toUpperCase();
        el.textContent = initials;
      }
    }
  });

  // Add demo banner if applicable
  addDemoBanner();
}

// Add demo banner function
function addDemoBanner() {
  // Check if banner already exists
  if (document.querySelector(".demo-banner")) return;

  const hardcodedUser = localStorage.getItem("currentUser");
  if (hardcodedUser) {
    const banner = document.createElement("div");
    banner.className = "demo-banner";
    banner.style.backgroundColor = "#ffc107";
    banner.style.color = "#212529";
    banner.style.padding = "5px 0";
    banner.style.textAlign = "center";
    banner.style.fontSize = "14px";
    banner.style.fontWeight = "bold";
    banner.style.position = "fixed";
    banner.style.top = "0";
    banner.style.left = "0";
    banner.style.width = "100%";
    banner.style.zIndex = "1000";
    banner.textContent =
      "You are using a demo account. Some features may be limited.";

    document.body.insertBefore(banner, document.body.firstChild);

    // Add spacing to prevent content from being hidden under banner
    document.body.style.paddingTop = "30px";
  }
}

// Logout function that handles both Firebase and hardcoded users
function logout() {
  // Clear hardcoded user from localStorage
  localStorage.removeItem("currentUser");

  // Sign out from Firebase (this won't error even if no user is signed in)
  auth
    .signOut()
    .then(() => {
      // Redirect to home page
      window.location.href = "../index.html";
    })
    .catch((error) => {
      console.error("Logout error:", error);
    });
}

// Add this to global scope to make it available to all pages
window.logout = logout;

export { redirectBasedOnRole, updateUserUI, logout };
