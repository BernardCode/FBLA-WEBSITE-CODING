// Import Firebase
import { db, auth } from "../src/config/firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Wait for DOM to be fully loaded before adding event listeners
document.addEventListener("DOMContentLoaded", async () => {
  // Check if user is logged in and is an employer
  if (!auth.currentUser) {
    window.location.href = "employer-login.html";
    return;
  }

  // Add event listener to the form submit button
  const jobListingForm = document.getElementById("jobListingForm");
  jobListingForm.addEventListener("submit", handleFormSubmit);

  // Add event listener to cancel button
  const cancelButton = document.querySelector(".btn-cancel");
  cancelButton.addEventListener("click", () => {
    jobListingForm.reset();
    clearErrorMessage();
  });

  // Add fake location suggestions functionality for demo purposes
  setupLocationSuggestions();

  // Create error message container if it doesn't exist
  createErrorContainer();
});

/**
 * Create error message container at the top of the form
 */
function createErrorContainer() {
  // Check if error container already exists
  if (!document.getElementById("errorContainer")) {
    const formContent = document.querySelector(".form-content");
    const form = document.getElementById("jobListingForm");

    // Create error container
    const errorContainer = document.createElement("div");
    errorContainer.id = "errorContainer";
    errorContainer.className = "error-container";
    errorContainer.style.display = "none";
    errorContainer.style.backgroundColor = "#ffecec";
    errorContainer.style.color = "#d8000c";
    errorContainer.style.padding = "10px";
    errorContainer.style.borderRadius = "4px";
    errorContainer.style.marginBottom = "20px";
    errorContainer.style.fontSize = "14px";
    errorContainer.style.fontWeight = "bold";

    // Insert at the top of the form
    formContent.insertBefore(errorContainer, form);
  }
}

/**
 * Handle form submission
 * @param {Event} event - The form submit event
 */
async function handleFormSubmit(event) {
  event.preventDefault();

  // Clear any existing error messages
  clearErrorMessage();

  try {
    // Collect form data
    const jobData = {
      jobTitle: document.getElementById("jobTitle").value.trim(),
      company: document.getElementById("company").value.trim(),
      jobType: document.getElementById("jobType").value,
      location: document.getElementById("location").value.trim(),
      workArrangement: document.getElementById("workArrangement").value,
      minPay: document.getElementById("minPay").value
        ? parseFloat(document.getElementById("minPay").value)
        : null,
      maxPay: document.getElementById("maxPay").value
        ? parseFloat(document.getElementById("maxPay").value)
        : null,
      showPayInListing: document.getElementById("showPayInListing").checked,
      jobDescription: document.getElementById("jobDescription").value.trim(),
      requirements: document.getElementById("requirements").value.trim(),
      applicationDeadline:
        document.getElementById("applicationDeadline").value || null,
      employerId: auth.currentUser.uid,
      dateCreated: serverTimestamp(),
      status: "Pending", // Default status for all new job postings
      applications: 0,
      viewCount: 0,
    };

    // Validate job data
    const validationResult = validateJobData(jobData);
    if (!validationResult.isValid) {
      showError(validationResult.message);
      focusInvalidField(validationResult.field);
      return;
    }

    // Save to Firestore
    await addDoc(collection(db, "jobs"), jobData);

    // Show success message
    showSuccess(
      "Job listing created successfully! It will be reviewed by an admin before being published."
    );

    // Reset form
    document.getElementById("jobListingForm").reset();

    // Redirect to employer dashboard after short delay
    setTimeout(() => {
      window.location.href = "employer.html";
    }, 2000);
  } catch (error) {
    console.error("Error creating job:", error);
    showError("Error creating job listing: " + error.message);
  }
}

/**
 * Validate job data before saving
 * @param {Object} jobData - The job data to validate
 * @returns {Object} - Validation result with isValid flag, error message, and field name
 */
function validateJobData(jobData) {
  // Field display names (for nicer error messages)
  const fieldLabels = {
    jobTitle: "Job Title",
    company: "Company",
    jobType: "Job Type",
    workArrangement: "Work Arrangement",
    jobDescription: "Job Description",
  };

  // Required fields validation
  const requiredFields = [
    "jobTitle",
    "company",
    "jobType",
    "workArrangement",
    "jobDescription",
  ];
  for (const field of requiredFields) {
    if (!jobData[field]) {
      return {
        isValid: false,
        message: `${fieldLabels[field]} is required. Please make a selection.`,
        field: field,
      };
    }
  }

  // Minimum length validations
  if (jobData.jobTitle.length < 3) {
    return {
      isValid: false,
      message: "Job Title must be at least 3 characters long.",
      field: "jobTitle",
    };
  }

  if (jobData.company.length < 2) {
    return {
      isValid: false,
      message: "Company name must be at least 2 characters long.",
      field: "company",
    };
  }

  if (jobData.jobDescription.length < 20) {
    return {
      isValid: false,
      message: "Job Description must be at least 20 characters long.",
      field: "jobDescription",
    };
  }

  // Pay rate validation (if provided)
  if (jobData.minPay !== null && jobData.maxPay !== null) {
    if (jobData.minPay > jobData.maxPay) {
      return {
        isValid: false,
        message: "Minimum pay cannot be greater than maximum pay.",
        field: "minPay",
      };
    }

    if (jobData.minPay < 0 || jobData.maxPay < 0) {
      return {
        isValid: false,
        message: "Pay rates cannot be negative.",
        field: "minPay",
      };
    }
  }

  // Application deadline validation
  if (jobData.applicationDeadline) {
    const deadlineDate = new Date(jobData.applicationDeadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison

    if (deadlineDate < today) {
      return {
        isValid: false,
        message: "Application deadline cannot be in the past.",
        field: "applicationDeadline",
      };
    }
  }

  return { isValid: true };
}

/**
 * Show error message in the error container
 * @param {string} message - The error message
 */
function showError(message) {
  const errorContainer = document.getElementById("errorContainer");
  errorContainer.textContent = "⚠️ " + message;
  errorContainer.style.display = "block";

  // Scroll to the top of the form to make the error visible
  errorContainer.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Clear the error message
 */
function clearErrorMessage() {
  const errorContainer = document.getElementById("errorContainer");
  errorContainer.textContent = "";
  errorContainer.style.display = "none";
}

/**
 * Show success message
 * @param {string} message - The success message
 */
function showSuccess(message) {
  // Create a success notification
  const successNotification = document.createElement("div");
  successNotification.className = "success-notification";
  successNotification.textContent = "✓ " + message;
  successNotification.style.position = "fixed";
  successNotification.style.top = "20px";
  successNotification.style.right = "20px";
  successNotification.style.backgroundColor = "#dff2bf";
  successNotification.style.color = "#4f8a10";
  successNotification.style.padding = "12px 20px";
  successNotification.style.borderRadius = "4px";
  successNotification.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
  successNotification.style.zIndex = "1000";

  document.body.appendChild(successNotification);

  // Remove the notification after 3 seconds
  setTimeout(() => {
    successNotification.style.opacity = "0";
    successNotification.style.transition = "opacity 0.5s";
    setTimeout(() => {
      document.body.removeChild(successNotification);
    }, 500);
  }, 3000);
}

/**
 * Focus on the invalid field
 * @param {string} fieldId - The ID of the field to focus
 */
function focusInvalidField(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.focus();

    // Highlight the field
    field.style.borderColor = "#d8000c";
    field.style.backgroundColor = "#ffefef";

    // Remove highlight after 3 seconds
    setTimeout(() => {
      field.style.borderColor = "";
      field.style.backgroundColor = "";
    }, 3000);
  }
}

/**
 * Setup basic location suggestions functionality
 * This is a simplified demo implementation
 */
function setupLocationSuggestions() {
  const locationInput = document.getElementById("location");
  const suggestionsList = document.getElementById("locationSuggestions");

  // Sample locations for demo
  const sampleLocations = [
    "New York, NY",
    "San Francisco, CA",
    "Chicago, IL",
    "Austin, TX",
    "Seattle, WA",
    "Boston, MA",
    "Los Angeles, CA",
    "Denver, CO",
    "Atlanta, GA",
    "Dallas, TX",
    "Miami, FL",
    "Washington, DC",
  ];

  locationInput.addEventListener("input", () => {
    const value = locationInput.value.toLowerCase();
    suggestionsList.innerHTML = "";

    if (value.length < 2) {
      suggestionsList.style.display = "none";
      return;
    }

    const matches = sampleLocations.filter((location) =>
      location.toLowerCase().includes(value)
    );

    if (matches.length > 0) {
      suggestionsList.style.display = "block";
      matches.forEach((location) => {
        const suggestion = document.createElement("div");
        suggestion.className = "location-suggestion";
        suggestion.textContent = location;
        suggestion.addEventListener("click", () => {
          locationInput.value = location;
          suggestionsList.style.display = "none";
        });
        suggestionsList.appendChild(suggestion);
      });
    } else {
      suggestionsList.style.display = "none";
    }
  });

  // Hide suggestions when clicking outside
  document.addEventListener("click", (event) => {
    if (
      event.target !== locationInput &&
      !suggestionsList.contains(event.target)
    ) {
      suggestionsList.style.display = "none";
    }
  });
}
