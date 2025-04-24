// Import Firebase
import { db, auth } from "../src/config/firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

// Wait for DOM to be fully loaded before adding event listeners
document.addEventListener("DOMContentLoaded", async () => {
  // Check authentication or show password overlay
  if (!auth.currentUser) {
    // Show password prompt
    document.getElementById("authOverlay").style.display = "flex";
    setupPasswordVerification();
  } else {
    // Check if user is an admin
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    if (!userDoc.exists() || userDoc.data().role !== "admin") {
      alert("You do not have permission to access the admin dashboard.");
      window.location.href = "../index.html";
      return;
    }

    // Hide auth overlay and load jobs
    document.getElementById("authOverlay").style.display = "none";
    await loadPendingJobs();
  }

  // Add event listeners for search and filters
  setupSearchAndFilters();
});

/**
 * Set up the password verification
 */
function setupPasswordVerification() {
  document
    .getElementById("adminPassword")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        verifyPassword();
      }
    });
}

/**
 * Verify the admin password
 */
async function verifyPassword() {
  const correctPassword = "admin123"; // Replace with actual admin password or use Firebase authentication
  const input = document.getElementById("adminPassword").value;
  const error = document.getElementById("authError");

  if (input === correctPassword) {
    document.getElementById("authOverlay").style.display = "none";
    await loadPendingJobs();
  } else {
    error.textContent = "Incorrect password. Try again.";
  }
}

/**
 * Load pending jobs from Firestore
 */
async function loadPendingJobs() {
  const jobListings = document.getElementById("jobListings");
  if (!jobListings) return;

  jobListings.innerHTML =
    '<div class="loading-job">Loading pending job listings...</div>';

  try {
    // Query pending jobs
    const q = query(
      collection(db, "jobs"),
      where("status", "==", "Pending"),
      orderBy("dateCreated", "desc")
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      jobListings.innerHTML = `
        <div class="empty-state">
          <h3>No pending job listings</h3>
          <p>All job listings have been reviewed.</p>
        </div>
      `;
      return;
    }

    // Clear loading message
    jobListings.innerHTML = "";

    // Create job cards
    const jobs = [];
    querySnapshot.forEach((doc) => {
      jobs.push({ id: doc.id, ...doc.data() });
    });

    // Update pending count if element exists
    const pendingCountElement = document.getElementById("pendingCount");
    if (pendingCountElement) {
      pendingCountElement.textContent = jobs.length;
    }

    // Create job cards
    jobs.forEach((job) => {
      const jobCard = createJobCard(job);
      jobListings.appendChild(jobCard);
    });
  } catch (error) {
    console.error("Error loading jobs:", error);
    jobListings.innerHTML = `<div class="error">Error loading jobs: ${error.message}</div>`;
  }
}

/**
 * Create a job card element
 * @param {Object} job - The job data
 * @returns {HTMLElement} - The job card element
 */
function createJobCard(job) {
  const jobCard = document.createElement("div");
  jobCard.className = "job-card";

  // Format dates
  const postedDate = job.dateCreated
    ? new Date(job.dateCreated.toDate()).toLocaleDateString()
    : "Unknown";

  // Format pay range
  let payRange = formatPayRange(job.minPay, job.maxPay);

  jobCard.innerHTML = `
    <div class="job-card-header">
      <h3 class="job-title">${job.jobTitle}</h3>
      <div class="job-tags">
        <span class="job-tag type">${job.jobType}</span>
        <span class="job-tag status pending">Pending</span>
      </div>
    </div>
    
    <div class="job-card-body">
      <div class="job-detail"><span class="material-icons">business</span><span>${
        job.company
      }</span></div>
      <div class="job-detail"><span class="material-icons">place</span><span>${
        job.location || job.workArrangement
      }</span></div>
      <div class="job-detail"><span class="material-icons">payments</span><span>${payRange}</span></div>
      <div class="job-detail"><span class="material-icons">event</span><span>Posted ${postedDate}</span></div>
    </div>
    
    <div class="job-card-footer">
      <div class="application-count">
        <span class="material-icons">people</span>
        <span>${job.applications || 0} Applications</span>
      </div>
      
      <div class="job-actions">
        <button class="btn icon-btn approve-btn" title="Approve" data-id="${
          job.id
        }">
          <span class="material-icons">check_circle</span>
        </button>
        <button class="btn icon-btn view-btn" title="View" data-id="${job.id}">
          <span class="material-icons">visibility</span>
        </button>
        <button class="btn icon-btn delete-btn" title="Delete" data-id="${
          job.id
        }">
          <span class="material-icons">delete</span>
        </button>
      </div>
    </div>
  `;

  // Add event listeners to buttons
  jobCard
    .querySelector(".approve-btn")
    .addEventListener("click", () => approveJob(job.id));
  jobCard
    .querySelector(".view-btn")
    .addEventListener("click", () => viewJobDetails(job));
  jobCard
    .querySelector(".delete-btn")
    .addEventListener("click", () => deleteJob(job.id));

  return jobCard;
}

/**
 * Approve a job listing
 * @param {string} jobId - The ID of the job to approve
 */
async function approveJob(jobId) {
  try {
    // Update job status in Firestore
    const jobRef = doc(db, "jobs", jobId);
    await updateDoc(jobRef, {
      status: "Approved",
      approvedAt: serverTimestamp(),
      approvedBy: auth.currentUser ? auth.currentUser.uid : "admin",
    });

    showNotification("Job listing approved successfully!", "success");

    // Remove job card from UI
    const jobCard = document
      .querySelector(`.job-card .approve-btn[data-id="${jobId}"]`)
      .closest(".job-card");
    if (jobCard) {
      jobCard.remove();
    }

    // Update pending count
    const pendingCountElement = document.getElementById("pendingCount");
    if (pendingCountElement) {
      const currentCount = parseInt(pendingCountElement.textContent);
      pendingCountElement.textContent = Math.max(0, currentCount - 1);
    }

    // Reload jobs if no job cards left
    const jobCards = document.querySelectorAll(".job-card");
    if (jobCards.length === 0) {
      await loadPendingJobs();
    }
  } catch (error) {
    console.error("Error approving job:", error);
    showNotification("Error approving job: " + error.message, "error");
  }
}

/**
 * View job details in a modal
 * @param {Object} job - The job data
 */
function viewJobDetails(job) {
  const modal = document.getElementById("jobModal");
  const modalBody = document.getElementById("modalBody");

  // Format job details for the modal
  modalBody.innerHTML = `
    <div class="job-detail-group">
      <h3>Basic Information</h3>
      <p><strong>Title:</strong> ${job.jobTitle}</p>
      <p><strong>Company:</strong> ${job.company}</p>
      <p><strong>Type:</strong> ${job.jobType}</p>
      <p><strong>Arrangement:</strong> ${job.workArrangement}</p>
      <p><strong>Location:</strong> ${job.location || "Not specified"}</p>
    </div>
    
    <div class="job-detail-group">
      <h3>Compensation</h3>
      <p><strong>Pay Range:</strong> ${formatPayRange(
        job.minPay,
        job.maxPay
      )}</p>
      <p><strong>Show in Listing:</strong> ${
        job.showPayInListing ? "Yes" : "No"
      }</p>
    </div>
    
    <div class="job-detail-group">
      <h3>Description</h3>
      <p>${job.jobDescription || "No description provided."}</p>
    </div>
    
    <div class="job-detail-group">
      <h3>Requirements</h3>
      <p>${job.requirements || "No specific requirements provided."}</p>
    </div>
    
    <div class="job-detail-group">
      <h3>Additional Information</h3>
      <p><strong>Posted:</strong> ${
        job.dateCreated
          ? new Date(job.dateCreated.toDate()).toLocaleString()
          : "Unknown"
      }</p>
      <p><strong>Application Deadline:</strong> ${
        job.applicationDeadline || "None"
      }</p>
    </div>
    
    <div class="modal-actions">
      <button class="btn primary-btn approve-modal-btn" data-id="${
        job.id
      }">Approve Job</button>
      <button class="btn secondary-btn close-modal-btn">Close</button>
    </div>
  `;

  // Add event listeners for buttons
  modalBody
    .querySelector(".approve-modal-btn")
    .addEventListener("click", function () {
      approveJob(this.getAttribute("data-id"));
      closeModal();
    });

  modalBody
    .querySelector(".close-modal-btn")
    .addEventListener("click", closeModal);

  // Show modal
  modal.classList.add("show");
}

/**
 * Delete a job listing
 * @param {string} jobId - The ID of the job to delete
 */
async function deleteJob(jobId) {
  if (
    !confirm(
      "Are you sure you want to delete this job listing? This cannot be undone."
    )
  ) {
    return;
  }

  try {
    await deleteDoc(doc(db, "jobs", jobId));
    showNotification("Job listing deleted successfully!", "success");

    // Remove job card from UI
    const jobCard = document
      .querySelector(`.job-card .delete-btn[data-id="${jobId}"]`)
      .closest(".job-card");
    if (jobCard) {
      jobCard.remove();
    }

    // Update pending count
    const pendingCountElement = document.getElementById("pendingCount");
    if (pendingCountElement) {
      const currentCount = parseInt(pendingCountElement.textContent);
      pendingCountElement.textContent = Math.max(0, currentCount - 1);
    }

    // Reload jobs if no job cards left
    const jobCards = document.querySelectorAll(".job-card");
    if (jobCards.length === 0) {
      await loadPendingJobs();
    }
  } catch (error) {
    console.error("Error deleting job:", error);
    showNotification("Error deleting job: " + error.message, "error");
  }
}

/**
 * Close the job details modal
 */
function closeModal() {
  document.getElementById("jobModal").classList.remove("show");
}

/**
 * Set up search and filter event listeners
 */
function setupSearchAndFilters() {
  const jobSearchInput = document.getElementById("jobSearchInput");
  const jobTypeFilter = document.getElementById("jobTypeFilter");
  const arrangementFilter = document.getElementById("arrangementFilter");

  function applyFilters() {
    const searchTerm = jobSearchInput?.value.toLowerCase() || "";
    const jobType = jobTypeFilter?.value || "";
    const arrangement = arrangementFilter?.value || "";

    const jobCards = document.querySelectorAll(".job-card");
    let visibleCount = 0;

    jobCards.forEach((card) => {
      const title = card.querySelector(".job-title").textContent.toLowerCase();
      const company = card
        .querySelector(".job-detail:nth-child(1)")
        .textContent.toLowerCase();
      const type = card.querySelector(".job-tag.type").textContent;
      const location = card
        .querySelector(".job-detail:nth-child(2)")
        .textContent.toLowerCase();

      const matchesSearch =
        searchTerm === "" ||
        title.includes(searchTerm) ||
        company.includes(searchTerm);

      const matchesType = jobType === "" || type === jobType;
      const matchesArrangement =
        arrangement === "" || location.includes(arrangement.toLowerCase());

      if (matchesSearch && matchesType && matchesArrangement) {
        card.style.display = "";
        visibleCount++;
      } else {
        card.style.display = "none";
      }
    });

    // Show no results message if no visible cards
    const jobListings = document.getElementById("jobListings");
    if (visibleCount === 0 && jobCards.length > 0) {
      // Create message if it doesn't exist
      if (!document.querySelector(".no-results")) {
        const noResults = document.createElement("div");
        noResults.className = "no-results";
        noResults.innerHTML = `
          <p>No job listings match your filters.</p>
          <button class="btn secondary-btn" id="clearFiltersBtn">Clear Filters</button>
        `;
        jobListings.appendChild(noResults);

        document
          .getElementById("clearFiltersBtn")
          .addEventListener("click", clearFilters);
      }
    } else {
      // Remove message if it exists
      const noResults = document.querySelector(".no-results");
      if (noResults) {
        noResults.remove();
      }
    }
  }

  // Add event listeners
  if (jobSearchInput) {
    jobSearchInput.addEventListener("input", applyFilters);
  }

  if (jobTypeFilter) {
    jobTypeFilter.addEventListener("change", applyFilters);
  }

  if (arrangementFilter) {
    arrangementFilter.addEventListener("change", applyFilters);
  }
}

/**
 * Clear all filters
 */
function clearFilters() {
  const jobSearchInput = document.getElementById("jobSearchInput");
  const jobTypeFilter = document.getElementById("jobTypeFilter");
  const arrangementFilter = document.getElementById("arrangementFilter");

  if (jobSearchInput) jobSearchInput.value = "";
  if (jobTypeFilter) jobTypeFilter.value = "";
  if (arrangementFilter) arrangementFilter.value = "";

  // Show all job cards
  const jobCards = document.querySelectorAll(".job-card");
  jobCards.forEach((card) => (card.style.display = ""));

  // Remove no results message
  const noResults = document.querySelector(".no-results");
  if (noResults) {
    noResults.remove();
  }
}

/**
 * Format pay range for display
 * @param {number} min - Minimum pay
 * @param {number} max - Maximum pay
 * @returns {string} - Formatted pay range
 */
function formatPayRange(min, max) {
  if (!min && !max) return "Unpaid";
  if (min >= 1000 && max >= 1000) {
    // Format as yearly salary
    const minFormatted =
      min >= 1000 ? `$${(min / 1000).toFixed(0)}K` : `$${min}`;
    const maxFormatted =
      max >= 1000 ? `$${(max / 1000).toFixed(0)}K` : `$${max}`;

    if (min && max) {
      return `${minFormatted} - ${maxFormatted}`;
    } else if (min) {
      return `From ${minFormatted}`;
    } else {
      return `Up to ${maxFormatted}`;
    }
  } else {
    // Format as hourly rate
    if (min && max) {
      return `$${min} - $${max}/hr`;
    } else if (min) {
      return `From $${min}/hr`;
    } else {
      return `Up to $${max}/hr`;
    }
  }
}

/**
 * Show a notification message
 * @param {string} message - The message to display
 * @param {string} type - Type of notification (success, error, info)
 */
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  // Set style based on type
  if (type === "success") {
    notification.style.backgroundColor = "#dff2bf";
    notification.style.color = "#4f8a10";
  } else if (type === "error") {
    notification.style.backgroundColor = "#ffcccb";
    notification.style.color = "#d8000c";
  } else {
    notification.style.backgroundColor = "#bce8f1";
    notification.style.color = "#31708f";
  }

  notification.style.padding = "10px 15px";
  notification.style.margin = "10px 0";
  notification.style.borderRadius = "4px";
  notification.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
  notification.style.position = "fixed";
  notification.style.bottom = "20px";
  notification.style.right = "20px";
  notification.style.zIndex = "1000";

  notification.textContent = message;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transition = "opacity 0.5s";

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 500);
  }, 3000);
}
