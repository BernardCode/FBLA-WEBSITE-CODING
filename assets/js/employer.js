// Import Firebase
import { db, auth } from "../src/config/firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";

// Wait for DOM to be fully loaded before adding event listeners
document.addEventListener("DOMContentLoaded", async () => {
  // Check if user is logged in and is an employer
  if (!auth.currentUser) {
    window.location.href = "employer-login.html";
    return;
  }

  // Load jobs and applications
  await loadEmployerJobs();
  await loadApplications();

  // Add event listeners for filters
  const jobSearchInput = document.getElementById("jobSearchInput");
  const jobTypeFilter = document.getElementById("jobTypeFilter");
  const arrangementFilter = document.getElementById("arrangementFilter");

  if (jobSearchInput) {
    jobSearchInput.addEventListener("input", () => {
      applyFilters();
    });
  }

  if (jobTypeFilter) {
    jobTypeFilter.addEventListener("change", () => {
      applyFilters();
    });
  }

  if (arrangementFilter) {
    arrangementFilter.addEventListener("change", () => {
      applyFilters();
    });
  }

  // Add event listener for create job button
  const createJobBtn = document.getElementById("createJobBtn");
  if (createJobBtn) {
    createJobBtn.addEventListener("click", () => {
      window.location.href = "create-job.html";
    });
  }

  // Add event listener for profile picture
  const profilePicture = document.querySelector(".profile-picture");
  if (profilePicture) {
    profilePicture.addEventListener("click", handleProfilePictureClick);
  }
});

/**
 * Load all jobs posted by the current employer from Firestore
 */
async function loadEmployerJobs() {
  const jobListings = document.getElementById("jobListings");

  if (!jobListings) return;

  jobListings.innerHTML =
    '<div class="loading-job">Loading your job listings...</div>';

  try {
    // Query jobs created by this employer
    const q = query(
      collection(db, "jobs"),
      where("employerId", "==", auth.currentUser.uid),
      orderBy("dateCreated", "desc")
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      jobListings.innerHTML = `
        <div class="empty-state">
          <h3>No job listings yet</h3>
          <p>Create your first job listing to start finding talent!</p>
          <a href="create-job.html" class="btn primary-btn">Create Job Listing</a>
        </div>
      `;
      return;
    }

    // Clear loading message
    jobListings.innerHTML = "";

    // Create job cards
    querySnapshot.forEach((doc) => {
      const job = { id: doc.id, ...doc.data() };
      const jobCard = createJobCard(job);
      jobListings.appendChild(jobCard);
    });
  } catch (error) {
    console.error("Error loading jobs:", error);
    jobListings.innerHTML = `<div class="error">Error loading jobs: ${error.message}</div>`;
  }
}

/**
 * Create a job card element from job data
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
        <span class="job-tag status ${
          job.status === "Approved" ? "approved" : "pending"
        }">${job.status}</span>
      </div>
    </div>
    
    <div class="job-card-body">
      <div class="job-detail">
        <span class="material-icons">place</span>
        <span>${job.location || job.workArrangement}</span>
      </div>
      
      <div class="job-detail">
        <span class="material-icons">payments</span>
        <span>${payRange}</span>
      </div>
      
      <div class="job-detail">
        <span class="material-icons">event</span>
        <span>Posted ${postedDate}</span>
      </div>
    </div>
    
    <div class="job-card-footer">
      <div class="application-count">
        <span class="material-icons">people</span>
        <span>${job.applications || 0} Applications</span>
      </div>
      
      <div class="job-actions">
        <button class="btn icon-btn edit-btn" data-id="${job.id}">
          <span class="material-icons">edit</span>
        </button>
        <button class="btn icon-btn delete-btn" data-id="${job.id}">
          <span class="material-icons">delete</span>
        </button>
      </div>
    </div>
  `;

  // Add event listeners to buttons
  jobCard
    .querySelector(".edit-btn")
    .addEventListener("click", () => editJob(job.id));
  jobCard
    .querySelector(".delete-btn")
    .addEventListener("click", () => deleteJob(job.id));

  return jobCard;
}

/**
 * Load applications for jobs posted by this employer
 */
async function loadApplications() {
  const applicationsContainer = document.querySelector(
    ".applications-table tbody"
  );
  if (!applicationsContainer) return;

  applicationsContainer.innerHTML =
    '<tr><td colspan="6">Loading applications...</td></tr>';

  try {
    // Get all jobs by this employer
    const jobsQuery = query(
      collection(db, "jobs"),
      where("employerId", "==", auth.currentUser.uid)
    );

    const jobsSnapshot = await getDocs(jobsQuery);
    const jobIds = jobsSnapshot.docs.map((doc) => doc.id);

    if (jobIds.length === 0) {
      applicationsContainer.innerHTML =
        '<tr><td colspan="6">No applications received yet.</td></tr>';
      return;
    }

    // Get applications for these jobs
    const applicationsQuery = query(
      collection(db, "applications"),
      where("jobId", "in", jobIds)
    );

    const applicationsSnapshot = await getDocs(applicationsQuery);

    if (applicationsSnapshot.empty) {
      applicationsContainer.innerHTML =
        '<tr><td colspan="6">No applications received yet.</td></tr>';
      return;
    }

    // Clear loading message
    applicationsContainer.innerHTML = "";

    // Create application rows
    const applications = [];

    // Get student data for each application
    for (const appDoc of applicationsSnapshot.docs) {
      const application = { id: appDoc.id, ...appDoc.data() };

      // Get student data
      const studentDoc = await getDoc(doc(db, "users", application.studentId));
      if (studentDoc.exists()) {
        application.student = studentDoc.data();
      }

      applications.push(application);
    }

    // Sort by date (newest first)
    applications.sort((a, b) => {
      return b.dateApplied.toDate() - a.dateApplied.toDate();
    });

    // Create rows
    applications.forEach((app) => {
      const row = createApplicationRow(app);
      applicationsContainer.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading applications:", error);
    applicationsContainer.innerHTML = `<tr><td colspan="6">Error loading applications: ${error.message}</td></tr>`;
  }
}

/**
 * Create an application row from application data
 * @param {Object} application - The application data
 * @returns {HTMLElement} - The table row element
 */
function createApplicationRow(application) {
  const row = document.createElement("tr");

  // Format application date
  const appDate = application.dateApplied
    ? new Date(application.dateApplied.toDate()).toLocaleDateString()
    : "Unknown";

  // Get status badge class
  let statusBadgeClass = "status-badge ";
  switch (application.status) {
    case "Submitted":
      statusBadgeClass += "review";
      break;
    case "Interview":
      statusBadgeClass += "interview";
      break;
    case "Offered":
      statusBadgeClass += "approved";
      break;
    case "Rejected":
      statusBadgeClass += "rejected";
      break;
    default:
      statusBadgeClass += "review";
  }

  // Create row content
  row.innerHTML = `
    <td class="applicant-cell">
      <div class="applicant-info">
        <div class="applicant-avatar">${getInitials(
          application.student?.displayName || application.studentName || "User"
        )}</div>
        <div>
          <p class="applicant-name">${
            application.student?.displayName ||
            application.studentName ||
            "User"
          }</p>
          <p class="applicant-email">${
            application.student?.email || application.studentEmail || "No email"
          }</p>
        </div>
      </div>
    </td>
    <td>${application.jobTitle || "Unnamed Position"}</td>
    <td>${appDate}</td>
    <td>
      <select class="status-select" data-app-id="${application.id}">
        <option value="Submitted" ${
          application.status === "Submitted" ? "selected" : ""
        }>Under Review</option>
        <option value="Interview" ${
          application.status === "Interview" ? "selected" : ""
        }>Interview</option>
        <option value="Offered" ${
          application.status === "Offered" ? "selected" : ""
        }>Offered</option>
        <option value="Rejected" ${
          application.status === "Rejected" ? "selected" : ""
        }>Rejected</option>
      </select>
    </td>
    <td>
      <a href="#" class="resume-link" data-student-id="${
        application.studentId
      }">
        <span class="material-icons">description</span>
        View
      </a>
    </td>
    <td>
      <div class="action-buttons">
        <button class="btn icon-btn view-profile-btn" data-student-id="${
          application.studentId
        }">
          <span class="material-icons">visibility</span>
        </button>
        <button class="btn icon-btn schedule-btn" data-app-id="${
          application.id
        }">
          <span class="material-icons">event</span>
        </button>
      </div>
    </td>
  `;

  // Add event listeners
  row
    .querySelector(".status-select")
    .addEventListener("change", (e) =>
      updateApplicationStatus(e.target.dataset.appId, e.target.value)
    );
  row.querySelector(".resume-link").addEventListener("click", (e) => {
    e.preventDefault();
    viewStudentResume(e.currentTarget.dataset.studentId);
  });
  row
    .querySelector(".view-profile-btn")
    .addEventListener("click", () =>
      viewStudentProfile(
        row.querySelector(".view-profile-btn").dataset.studentId
      )
    );
  row
    .querySelector(".schedule-btn")
    .addEventListener("click", () =>
      scheduleInterview(row.querySelector(".schedule-btn").dataset.appId)
    );

  return row;
}

/**
 * Edit job listing
 * @param {string} jobId - The ID of the job to edit
 */
async function editJob(jobId) {
  window.location.href = `create-job.html?edit=${jobId}`;
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
      .querySelector(`.job-card .edit-btn[data-id="${jobId}"]`)
      .closest(".job-card");
    if (jobCard) {
      jobCard.remove();
    }

    // Reload jobs if no job cards left
    const jobCards = document.querySelectorAll(".job-card");
    if (jobCards.length === 0) {
      await loadEmployerJobs();
    }
  } catch (error) {
    console.error("Error deleting job:", error);
    showNotification("Error deleting job: " + error.message, "error");
  }
}

/**
 * Update the status of an application
 * @param {string} applicationId - The ID of the application
 * @param {string} newStatus - The new status value
 */
async function updateApplicationStatus(applicationId, newStatus) {
  try {
    await updateDoc(doc(db, "applications", applicationId), {
      status: newStatus,
      lastUpdated: serverTimestamp(),
    });

    showNotification("Application status updated successfully!", "success");
  } catch (error) {
    console.error("Error updating application status:", error);
    showNotification(
      "Error updating application status: " + error.message,
      "error"
    );
  }
}

/**
 * View a student's resume
 * @param {string} studentId - The ID of the student
 */
async function viewStudentResume(studentId) {
  try {
    const userDoc = await getDoc(doc(db, "users", studentId));

    if (!userDoc.exists()) {
      showNotification("Student profile not found.", "error");
      return;
    }

    const userData = userDoc.data();

    if (!userData.resumeUrl) {
      showNotification("This student has not uploaded a resume yet.", "info");
      return;
    }

    // Open resume in new tab
    window.open(userData.resumeUrl, "_blank");
  } catch (error) {
    console.error("Error viewing resume:", error);
    showNotification("Error viewing resume: " + error.message, "error");
  }
}

/**
 * View a student's profile
 * @param {string} studentId - The ID of the student
 */
async function viewStudentProfile(studentId) {
  alert(
    "This functionality requires integration with the student profile page."
  );
  // In a full implementation, we'd create a modal or page to show student profile
}

/**
 * Schedule an interview with a student
 * @param {string} applicationId - The ID of the application
 */
function scheduleInterview(applicationId) {
  alert("This functionality will be implemented in a future update.");
  // In a full implementation, we'd open a modal to schedule an interview
}

/**
 * Get initials from a name
 * @param {string} name - The name to get initials from
 * @returns {string} - The initials
 */
function getInitials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
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
 * Apply filters to job listings
 */
function applyFilters() {
  const searchTerm =
    document.getElementById("jobSearchInput")?.value?.toLowerCase() || "";
  const jobType = document.getElementById("jobTypeFilter")?.value || "";
  const workArrangement =
    document.getElementById("arrangementFilter")?.value || "";

  const jobCards = document.querySelectorAll(".job-card");

  jobCards.forEach((card) => {
    const title = card.querySelector(".job-title").textContent.toLowerCase();
    const type = card.querySelector(".job-tag.type").textContent;
    const details = Array.from(card.querySelectorAll(".job-detail")).map(
      (detail) => detail.textContent.toLowerCase()
    );

    const matchesSearch =
      searchTerm === "" ||
      title.includes(searchTerm) ||
      details.some((d) => d.includes(searchTerm));
    const matchesType = jobType === "" || type === jobType;
    const matchesArrangement =
      workArrangement === "" ||
      details.some((d) =>
        d.toLowerCase().includes(workArrangement.toLowerCase())
      );

    if (matchesSearch && matchesType && matchesArrangement) {
      card.style.display = "";
    } else {
      card.style.display = "none";
    }
  });

  // Show message if no results
  const visibleCards = Array.from(jobCards).filter(
    (card) => card.style.display !== "none"
  );

  const jobListings = document.getElementById("jobListings");
  const noResultsEl = document.querySelector(".no-results-message");

  if (visibleCards.length === 0 && !noResultsEl) {
    const noResults = document.createElement("div");
    noResults.className = "no-results-message";
    noResults.innerHTML = `
      <p>No job listings match your filters.</p>
      <button class="btn secondary-btn" id="clearFiltersBtn">Clear Filters</button>
    `;
    jobListings.appendChild(noResults);

    document
      .getElementById("clearFiltersBtn")
      .addEventListener("click", clearFilters);
  } else if (visibleCards.length > 0 && noResultsEl) {
    noResultsEl.remove();
  }
}

/**
 * Clear all filters
 */
function clearFilters() {
  const searchInput = document.getElementById("jobSearchInput");
  const jobTypeFilter = document.getElementById("jobTypeFilter");
  const arrangementFilter = document.getElementById("arrangementFilter");

  if (searchInput) searchInput.value = "";
  if (jobTypeFilter) jobTypeFilter.value = "";
  if (arrangementFilter) arrangementFilter.value = "";

  // Show all job cards
  const jobCards = document.querySelectorAll(".job-card");
  jobCards.forEach((card) => (card.style.display = ""));

  // Remove no results message
  const noResultsEl = document.querySelector(".no-results-message");
  if (noResultsEl) noResultsEl.remove();
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

// Add this function to handle profile picture click
async function handleProfilePictureClick() {
  try {
    // Get employer profile data
    const employerDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    if (!employerDoc.exists()) {
      showNotification("Error loading profile data", "error");
      return;
    }

    const employerData = employerDoc.data();

    // Create and show profile modal
    const modal = document.createElement("div");
    modal.className = "profile-modal";
    modal.innerHTML = `
      <div class="profile-modal-content">
        <div class="profile-modal-header">
          <h2>Employer Profile</h2>
          <button class="close-modal">&times;</button>
        </div>
        <div class="profile-modal-body">
          <div class="profile-info">
            <div class="profile-field">
              <label>Company Name:</label>
              <span>${employerData.companyName || "Not specified"}</span>
            </div>
            <div class="profile-field">
              <label>Contact Name:</label>
              <span>${employerData.displayName || "Not specified"}</span>
            </div>
            <div class="profile-field">
              <label>Email:</label>
              <span>${employerData.email || "Not specified"}</span>
            </div>
            <div class="profile-field">
              <label>Phone:</label>
              <span>${employerData.phone || "Not specified"}</span>
            </div>
            <div class="profile-field">
              <label>Location:</label>
              <span>${employerData.location || "Not specified"}</span>
            </div>
            <div class="profile-field">
              <label>About:</label>
              <p>${employerData.about || "No description provided"}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal to page
    document.body.appendChild(modal);

    // Add event listener to close button
    const closeBtn = modal.querySelector(".close-modal");
    closeBtn.addEventListener("click", () => {
      modal.remove();
    });

    // Close modal when clicking outside
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  } catch (error) {
    console.error("Error loading profile:", error);
    showNotification("Error loading profile data", "error");
  }
}
