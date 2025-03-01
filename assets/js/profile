// Student Profile JavaScript

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
  // Profile data object (would be loaded from server in production)
  const profileData = {
    basic: {
      name: "Alex Miller",
      headline: "Senior at Cupertino High School",
      avatar: "/api/placeholder/120/120",
      email: "alex.miller@student.fuhsd.org",
      phone: "(408) 555-1234",
      location: "Cupertino, CA",
      linkedin: "linkedin.com/in/alexmiller",
      website: "alexmiller.portfolio.io",
      about: "I'm a senior at Cupertino High School with a passion for computer science and design. I've completed several AP courses including Computer Science A, Calculus BC, and Physics. I'm particularly interested in web development and UI/UX design, and I'm looking for internship opportunities where I can apply my skills while learning from professionals in the tech industry."
    },
    education: [
      {
        school: "Cupertino High School",
        degree: "High School Diploma",
        logo: "<i class='fas fa-school'></i>",
        startDate: "2021-08",
        endDate: "2025-05",
        current: true,
        gpa: "4.2/4.0",
        description: "Taking a college preparatory curriculum with emphasis on STEM courses. Relevant coursework includes AP Computer Science A, AP Calculus BC, AP Physics, and Digital Media Design."
      },
      {
        school: "Codecademy",
        degree: "Front-End Developer Certificate",
        logo: "<i class='fas fa-certificate'></i>",
        startDate: "2023-01",
        endDate: "2023-06",
        current: false,
        gpa: null,
        description: "Completed comprehensive front-end development program covering HTML, CSS, JavaScript, React, and responsive design principles. Created several projects including a personal portfolio site."
      }
    ],
    experience: [
      {
        company: "Cupertino High Tech Club",
        title: "Web Development Team Lead",
        logo: "/api/placeholder/60/60",
        startDate: "2023-09",
        endDate: null,
        current: true,
        location: "Cupertino, CA",
        description: "Lead a team of 5 students to design and develop the club's website. Organized weekly coding sessions and taught web development basics to new members. Implemented a content management system that improved update efficiency by 40%."
      },
      {
        company: "Cupertino Library",
        title: "Technology Volunteer",
        logo: "/api/placeholder/60/60",
        startDate: "2022-06",
        endDate: "2022-08",
        current: false,
        location: "Cupertino, CA",
        description: "Assisted patrons with technology questions and troubleshooting. Helped with computer setup for coding workshops for elementary and middle school students. Created instructional materials for seniors learning basic computer skills."
      }
    ],
    skills: [
      "HTML5", "CSS3", "JavaScript", "React", "Python", "Java", "Git", 
      "UI/UX Design", "Figma", "Adobe Photoshop", "Problem Solving", "Team Leadership"
    ],
    projects: [
      {
        title: "EcoTracker App",
        type: "Web Application",
        logo: "<i class='fas fa-code'></i>",
        startDate: "2023-01",
        endDate: "2023-03",
        current: false,
        link: "https://github.com/alexmiller/ecotracker",
        description: "Developed a web application that helps users track their carbon footprint. Used React for the frontend and Firebase for the backend. Implemented data visualization using Chart.js to help users understand their environmental impact."
      },
      {
        title: "Study Buddy",
        type: "Mobile App Design",
        logo: "<i class='fas fa-laptop-code'></i>",
        startDate: "2022-10",
        endDate: "2022-12",
        current: false,
        link: null,
        description: "Designed a mobile app concept to help high school students organize study groups and collaborate on projects. Created wireframes, prototypes, and user flows using Figma. Conducted user testing with classmates to improve the design."
      }
    ],
    accomplishments: [
      {
        title: "Congressional App Challenge - Regional Finalist",
        date: "2023-11",
        description: "Selected as a regional finalist for the EcoTracker App, which competed against 40+ submissions from high school students across the district. Recognized for innovation in environmental awareness and technical implementation."
      },
      {
        title: "National Honor Society Member",
        date: "2022-09",
        description: "Selected for membership based on academic achievement, leadership, service, and character. Participated in community service projects including local park cleanups and elementary school tutoring program."
      },
      {
        title: "First Place - School Science Fair",
        date: "2023-03",
        description: "Won first place in the Computer Science category for developing a machine learning model that predicts local air quality based on traffic patterns and weather conditions."
      }
    ]
  };

  // Calculate profile completion percentage
  function calculateProfileCompletion() {
    let totalFields = 0;
    let filledFields = 0;
    
    // Check basic info
    const basicFields = ['name', 'headline', 'email', 'phone', 'location', 'about'];
    totalFields += basicFields.length;
    basicFields.forEach(field => {
      if (profileData.basic[field]) filledFields++;
    });
    
    // Check sections
    totalFields += 4; // Education, Experience, Skills, Projects
    if (profileData.education.length > 0) filledFields++;
    if (profileData.experience.length > 0) filledFields++;
    if (profileData.skills.length > 0) filledFields++;
    if (profileData.projects.length > 0) filledFields++;
    
    // Calculate percentage
    return Math.round((filledFields / totalFields) * 100);
  }

  // Update profile completion indicator
  function updateProfileCompletion() {
    const percentage = calculateProfileCompletion();
    document.querySelector('.completion-progress').style.width = `${percentage}%`;
    document.querySelector('.completion-text').textContent = `Profile ${percentage}% Complete`;
  }

  // Format date for display (Month Year)
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  // Format date range for display
  function formatDateRange(startDate, endDate, current) {
    const start = formatDate(startDate);
    if (current) {
      return `${start} - Present`;
    } else if (endDate) {
      return `${start} - ${formatDate(endDate)}`;
    }
    return start;
  }

  // Populate form fields when opening modals
  function populateFormFields(modalId) {
    switch(modalId) {
      case 'aboutModal':
        document.getElementById('aboutText').value = profileData.basic.about;
        break;
      case 'skillsModal':
        document.getElementById('skillsList').value = profileData.skills.join(', ');
        break;
      // Additional cases for other modals would be added here
    }
  }

  // Save form data from modals
  function saveFormData(modalId) {
    switch(modalId) {
      case 'aboutModal':
        profileData.basic.about = document.getElementById('aboutText').value;
        document.querySelector('.about-text').textContent = profileData.basic.about;
        break;
      case 'skillsModal':
        const skillsInput = document.getElementById('skillsList').value;
        profileData.skills = skillsInput.split(',').map(skill => skill.trim()).filter(skill => skill);
        
        // Update skills display
        const skillsGrid = document.querySelector('.skills-grid');
        skillsGrid.innerHTML = '';
        profileData.skills.forEach(skill => {
          const skillTag = document.createElement('div');
          skillTag.className = 'skill-tag';
          skillTag.textContent = skill;
          skillsGrid.appendChild(skillTag);
        });
        break;
      case 'educationModal':
        // Get form values
        const eduData = {
          school: document.getElementById('schoolName').value,
          degree: document.getElementById('degreeType').value,
          logo: "<i class='fas fa-school'></i>",
          startDate: document.getElementById('eduStartDate').value,
          endDate: document.getElementById('currentlyStudying').checked ? null : document.getElementById('eduEndDate').value,
          current: document.getElementById('currentlyStudying').checked,
          gpa: document.getElementById('gpa').value || null,
          description: document.getElementById('eduDescription').value
        };
        
        // Add to profile data
        profileData.education.push(eduData);
        
        // Update education display
        updateEducationDisplay();
        break;
      case 'experienceModal':
        // Get form values
        const expData = {
          company: document.getElementById('companyName').value,
          title: document.getElementById('jobTitle').value,
          logo: "/api/placeholder/60/60", // Placeholder for demo
          startDate: document.getElementById('expStartDate').value,
          endDate: document.getElementById('currentlyWorking').checked ? null : document.getElementById('expEndDate').value,
          current: document.getElementById('currentlyWorking').checked,
          location: document.getElementById('jobLocation').value,
          description: document.getElementById('jobDescription').value
        };
        
        // Add to profile data
        profileData.experience.push(expData);
        
        // Update experience display
        updateExperienceDisplay();
        break;
      case 'projectModal':
        // Get form values
        const projData = {
          title: document.getElementById('projectTitle').value,
          type: document.getElementById('projectType').value,
          logo: "<i class='fas fa-code'></i>", // Default icon
          startDate: document.getElementById('projStartDate').value,
          endDate: document.getElementById('ongoingProject').checked ? null : document.getElementById('projEndDate').value,
          current: document.getElementById('ongoingProject').checked,
          link: document.getElementById('projectLink').value || null,
          description: document.getElementById('projectDescription').value
        };
        
        // Add to profile data
        profileData.projects.push(projData);
        
        // Update projects display
        updateProjectsDisplay();
        break;
      case 'accomplishmentModal':
        // Get form values
        const accomplishmentData = {
          title: document.getElementById('accomplishmentTitle').value,
          date: document.getElementById('accomplishmentDate').value,
          description: document.getElementById('accomplishmentDescription').value
        };
        
        // Add to profile data
        profileData.accomplishments.push(accomplishmentData);
        
        // Update accomplishments display
        updateAccomplishmentsDisplay();
        break;
    }
    
    // Recalculate profile completion
    updateProfileCompletion();
  }

  // Update education display
  function updateEducationDisplay() {
    const educationGrid = document.querySelector('.card-grid');
    educationGrid.innerHTML = '';
    
    profileData.education.forEach(edu => {
      const educationCard = document.createElement('div');
      educationCard.className = 'education-card';
      
      educationCard.innerHTML = `
        <div class="card-header">
          <div class="card-logo">
            ${edu.logo}
          </div>
          <div class="card-title-group">
            <h3 class="card-title">${edu.school}</h3>
            <p class="card-subtitle">${edu.degree}</p>
          </div>
        </div>
        <div class="card-meta">
          <span>${formatDateRange(edu.startDate, edu.endDate, edu.current)}</span>
          ${edu.gpa ? `<span>GPA: ${edu.gpa}</span>` : ''}
        </div>
        <p class="card-description">${edu.description}</p>
      `;
      
      educationGrid.appendChild(educationCard);
    });
  }

  // Update experience display
  function updateExperienceDisplay() {
    const experienceContainer = document.querySelector('.content-section:nth-child(3) .card-grid');
    experienceContainer.innerHTML = '';
    
    profileData.experience.forEach(exp => {
      const experienceCard = document.createElement('div');
      experienceCard.className = 'experience-card';
      
      experienceCard.innerHTML = `
        <div class="card-header">
          <div class="card-logo">
            <img src="${exp.logo}" alt="${exp.company} Logo" />
          </div>
          <div class="card-title-group">
            <h3 class="card-title">${exp.company}</h3>
            <p class="card-subtitle">${exp.title}</p>
          </div>
        </div>
        <div class="card-meta">
          <span>${formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
          <span>${exp.location}</span>
        </div>
        <p class="card-description">${exp.description}</p>
      `;
      
      experienceContainer.appendChild(experienceCard);
    });
  }

  // Update projects display
  function updateProjectsDisplay() {
    const projectsContainer = document.querySelector('.content-section:nth-child(5) .card-grid');
    projectsContainer.innerHTML = '';
    
    profileData.projects.forEach(project => {
      const projectCard = document.createElement('div');
      projectCard.className = 'experience-card';
      
      projectCard.innerHTML = `
        <div class="card-header">
          <div class="card-logo">
            ${project.logo}
          </div>
          <div class="card-title-group">
            <h3 class="card-title">${project.title}</h3>
            <p class="card-subtitle">${project.type}</p>
          </div>
        </div>
        <div class="card-meta">
          <span>${formatDateRange(project.startDate, project.endDate, project.current)}</span>
          <span>${project.link ? `<a href="${project.link}" style="color: inherit;">Project Link</a>` : 'No Link Available'}</span>
        </div>
        <p class="card-description">${project.description}</p>
      `;
      
      projectsContainer.appendChild(projectCard);
    });
  }

  // Update accomplishments display
  function updateAccomplishmentsDisplay() {
    const accomplishmentsContainer = document.querySelector('.content-section:nth-child(6)');
    
    // Clear all accomplishment cards but leave the header and add button
    const header = accomplishmentsContainer.querySelector('.section-header');
    const addButton = accomplishmentsContainer.querySelector('.add-new-button
