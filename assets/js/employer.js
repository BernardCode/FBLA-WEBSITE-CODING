// IndexedDB database configuration
const DB_NAME = "CareerBridgeDB";
const DB_VERSION = 1;
const JOB_STORE_NAME = "JobPostings";

// Wait for DOM to be fully loaded before adding event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Load all job listings from the database
  loadJobListings();
});

/**
 * Load all job listings from the database and display them
 */
function loadJobListings() {
  const jobContent = document.querySelector(".job-content");

  // Show loading indicator
  jobContent.innerHTML =
    '<div class="loading-message">Loading job listings...</div>';

  // Open database connection
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onerror = (event) => {
    jobContent.innerHTML = `<div class="error-message">
      Error loading database: ${event.target.error}</div>`;
  };

  request.onsuccess = (event) => {
    const db = event.target.result;

    // Check if the JobPostings store exists
    if (!db.objectStoreNames.contains(JOB_STORE_NAME)) {
      jobContent.innerHTML = `<div class="empty-message">
        No job listings found. Please <a href="create-job.html">add a job</a> first.</div>`;
      return;
    }

    const transaction = db.transaction([JOB_STORE_NAME], "readonly");
    const jobStore = transaction.objectStore(JOB_STORE_NAME);
    const getAllRequest = jobStore.getAll();

    getAllRequest.onsuccess = () => {
      const jobs = getAllRequest.result;

      if (jobs.length === 0) {
        jobContent.innerHTML = `<div class="empty-message">
          No job listings found. Please <a href="create-job.html">add a job</a> first.</div>`;
        return;
      }

      // Sort jobs (newest first based on creation date)
      jobs.sort((a, b) => {
        const dateA = new Date(a.dateCreated || 0);
        const dateB = new Date(b.dateCreated || 0);
        return dateB - dateA;
      });

      // Clear and rebuild the job content
      jobContent.innerHTML = "";

      // Add each job to the content
      jobs.forEach((job) => {
        const jobElement = createJobElement(job);
        jobContent.appendChild(jobElement);
      });
    };

    getAllRequest.onerror = (event) => {
      jobContent.innerHTML = `<div class="error-message">
        Error fetching jobs: ${event.target.error}</div>`;
    };
  };
}

/**
 * Create a job listing element
 * @param {Object} job - The job data
 * @returns {HTMLElement} - The created job element
 */
function createJobElement(job) {
  const jobId = `job-${job.id}`;
  const jobElement = document.createElement("div");
  jobElement.className = "job-item";
  jobElement.id = jobId;

  // Format pay range
  let payRange = "Unpaid";
  if (job.minPay !== null && job.maxPay !== null) {
    payRange = `$${job.minPay}-${job.maxPay}/hr`;
  } else if (job.minPay !== null) {
    payRange = `$${job.minPay}/hr`;
  } else if (job.maxPay !== null) {
    payRange = `$${job.maxPay}/hr`;
  }

  // Format work arrangement
  const workArrangement = getWorkArrangementText(job.workArrangement);

  // Format job brief
  const jobBrief = `${job.company} • ${workArrangement} • ${payRange}`;

  // Format status badge
  const statusBadgeClass =
    job.jobStatus === "Reviewed" ? "badge-approved" : "badge-pending";
  const statusText = job.jobStatus === "Reviewed" ? "Approved" : "Pending";

  // Format application count
  const applicationCount = job.applicationCount || 0;

  // Format creation date
  const creationDate = job.dateCreated ? new Date(job.dateCreated) : new Date();
  const formattedDate = formatDate(creationDate);

  jobElement.innerHTML = `
    <div class="job-summary" onclick="toggleJobDetails('${jobId}')">
      <div class="job-main-info">
        <h2 class="job-title">${job.jobTitle}</h2>
        <div class="job-brief">${jobBrief}</div>
      </div>

      <div class="job-meta-info">
        <span class="status-badge ${statusBadgeClass}">${statusText}</span>
        <span class="applications-count">${applicationCount} applications</span>
        <span class="expand-icon">▼</span>
      </div>
    </div>

    <div class="job-details" id="${jobId}-details">
      <div class="details-content">
        <div class="details-grid">
          <div class="detail-group">
            <span class="detail-label">Company</span>
            <span class="detail-value">${job.company}</span>
          </div>

          <div class="detail-group">
            <span class="detail-label">Job Type</span>
            <span class="detail-value">${job.jobType}</span>
          </div>

          <div class="detail-group">
            <span class="detail-label">Location</span>
            <span class="detail-value">${job.location || workArrangement}</span>
          </div>

          <div class="detail-group">
            <span class="detail-label">Compensation</span>
            <span class="detail-value">${payRange}</span>
          </div>

          <div class="detail-group">
            <span class="detail-label">Posted Date</span>
            <span class="detail-value">${formattedDate}</span>
          </div>

          <div class="detail-group">
            <span class="detail-label">Total Views</span>
            <span class="detail-value">${job.viewCount || 0}</span>
          </div>
        </div>

        <div class="job-description">
          <h3 class="description-title">Job Description</h3>
          <p class="description-text">
            ${job.jobDescription || "No description provided."}
          </p>
        </div>

        <div class="job-description">
          <h3 class="description-title">Requirements</h3>
          <p class="description-text">
            ${
              formatRequirements(job.requirements) ||
              "No specific requirements provided."
            }
          </p>
        </div>

        <div class="job-actions">
          <button class="action-button btn-secondary" onclick="viewJob(${
            job.id
          })">
            <span>👁️</span> View
          </button>
          <button class="action-button btn-primary" onclick="editJob(${
            job.id
          })">
            <span>✏️</span> Edit
          </button>
          <button class="action-button btn-danger" onclick="deleteJob(${
            job.id
          })">
            <span>🗑️</span> Delete
          </button>
        </div>
      </div>
    </div>
  `;

  return jobElement;
}

/**
 * Format requirements text with bullet points
 * @param {string} requirements - The requirements text
 * @returns {string} - Formatted requirements with bullet points
 */
function formatRequirements(requirements) {
  if (!requirements) return "";

  // Split by newlines and add bullet points if not already there
  return requirements
    .split("\n")
    .map((line) => {
      line = line.trim();
      if (!line) return "";
      if (
        line.startsWith("•") ||
        line.startsWith("-") ||
        line.startsWith("*")
      ) {
        return line;
      }
      return `• ${line}`;
    })
    .filter((line) => line)
    .join("<br />");
}

/**
 * Format date to a readable string
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Get text representation of work arrangement
 * @param {string} arrangement - The work arrangement value
 * @returns {string} - Human-readable work arrangement
 */
function getWorkArrangementText(arrangement) {
  switch (arrangement) {
    case "remote":
      return "Remote";
    case "hybrid":
      return "Hybrid";
    case "in-person":
      return "In-Person";
    default:
      return "Flexible";
  }
}

/**
 * View job details (redirect to public job view)
 * @param {number} jobId - The ID of the job to view
 */
function viewJob(jobId) {
  window.location.href = `jobs.html?job=${jobId}`;
}

/**
 * Edit job details (placeholder function)
 * @param {number} jobId - The ID of the job to edit
 */
function editJob(jobId) {
  window.location.href = `create-job.html?edit=${jobId}`;
}

/**
 * Delete a job from the database
 * @param {number} jobId - The ID of the job to delete
 */
function deleteJob(jobId) {
  if (
    !confirm(
      "Are you sure you want to delete this job listing? This action cannot be undone."
    )
  ) {
    return;
  }

  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction([JOB_STORE_NAME], "readwrite");
    const jobStore = transaction.objectStore(JOB_STORE_NAME);

    const deleteRequest = jobStore.delete(jobId);

    deleteRequest.onsuccess = () => {
      alert("Job listing deleted successfully.");
      // Reload the job listings
      loadJobListings();
    };

    deleteRequest.onerror = (event) => {
      alert(`Error deleting job: ${event.target.error}`);
    };
  };

  request.onerror = (event) => {
    alert(`Database error: ${event.target.error}`);
  };
}
