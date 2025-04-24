// IndexedDB database configuration
const DB_NAME = "CareerBridgeDB";
const DB_VERSION = 1;
const JOB_STORE_NAME = "JobPostings";

// Wait for DOM to be fully loaded before adding event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Load all approved job listings from the database
  loadJobListings();

  // Add event listener for the search input
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      applyFilters();
    });
  }

  // Add event listeners for filter inputs
  const workTypeFilter = document.getElementById("workTypeFilter");
  if (workTypeFilter) {
    workTypeFilter.addEventListener("change", () => {
      applyFilters();
    });
  }

  const minPayFilter = document.getElementById("minPayFilter");
  if (minPayFilter) {
    minPayFilter.addEventListener("input", () => {
      applyFilters();
    });
  }

  // Add event listener for clear filters button
  const clearFiltersBtn = document.getElementById("clearFiltersBtn");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      // Reset all filter inputs
      if (workTypeFilter) workTypeFilter.value = "";
      if (minPayFilter) minPayFilter.value = "";
      if (searchInput) searchInput.value = "";

      // Reload all job listings
      loadJobListings();
    });
  }
});

/**
 * Load all approved job listings from the database and display them
 */
function loadJobListings() {
  const jobListingsContainer = document.getElementById("jobListings");

  // Show loading indicator
  jobListingsContainer.innerHTML =
    '<div class="loading-message">Loading job listings...</div>';

  // Open database connection
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onerror = (event) => {
    jobListingsContainer.innerHTML = `<div class="error-message">
      Error loading database: ${event.target.error}</div>`;
  };

  request.onsuccess = (event) => {
    const db = event.target.result;

    // Check if the JobPostings store exists
    if (!db.objectStoreNames.contains(JOB_STORE_NAME)) {
      jobListingsContainer.innerHTML = `<div class="empty-message">
        No job listings available.</div>`;
      return;
    }

    const transaction = db.transaction([JOB_STORE_NAME], "readonly");
    const jobStore = transaction.objectStore(JOB_STORE_NAME);
    const getAllRequest = jobStore.getAll();

    getAllRequest.onsuccess = () => {
      const allJobs = getAllRequest.result;

      // Filter only approved jobs
      const approvedJobs = allJobs.filter(
        (job) => job.jobStatus === "Reviewed"
      );

      if (approvedJobs.length === 0) {
        jobListingsContainer.innerHTML = `<div class="empty-message">
          No approved job listings available.</div>`;
        return;
      }

      // Sort jobs by creation date (newest first)
      approvedJobs.sort((a, b) => {
        const dateA = new Date(a.dateCreated || 0);
        const dateB = new Date(b.dateCreated || 0);
        return dateB - dateA;
      });

      // Clear and rebuild the jobs container
      jobListingsContainer.innerHTML = "";

      // Add each job to the container
      approvedJobs.forEach((job) => {
        const jobElement = createJobElement(job);
        jobListingsContainer.appendChild(jobElement);
      });

      // Update job count
      updateJobCount(approvedJobs.length);
    };

    getAllRequest.onerror = (event) => {
      jobListingsContainer.innerHTML = `<div class="error-message">
        Error fetching jobs: ${event.target.error}</div>`;
    };
  };
}

/**
 * Apply all filters and search criteria to the job listings
 */
function applyFilters() {
  const searchInput = document.getElementById("searchInput");
  const workTypeFilter = document.getElementById("workTypeFilter");
  const minPayFilter = document.getElementById("minPayFilter");

  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
  const workType = workTypeFilter ? workTypeFilter.value : "";
  const minPay =
    minPayFilter && minPayFilter.value ? parseFloat(minPayFilter.value) : null;

  // Open database connection
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction([JOB_STORE_NAME], "readonly");
    const jobStore = transaction.objectStore(JOB_STORE_NAME);
    const getAllRequest = jobStore.getAll();

    getAllRequest.onsuccess = () => {
      const allJobs = getAllRequest.result;

      // First filter for approved jobs only
      let filteredJobs = allJobs.filter((job) => job.jobStatus === "Reviewed");

      // Then apply work type filter if selected
      if (workType) {
        filteredJobs = filteredJobs.filter(
          (job) => job.workArrangement === workType
        );
      }

      // Apply min pay filter if provided
      if (minPay !== null) {
        filteredJobs = filteredJobs.filter((job) => {
          // Include jobs that have a minPay greater than or equal to the filter amount
          // OR jobs that have a maxPay greater than or equal to the filter amount
          return (
            (job.minPay !== null && job.minPay >= minPay) ||
            (job.maxPay !== null && job.maxPay >= minPay)
          );
        });
      }

      // Apply search term if provided
      if (searchTerm) {
        filteredJobs = filteredJobs.filter((job) => {
          const jobTitle = job.jobTitle.toLowerCase();
          const company = job.company.toLowerCase();
          const description = job.jobDescription.toLowerCase();

          return (
            jobTitle.includes(searchTerm) ||
            company.includes(searchTerm) ||
            description.includes(searchTerm)
          );
        });
      }

      // Display filtered jobs
      const jobListingsContainer = document.getElementById("jobListings");

      if (filteredJobs.length === 0) {
        jobListingsContainer.innerHTML = `<div class="empty-message">
          No jobs match your search criteria. <a href="#" id="resetFiltersLink">Reset filters</a></div>`;

        const resetLink = document.getElementById("resetFiltersLink");
        if (resetLink) {
          resetLink.addEventListener("click", (e) => {
            e.preventDefault();
            document.getElementById("clearFiltersBtn").click();
          });
        }

        updateJobCount(0);
        return;
      }

      // Clear and rebuild the jobs container
      jobListingsContainer.innerHTML = "";

      // Add each filtered job to the container
      filteredJobs.forEach((job) => {
        const jobElement = createJobElement(job);
        jobListingsContainer.appendChild(jobElement);
      });

      // Update job count
      updateJobCount(filteredJobs.length);
    };
  };
}

/**
 * Create a job listing element
 * @param {Object} job - The job data
 * @returns {HTMLElement} - The created job element
 */
function createJobElement(job) {
  const jobElement = document.createElement("div");
  jobElement.className = "job-item";
  jobElement.setAttribute("data-job-id", job.id);

  // Format pay range
  let payDisplay = "Unpaid Position";
  if (job.minPay !== null) {
    payDisplay = `${job.minPay.toLocaleString()}`;
  } else if (job.maxPay !== null) {
    payDisplay = `${job.maxPay.toLocaleString()}`;
  }

  // Get work arrangement text
  const workArrangement = getWorkArrangementInfo(job.workArrangement);

  // Format application count
  const applicationCount = job.applicationCount || 0;

  // Format the job description (truncate for preview)
  const truncatedDescription = truncateText(job.jobDescription, 200);

  jobElement.innerHTML = `
    <div class="job-header">
      <div class="job-title-area">
        <h2 class="job-title">${job.jobTitle}</h2>
        <div class="company-name">${job.company}</div>
      </div>
      <div class="job-meta">
        <span class="job-type-badge">${workArrangement.text}</span>
        <span class="job-pay-badge">${payDisplay}</span>
      </div>
    </div>
    <div class="job-description">
      <p>${truncatedDescription}</p>
    </div>
    <div class="job-footer">
      <span class="applications-count">${applicationCount} applications</span>
      <button class="apply-button" data-job-id="${job.id}">Apply Now</button>
    </div>
  `;

  // Add event listener to Apply button
  const applyButton = jobElement.querySelector(".apply-button");
  if (applyButton) {
    // Check if the user has already applied to this job
    if (job.userHasApplied) {
      applyButton.className = "applied-button";
      applyButton.textContent = "Applied";
      applyButton.disabled = true;
    } else {
      applyButton.addEventListener("click", (e) => {
        incrementApplicationCount(job.id);
        // Change button appearance after applying
        e.target.className = "applied-button";
        e.target.textContent = "Applied";
        e.target.disabled = true;
      });
    }
  }

  return jobElement;
}

/**
 * Increment the application count for a job
 * @param {number} jobId - The ID of the job
 */
function incrementApplicationCount(jobId) {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction([JOB_STORE_NAME], "readwrite");
    const jobStore = transaction.objectStore(JOB_STORE_NAME);

    // Get the job first to update it
    const getRequest = jobStore.get(jobId);

    getRequest.onsuccess = () => {
      const job = getRequest.result;
      if (job) {
        // Update the application count
        job.applicationCount = (job.applicationCount || 0) + 1;

        // Mark that the user has applied to this job
        job.userHasApplied = true;

        // Put the updated job back into the store
        const updateRequest = jobStore.put(job);

        updateRequest.onsuccess = () => {
          // Update the UI
          const jobElement = document.querySelector(
            `.job-item[data-job-id="${jobId}"]`
          );
          if (jobElement) {
            const applicationsCountElement = jobElement.querySelector(
              ".applications-count"
            );
            if (applicationsCountElement) {
              applicationsCountElement.textContent = `${job.applicationCount} applications`;
            }

            // Check if apply button was updated in the event handler (direct click)
            // If not (e.g., in case of programmatic call), update it here
            const applyButton = jobElement.querySelector(".apply-button");
            if (applyButton && applyButton.className !== "applied-button") {
              applyButton.className = "applied-button";
              applyButton.textContent = "Applied";
              applyButton.disabled = true;
            }
          }

          // Show success notification
          showNotification("Application submitted successfully!", "success");
        };

        updateRequest.onerror = (event) => {
          showNotification(
            `Error submitting application: ${event.target.error}`,
            "error"
          );
        };
      } else {
        showNotification(`Job with ID ${jobId} not found`, "error");
      }
    };

    getRequest.onerror = (event) => {
      showNotification(`Error fetching job: ${event.target.error}`, "error");
    };
  };

  request.onerror = (event) => {
    showNotification(`Database error: ${event.target.error}`, "error");
  };
}

/**
 * Update the job count display
 * @param {number} count - The number of jobs to display
 */
function updateJobCount(count) {
  const jobCountElement = document.getElementById("jobCount");
  if (jobCountElement) {
    jobCountElement.textContent = count;
  }
}

/**
 * Get work arrangement display info
 * @param {string} arrangement - The work arrangement value
 * @returns {Object} - Information about the work arrangement
 */
function getWorkArrangementInfo(arrangement) {
  switch (arrangement) {
    case "remote":
      return { text: "Remote" };
    case "hybrid":
      return { text: "Hybrid" };
    case "in-person":
      return { text: "In-Person" };
    default:
      return { text: "Flexible" };
  }
}

/**
 * Truncate text to a certain length and add ellipsis
 * @param {string} text - The text to truncate
 * @param {number} maxLength - The maximum length
 * @returns {string} - The truncated text
 */
function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Show a notification message
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error)
 */
function showNotification(message, type = "success") {
  // Check if notification container exists, create if not
  let notificationContainer = document.getElementById("notificationContainer");

  if (!notificationContainer) {
    notificationContainer = document.createElement("div");
    notificationContainer.id = "notificationContainer";
    notificationContainer.style.position = "fixed";
    notificationContainer.style.top = "20px";
    notificationContainer.style.right = "20px";
    notificationContainer.style.zIndex = "1000";
    document.body.appendChild(notificationContainer);
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.style.backgroundColor =
    type === "success" ? "#ecfdf5" : "#fef2f2";
  notification.style.color = type === "success" ? "#047857" : "#b91c1c";
  notification.style.padding = "16px";
  notification.style.borderRadius = "8px";
  notification.style.marginBottom = "12px";
  notification.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
  notification.style.display = "flex";
  notification.style.alignItems = "center";

  // Add icon based on type
  const icon = type === "success" ? "check_circle" : "error";

  notification.innerHTML = `
    <span class="material-icons" style="margin-right: 8px;">${icon}</span>
    <span>${message}</span>
  `;

  // Add to container
  notificationContainer.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transition = "opacity 0.5s ease";

    setTimeout(() => {
      if (notification.parentNode === notificationContainer) {
        notificationContainer.removeChild(notification);
      }
    }, 500);
  }, 3000);
}
