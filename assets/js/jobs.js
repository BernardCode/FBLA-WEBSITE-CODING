// Import Firebase
import { db, auth } from "./src/config/firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  doc,
  updateDoc,
  increment,
  addDoc,
  serverTimestamp,
  arrayUnion,
  getDoc,
} from "firebase/firestore";

// Global variables for pagination
let lastVisible = null;
let currentJobs = [];

// Wait for DOM to be fully loaded before adding event listeners
document.addEventListener("DOMContentLoaded", async () => {
  // Check auth state
  auth.onAuthStateChanged(async (user) => {
    // Load jobs regardless of auth state
    await loadApprovedJobs();

    // Add event listeners for search and filters
    setupSearchAndFilters();
  });
});

/**
 * Load approved jobs from Firestore
 * @param {Object} searchParams - Search and filter parameters
 */
async function loadApprovedJobs(searchParams = {}) {
  const jobListings = document.getElementById("jobListings");
  if (!jobListings) return;

  jobListings.innerHTML =
    '<div class="loading-message">Loading job listings...</div>';

  try {
    // Build query with filters
    let jobsQuery = query(
      collection(db, "jobs"),
      where("status", "==", "Approved")
    );

    // Add additional filters if provided
    if (searchParams.jobType) {
      jobsQuery = query(
        jobsQuery,
        where("jobType", "==", searchParams.jobType)
      );
    }

    if (searchParams.workArrangement) {
      jobsQuery = query(
        jobsQuery,
        where("workArrangement", "==", searchParams.workArrangement)
      );
    }

    // Add sorting
    jobsQuery = query(jobsQuery, orderBy("dateCreated", "desc"), limit(10));

    // Add pagination if we have a last item
    if (searchParams.startAfter && lastVisible) {
      jobsQuery = query(jobsQuery, startAfter(lastVisible));
    }

    const querySnapshot = await getDocs(jobsQuery);

    if (querySnapshot.empty && !searchParams.startAfter) {
      jobListings.innerHTML = `
        <div class="empty-message">
          <h3>No job listings available</h3>
          <p>Check back later for new opportunities!</p>
        </div>
      `;
      updateJobCount(0);
      return;
    }

    // Update last visible for pagination
    const snapshots = querySnapshot.docs;
    lastVisible = snapshots[snapshots.length - 1];

    // Clear jobs array if this is first page load
    if (!searchParams.startAfter) {
      currentJobs = [];
    }

    // Store jobs for filtering
    snapshots.forEach((doc) => {
      const job = { id: doc.id, ...doc.data() };
      currentJobs.push(job);
    });

    // Apply text search filter if needed
    let displayedJobs = currentJobs;
    if (searchParams.searchTerm) {
      const term = searchParams.searchTerm.toLowerCase();
      displayedJobs = currentJobs.filter(
        (job) =>
          job.jobTitle.toLowerCase().includes(term) ||
          job.company.toLowerCase().includes(term) ||
          (job.jobDescription &&
            job.jobDescription.toLowerCase().includes(term)) ||
          (job.requirements && job.requirements.toLowerCase().includes(term))
      );
    }

    // Apply minimum pay filter if provided
    if (searchParams.minPay) {
      const minPay = parseFloat(searchParams.minPay);
      displayedJobs = displayedJobs.filter(
        (job) =>
          (job.minPay && job.minPay >= minPay) ||
          (job.maxPay && job.maxPay >= minPay)
      );
    }

    // Clear existing jobs if not paginating
    if (!searchParams.startAfter) {
      jobListings.innerHTML = "";
    } else {
      // Remove load more button if it exists
      const loadMoreBtn = document.querySelector(".load-more-btn");
      if (loadMoreBtn) loadMoreBtn.remove();
    }

    // Show no results message if filtered to empty
    if (displayedJobs.length === 0) {
      jobListings.innerHTML = `
        <div class="empty-message">
          <h3>No matching jobs found</h3>
          <p>Try adjusting your search criteria</p>
          <button id="clearFiltersBtn" class="btn secondary-btn">Clear Filters</button>
        </div>
      `;
      document
        .getElementById("clearFiltersBtn")
        .addEventListener("click", clearFilters);
      updateJobCount(0);
      return;
    }

    // Create job cards
    displayedJobs.forEach(async (job) => {
      // Check if user has already applied
      let userHasApplied = false;

      if (auth.currentUser) {
        // Check if user is in applicants array
        userHasApplied =
          job.applicants && job.applicants.includes(auth.currentUser.uid);

        // If not found in array, check applications collection
        if (!userHasApplied) {
          const applicationsQuery = query(
            collection(db, "applications"),
            where("jobId", "==", job.id),
            where("studentId", "==", auth.currentUser.uid),
            limit(1)
          );

          const appSnapshot = await getDocs(applicationsQuery);
          userHasApplied = !appSnapshot.empty;
        }
      }

      job.userHasApplied = userHasApplied;
      const jobCard = createJobCard(job);
      jobListings.appendChild(jobCard);
    });

    // Update job count
    updateJobCount(displayedJobs.length);

    // Add load more button if we have more results
    if (snapshots.length === 10) {
      const loadMoreBtn = document.createElement("button");
      loadMoreBtn.className = "btn load-more-btn";
      loadMoreBtn.textContent = "Load More Jobs";
      loadMoreBtn.addEventListener("click", () => {
        loadApprovedJobs({ ...searchParams, startAfter: true });
      });
      jobListings.appendChild(loadMoreBtn);
    }
  } catch (error) {
    console.error("Error loading jobs:", error);
    jobListings.innerHTML = `<div class="error-message">Error loading jobs: ${error.message}</div>`;
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
  jobCard.setAttribute("data-job-id", job.id);

  // Format dates
  const postedDate = job.dateCreated
    ? new Date(job.dateCreated.toDate()).toLocaleDateString()
    : "Unknown";

  // Format pay range
  let payRange = formatPayRange(job.minPay, job.maxPay);

  // Check if user has already applied
  const userHasApplied = job.userHasApplied || false;

  jobCard.innerHTML = `
    <div class="job-header">
      <div class="job-title-area">
        <h2 class="job-title">${job.jobTitle}</h2>
        <div class="company-name">
          ${job.company}
        </div>
      </div>
      <div class="job-meta">
        <span class="job-tag job-type">${job.jobType}</span>
        <span class="job-tag job-arrangement">${job.workArrangement}</span>
        <span class="job-tag job-pay">${payRange}</span>
      </div>
    </div>
    
    <div class="job-details">
      <p class="job-description">${truncateText(
        job.jobDescription || "",
        200
      )}</p>
      <div class="skills-container">
        ${
          job.requirements
            ? `<p class="job-requirements">${truncateText(
                job.requirements,
                100
              )}</p>`
            : ""
        }
      </div>
    </div>
    
    <div class="job-footer">
      <div class="job-info">
        <span class="job-posted">Posted ${postedDate}</span>
        <span class="job-applications">${
          job.applications || 0
        } applications</span>
      </div>
      <button class="btn ${userHasApplied ? "applied-btn" : "apply-btn"}" ${
    userHasApplied ? "disabled" : ""
  } data-job-id="${job.id}">
          ${userHasApplied ? "Applied" : "Apply Now"}
      </button>
    </div>
  `;

  // Add event listener to Apply button
  const applyButton = jobCard.querySelector(`[data-job-id="${job.id}"]`);
  if (applyButton && !userHasApplied) {
    applyButton.addEventListener("click", () => applyToJob(job));
  }

  return jobCard;
}

/**
 * Apply to a job
 * @param {Object} job - The job to apply to
 */
async function applyToJob(job) {
  if (!auth.currentUser) {
    window.location.href = "student-login.html";
    return;
  }

  try {
    // Check if user has already applied
    const applicationsQuery = query(
      collection(db, "applications"),
      where("jobId", "==", job.id),
      where("studentId", "==", auth.currentUser.uid),
      limit(1)
    );

    const appSnapshot = await getDocs(applicationsQuery);
    if (!appSnapshot.empty) {
      showNotification("You have already applied to this job", "error");
      return;
    }

    // Get student profile data
    const studentDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    if (!studentDoc.exists()) {
      showNotification("Please complete your profile before applying", "error");
      window.location.href = "profile.html";
      return;
    }

    const studentData = studentDoc.data();

    // Create application document
    const applicationData = {
      jobId: job.id,
      jobTitle: job.jobTitle,
      company: job.company,
      studentId: auth.currentUser.uid,
      studentName: studentData.displayName,
      studentEmail: studentData.email,
      status: "Pending",
      dateApplied: serverTimestamp(),
      employerId: job.employerId,
    };

    // Add application to applications collection
    await addDoc(collection(db, "applications"), applicationData);

    // Update job document with new applicant
    await updateDoc(doc(db, "jobs", job.id), {
      applicants: arrayUnion(auth.currentUser.uid),
      applications: increment(1),
    });

    showNotification("Application submitted successfully!");

    // Update UI to show applied status
    const jobCard = document.querySelector(`[data-job-id="${job.id}"]`);
    if (jobCard) {
      const applyBtn = jobCard.querySelector(".apply-btn");
      if (applyBtn) {
        applyBtn.disabled = true;
        applyBtn.textContent = "Applied";
        applyBtn.classList.add("applied");
      }
    }
  } catch (error) {
    console.error("Error applying to job:", error);
    showNotification("Error submitting application: " + error.message, "error");
  }
}

/**
 * Set up search and filter event listeners
 */
function setupSearchAndFilters() {
  const searchInput = document.getElementById("searchInput");
  const jobTypeFilter = document.getElementById("jobTypeFilter");
  const workArrangementFilter = document.getElementById(
    "workArrangementFilter"
  );
  const minPayFilter = document.getElementById("minPayFilter");
  const sortByFilter = document.getElementById("sortByFilter");
  const clearFiltersBtn = document.getElementById("clearFiltersBtn");

  function applyFilters() {
    const filters = {
      searchTerm: searchInput?.value || "",
      jobType: jobTypeFilter?.value || "",
      workArrangement: workArrangementFilter?.value || "",
      minPay: minPayFilter?.value || null,
    };

    // Reset pagination
    lastVisible = null;

    // Load jobs with filters
    loadApprovedJobs(filters);
  }

  // Debounce function for search input
  const debounce = (func, delay) => {
    let debounceTimer;
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
  };

  // Add event listeners
  if (searchInput)
    searchInput.addEventListener("input", debounce(applyFilters, 300));
  if (jobTypeFilter) jobTypeFilter.addEventListener("change", applyFilters);
  if (workArrangementFilter)
    workArrangementFilter.addEventListener("change", applyFilters);
  if (minPayFilter)
    minPayFilter.addEventListener("input", debounce(applyFilters, 300));
  if (sortByFilter) sortByFilter.addEventListener("change", applyFilters);
  if (clearFiltersBtn) clearFiltersBtn.addEventListener("click", clearFilters);
}

/**
 * Clear all filters and reload jobs
 */
function clearFilters() {
  const searchInput = document.getElementById("searchInput");
  const jobTypeFilter = document.getElementById("jobTypeFilter");
  const workArrangementFilter = document.getElementById(
    "workArrangementFilter"
  );
  const minPayFilter = document.getElementById("minPayFilter");
  const sortByFilter = document.getElementById("sortByFilter");

  if (searchInput) searchInput.value = "";
  if (jobTypeFilter) jobTypeFilter.value = "";
  if (workArrangementFilter) workArrangementFilter.value = "";
  if (minPayFilter) minPayFilter.value = "";
  if (sortByFilter) sortByFilter.value = "date";

  // Reset pagination
  lastVisible = null;

  // Reload jobs without filters
  loadApprovedJobs();
}

/**
 * Update the job count displayed on the page
 * @param {number} count - The number of jobs to display
 */
function updateJobCount(count) {
  const jobCountElement = document.getElementById("jobCount");
  if (jobCountElement) {
    jobCountElement.textContent = count;
  }
}

/**
 * Truncate text to a certain length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - The maximum length
 * @returns {string} - The truncated text
 */
function truncateText(text, maxLength) {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

/**
 * Format pay range for display
 * @param {number} min - Minimum pay
 * @param {number} max - Maximum pay
 * @returns {string} - Formatted pay range
 */
function formatPayRange(min, max) {
  if (!min && !max) return "Unpaid";
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  if (min) return `From $${min.toLocaleString()}`;
  return `Up to $${max.toLocaleString()}`;
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
