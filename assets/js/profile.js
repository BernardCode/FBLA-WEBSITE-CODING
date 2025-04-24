// Modal handling functions
function openModal(modalId) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "flex"; // Use flex to enable centering
  modal.innerHTML = getModalContent(modalId);
  document.body.appendChild(modal);

  // Close modal when clicking outside the content area
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      // Only close if clicking the background overlay
      closeModal(modal);
    }
  });

  // Focus the first input field in the modal for accessibility
  const firstInput = modal.querySelector("input, textarea, select");
  if (firstInput) {
    firstInput.focus();
  }
}

function closeModal(modal) {
  // Use optional chaining in case the modal was already removed by other means
  modal?.remove();
}

// Handle profile picture upload
function setupProfilePictureUpload() {
  const avatarUpload = document.querySelector(".avatar-upload");
  const profileAvatarImg = document.querySelector(".profile-avatar img");
  if (!avatarUpload || !profileAvatarImg) {
    console.warn("Profile picture upload elements not found.");
    return; // Exit if elements aren't found
  }

  // Create file input only once
  let fileInput = document.getElementById("profile-pic-input");
  if (!fileInput) {
    fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    fileInput.id = "profile-pic-input";
    document.body.appendChild(fileInput);

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          profileAvatarImg.src = event.target.result;
          // Add backend saving logic here if needed
          console.log("Profile picture updated (client-side).");
          // Optional: show feedback to user
        };
        reader.onerror = () => {
          console.error("Error reading file for profile picture.");
          alert("Error loading profile picture.");
        };
        reader.readAsDataURL(file);
      }
      // Reset input value to allow re-uploading the same file
      e.target.value = null;
    });
  }

  avatarUpload.addEventListener("click", () => {
    if (fileInput) {
      fileInput.click();
    }
  });
}

// --- Card Removal Function ---
/**
 * Removes the card element associated with the button clicked.
 * @param {HTMLElement} buttonElement The remove button element that was clicked.
 * @param {string} cardType The type of card ('experience', 'education', 'project', 'accomplishment') to ensure the correct parent is found.
 */
function removeCard(buttonElement, cardType) {
  // Determine the correct class selector based on cardType
  let cardSelector = "";
  if (cardType === "project") {
    // Use '.project-card' if defined, else fallback to '.experience-card' style
    cardSelector = document.querySelector(".project-card")
      ? ".project-card"
      : ".experience-card";
  } else {
    cardSelector = `.${cardType}-card`;
  }

  const card = buttonElement.closest(cardSelector);

  if (card) {
    // Confirmation dialog
    if (confirm(`Are you sure you want to remove this ${cardType} entry?`)) {
      card.remove();
      // Add backend logic here to delete the item persistently
      console.log(`${cardType} card removed (client-side).`);
      // Optional: Add visual feedback or update counts
    }
  } else {
    console.error(`Could not find parent card ('${cardSelector}') to remove.`);
  }
}

// --- Save Form Data ---
function saveFormData(modalId, formData) {
  const modalElement = document.querySelector(".modal"); // Get the modal element to close it later

  try {
    switch (modalId) {
      case "aboutModal":
        const aboutTextElement = document.querySelector(".about-text");
        if (aboutTextElement) {
          aboutTextElement.textContent = formData.get("about");
        }
        break;
      case "educationModal":
        addEducationCard(formData);
        break;
      case "experienceModal":
        addExperienceCard(formData);
        break;
      case "projectModal":
        addProjectCard(formData);
        break;
      case "skillsModal":
        const skillsInput = formData.get("skills");
        if (skillsInput !== null) {
          updateSkills(
            skillsInput
              .split(",")
              .map((skill) => skill.trim())
              .filter((skill) => skill)
          );
        }
        break;
      case "accomplishmentModal":
        addAccomplishmentCard(formData);
        break;
      default:
        console.warn("Unknown modalId:", modalId);
    }
  } catch (error) {
    console.error(`Error saving form data for ${modalId}:`, error);
    alert(`An error occurred while saving ${modalId}. Please try again.`);
    // Don't close the modal if save failed
    return;
  }

  // Close the modal after successful save
  if (modalElement) {
    closeModal(modalElement);
  }
}

// --- Get Modal Content ---
function getModalContent(modalId) {
  // Default values for fields (empty for add, fetch existing for edit)
  let currentAbout =
    document.querySelector(".about-text")?.textContent.trim() || "";
  let currentSkills = Array.from(
    document.querySelectorAll(".skills-grid .skill-tag")
  )
    .map((tag) => tag.textContent.trim())
    .join(", ");

  const modalContents = {
    aboutModal: `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit About</h3>
                    <button type="button" class="close-modal" onclick="closeModal(this.closest('.modal'))" aria-label="Close">&times;</button>
                </div>
                <form onsubmit="event.preventDefault(); saveFormData('aboutModal', new FormData(this));">
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="about" class="form-label">About Me</label>
                            <textarea id="about" name="about" class="form-textarea" required>${currentAbout}</textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="modal-button cancel-button" onclick="closeModal(this.closest('.modal'))">Cancel</button>
                        <button type="submit" class="modal-button save-button">Save Changes</button>
                    </div>
                </form>
            </div>
        `,
    educationModal: `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add/Edit Education</h3>
                    <button type="button" class="close-modal" onclick="closeModal(this.closest('.modal'))" aria-label="Close">&times;</button>
                </div>
                <form onsubmit="event.preventDefault(); saveFormData('educationModal', new FormData(this));">
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="school" class="form-label">School Name</label>
                            <input type="text" id="school" name="school" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label for="degree" class="form-label">Degree/Diploma</label>
                            <input type="text" id="degree" name="degree" class="form-input">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="eduStartDate" class="form-label">Start Date</label>
                                <input type="text" id="eduStartDate" name="startDate" class="form-input" placeholder="e.g., Aug 2021">
                            </div>
                            <div class="form-group">
                                <label for="eduEndDate" class="form-label">End Date</label>
                                <input type="text" id="eduEndDate" name="endDate" class="form-input" placeholder="e.g., Jun 2025 or Present">
                            </div>
                        </div>
                         <div class="form-group">
                            <label for="eduGpa" class="form-label">GPA (Optional)</label>
                            <input type="text" id="eduGpa" name="gpa" class="form-input" placeholder="e.g., 4.0 or 4.2/4.0">
                        </div>
                        <div class="form-group">
                            <label for="eduDescription" class="form-label">Description/Courses</label>
                            <textarea id="eduDescription" name="description" class="form-textarea" placeholder="Relevant coursework, activities..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="modal-button cancel-button" onclick="closeModal(this.closest('.modal'))">Cancel</button>
                        <button type="submit" class="modal-button save-button">Save Education</button>
                    </div>
                </form>
            </div>
        `,
    experienceModal: `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add/Edit Experience</h3>
                     <button type="button" class="close-modal" onclick="closeModal(this.closest('.modal'))" aria-label="Close">&times;</button>
                </div>
                 <form onsubmit="event.preventDefault(); saveFormData('experienceModal', new FormData(this));">
                    <div class="modal-body">
                         <div class="form-group">
                            <label for="expTitle" class="form-label">Title</label>
                            <input type="text" id="expTitle" name="title" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label for="expCompany" class="form-label">Company/Organization</label>
                            <input type="text" id="expCompany" name="company" class="form-input" required>
                        </div>
                         <div class="form-row">
                            <div class="form-group">
                                <label for="expStartDate" class="form-label">Start Date</label>
                                <input type="text" id="expStartDate" name="startDate" class="form-input" placeholder="e.g., Sep 2023" required>
                            </div>
                            <div class="form-group">
                                <label for="expEndDate" class="form-label">End Date</label>
                                <input type="text" id="expEndDate" name="endDate" class="form-input" placeholder="e.g., Present or Aug 2024" required>
                            </div>
                        </div>
                         <div class="form-group">
                            <label for="expLocation" class="form-label">Location</label>
                            <input type="text" id="expLocation" name="location" class="form-input" placeholder="e.g., Cupertino, CA">
                        </div>
                        <div class="form-group">
                            <label for="expDescription" class="form-label">Description</label>
                            <textarea id="expDescription" name="description" class="form-textarea" placeholder="Key responsibilities and achievements..."></textarea>
                        </div>
                         <div class="form-group">
                            <label for="expLogo" class="form-label">Logo URL (Optional)</label>
                            <input type="url" id="expLogo" name="logo" class="form-input" placeholder="https://...">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="modal-button cancel-button" onclick="closeModal(this.closest('.modal'))">Cancel</button>
                        <button type="submit" class="modal-button save-button">Save Experience</button>
                    </div>
                </form>
            </div>
        `,
    skillsModal: `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Skills</h3>
                     <button type="button" class="close-modal" onclick="closeModal(this.closest('.modal'))" aria-label="Close">&times;</button>
                </div>
                 <form onsubmit="event.preventDefault(); saveFormData('skillsModal', new FormData(this));">
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="skills" class="form-label">Skills</label>
                            <input type="text" id="skills" name="skills" class="form-input" value="${currentSkills}" required>
                            <p class="form-hint">Enter your skills separated by commas, e.g., HTML, CSS, JavaScript, Python</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="modal-button cancel-button" onclick="closeModal(this.closest('.modal'))">Cancel</button>
                        <button type="submit" class="modal-button save-button">Save Skills</button>
                    </div>
                </form>
            </div>
        `,
    projectModal: `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add/Edit Project</h3>
                    <button type="button" class="close-modal" onclick="closeModal(this.closest('.modal'))" aria-label="Close">&times;</button>
                </div>
                <form onsubmit="event.preventDefault(); saveFormData('projectModal', new FormData(this));">
                    <div class="modal-body">
                         <div class="form-group">
                            <label for="projName" class="form-label">Project Name</label>
                            <input type="text" id="projName" name="name" class="form-input" required>
                        </div>
                         <div class="form-group">
                            <label for="projType" class="form-label">Type/Subtitle</label>
                            <input type="text" id="projType" name="type" class="form-input" placeholder="e.g., Web Application, UI/UX Design">
                        </div>
                         <div class="form-row">
                            <div class="form-group">
                                <label for="projStartDate" class="form-label">Start Date (Optional)</label>
                                <input type="text" id="projStartDate" name="startDate" class="form-input" placeholder="e.g., Jan 2023">
                            </div>
                            <div class="form-group">
                                <label for="projEndDate" class="form-label">End Date (Optional)</label>
                                <input type="text" id="projEndDate" name="endDate" class="form-input" placeholder="e.g., Mar 2023">
                            </div>
                        </div>
                         <div class="form-group">
                            <label for="projLink" class="form-label">Link (Optional)</label>
                            <input type="url" id="projLink" name="link" class="form-input" placeholder="e.g., GitHub URL, Live Demo URL">
                        </div>
                        <div class="form-group">
                            <label for="projDescription" class="form-label">Description</label>
                            <textarea id="projDescription" name="description" class="form-textarea" required placeholder="What the project does, technologies used..."></textarea>
                        </div>
                         <div class="form-group">
                            <label for="projIcon" class="form-label">Font Awesome Icon (Optional)</label>
                            <input type="text" id="projIcon" name="icon" class="form-input" placeholder="e.g., fas fa-code">
                            <p class="form-hint">Find icons at Font Awesome (v6 used here). Use the full class name (e.g., fas fa-rocket).</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="modal-button cancel-button" onclick="closeModal(this.closest('.modal'))">Cancel</button>
                        <button type="submit" class="modal-button save-button">Save Project</button>
                    </div>
                </form>
            </div>
        `,
    accomplishmentModal: `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add/Edit Accomplishment</h3>
                     <button type="button" class="close-modal" onclick="closeModal(this.closest('.modal'))" aria-label="Close">&times;</button>
                </div>
                 <form onsubmit="event.preventDefault(); saveFormData('accomplishmentModal', new FormData(this));">
                    <div class="modal-body">
                         <div class="form-group">
                            <label for="accTitle" class="form-label">Title</label>
                            <input type="text" id="accTitle" name="title" class="form-input" required placeholder="e.g., Award Name, Certification, Publication">
                        </div>
                        <div class="form-group">
                            <label for="accDate" class="form-label">Date</label>
                            <input type="text" id="accDate" name="date" class="form-input" placeholder="e.g., November 2023 or 2022 - Present" required>
                        </div>
                        <div class="form-group">
                            <label for="accDescription" class="form-label">Description (Optional)</label>
                            <textarea id="accDescription" name="description" class="form-textarea" placeholder="Details about the accomplishment..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="modal-button cancel-button" onclick="closeModal(this.closest('.modal'))">Cancel</button>
                        <button type="submit" class="modal-button save-button">Save Accomplishment</button>
                    </div>
                </form>
            </div>
        `,
  };

  return (
    modalContents[modalId] ||
    `<div class="modal-content"><div class="modal-header"><h3>Error</h3><button type="button" class="close-modal" onclick="closeModal(this.closest('.modal'))" aria-label="Close">&times;</button></div><div class="modal-body">Error: Modal content for '${modalId}' not found.</div></div>`
  );
}

// --- Helper function to safely get form data text ---
function getFormDataText(formData, key, defaultValue = "") {
  // Use optional chaining and nullish coalescing
  return formData.get(key)?.toString() ?? defaultValue;
}

// --- Function to find or create a card grid ---
function findOrCreateCardGrid(sectionElement) {
  if (!sectionElement) return null;
  let cardGrid = sectionElement.querySelector(".card-grid");
  if (!cardGrid) {
    const addButton = sectionElement.querySelector(".add-new-button");
    if (addButton) {
      addButton.insertAdjacentHTML(
        "beforebegin",
        '<div class="card-grid"></div>'
      );
      cardGrid = sectionElement.querySelector(".card-grid");
    }
  }
  return cardGrid;
}

// --- Add new card functions ---

function addEducationCard(formData) {
  const school = getFormDataText(formData, "school");
  const degree = getFormDataText(formData, "degree");
  const startDate = getFormDataText(formData, "startDate");
  const endDate = getFormDataText(formData, "endDate");
  const gpa = getFormDataText(formData, "gpa");
  const description = getFormDataText(formData, "description");

  const cardHTML = `
        <div class="education-card">
            <div class="card-header">
                <div class="card-logo"><i class="fas fa-school"></i></div>
                <div class="card-title-group">
                    <h3 class="card-title">${school}</h3>
                    <p class="card-subtitle">${degree}</p>
                </div>
                <button class="remove-button" onclick="removeCard(this, 'education')" aria-label="Remove education">×</button>
            </div>
            <div class="card-meta">
                ${
                  startDate || endDate
                    ? `<span>${startDate} - ${endDate}</span>`
                    : ""
                }
                 ${gpa ? `<span>GPA: ${gpa}</span>` : ""}
            </div>
             ${
               description
                 ? `<p class="card-description">${description}</p>`
                 : ""
             }
        </div>`;

  const educationSection =
    document.querySelector(".education-card")?.closest(".content-section") ??
    Array.from(document.querySelectorAll(".section-title"))
      .find((el) => el.textContent.includes("Education"))
      ?.closest(".content-section");
  const cardGrid = findOrCreateCardGrid(educationSection);

  if (cardGrid) {
    cardGrid.insertAdjacentHTML("beforeend", cardHTML);
  } else {
    console.error(
      "Could not find the education section to insert the new card."
    );
  }
}

function addExperienceCard(formData) {
  const title = getFormDataText(formData, "title");
  const company = getFormDataText(formData, "company");
  const startDate = getFormDataText(formData, "startDate");
  const endDate = getFormDataText(formData, "endDate");
  const location = getFormDataText(formData, "location");
  const description = getFormDataText(formData, "description");
  const logo = getFormDataText(formData, "logo");

  const logoHTML = logo
    ? `<img src="${logo}" alt="${company} Logo" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'fas fa-building\\'></i>';" />` // Added onerror fallback
    : '<i class="fas fa-building"></i>';

  const cardHTML = `
        <div class="experience-card">
            <div class="card-header">
                <div class="card-logo">${logoHTML}</div>
                <div class="card-title-group">
                    <h3 class="card-title">${title}</h3>
                    <p class="card-subtitle">${company}</p>
                </div>
                <button class="remove-button" onclick="removeCard(this, 'experience')" aria-label="Remove experience">×</button>
            </div>
            <div class="card-meta">
                 ${
                   startDate || endDate
                     ? `<span>${startDate} - ${endDate}</span>`
                     : ""
                 }
                ${location ? `<span>${location}</span>` : ""}
            </div>
            ${
              description
                ? `<p class="card-description">${description}</p>`
                : ""
            }
        </div>`;

  const experienceSection =
    document.querySelector(".experience-card")?.closest(".content-section") ??
    Array.from(document.querySelectorAll(".section-title"))
      .find((el) => el.textContent.includes("Experience"))
      ?.closest(".content-section");
  const cardGrid = findOrCreateCardGrid(experienceSection);

  if (cardGrid) {
    cardGrid.insertAdjacentHTML("beforeend", cardHTML);
  } else {
    console.error(
      "Could not find the experience section to insert the new card."
    );
  }
}

function addProjectCard(formData) {
  const name = getFormDataText(formData, "name");
  const type = getFormDataText(formData, "type");
  const startDate = getFormDataText(formData, "startDate");
  const endDate = getFormDataText(formData, "endDate");
  const link = getFormDataText(formData, "link");
  const description = getFormDataText(formData, "description");
  const icon = getFormDataText(formData, "icon", "fas fa-project-diagram"); // Default icon

  const dateRange =
    startDate || endDate ? `<span>${startDate} - ${endDate}</span>` : "";
  const linkHTML = link
    ? `<span><a href="${link}" target="_blank" rel="noopener noreferrer" style="color: inherit;">Project Link</a></span>`
    : "";
  const cardClass = document.querySelector(".project-card")
    ? "project-card"
    : "experience-card"; // Use existing class

  const cardHTML = `
        <div class="${cardClass}">
            <div class="card-header">
                <div class="card-logo"><i class="${icon}"></i></div>
                <div class="card-title-group">
                    <h3 class="card-title">${name}</h3>
                    <p class="card-subtitle">${type}</p>
                </div>
                 <button class="remove-button" onclick="removeCard(this, 'project')" aria-label="Remove project">×</button>
            </div>
            <div class="card-meta">
                ${dateRange}
                ${linkHTML}
            </div>
            ${
              description
                ? `<p class="card-description">${description}</p>`
                : ""
            }
        </div>`;

  const projectSection =
    document.querySelector(`.${cardClass}`)?.closest(".content-section") ??
    Array.from(document.querySelectorAll(".section-title"))
      .find((el) => el.textContent.includes("Projects"))
      ?.closest(".content-section");
  const cardGrid = findOrCreateCardGrid(projectSection);

  if (cardGrid) {
    cardGrid.insertAdjacentHTML("beforeend", cardHTML);
  } else {
    console.error("Could not find the project section to insert the new card.");
  }
}

function addAccomplishmentCard(formData) {
  const title = getFormDataText(formData, "title");
  const date = getFormDataText(formData, "date");
  const description = getFormDataText(formData, "description");

  const cardHTML = `
        <div class="accomplishment-card">
             <button class="remove-button" onclick="removeCard(this, 'accomplishment')" aria-label="Remove accomplishment">×</button>
            <h3 class="accomplishment-title">${title}</h3>
            <p class="accomplishment-date">${date}</p>
            ${
              description
                ? `<p class="accomplishment-description">${description}</p>`
                : ""
            }
        </div>`;

  const accomplishmentSection =
    document
      .querySelector(".accomplishment-card")
      ?.closest(".content-section") ??
    Array.from(document.querySelectorAll(".section-title"))
      .find((el) => el.textContent.includes("Accomplishments"))
      ?.closest(".content-section");

  // Accomplishments might not use a grid, insert before the add button
  const addButton = accomplishmentSection?.querySelector(".add-new-button");
  if (addButton) {
    addButton.insertAdjacentHTML("beforebegin", cardHTML);
  } else if (accomplishmentSection) {
    // Fallback: append to section if button not found (less ideal)
    accomplishmentSection.insertAdjacentHTML("beforeend", cardHTML);
    console.warn(
      "Add button not found for accomplishments, appended card to section end."
    );
  } else {
    console.error(
      "Could not find the accomplishment section to insert the new card."
    );
  }
}

// Update skills in the grid
function updateSkills(skills) {
  const skillsGrid = document.querySelector(".skills-grid");
  if (!skillsGrid) {
    console.error("Skills grid not found.");
    return;
  }
  // Clear existing skills
  skillsGrid.innerHTML = "";
  // Add new skills
  skills
    .filter((skill) => skill) // Filter out empty strings potentially from splitting
    .forEach((skill) => {
      const skillTag = document.createElement("div");
      skillTag.className = "skill-tag";
      skillTag.textContent = skill.trim(); // Trim each skill
      skillsGrid.appendChild(skillTag);
    });
}

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  // Setup editable components
  setupProfilePictureUpload();

  // Make specific fields directly editable (inline)
  const editableElements = document.querySelectorAll(
    ".student-name, .student-headline" // Limit inline editing
    // ".contact-value" // Cautious about enabling this for sensitive info
  );
  editableElements.forEach((element) => {
    if (element.getAttribute("contenteditable") !== "true") {
      element.setAttribute("contenteditable", "true");
      element.style.cursor = "text";
      element.dataset.originalValue = element.textContent.trim(); // Store original value

      element.addEventListener("blur", (e) => {
        const newValue = element.textContent.trim();
        if (newValue !== element.dataset.originalValue) {
          // Add backend saving logic here
          console.log(
            `Inline content updated (${element.className}):`,
            newValue
          );
          element.dataset.originalValue = newValue; // Update stored value
          // Optional: Add visual feedback (e.g., temporary highlight)
          element.style.backgroundColor = "#e8f5e9"; // Light green flash
          setTimeout(() => {
            element.style.backgroundColor = "";
          }, 1000);
        }
      });

      // Prevent rich text pasting and limit length if needed
      element.addEventListener("paste", (e) => {
        e.preventDefault();
        const text = e.clipboardData?.getData("text/plain");
        if (text) {
          document.execCommand("insertText", false, text);
        }
      });

      // Optional: Handle Enter key (treat as blur/save)
      element.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault(); // Prevent newline
          element.blur(); // Trigger blur event to save
        }
      });
    }
  });

  // Setup Resume Upload Button
  const uploadResumeButton = document.getElementById("upload-resume-button");
  const resumeFileInput = document.getElementById("resume-file-input");

  if (uploadResumeButton && resumeFileInput) {
    uploadResumeButton.addEventListener("click", () => {
      resumeFileInput.click(); // Trigger the hidden file input
    });

    resumeFileInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        console.log("Selected resume file:", file.name, file.type, file.size);
        // --- Placeholder for actual upload ---
        alert(
          `Selected file: ${file.name}\n(Upload functionality requires backend integration)`
        );

        // Optional: Provide feedback like changing button text or showing filename
        // uploadResumeButton.textContent = `Resume: ${file.name}`; // Example feedback
        // Reset file input value allows selecting the same file again if needed
        event.target.value = null;
      } else {
        console.log("No resume file selected.");
      }
    });
  } else {
    console.warn("Upload resume button or file input not found.");
  }
}); // End DOMContentLoaded
