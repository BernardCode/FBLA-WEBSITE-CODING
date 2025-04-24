// migration.js
// Run this script once to set up initial data in your Firebase database

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  setDoc,
  doc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4sQLKfdgbdu6y6nWNJrcchMpMNQO63Gk",
  authDomain: "careerbridge-cb089.firebaseapp.com",
  projectId: "careerbridge-cb089",
  storageBucket: "careerbridge-cb089.firebasestorage.app",
  messagingSenderId: "501798299971",
  appId: "1:501798299971:web:c6dc069231964655a327f6",
  measurementId: "G-GTLJ5GX7HK",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Create admin user
async function createAdminUser() {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      "admin@careerbridge.com",
      "admin123"
    );
    const user = userCredential.user;

    // Add user to Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: "admin@careerbridge.com",
      displayName: "CareerBridge Admin",
      role: "admin",
      createdAt: serverTimestamp(),
    });

    console.log("Admin user created with ID: ", user.uid);
    return user.uid;
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

// Create sample employer user
async function createEmployerUser() {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      "employer@example.com",
      "password123"
    );
    const user = userCredential.user;

    // Add user to Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: "employer@example.com",
      displayName: "Example Employer",
      companyName: "Tech Solutions Inc.",
      role: "employer",
      createdAt: serverTimestamp(),
    });

    console.log("Employer user created with ID: ", user.uid);
    return user.uid;
  } catch (error) {
    console.error("Error creating employer user:", error);
  }
}

// Create sample student user
async function createStudentUser() {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      "student@student.fuhsd.org",
      "password123"
    );
    const user = userCredential.user;

    // Add user to Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: "student@student.fuhsd.org",
      displayName: "Bernard Freund",
      headline: "Sophomore at Cupertino High School",
      about:
        "I'm a senior at Cupertino High School with a passion for computer science and design. I've completed several AP courses including Computer Science A, Calculus BC, and Physics. I'm particularly interested in web development and UI/UX design.",
      phone: "408-555-1234",
      location: "Cupertino, CA",
      role: "student",
      createdAt: serverTimestamp(),
      skills: [
        "HTML5",
        "CSS3",
        "JavaScript",
        "React",
        "Python",
        "Java",
        "Git",
        "UI/UX Design",
        "Figma",
        "Adobe Photoshop",
        "Problem Solving",
        "Team Leadership",
      ],
    });

    console.log("Student user created with ID: ", user.uid);
    return user.uid;
  } catch (error) {
    console.error("Error creating student user:", error);
  }
}

// Create sample job listings
async function createSampleJobs(employerId) {
  try {
    const jobs = [
      {
        jobTitle: "Frontend Developer",
        company: "Tech Solutions Inc.",
        jobType: "Internship",
        workArrangement: "Remote",
        location: "Remote",
        minPay: 25,
        maxPay: 35,
        showPayInListing: true,
        jobDescription:
          "We are looking for a talented Frontend Developer intern to join our team. The ideal candidate will have experience with modern JavaScript frameworks and a strong understanding of responsive design principles.",
        requirements:
          "Knowledge of HTML, CSS, and JavaScript. Familiarity with React is a plus.",
        applicationDeadline: "2025-06-30",
        employerId: employerId,
        dateCreated: serverTimestamp(),
        status: "Approved",
        applications: 24,
        viewCount: 156,
      },
      {
        jobTitle: "Data Science Intern",
        company: "Tech Solutions Inc.",
        jobType: "Internship",
        workArrangement: "Hybrid",
        location: "Cupertino, CA",
        minPay: 30,
        maxPay: 40,
        showPayInListing: true,
        jobDescription:
          "Work with our data science team to analyze large datasets and help extract meaningful insights. You'll learn how to apply machine learning algorithms to solve real-world problems.",
        requirements:
          "Familiar with Python, basics of data analysis, and statistics.",
        applicationDeadline: "2025-06-15",
        employerId: employerId,
        dateCreated: serverTimestamp(),
        status: "Approved",
        applications: 36,
        viewCount: 203,
      },
      {
        jobTitle: "Marketing Assistant",
        company: "Tech Solutions Inc.",
        jobType: "Part-Time",
        workArrangement: "In-Person",
        location: "Cupertino, CA",
        minPay: 22,
        maxPay: 28,
        showPayInListing: true,
        jobDescription:
          "Support our marketing team in creating engaging content for social media, email campaigns, and promotional materials. Help analyze marketing metrics and provide insights.",
        requirements:
          "Strong communication skills, interest in marketing, and ability to work 10-15 hours per week.",
        applicationDeadline: "2025-05-30",
        employerId: employerId,
        dateCreated: serverTimestamp(),
        status: "Pending",
        applications: 0,
        viewCount: 0,
      },
    ];

    for (const job of jobs) {
      const docRef = await addDoc(collection(db, "jobs"), job);
      console.log("Job created with ID: ", docRef.id);
    }

    console.log("Sample jobs created");
  } catch (error) {
    console.error("Error creating sample jobs:", error);
  }
}

// Create sample education entries
async function createSampleEducation(studentId) {
  try {
    const educationEntries = [
      {
        studentId: studentId,
        school: "Cupertino High School",
        degree: "High School Diploma",
        startDate: "2021",
        endDate: "2025 (Expected)",
        gpa: "4.2/4.0",
        description:
          "Taking a college preparatory curriculum with emphasis on STEM courses. Relevant coursework includes AP Computer Science A, AP Calculus BC, AP Physics, and Digital Media Design.",
        createdAt: serverTimestamp(),
      },
      {
        studentId: studentId,
        school: "Codecademy",
        degree: "Front-End Developer Certificate",
        startDate: "January 2023",
        endDate: "June 2023",
        description:
          "Completed comprehensive front-end development program covering HTML, CSS, JavaScript, React, and responsive design principles. Created several projects including a personal portfolio site.",
        createdAt: serverTimestamp(),
      },
    ];

    for (const education of educationEntries) {
      const docRef = await addDoc(collection(db, "education"), education);
      console.log("Education entry created with ID: ", docRef.id);
    }

    console.log("Sample education entries created");
  } catch (error) {
    console.error("Error creating sample education entries:", error);
  }
}

// Create sample experience entries
async function createSampleExperience(studentId) {
  try {
    const experienceEntries = [
      {
        studentId: studentId,
        title: "Web Development Team Lead",
        company: "Cupertino High Tech Club",
        startDate: "Sep 2023",
        endDate: "Present",
        location: "Cupertino, CA",
        description:
          "Lead a team of 5 students to design and develop the club's website. Organized weekly coding sessions and taught web development basics to new members. Implemented a content management system that improved update efficiency by 40%.",
        createdAt: serverTimestamp(),
      },
      {
        studentId: studentId,
        title: "Technology Volunteer",
        company: "Cupertino Library",
        startDate: "Jun 2022",
        endDate: "Aug 2022",
        location: "Cupertino, CA",
        description:
          "Assisted patrons with technology questions and troubleshooting. Helped with computer setup for coding workshops for elementary and middle school students. Created instructional materials for seniors learning basic computer skills.",
        createdAt: serverTimestamp(),
      },
    ];

    for (const experience of experienceEntries) {
      const docRef = await addDoc(collection(db, "experience"), experience);
      console.log("Experience entry created with ID: ", docRef.id);
    }

    console.log("Sample experience entries created");
  } catch (error) {
    console.error("Error creating sample experience entries:", error);
  }
}

// Create sample projects
async function createSampleProjects(studentId) {
  try {
    const projects = [
      {
        studentId: studentId,
        name: "EcoTracker App",
        type: "Web Application",
        startDate: "Jan 2023",
        endDate: "Mar 2023",
        link: "https://github.com/alexmiller/ecotracker",
        description:
          "Developed a web application that helps users track their carbon footprint. Used React for the frontend and Firebase for the backend. Implemented data visualization using Chart.js to help users understand their environmental impact.",
        icon: "fas fa-code",
        createdAt: serverTimestamp(),
      },
      {
        studentId: studentId,
        name: "Study Buddy",
        type: "Mobile App Design",
        startDate: "Oct 2022",
        endDate: "Dec 2022",
        description:
          "Designed a mobile app concept to help high school students organize study groups and collaborate on projects. Created wireframes, prototypes, and user flows using Figma. Conducted user testing with classmates to improve the design.",
        icon: "fas fa-laptop-code",
        createdAt: serverTimestamp(),
      },
    ];

    for (const project of projects) {
      const docRef = await addDoc(collection(db, "projects"), project);
      console.log("Project created with ID: ", docRef.id);
    }

    console.log("Sample projects created");
  } catch (error) {
    console.error("Error creating sample projects:", error);
  }
}

// Create sample accomplishments
async function createSampleAccomplishments(studentId) {
  try {
    const accomplishments = [
      {
        studentId: studentId,
        title: "Congressional App Challenge - Regional Finalist",
        date: "November 2023",
        description:
          "Selected as a regional finalist for the EcoTracker App, which competed against 40+ submissions from high school students across the district. Recognized for innovation in environmental awareness and technical implementation.",
        createdAt: serverTimestamp(),
      },
      {
        studentId: studentId,
        title: "National Honor Society Member",
        date: "2022 - Present",
        description:
          "Selected for membership based on academic achievement, leadership, service, and character. Participated in community service projects including local park cleanups and elementary school tutoring program.",
        createdAt: serverTimestamp(),
      },
      {
        studentId: studentId,
        title: "First Place - School Science Fair",
        date: "March 2023",
        description:
          "Won first place in the Computer Science category for developing a machine learning model that predicts local air quality based on traffic patterns and weather conditions.",
        createdAt: serverTimestamp(),
      },
    ];

    for (const accomplishment of accomplishments) {
      const docRef = await addDoc(
        collection(db, "accomplishments"),
        accomplishment
      );
      console.log("Accomplishment created with ID: ", docRef.id);
    }

    console.log("Sample accomplishments created");
  } catch (error) {
    console.error("Error creating sample accomplishments:", error);
  }
}

// Run all migrations
async function runMigrations() {
  try {
    console.log("Starting migrations...");

    // Create users
    const adminId = await createAdminUser();
    const employerId = await createEmployerUser();
    const studentId = await createStudentUser();

    // Create sample data
    if (employerId) {
      await createSampleJobs(employerId);
    }

    if (studentId) {
      await createSampleEducation(studentId);
      await createSampleExperience(studentId);
      await createSampleProjects(studentId);
      await createSampleAccomplishments(studentId);
    }

    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Error running migrations:", error);
  }
}

// Run migrations
runMigrations();
