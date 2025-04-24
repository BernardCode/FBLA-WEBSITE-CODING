// Import Firebase
import { db, auth, storage } from "../src/config/firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Global user data
let userData = null;

// Wait for DOM to be fully loaded before adding event listeners
document.addEventListener("DOMContentLoaded", async () => {
  // Check if user is logged in
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "student-login.html";
      return;
    }

    // Load user profile
    await loadUserProfile(user);

    // Set up event listeners
    setupProfileEventListeners();
  });
});

/**
 * Load user profile data from Firestore
 * @param {Object} user - The authenticated user
 */
async function loadUserProfile(user) {
  try {
    // Get user data
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      // Create a basic profile if user doesn't have one
      userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        role: "student",
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", user.uid), userData);
    } else {
      userData = userDoc.data();
    }

    // Update UI with user data
    updateProfileUI(userData);

    // Load education entries
    await loadEducation();

    // Load experience entries
    await loadExperience();

    // Load projects
    await loadProjects();

    // Load accomplishments
    await loadAccomplishments();

    // Update profile completion percentage
    updateProfileCompletion();
  } catch (error) {
    console.error("Error loading profile:", error);
    showNotification("Error loading profile: " + error.message, "error");
  }
}

/**
 * Update the profile UI with user data
 * @param {Object} data - The user data
 */
function updateProfileUI(data) {
  // Basic profile info
  const nameElements = document.querySelectorAll(".student-name");
  nameElements.forEach((el) => {
    el.textContent = data.displayName || data.email;
  });

  const headlineEl = document.querySelector(".student-headline");
  if (headlineEl) {
    headlineEl.textContent =
      data.headline || "Student at Cupertino High School";
  }

  // Profile picture
  const avatarImgs = document.querySelectorAll(".profile-avatar img");
  avatarImgs.forEach((img) => {
    img.src = data.photoURL || "../assets/img/img.png";
  });

  // About section
  const aboutText = document.querySelector(".about-text");
  if (aboutText) {
    aboutText.textContent = data.about || "No information provided yet.";
  }

  // Contact info
  const emailValue = document.querySelector(
    ".contact-item:nth-child(1) .contact-value"
  );
  if (emailValue) {
    emailValue.textContent = data.email;
  }

  const phoneValue = document.querySelector(
    ".contact-item:nth-child(2) .contact-value"
  );
  if (phoneValue) {
    phoneValue.textContent = data.phone || "***-***-****";
  }

  const locationValue = document.querySelector(
    ".contact-item:nth-child(3) .contact-value"
  );
  if (locationValue) {
    locationValue.textContent = data.location || "Cupertino, CA";
  }

  const linkedinValue = document.querySelector(
    ".contact-item:nth-child(4) .contact-value"
  );
  if (linkedinValue) {
    linkedinValue.textContent = data.linkedin || "linkedin.com/in/studentname";
  }

  const websiteValue = document.querySelector(
    ".contact-item:nth-child(5) .contact-value"
  );
  if (websiteValue) {
    websiteValue.textContent = data.website || "studentname.portfolio.io";
  }
}

/**
 * Calculate and update profile completion percentage
 */
function updateProfileCompletion() {
  // Calculate profile completion percentage
  const requiredFields = [
    "displayName",
    "headline",
    "photoURL",
    "about",
    "phone",
    "location",
    "linkedin",
    "website",
  ];

  let completed = 0;
  requiredFields.forEach((field) => {
    if (userData[field]) completed++;
  });

  // Check if education, experience, and skills are added
  const hasEducation = document.querySelector(".education-card") !== null;
  const hasExperience = document.querySelector(".experience-card") !== null;
  const hasSkills = document.querySelector(".skill-tag") !== null;

  if (hasEducation) completed++;
  if (hasExperience) completed++;
  if (hasSkills) completed++;

  const totalFields = requiredFields.length + 3; // +3 for education, experience, skills
  const percentage = Math.round((completed / totalFields) * 100);

  // Update UI
  const progressBar = document.querySelector(".completion-progress");
  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
  }

  const completionText = document.querySelector(".completion-text");
  if (completionText) {
    completionText.textContent = `Profile ${percentage}% Complete`;
  }
}

/**
 * Load education entries from Firestore
 */
async function loadEducation() {
  try {
    const q = query(
      collection(db, "education"),
      where("studentId", "==", auth.currentUser.uid)
    );

    const querySnapshot = await getDocs(q);

    // Clear existing education cards
    const educationSection = document
      .querySelector(".education-card")
      ?.closest(".content-section");
    if (educationSection) {
      const cardGrid = educationSection.querySelector(".card-grid");
      if (cardGrid) {
        // Keep the grid but clear its contents
        cardGrid.innerHTML = "";
      } else {
        // Create card grid if it doesn't exist
        const addButton = educationSection.querySelector(".add-new-button");
        if (addButton) {
          addButton.insertAdjacentHTML(
            "beforebegin",
            '<div class="card-grid"></div>'
          );
        }
      }
    }

    if (querySnapshot.empty) {
      return;
    }

    // Get card grid
    const cardGrid = educationSection.querySelector(".card-grid");

    // Add education cards
    querySnapshot.forEach((doc) => {
      const education = { id: doc.id, ...doc.data() };
      const educationCard = createEducationCard(education);
      cardGrid.appendChild(educationCard);
    });
  } catch (error) {
    console.error("Error loading education:", error);
    showNotification("Error loading education data.", "error");
  }
}

/**
 * Create an education card element
 * @param {Object} education - The education data
 * @returns {HTMLElement} - The education card element
 */
function createEducationCard(education) {
  const card = document.createElement("div");
  card.className = "education-card";
  card.setAttribute("data-id", education.id);

  card.innerHTML = `
    <div class="card-header">
      <div class="card-logo"><i class="fas fa-school"></i></div>
      <div class="card-title-group">
        <h3 class="card-title">${education.school}</h3>
        <p class="card-subtitle">${education.degree || ""}</p>
      </div>
      <button class="remove-button" onclick="removeEducation('${
        education.id
      }')" aria-label="Remove education">×</button>
    </div>
    <div class="card-meta">
      ${
        education.startDate && education.endDate
          ? `<span>${education.startDate} - ${education.endDate}</span>`
          : ""
      }
      ${education.gpa ? `<span>GPA: ${education.gpa}</span>` : ""}
    </div>
    ${
      education.description
        ? `<p class="card-description">${education.description}</p>`
        : ""
    }
  `;

  return card;
}

/**
 * Load experience entries from Firestore
 */
async function loadExperience() {
  try {
    const q = query(
      collection(db, "experience"),
      where("studentId", "==", auth.currentUser.uid)
    );

    const querySnapshot = await getDocs(q);

    // Clear existing experience cards
    const experienceSection = document
      .querySelector(".experience-card")
      ?.closest(".content-section");
    if (experienceSection) {
      const cardGrid = experienceSection.querySelector(".card-grid");
      if (cardGrid) {
        // Keep the grid but clear its contents
        cardGrid.innerHTML = "";
      } else {
        // Create card grid if it doesn't exist
        const addButton = experienceSection.querySelector(".add-new-button");
        if (addButton) {
          addButton.insertAdjacentHTML(
            "beforebegin",
            '<div class="card-grid"></div>'
          );
        }
      }
    }

    if (querySnapshot.empty) {
      return;
    }

    // Get card grid
    const cardGrid = experienceSection.querySelector(".card-grid");

    // Add experience cards
    querySnapshot.forEach((doc) => {
      const experience = { id: doc.id, ...doc.data() };
      const experienceCard = createExperienceCard(experience);
      cardGrid.appendChild(experienceCard);
    });
  } catch (error) {
    console.error("Error loading experience:", error);
    showNotification("Error loading experience data.", "error");
  }
}

/**
 * Create an experience card element
 * @param {Object} experience - The experience data
 * @returns {HTMLElement} - The experience card element
 */
function createExperienceCard(experience) {
  const card = document.createElement("div");
  card.className = "experience-card";
  card.setAttribute("data-id", experience.id);

  // Determine logo content
  let logoContent = "";
  if (experience.logoUrl) {
    logoContent = `<img src="${experience.logoUrl}" alt="${experience.company} Logo" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'fas fa-building\\'></i>';" />`;
  } else {
    logoContent = '<i class="fas fa-building"></i>';
  }

  card.innerHTML = `
    <div class="card-header">
      <div class="card-logo">${logoContent}</div>
      <div class="card-title-group">
        <h3 class="card-title">${experience.title}</h3>
        <p class="card-subtitle">${experience.company}</p>
      </div>
      <button class="remove-button" onclick="removeExperience('${
        experience.id
      }')" aria-label="Remove experience">×</button>
    </div>
    <div class="card-meta">
      ${
        experience.startDate && experience.endDate
          ? `<span>${experience.startDate} - ${experience.endDate}</span>`
          : ""
      }
      ${experience.location ? `<span>${experience.location}</span>` : ""}
    </div>
    ${
      experience.description
        ? `<p class="card-description">${experience.description}</p>`
        : ""
    }
  `;

  return card;
}

/**
 * Load projects from Firestore
 */
async function loadProjects() {
  try {
    const q = query(
      collection(db, "projects"),
      where("studentId", "==", auth.currentUser.uid)
    );

    const querySnapshot = await getDocs(q);

    // Find or identify the projects section
    const projectsSection =
      document.querySelector(".project-card")?.closest(".content-section") ||
      Array.from(document.querySelectorAll(".section-title"))
        .find((el) => el.textContent.includes("Projects"))
        ?.closest(".content-section");

    if (!projectsSection) {
      return;
    }

    // Clear existing project cards
    const cardGrid = projectsSection.querySelector(".card-grid");
    if (cardGrid) {
      cardGrid.innerHTML = "";
    } else {
      // Create card grid if it doesn't exist
      const addButton = projectsSection.querySelector(".add-new-button");
      if (addButton) {
        addButton.insertAdjacentHTML(
          "beforebegin",
          '<div class="card-grid"></div>'
        );
      }
    }

    if (querySnapshot.empty) {
      return;
    }

    // Get card grid (defined after potentially creating it)
    const projectCardGrid = projectsSection.querySelector(".card-grid");

    // Add project cards
    querySnapshot.forEach((doc) => {
      const project = { id: doc.id, ...doc.data() };
      const projectCard = createProjectCard(project);
      projectCardGrid.appendChild(projectCard);
    });
  } catch (error) {
    console.error("Error loading projects:", error);
    showNotification("Error loading project data.", "error");
  }
}

/**
 * Create a project card element
 * @param {Object} project - The project data
 * @returns {HTMLElement} - The project card element
 */
function createProjectCard(project) {
  const card = document.createElement("div");
  card.className = "project-card";
  card.setAttribute("data-id", project.id);

  // Determine icon
  const icon = project.icon || "fas fa-code";

  card.innerHTML = `
    <div class="card-header">
      <div class="card-logo"><i class="${icon}"></i></div>
      <div class="card-title-group">
        <h3 class="card-title">${project.name}</h3>
        <p class="card-subtitle">${project.type || ""}</p>
      </div>
      <button class="remove-button" onclick="removeProject('${
        project.id
      }')" aria-label="Remove project">×</button>
    </div>
    <div class="card-meta">
      ${
        project.startDate && project.endDate
          ? `<span>${project.startDate} - ${project.endDate}</span>`
          : ""
      }
      ${
        project.link
          ? `<span><a href="${project.link}" target="_blank" rel="noopener noreferrer" style="color: inherit;">Project Link</a></span>`
          : ""
      }
    </div>
    ${
      project.description
        ? `<p class="card-description">${project.description}</p>`
        : ""
    }
  `;

  return card;
}

/**
 * Load accomplishments from Firestore
 */
async function loadAccomplishments() {
  try {
    const q = query(
      collection(db, "accomplishments"),
      where("studentId", "==", auth.currentUser.uid)
    );

    const querySnapshot = await getDocs(q);

    // Find accomplishments section
    const accomplishmentsSection =
      document
        .querySelector(".accomplishment-card")
        ?.closest(".content-section") ||
      Array.from(document.querySelectorAll(".section-title"))
        .find((el) => el.textContent.includes("Accomplishments"))
        ?.closest(".content-section");

    if (!accomplishmentsSection) {
      return;
    }

    // Clear existing accomplishment cards (except the add button)
    const accomplishmentCards = accomplishmentsSection.querySelectorAll(
      ".accomplishment-card"
    );
    accomplishmentCards.forEach((card) => card.remove());

    if (querySnapshot.empty) {
      return;
    }

    // Add accomplishment cards before the add button
    const addButton = accomplishmentsSection.querySelector(".add-new-button");

    querySnapshot.forEach((doc) => {
      const accomplishment = { id: doc.id, ...doc.data() };
      const accomplishmentCard = createAccomplishmentCard(accomplishment);

      if (addButton) {
        addButton.insertAdjacentElement("beforebegin", accomplishmentCard);
      } else {
        accomplishmentsSection.appendChild(accomplishmentCard);
      }
    });
  } catch (error) {
    console.error("Error loading accomplishments:", error);
    showNotification("Error loading accomplishment data.", "error");
  }
}

/**
 * Create an accomplishment card element
 * @param {Object} accomplishment - The accomplishment data
 * @returns {HTMLElement} - The accomplishment card element
 */
function createAccomplishmentCard(accomplishment) {
  const card = document.createElement("div");
  card.className = "accomplishment-card";
  card.setAttribute("data-id", accomplishment.id);

  card.innerHTML = `
    <button class="remove-button" onclick="removeAccomplishment('${
      accomplishment.id
    }')" aria-label="Remove accomplishment">×</button>
    <h3 class="accomplishment-title">${accomplishment.title}</h3>
    <p class="accomplishment-date">${accomplishment.date || ""}</p>
    ${
      accomplishment.description
        ? `<p class="accomplishment-description">${accomplishment.description}</p>`
        : ""
    }
  `;

  return card;
}

/**
 * Set up event listeners for the profile page
 */
function setupProfileEventListeners() {
  // Profile picture upload
  setupProfilePictureUpload();

  // Resume upload
  setupResumeUpload();

  // Modal buttons
  setupModalButtons();

  // Inline editing for profile info
  setupInlineEditing();
}

/**
 * Set up profile picture upload
 */
function setupProfilePictureUpload() {
  const avatarUpload = document.querySelector(".avatar-upload");
  if (!avatarUpload) return;

  avatarUpload.addEventListener("click", () => {
    // Create file input if it doesn't exist
    let fileInput = document.getElementById("profile-pic-input");
    if (!fileInput) {
      fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.id = "profile-pic-input";
      fileInput.style.display = "none";
      document.body.appendChild(fileInput);

      fileInput.addEventListener("change", uploadProfilePicture);
    }

    fileInput.click();
  });
}

/**
 * Upload profile picture to Firebase Storage
 * @param {Event} event - The file input change event
 */
async function uploadProfilePicture(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    // Show loading state
    const avatarUploadBtn = document.querySelector(".avatar-upload");
    if (avatarUploadBtn) {
      avatarUploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      avatarUploadBtn.style.pointerEvents = "none";
    }

    // Upload to Firebase Storage
    const storageRef = ref(storage, `profile_images/${auth.currentUser.uid}`);
    await uploadBytes(storageRef, file);

    // Get download URL
    const photoURL = await getDownloadURL(storageRef);

    // Update user document
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      photoURL: photoURL,
      lastUpdated: serverTimestamp(),
    });

    // Update user data
    userData.photoURL = photoURL;

    // Update UI
    const avatarImgs = document.querySelectorAll(".profile-avatar img");
    avatarImgs.forEach((img) => {
      img.src = photoURL;
    });

    // Reset upload button
    if (avatarUploadBtn) {
      avatarUploadBtn.innerHTML = '<i class="fas fa-camera"></i>';
      avatarUploadBtn.style.pointerEvents = "";
    }

    showNotification("Profile picture updated successfully!", "success");

    // Update profile completion
    updateProfileCompletion();
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    showNotification(
      "Error uploading profile picture: " + error.message,
      "error"
    );

    // Reset upload button
    const avatarUploadBtn = document.querySelector(".avatar-upload");
    if (avatarUploadBtn) {
      avatarUploadBtn.innerHTML = '<i class="fas fa-camera"></i>';
      avatarUploadBtn.style.pointerEvents = "";
    }
  }
}

/**
 * Set up resume upload
 */
function setupResumeUpload() {
  const uploadResumeBtn = document.getElementById("upload-resume-button");
  const resumeFileInput = document.getElementById("resume-file-input");

  if (uploadResumeBtn && resumeFileInput) {
    uploadResumeBtn.addEventListener("click", () => {
      resumeFileInput.click();
    });

    resumeFileInput.addEventListener("change", uploadResume);
  }
}

/**
 * Upload resume to Firebase Storage
 * @param {Event} event - The file input change event
 */
async function uploadResume(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    // Show loading state
    const uploadBtn = document.getElementById("upload-resume-button");
    const originalText = uploadBtn.textContent;
    uploadBtn.textContent = "Uploading...";
    uploadBtn.disabled = true;

    // Create storage reference
    const storageRef = ref(
      storage,
      `resumes/${auth.currentUser.uid}/${file.name}`
    );

    // Upload file
    await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    // Update user profile with resume URL
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      resumeUrl: downloadURL,
      resumeFilename: file.name,
      resumeUpdatedAt: serverTimestamp(),
    });

    // Update local user data
    userData.resumeUrl = downloadURL;
    userData.resumeFilename = file.name;

    // Update UI
    uploadBtn.textContent = `Resume: ${file.name}`;
    setTimeout(() => {
      uploadBtn.textContent = originalText;
      uploadBtn.disabled = false;
    }, 3000);

    showNotification("Resume uploaded successfully!", "success");

    // Update profile completion
    updateProfileCompletion();
  } catch (error) {
    console.error("Error uploading resume:", error);
    showNotification("Error uploading resume: " + error.message, "error");

    // Reset button
    const uploadBtn = document.getElementById("upload-resume-button");
    uploadBtn.textContent = "Upload Resume";
    uploadBtn.disabled = false;
  }
}

/**
 * Set up modal buttons
 */
function setupModalButtons() {
  // About section edit button
  const aboutEditBtn = document.querySelector(
    '.section-header:has(.section-title:contains("About")) .edit-button'
  );
  if (aboutEditBtn) {
    aboutEditBtn.addEventListener("click", () => openModal("aboutModal"));
  }

  // Skills section edit button
  const skillsEditBtn = document.querySelector(
    '.section-header:has(.section-title:contains("Skills")) .edit-button'
  );
  if (skillsEditBtn) {
    skillsEditBtn.addEventListener("click", () => openModal("skillsModal"));
  }

  // Add education button
  const addEducationBtn = document.querySelector(
    '.add-new-button[onclick*="educationModal"]'
  );
  if (addEducationBtn) {
    addEducationBtn.onclick = null; // Remove inline handler
    addEducationBtn.addEventListener("click", () =>
      openModal("educationModal")
    );
  }

  // Add experience button
  const addExperienceBtn = document.querySelector(
    '.add-new-button[onclick*="experienceModal"]'
  );
  if (addExperienceBtn) {
    addExperienceBtn.onclick = null; // Remove inline handler
    addExperienceBtn.addEventListener("click", () =>
      openModal("experienceModal")
    );
  }

  // Add project button
  const addProjectBtn = document.querySelector(
    '.add-new-button[onclick*="projectModal"]'
  );
  if (addProjectBtn) {
    addProjectBtn.onclick = null; // Remove inline handler
    addProjectBtn.addEventListener("click", () => openModal("projectModal"));
  }

  // Add accomplishment button
  const addAccomplishmentBtn = document.querySelector(
    '.add-new-button[onclick*="accomplishmentModal"]'
  );
  if (addAccomplishmentBtn) {
    addAccomplishmentBtn.onclick = null; // Remove inline handler
    addAccomplishmentBtn.addEventListener("click", () =>
      openModal("accomplishmentModal")
    );
  }

  // Define global functions for remove buttons
  window.removeEducation = removeEducation;
  window.removeExperience = removeExperience;
  window.removeProject = removeProject;
  window.removeAccomplishment = removeAccomplishment;
}

/**
 * Open a modal
 * @param {string} modalId - The ID of the modal to open
 * @param {Object} editData - Data to pre-fill if editing an existing item
 */
function openModal(modalId, editData = null) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "flex";
  modal.innerHTML = getModalContent(modalId, editData);
  document.body.appendChild(modal);

  // Close when clicking outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal(modal);
    }
  });

  // Add event listener to form
  const form = modal.querySelector("form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      saveFormData(modalId, new FormData(form), editData);
    });
  }
}

/**
 * Close a modal
 * @param {HTMLElement} modal - The modal element to close
 */
function closeModal(modal) {
  if (modal) {
    modal.style.opacity = "0";
    modal.style.transition = "opacity 0.3s";

    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 300);
  }
}

/**
 * Get modal content HTML
 * @param {string} modalId - The ID of the modal
 * @param {Object} editData - Data to pre-fill if editing an existing item
 * @returns {string} - The modal HTML content
 */
function getModalContent(modalId, editData = null) {
  let currentAbout = userData?.about || "";
  let currentSkills = Array.from(
    document.querySelectorAll(".skills-grid .skill-tag")
  )
    .map((tag) => tag.textContent.trim())
    .join(", ");

  switch (modalId) {
    case "aboutModal":
      return `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Edit About</h3>
            <button type="button" class="close-modal" onclick="this.closest('.modal').remove()" aria-label="Close">&times;</button>
          </div>
          <form>
            <div class="modal-body">
              <div class="form-group">
                <label for="about" class="form-label">About Me</label>
                <textarea id="about" name="about" class="form-textarea" required>${currentAbout}</textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="modal-button cancel-button" onclick="this.closest('.modal').remove()">Cancel</button>
              <button type="submit" class="modal-button save-button">Save Changes</button>
            </div>
          </form>
        </div>
      `;

    case "educationModal":
      return `
        <div class="modal-content">
          <div class="modal-header">
            <h3>${editData ? "Edit" : "Add"} Education</h3>
            <button type="button" class="close-modal" onclick="this.closest('.modal').remove()" aria-label="Close">&times;</button>
          </div>
          <form>
            ${
              editData
                ? `<input type="hidden" name="id" value="${editData.id}">`
                : ""
            }
            <div class="modal-body">
              <div class="form-group">
                <label for="school" class="form-label">School Name</label>
                <input type="text" id="school" name="school" class="form-input" required value="${
                  editData?.school || ""
                }">
              </div>
              <div class="form-group">
                <label for="degree" class="form-label">Degree/Diploma</label>
                <input type="text" id="degree" name="degree" class="form-input" value="${
                  editData?.degree || ""
                }">
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="eduStartDate" class="form-label">Start Date</label>
                  <input type="text" id="eduStartDate" name="startDate" class="form-input" placeholder="e.g., Aug 2021" value="${
                    editData?.startDate || ""
                  }">
                </div>
                <div class="form-group">
                  <label for="eduEndDate" class="form-label">End Date</label>
                  <input type="text" id="eduEndDate" name="endDate" class="form-input" placeholder="e.g., Jun 2025 or Present" value="${
                    editData?.endDate || ""
                  }">
                </div>
              </div>
              <div class="form-group">
                <label for="eduGpa" class="form-label">GPA (Optional)</label>
                <input type="text" id="eduGpa" name="gpa" class="form-input" placeholder="e.g., 4.0 or 4.2/4.0" value="${
                  editData?.gpa || ""
                }">
              </div>
              <div class="form-group">
                <label for="eduDescription" class="form-label">Description/Courses</label>
                <textarea id="eduDescription" name="description" class="form-textarea" placeholder="Relevant coursework, activities...">${
                  editData?.description || ""
                }</textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="modal-button cancel-button" onclick="this.closest('.modal').remove()">Cancel</button>
              <button type="submit" class="modal-button save-button">Save Education</button>
            </div>
          </form>
        </div>
      `;

    case "experienceModal":
      return `
        <div class="modal-content">
          <div class="modal-header">
            <h3>${editData ? "Edit" : "Add"} Experience</h3>
            <button type="button" class="close-modal" onclick="this.closest('.modal').remove()" aria-label="Close">&times;</button>
          </div>
          <form>
            ${
              editData
                ? `<input type="hidden" name="id" value="${editData.id}">`
                : ""
            }
            <div class="modal-body">
              <div class="form-group">
                <label for="expTitle" class="form-label">Title</label>
                <input type="text" id="expTitle" name="title" class="form-input" required value="${
                  editData?.title || ""
                }">
              </div>
              <div class="form-group">
                <label for="expCompany" class="form-label">Company/Organization</label>
                <input type="text" id="expCompany" name="company" class="form-input" required value="${
                  editData?.company || ""
                }">
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="expStartDate" class="form-label">Start Date</label>
                  <input type="text" id="expStartDate" name="startDate" class="form-input" placeholder="e.g., Sep 2023" required value="${
                    editData?.startDate || ""
                  }">
                </div>
                <div class="form-group">
                  <label for="expEndDate" class="form-label">End Date</label>
                  <input type="text" id="expEndDate" name="endDate" class="form-input" placeholder="e.g., Present or Aug 2024" required value="${
                    editData?.endDate || ""
                  }">
                </div>
              </div>
              <div class="form-group">
                <label for="expLocation" class="form-label">Location</label>
                <input type="text" id="expLocation" name="location" class="form-input" placeholder="e.g., Cupertino, CA" value="${
                  editData?.location || ""
                }">
              </div>
              <div class="form-group">
                <label for="expDescription" class="form-label">Description</label>
                <textarea id="expDescription" name="description" class="form-textarea" placeholder="Key responsibilities and achievements...">${
                  editData?.description || ""
                }</textarea>
              </div>
              <div class="form-group">
                <label for="expLogo" class="form-label">Logo URL (Optional)</label>
                <input type="url" id="expLogo" name="logoUrl" class="form-input" placeholder="https://..." value="${
                  editData?.logoUrl || ""
                }">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="modal-button cancel-button" onclick="this.closest('.modal').remove()">Cancel</button>
              <button type="submit" class="modal-button save-button">Save Experience</button>
            </div>
          </form>
        </div>
      `;

    case "skillsModal":
      return `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Edit Skills</h3>
            <button type="button" class="close-modal" onclick="this.closest('.modal').remove()" aria-label="Close">&times;</button>
          </div>
          <form>
            <div class="modal-body">
              <div class="form-group">
                <label for="skills" class="form-label">Skills</label>
                <input type="text" id="skills" name="skills" class="form-input" value="${currentSkills}" required>
                <p class="form-hint">Enter your skills separated by commas, e.g., HTML, CSS, JavaScript, Python</p>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="modal-button cancel-button" onclick="this.closest('.modal').remove()">Cancel</button>
              <button type="submit" class="modal-button save-button">Save Skills</button>
            </div>
          </form>
        </div>
      `;

    case "projectModal":
      return `
        <div class="modal-content">
          <div class="modal-header">
            <h3>${editData ? "Edit" : "Add"} Project</h3>
            <button type="button" class="close-modal" onclick="this.closest('.modal').remove()" aria-label="Close">&times;</button>
          </div>
          <form>
            ${
              editData
                ? `<input type="hidden" name="id" value="${editData.id}">`
                : ""
            }
            <div class="modal-body">
              <div class="form-group">
                <label for="projName" class="form-label">Project Name</label>
                <input type="text" id="projName" name="name" class="form-input" required value="${
                  editData?.name || ""
                }">
              </div>
              <div class="form-group">
                <label for="projType" class="form-label">Type/Subtitle</label>
                <input type="text" id="projType" name="type" class="form-input" placeholder="e.g., Web Application, UI/UX Design" value="${
                  editData?.type || ""
                }">
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="projStartDate" class="form-label">Start Date (Optional)</label>
                  <input type="text" id="projStartDate" name="startDate" class="form-input" placeholder="e.g., Jan 2023" value="${
                    editData?.startDate || ""
                  }">
                </div>
                <div class="form-group">
                  <label for="projEndDate" class="form-label">End Date (Optional)</label>
                  <input type="text" id="projEndDate" name="endDate" class="form-input" placeholder="e.g., Mar 2023" value="${
                    editData?.endDate || ""
                  }">
                </div>
              </div>
              <div class="form-group">
                <label for="projLink" class="form-label">Link (Optional)</label>
                <input type="url" id="projLink" name="link" class="form-input" placeholder="e.g., GitHub URL, Live Demo URL" value="${
                  editData?.link || ""
                }">
              </div>
              <div class="form-group">
                <label for="projDescription" class="form-label">Description</label>
                <textarea id="projDescription" name="description" class="form-textarea" required placeholder="What the project does, technologies used...">${
                  editData?.description || ""
                }</textarea>
              </div>
              <div class="form-group">
                <label for="projIcon" class="form-label">Font Awesome Icon (Optional)</label>
                <input type="text" id="projIcon" name="icon" class="form-input" placeholder="e.g., fas fa-code" value="${
                  editData?.icon || ""
                }">
                <p class="form-hint">Find icons at Font Awesome (v6 used here). Use the full class name (e.g., fas fa-rocket).</p>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="modal-button cancel-button" onclick="this.closest('.modal').remove()">Cancel</button>
              <button type="submit" class="modal-button save-button">Save Project</button>
            </div>
          </form>
        </div>
      `;

    case "accomplishmentModal":
      return `
        <div class="modal-content">
          <div class="modal-header">
            <h3>${editData ? "Edit" : "Add"} Accomplishment</h3>
            <button type="button" class="close-modal" onclick="this.closest('.modal').remove()" aria-label="Close">&times;</button>
          </div>
          <form>
            ${
              editData
                ? `<input type="hidden" name="id" value="${editData.id}">`
                : ""
            }
            <div class="modal-body">
              <div class="form-group">
                <label for="accTitle" class="form-label">Title</label>
                <input type="text" id="accTitle" name="title" class="form-input" required placeholder="e.g., Award Name, Certification, Publication" value="${
                  editData?.title || ""
                }">
              </div>
              <div class="form-group">
                <label for="accDate" class="form-label">Date</label>
                <input type="text" id="accDate" name="date" class="form-input" placeholder="e.g., November 2023 or 2022 - Present" required value="${
                  editData?.date || ""
                }">
              </div>
              <div class="form-group">
                <label for="accDescription" class="form-label">Description (Optional)</label>
                <textarea id="accDescription" name="description" class="form-textarea" placeholder="Details about the accomplishment...">${
                  editData?.description || ""
                }</textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="modal-button cancel-button" onclick="this.closest('.modal').remove()">Cancel</button>
              <button type="submit" class="modal-button save-button">Save Accomplishment</button>
            </div>
          </form>
        </div>
      `;

    default:
      return `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Error</h3>
            <button type="button" class="close-modal" onclick="this.closest('.modal').remove()" aria-label="Close">&times;</button>
          </div>
          <div class="modal-body">
            <p>Unknown modal type: ${modalId}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="modal-button cancel-button" onclick="this.closest('.modal').remove()">Close</button>
          </div>
        </div>
      `;
  }
}

/**
 * Save form data to Firestore
 * @param {string} modalId - The ID of the modal
 * @param {FormData} formData - The form data
 * @param {Object} editData - Data if editing an existing item
 */
async function saveFormData(modalId, formData, editData) {
  try {
    switch (modalId) {
      case "aboutModal":
        await saveAboutData(formData);
        break;
      case "educationModal":
        await saveEducationData(formData, editData);
        break;
      case "experienceModal":
        await saveExperienceData(formData, editData);
        break;
      case "skillsModal":
        await saveSkillsData(formData);
        break;
      case "projectModal":
        await saveProjectData(formData, editData);
        break;
      case "accomplishmentModal":
        await saveAccomplishmentData(formData, editData);
        break;
    }

    // Close the modal
    const modal = document.querySelector(".modal");
    if (modal) {
      closeModal(modal);
    }

    // Show success notification
    showNotification("Data saved successfully!", "success");

    // Update profile completion
    updateProfileCompletion();
  } catch (error) {
    console.error("Error saving form data:", error);
    showNotification("Error saving data: " + error.message, "error");
  }
}

/**
 * Save about data to Firestore
 * @param {FormData} formData - The form data
 */
async function saveAboutData(formData) {
  const about = formData.get("about");

  // Update user document
  await updateDoc(doc(db, "users", auth.currentUser.uid), {
    about: about,
    lastUpdated: serverTimestamp(),
  });

  // Update local data
  userData.about = about;

  // Update UI
  const aboutText = document.querySelector(".about-text");
  if (aboutText) {
    aboutText.textContent = about;
  }
}

/**
 * Save education data to Firestore
 * @param {FormData} formData - The form data
 * @param {Object} editData - Data if editing an existing item
 */
async function saveEducationData(formData, editData) {
  const educationData = {
    studentId: auth.currentUser.uid,
    school: formData.get("school"),
    degree: formData.get("degree"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    gpa: formData.get("gpa"),
    description: formData.get("description"),
    lastUpdated: serverTimestamp(),
  };

  if (editData && formData.get("id")) {
    // Update existing education
    await updateDoc(doc(db, "education", formData.get("id")), educationData);
  } else {
    // Add new education
    educationData.createdAt = serverTimestamp();
    await addDoc(collection(db, "education"), educationData);
  }

  // Reload education data
  await loadEducation();
}

/**
 * Save experience data to Firestore
 * @param {FormData} formData - The form data
 * @param {Object} editData - Data if editing an existing item
 */
async function saveExperienceData(formData, editData) {
  const experienceData = {
    studentId: auth.currentUser.uid,
    title: formData.get("title"),
    company: formData.get("company"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    location: formData.get("location"),
    description: formData.get("description"),
    logoUrl: formData.get("logoUrl"),
    lastUpdated: serverTimestamp(),
  };

  if (editData && formData.get("id")) {
    // Update existing experience
    await updateDoc(doc(db, "experience", formData.get("id")), experienceData);
  } else {
    // Add new experience
    experienceData.createdAt = serverTimestamp();
    await addDoc(collection(db, "experience"), experienceData);
  }

  // Reload experience data
  await loadExperience();
}

/**
 * Save skills data to Firestore
 * @param {FormData} formData - The form data
 */
async function saveSkillsData(formData) {
  const skillsInput = formData.get("skills");
  const skills = skillsInput
    .split(",")
    .map((skill) => skill.trim())
    .filter((skill) => skill);

  // Update user document with skills array
  await updateDoc(doc(db, "users", auth.currentUser.uid), {
    skills: skills,
    lastUpdated: serverTimestamp(),
  });

  // Update local data
  userData.skills = skills;

  // Update UI
  const skillsGrid = document.querySelector(".skills-grid");
  if (skillsGrid) {
    skillsGrid.innerHTML = "";
    skills.forEach((skill) => {
      const skillTag = document.createElement("div");
      skillTag.className = "skill-tag";
      skillTag.textContent = skill;
      skillsGrid.appendChild(skillTag);
    });
  }
}

/**
 * Save project data to Firestore
 * @param {FormData} formData - The form data
 * @param {Object} editData - Data if editing an existing item
 */
async function saveProjectData(formData, editData) {
  const projectData = {
    studentId: auth.currentUser.uid,
    name: formData.get("name"),
    type: formData.get("type"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    link: formData.get("link"),
    description: formData.get("description"),
    icon: formData.get("icon") || "fas fa-code",
    lastUpdated: serverTimestamp(),
  };

  if (editData && formData.get("id")) {
    // Update existing project
    await updateDoc(doc(db, "projects", formData.get("id")), projectData);
  } else {
    // Add new project
    projectData.createdAt = serverTimestamp();
    await addDoc(collection(db, "projects"), projectData);
  }

  // Reload projects data
  await loadProjects();
}

/**
 * Save accomplishment data to Firestore
 * @param {FormData} formData - The form data
 * @param {Object} editData - Data if editing an existing item
 */
async function saveAccomplishmentData(formData, editData) {
  const accomplishmentData = {
    studentId: auth.currentUser.uid,
    title: formData.get("title"),
    date: formData.get("date"),
    description: formData.get("description"),
    lastUpdated: serverTimestamp(),
  };

  if (editData && formData.get("id")) {
    // Update existing accomplishment
    await updateDoc(
      doc(db, "accomplishments", formData.get("id")),
      accomplishmentData
    );
  } else {
    // Add new accomplishment
    accomplishmentData.createdAt = serverTimestamp();
    await addDoc(collection(db, "accomplishments"), accomplishmentData);
  }

  // Reload accomplishments data
  await loadAccomplishments();
}

/**
 * Remove education entry
 * @param {string} id - The ID of the education to remove
 */
async function removeEducation(id) {
  if (!confirm("Are you sure you want to remove this education entry?")) {
    return;
  }

  try {
    await deleteDoc(doc(db, "education", id));

    // Remove from UI
    const educationCard = document.querySelector(
      `.education-card[data-id="${id}"]`
    );
    if (educationCard) {
      educationCard.remove();
    }

    showNotification("Education entry removed successfully!", "success");

    // Update profile completion
    updateProfileCompletion();
  } catch (error) {
    console.error("Error removing education:", error);
    showNotification("Error removing education: " + error.message, "error");
  }
}

/**
 * Remove experience entry
 * @param {string} id - The ID of the experience to remove
 */
async function removeExperience(id) {
  if (!confirm("Are you sure you want to remove this experience entry?")) {
    return;
  }

  try {
    await deleteDoc(doc(db, "experience", id));

    // Remove from UI
    const experienceCard = document.querySelector(
      `.experience-card[data-id="${id}"]`
    );
    if (experienceCard) {
      experienceCard.remove();
    }

    showNotification("Experience entry removed successfully!", "success");

    // Update profile completion
    updateProfileCompletion();
  } catch (error) {
    console.error("Error removing experience:", error);
    showNotification("Error removing experience: " + error.message, "error");
  }
}

/**
 * Remove project entry
 * @param {string} id - The ID of the project to remove
 */
async function removeProject(id) {
  if (!confirm("Are you sure you want to remove this project?")) {
    return;
  }

  try {
    await deleteDoc(doc(db, "projects", id));

    // Remove from UI
    const projectCard = document.querySelector(
      `.project-card[data-id="${id}"]`
    );
    if (projectCard) {
      projectCard.remove();
    }

    showNotification("Project removed successfully!", "success");
  } catch (error) {
    console.error("Error removing project:", error);
    showNotification("Error removing project: " + error.message, "error");
  }
}

/**
 * Remove accomplishment entry
 * @param {string} id - The ID of the accomplishment to remove
 */
async function removeAccomplishment(id) {
  if (!confirm("Are you sure you want to remove this accomplishment?")) {
    return;
  }

  try {
    await deleteDoc(doc(db, "accomplishments", id));

    // Remove from UI
    const accomplishmentCard = document.querySelector(
      `.accomplishment-card[data-id="${id}"]`
    );
    if (accomplishmentCard) {
      accomplishmentCard.remove();
    }

    showNotification("Accomplishment removed successfully!", "success");
  } catch (error) {
    console.error("Error removing accomplishment:", error);
    showNotification(
      "Error removing accomplishment: " + error.message,
      "error"
    );
  }
}

/**
 * Set up inline editing for profile info
 */
function setupInlineEditing() {
  const editableElements = [
    { selector: ".student-name", field: "displayName" },
    { selector: ".student-headline", field: "headline" },
    { selector: ".contact-item:nth-child(2) .contact-value", field: "phone" },
    {
      selector: ".contact-item:nth-child(3) .contact-value",
      field: "location",
    },
    {
      selector: ".contact-item:nth-child(4) .contact-value",
      field: "linkedin",
    },
    { selector: ".contact-item:nth-child(5) .contact-value", field: "website" },
  ];

  editableElements.forEach(({ selector, field }) => {
    const element = document.querySelector(selector);
    if (!element) return;

    // Make element editable
    element.setAttribute("contenteditable", "true");
    element.dataset.field = field;

    // Add visual cue on hover
    element.style.cursor = "text";
    element.addEventListener("mouseover", () => {
      element.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
    });
    element.addEventListener("mouseout", () => {
      element.style.backgroundColor = "";
    });

    // Save on blur
    element.addEventListener("blur", async () => {
      const newValue = element.textContent.trim();
      if (newValue !== userData[field]) {
        try {
          // Update field in Firestore
          await updateDoc(doc(db, "users", auth.currentUser.uid), {
            [field]: newValue,
            lastUpdated: serverTimestamp(),
          });

          // Update local data
          userData[field] = newValue;

          // Visual feedback
          element.style.backgroundColor = "#e8f5e9";
          setTimeout(() => {
            element.style.backgroundColor = "";
          }, 1000);

          // Update profile completion
          updateProfileCompletion();
        } catch (error) {
          console.error(`Error updating ${field}:`, error);
          showNotification(
            `Error updating ${field}: ${error.message}`,
            "error"
          );

          // Revert to original value
          element.textContent = userData[field] || "";
        }
      }
    });

    // Handle Enter key
    element.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        element.blur();
      }
    });
  });
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
