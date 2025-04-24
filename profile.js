// Modal handling functions
function openModal(modalId) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "flex";
  modal.innerHTML = getModalContent(modalId);
  document.body.appendChild(modal);

  // Close modal when clicking outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal(modal);
    }
  });
}

function closeModal(modal) {
  modal.remove();
}

// Handle profile picture upload
function setupProfilePictureUpload() {
  const avatarUpload = document.querySelector(".avatar-upload");
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";

  avatarUpload.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        document.querySelector(".profile-avatar img").src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  document.body.appendChild(fileInput);
}

// Save form data
function saveFormData(modalId, formData) {
  switch (modalId) {
    case "aboutModal":
      document.querySelector(".about-text").textContent = formData.get("about");
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
      updateSkills(formData.get("skills").split(","));
      break;
    case "accomplishmentModal":
      addAccomplishmentCard(formData);
      break;
  }
}

// Get modal content based on type
function getModalContent(modalId) {
  const modalContents = {
    aboutModal: `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit About</h3>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form onsubmit="event.preventDefault(); saveFormData('aboutModal', new FormData(this)); this.closest('.modal').remove();">
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">About Me</label>
                            <textarea name="about" class="form-textarea" required>${document
                              .querySelector(".about-text")
                              .textContent.trim()}</textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="modal-button cancel-button" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button type="submit" class="modal-button save-button">Save Changes</button>
                    </div>
                </form>
            </div>
        `,
    educationModal: `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add Education</h3>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form onsubmit="event.preventDefault(); saveFormData('educationModal', new FormData(this)); this.closest('.modal').remove();">
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">School Name</label>
                            <input type="text" name="school" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Degree/Diploma</label>
                            <input type="text" name="degree" class="form-input" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Start Date</label>
                                <input type="text" name="startDate" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">End Date</label>
                                <input type="text" name="endDate" class="form-input" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea name="description" class="form-textarea" required></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="modal-button cancel-button" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button type="submit" class="modal-button save-button">Save Changes</button>
                    </div>
                </form>
            </div>
        `,
    // Add similar modal contents for other sections...
  };

  return modalContents[modalId] || "";
}

// Add new cards
function addEducationCard(formData) {
  const cardHTML = `
        <div class="education-card">
            <div class="card-header">
                <div class="card-logo">
                    <i class="fas fa-school"></i>
                </div>
                <div class="card-title-group">
                    <h3 class="card-title">${formData.get("school")}</h3>
                    <p class="card-subtitle">${formData.get("degree")}</p>
                </div>
            </div>
            <div class="card-meta">
                <span>${formData.get("startDate")} - ${formData.get(
    "endDate"
  )}</span>
            </div>
            <p class="card-description">${formData.get("description")}</p>
        </div>
    `;

  const cardGrid = document
    .querySelector(".education-card")
    .closest(".card-grid");
  cardGrid.insertAdjacentHTML("beforeend", cardHTML);
}

// Update skills
function updateSkills(skills) {
  const skillsGrid = document.querySelector(".skills-grid");
  skillsGrid.innerHTML = skills
    .map(
      (skill) => `
        <div class="skill-tag">${skill.trim()}</div>
    `
    )
    .join("");
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  setupProfilePictureUpload();

  // Make basic information editable inline
  const editableElements = document.querySelectorAll(
    ".student-name, .student-headline, .contact-value"
  );
  editableElements.forEach((element) => {
    element.setAttribute("contenteditable", "true");
    element.addEventListener("blur", () => {
      // Here you could add logic to save changes to a backend
      console.log("Content updated:", element.textContent);
    });
  });
});
