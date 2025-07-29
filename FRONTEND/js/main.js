document.addEventListener("DOMContentLoaded", () => {
  // --- GLOBAL VARIABLES & CONSTANTS ---
  const API_BASE_URL = "http://localhost:5000/api"; // Backend API base URL
  const GEMINI_API_KEY = "AIzaSyCdi0D-kXXO0-OdFHD1gNgFRHaMjfNsdQc"; // IMPORTANT: Replace with your actual Gemini API Key
  let currentUser = null;
  let currentToken = null;

  // --- UTILITY & AUTH FUNCTIONS ---
  function showMessageBox(message, type = "info", callback = null) {
    const overlay = document.createElement("div");
    overlay.classList.add("message-box-overlay");
    overlay.innerHTML = `<div class="message-box-content"><p>${message}</p><button id="message-box-ok">OK</button></div>`;
    document.body.appendChild(overlay);
    document.getElementById("message-box-ok").addEventListener("click", () => {
      overlay.remove();
      if (callback) callback();
    });
  }

  function showLoadingSpinner(buttonElement) {
    if (buttonElement) {
      buttonElement.disabled = true;
      buttonElement.dataset.originalText = buttonElement.innerHTML;
      buttonElement.innerHTML = `<span class="loading-spinner"></span> Loading...`;
    }
  }

  function hideLoadingSpinner(buttonElement) {
    if (buttonElement) {
      buttonElement.disabled = false;
      buttonElement.innerHTML = buttonElement.dataset.originalText || "Submit";
    }
  }

  function handleSessionExpired() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    currentUser = null;
    currentToken = null;
    updateAuthUI();
    showMessageBox(
      "Your session has expired. Please log in again.",
      "info",
      () => {
        window.location.href = "login.html";
      }
    );
  }

  async function fetchWithAuth(url, options = {}) {
    const headers = options.headers || {};
    currentToken = localStorage.getItem("token");
    if (currentToken) headers["x-auth-token"] = currentToken;
    options.headers = headers;
    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
        if (!response.ok)
          throw new Error(
            `Server responded with non-JSON content: ${response.statusText}`
          );
      }
      if (!response.ok) {
        const errorMessage = (
          data.msg ||
          data.message ||
          `HTTP error! status: ${response.status}`
        ).toLowerCase();
        if (
          errorMessage.includes("token expired") ||
          errorMessage.includes("jwt expired")
        ) {
          handleSessionExpired();
          throw new Error("SessionExpired");
        }
        throw new Error(
          data.msg || data.message || `HTTP error! status: ${response.status}`
        );
      }
      return data;
    } catch (error) {
      if (error.message === "SessionExpired") throw error;
      console.error("Fetch with Auth Error:", error);
      let displayMessage = `Network or server error: ${error.message}`;
      if (error.message.includes("Failed to fetch")) {
        displayMessage =
          "Could not connect to the backend server. Please ensure it is running and accessible.";
      }
      showMessageBox(displayMessage, "error");
      throw error;
    }
  }

  function checkUserSession() {
    currentToken = localStorage.getItem("token");
    const userString = localStorage.getItem("user");
    currentUser = userString ? JSON.parse(userString) : null;
    updateAuthUI();
  }

  function updateAuthUI() {
    const authNavLink = document.getElementById("auth-nav-link");
    const userProfileLink = document.getElementById("user-profile-link");
    const logoutButton = document.getElementById("logout-button");
    const mobileAuthNavLink = document.getElementById("mobile-auth-nav-link");
    const mobileUserProfileLink = document.getElementById(
      "mobile-user-profile-link"
    );
    const mobileLogoutButton = document.getElementById("mobile-logout-button");
    if (currentToken && currentUser) {
      authNavLink?.classList.add("hidden");
      userProfileLink?.classList.remove("hidden");
      if (userProfileLink) userProfileLink.textContent = "My Profile";
      logoutButton?.classList.remove("hidden");
      mobileAuthNavLink?.classList.add("hidden");
      mobileUserProfileLink?.classList.remove("hidden");
      if (mobileUserProfileLink)
        mobileUserProfileLink.textContent = "My Profile";
      mobileLogoutButton?.classList.remove("hidden");
    } else {
      authNavLink?.classList.remove("hidden");
      userProfileLink?.classList.add("hidden");
      logoutButton?.classList.add("hidden");
      mobileAuthNavLink?.classList.remove("hidden");
      mobileUserProfileLink?.classList.add("hidden");
      mobileLogoutButton?.classList.add("hidden");
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    currentToken = null;
    currentUser = null;
    updateAuthUI();
    showMessageBox("You have been logged out.", "info", () => {
      window.location.href = "index.html";
    });
  }

  // --- PAGE INITIALIZATION ROUTER ---
  function initializePage() {
    checkUserSession();
    const mobileMenuButton = document.getElementById("mobile-menu-button");
    const mobileMenu = document.getElementById("mobile-menu");
    if (mobileMenuButton)
      mobileMenuButton.addEventListener("click", () =>
        mobileMenu?.classList.toggle("hidden")
      );

    const logoutBtn = document.getElementById("logout-button");
    const mobileLogoutBtn = document.getElementById("mobile-logout-button");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);
    if (mobileLogoutBtn) mobileLogoutBtn.addEventListener("click", logout);

    const path = window.location.pathname;
    const protectedPaths = [
      "/dashboard.html",
      "/profile.html",
      "/application.html",
    ];
    if (protectedPaths.some((p) => path.endsWith(p)) && !currentUser) {
      showMessageBox(
        "You must be logged in to access this page.",
        "info",
        () => (window.location.href = "login.html")
      );
      return;
    }

    if (path.endsWith("/") || path.endsWith("/index.html"))
      initializeHomePage();
    else if (path.endsWith("/login.html")) initializeLoginPage();
    else if (path.endsWith("/dashboard.html")) initializeDashboardPage();
    else if (path.endsWith("/profile.html")) initializeProfilePage();
    else if (path.endsWith("/application.html")) initializeApplicationPage();
  }

  // --- HOME PAGE LOGIC ---
  function initializeHomePage() {
    const collegeGrid = document.getElementById("college-grid");
    const searchInput = document.getElementById("search-input");
    const stateSearchInput = document.getElementById("state-search-input");
    const courseSearchInput = document.getElementById("course-search-input");
    const noResultsMessage = document.getElementById("no-results");
    let allColleges = [];

    async function getGeminiSuggestions(prompt) {
        if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
            console.error("Gemini API Key is missing or invalid.");
            noResultsMessage.textContent = "AI search is disabled. Please configure the API Key.";
            noResultsMessage.style.display = "block";
            return [];
        }
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });
                if (!response.ok) {
                    if (response.status >= 500 && attempt < maxRetries) {
                        console.warn(`Attempt ${attempt} failed with status ${response.status}. Retrying...`);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    }
                    const errorData = await response.json();
                    console.error('Gemini API Error Response:', errorData);
                    throw new Error(`API Error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
                }
                const data = await response.json();
                if (!data.candidates || !data.candidates[0].content.parts[0].text) {
                    throw new Error("Invalid response structure from AI.");
                }
                const textResponse = data.candidates[0].content.parts[0].text;
                const jsonStringMatch = textResponse.match(/\[.*\]/s);
                if (!jsonStringMatch) {
                    console.error("AI did not return a valid JSON array. Response was:", textResponse);
                    throw new Error("No valid JSON array found in AI response.");
                }
                return JSON.parse(jsonStringMatch[0]);
            } catch (error) {
                console.error(`Error on attempt ${attempt}:`, error);
                if (attempt === maxRetries) {
                    noResultsMessage.textContent = `An error occurred with the AI search. ${error.message}`;
                    noResultsMessage.style.display = 'block';
                    return [];
                }
            }
        }
        return [];
    }

    async function fetchAndRenderResults() {
        const collegeQuery = searchInput.value.toLowerCase();
        const stateQuery = stateSearchInput.value.toLowerCase();
        const courseQuery = courseSearchInput.value.toLowerCase();

        collegeGrid.innerHTML = `<p class="text-center text-gray-500 col-span-full">Searching for colleges...</p>`;
        noResultsMessage.style.display = "none";

        let prompt = `Based on our database of colleges, find institutions that match the following criteria:
            - College Name contains: "${collegeQuery}"
            - State contains: "${stateQuery}"
            - Offers courses related to: "${courseQuery}"
            Prioritize colleges from this existing list if they match: ${JSON.stringify(allColleges.map(c => ({name: c.name, location: c.location, description: c.description, imageUrl: c.imageUrl, id: c.id})))}.
            If no direct matches are found from the list, suggest up to 3 realistic, well-known fictional or real colleges in India that fit the criteria perfectly.
            Return the result as a JSON array of objects. Each object must have "name", "location", and "description" keys. If it's from the database, also include its "id" and "imageUrl". For new suggestions, create a placeholder image URL from placehold.co, like "https://placehold.co/600x400/000000/FFFF00?text=XYZ".`;

        const suggestedColleges = await getGeminiSuggestions(prompt);
        renderColleges(suggestedColleges);
    }

    function renderColleges(collegesToRender) {
        collegeGrid.innerHTML = "";
        if (!collegesToRender || collegesToRender.length === 0) {
            noResultsMessage.style.display = "block";
            return;
        }
        noResultsMessage.style.display = "none";
        collegesToRender.forEach((college) => {
            const card = document.createElement("div");
            card.className = "bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition duration-300 college-card";
            const imageUrl = college.imageUrl || `https://placehold.co/600x400/000000/FFFF00?text=${college.name.split(" ").map((n) => n[0]).join("") || "C"}`;
            const applyButton = college.id
                ? `<button class="apply-btn w-full bg-yellow-400 text-black font-bold py-2 px-4 rounded-md hover:bg-yellow-500 transition" data-id="${college.id}" data-name="${college.name}">Apply Now</button>`
                : `<button class="apply-btn w-full bg-gray-300 text-gray-600 font-bold py-2 px-4 rounded-md cursor-not-allowed" title="This is an AI suggestion and cannot be applied to directly." disabled>Apply Now</button>`;
            card.innerHTML = `
                <img src="${imageUrl}" alt="${college.name}" class="w-full h-48 object-cover">
                <div class="p-6">
                    <h3 class="text-xl font-bold mb-2">${college.name} ${!college.id ? '<span class="text-sm text-blue-500">(AI Suggestion)</span>' : ""}</h3>
                    <p class="text-gray-600 text-sm mb-4">📍 ${college.location}</p>
                    <p class="text-gray-700 mb-6 college-description">${college.description || "A renowned institution."}</p>
                    ${applyButton}
                </div>`;
            collegeGrid.appendChild(card);
        });
    }

    async function initialFetch() {
        try {
            allColleges = await fetchWithAuth(`${API_BASE_URL}/colleges`);
            renderColleges(allColleges);
        } catch (error) {
            noResultsMessage.style.display = "block";
            noResultsMessage.textContent = "Failed to load initial college list.";
        }
    }

    let debounceTimer;
    function handleInput() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(fetchAndRenderResults, 600);
    }

    searchInput.addEventListener("input", handleInput);
    stateSearchInput.addEventListener("input", handleInput);
    courseSearchInput.addEventListener("input", handleInput);

    collegeGrid.addEventListener("click", (e) => {
        if (e.target.classList.contains("apply-btn") && !e.target.disabled) {
            const collegeId = e.target.dataset.id;
            const collegeName = e.target.dataset.name;
            if (!currentUser) {
                showMessageBox("Please login as a student to apply.", "info", () => {
                    localStorage.setItem("postLoginRedirect", `application.html?id=${collegeId}&name=${encodeURIComponent(collegeName)}`);
                    window.location.href = "login.html";
                });
            } else {
                window.location.href = `application.html?id=${collegeId}&name=${encodeURIComponent(collegeName)}`;
            }
        }
    });

    initialFetch();
  }

  // --- LOGIN PAGE LOGIC ---
  function initializeLoginPage() {
    if (currentUser) {
      window.location.href = "dashboard.html";
      return;
    }
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const tabButtons = document.querySelectorAll(".tab-button");
    const authForms = document.querySelectorAll(".auth-form");

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        tabButtons.forEach((btn) => btn.classList.remove("active-tab"));
        authForms.forEach((form) => form.classList.remove("active-form"));
        document.getElementById(`${button.dataset.tab}-form`).classList.add("active-form");
        button.classList.add("active-tab");
      });
    });

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
      const loginBtn = loginForm.querySelector('button[type="submit"]');
      showLoadingSpinner(loginBtn);
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || "Login failed");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        showMessageBox("Login successful!", "success", () => {
          const redirectUrl = localStorage.getItem("postLoginRedirect");
          if (redirectUrl) {
            localStorage.removeItem("postLoginRedirect");
            window.location.href = redirectUrl;
          } else {
            window.location.href = "dashboard.html";
          }
        });
      } catch (error) {
        showMessageBox(error.message, "error");
      } finally {
        hideLoadingSpinner(loginBtn);
      }
    });

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fullName = document.getElementById("register-fullName").value;
      const email = document.getElementById("register-email").value;
      const password = document.getElementById("register-password").value;
      const registerBtn = registerForm.querySelector('button[type="submit"]');
      showLoadingSpinner(registerBtn);
      try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, email, password, role: "student" }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || "Registration failed");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        showMessageBox("Registration successful!", "success", () => {
          window.location.href = "dashboard.html";
        });
      } catch (error) {
        showMessageBox(error.message, "error");
      } finally {
        hideLoadingSpinner(registerBtn);
      }
    });
  }

  // --- APPLICATION PAGE LOGIC ---
  function initializeApplicationPage() {
    const applicationForm = document.getElementById("application-form");
    const applyingCollegeNameEl = document.getElementById("applying-college-name");
    const fullNameAppInput = document.getElementById("fullName-app");
    const emailAppInput = document.getElementById("email-app");
    const programOfInterestInput = document.getElementById("programOfInterest");

    const params = new URLSearchParams(window.location.search);
    const collegeId = params.get("id") || params.get("collegeId");
    const collegeName = params.get("name");
    const resubmitId = params.get("resubmitId");

    if (!collegeName) {
      showMessageBox(
        "Invalid application link: missing college name.", "error",
        () => (window.location.href = "index.html")
      );
      return;
    }

    if (resubmitId) {
      document.querySelector("h2").textContent = "Resubmit Application";
      fetchWithAuth(`${API_BASE_URL}/applications/${resubmitId}`)
        .then((appData) => {
          programOfInterestInput.value = appData.programOfInterest;
        })
        .catch((err) =>
          console.error("Could not fetch old application data", err)
        );
    }

    applyingCollegeNameEl.textContent = collegeName;
    if (currentUser) {
      fullNameAppInput.value = currentUser.fullName;
      emailAppInput.value = currentUser.email;
    }

    applicationForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = applicationForm.querySelector('button[type="submit"]');
      showLoadingSpinner(submitBtn);

      const payload = {
        collegeId: collegeId,
        programOfInterest: programOfInterestInput.value,
      };

      const isResubmit = !!resubmitId;
      const url = isResubmit
        ? `${API_BASE_URL}/applications/${resubmitId}`
        : `${API_BASE_URL}/applications`;
      const method = isResubmit ? "PUT" : "POST";

      try {
        await fetchWithAuth(url, {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        showMessageBox(
          `Application ${isResubmit ? "resubmitted" : "submitted"} successfully!`, "success",
          () => {
            window.location.href = "dashboard.html";
          }
        );
      } catch (error) {
        if (error.message !== "SessionExpired") {
          showMessageBox(`Submission failed: ${error.message}`, "error");
        }
      } finally {
        hideLoadingSpinner(submitBtn);
      }
    });
  }

  // --- PROFILE PAGE LOGIC ---
  function initializeProfilePage() {
    const mainHeading = document.getElementById("profile-main-heading");
    if (currentUser && currentUser.fullName) {
      mainHeading.textContent = `${currentUser.fullName}'s Profile`;
    }
    const viewModeContainer = document.getElementById("profile-view-mode");
    const editModeContainer = document.getElementById("profile-edit-mode");
    const profileForm = document.getElementById("profile-form");
    const editProfileBtn = document.getElementById("edit-profile-btn");
    const cancelEditBtn = document.getElementById("cancel-edit-btn");
    const viewFullName = document.getElementById("view-fullName");
    const viewEmail = document.getElementById("view-email");
    const viewPhone = document.getElementById("view-phone");
    const viewDob = document.getElementById("view-dob");
    const viewAddress = document.getElementById("view-address");
    const view10thSchool = document.getElementById("view-10thSchool");
    const view10thMarks = document.getElementById("view-10thMarks");
    const view12thSchool = document.getElementById("view-12thSchool");
    const view12thMarks = document.getElementById("view-12thMarks");
    const viewSkills = document.getElementById("view-skills");
    const viewInterests = document.getElementById("view-interests");
    const profileFullNameInput = document.getElementById("profile-fullName");
    const profileEmailInput = document.getElementById("profile-email");
    const profilePhoneInput = document.getElementById("profile-phone");
    const profileDobInput = document.getElementById("profile-dob");
    const profileAddressInput = document.getElementById("profile-address");
    const profile10thSchoolInput = document.getElementById("profile-10thSchool");
    const profile10thMarksInput = document.getElementById("profile-10thMarks");
    const profile12thSchoolInput = document.getElementById("profile-12thSchool");
    const profile12thMarksInput = document.getElementById("profile-12thMarks");
    const profileSkillsInput = document.getElementById("profile-skills");
    const profileInterestsInput = document.getElementById("profile-interests");

    function toggleProfileMode(mode) {
      if (mode === "edit") {
        viewModeContainer.classList.add("hidden");
        editModeContainer.classList.remove("hidden");
        editProfileBtn.classList.add("hidden");
      } else {
        editModeContainer.classList.add("hidden");
        viewModeContainer.classList.remove("hidden");
        editProfileBtn.classList.remove("hidden");
      }
    }

    async function renderProfile() {
      if (!currentUser) return;
      profileFullNameInput.value = currentUser.fullName;
      profileEmailInput.value = currentUser.email;
      viewFullName.textContent = currentUser.fullName;
      viewEmail.textContent = currentUser.email;
      try {
        const profileData = await fetchWithAuth(`${API_BASE_URL}/profile/me`);
        viewPhone.textContent = profileData.phoneNumber || "-";
        viewDob.textContent = profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString() : "-";
        viewAddress.textContent = profileData.address || "-";
        view10thSchool.textContent = profileData.education?.grade10?.school || "-";
        view10thMarks.textContent = profileData.education?.grade10?.marks || "-";
        view12thSchool.textContent = profileData.education?.grade12?.school || "-";
        view12thMarks.textContent = profileData.education?.grade12?.marks || "-";
        viewSkills.textContent = Array.isArray(profileData.skills) && profileData.skills.length > 0 ? profileData.skills.join(", ") : "-";
        viewInterests.textContent = Array.isArray(profileData.interests) && profileData.interests.length > 0 ? profileData.interests.join(", ") : "-";
        profilePhoneInput.value = profileData.phoneNumber || "";
        profileDobInput.value = profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split("T")[0] : "";
        profileAddressInput.value = profileData.address || "";
        profile10thSchoolInput.value = profileData.education?.grade10?.school || "";
        profile10thMarksInput.value = profileData.education?.grade10?.marks || "";
        profile12thSchoolInput.value = profileData.education?.grade12?.school || "";
        profile12thMarksInput.value = profileData.education?.grade12?.marks || "";
        profileSkillsInput.value = Array.isArray(profileData.skills) ? profileData.skills.join(", ") : "";
        profileInterestsInput.value = Array.isArray(profileData.interests) ? profileData.interests.join(", ") : "";
      } catch (error) {
        if (error.message !== "SessionExpired") {
          console.error("Failed to fetch profile. A new one can be created.");
        }
      } finally {
        toggleProfileMode("view");
      }
    }

    editProfileBtn.addEventListener("click", () => toggleProfileMode("edit"));
    cancelEditBtn.addEventListener("click", () => {
      toggleProfileMode("view");
      renderProfile();
    });

    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const saveBtn = profileForm.querySelector('button[type="submit"]');
      showLoadingSpinner(saveBtn);
      const profileData = {
        phoneNumber: profilePhoneInput.value,
        dateOfBirth: profileDobInput.value,
        address: profileAddressInput.value,
        education: {
          grade10: { school: profile10thSchoolInput.value, marks: profile10thMarksInput.value },
          grade12: { school: profile12thSchoolInput.value, marks: profile12thMarksInput.value }
        },
        skills: profileSkillsInput.value.split(",").map((s) => s.trim()).filter(Boolean),
        interests: profileInterestsInput.value.split(",").map((i) => i.trim()).filter(Boolean),
      };
      try {
        await fetchWithAuth(`${API_BASE_URL}/profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileData),
        });
        showMessageBox("Profile saved successfully!", "success");
        await renderProfile();
      } catch (error) {
        if (error.message !== "SessionExpired")
          showMessageBox(`Failed to save profile: ${error.message}`, "error");
      } finally {
        hideLoadingSpinner(saveBtn);
        toggleProfileMode("view");
      }
    });
    
    renderProfile();
  }

  // --- DASHBOARD PAGE LOGIC ---
  function initializeDashboardPage() {
    const dashboardContent = document.getElementById("dashboard-content");
    const modal = document.getElementById("details-modal");
    const modalContent = document.getElementById("modal-content");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const resubmitRequestBtn = document.getElementById("resubmit-request-btn");
    let applicationsData = [];
    let currentAppId = null;

    function openDetailsModal(app) {
      currentAppId = app.id;
      document.getElementById("modal-college-name").textContent = app.college.name;
      document.getElementById("modal-program").textContent = app.programOfInterest;
      document.getElementById("modal-applicant-name").textContent = currentUser.fullName;
      document.getElementById("modal-submission-date").textContent = new Date(app.submissionDate).toLocaleDateString();
      const statusText = app.status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      document.getElementById("modal-status").textContent = statusText;
      const adminNotesSection = document.getElementById("modal-admin-notes-section");
      if (app.adminNotes) {
        document.getElementById("modal-admin-notes").textContent = app.adminNotes;
        adminNotesSection.classList.remove("hidden");
      } else {
        adminNotesSection.classList.add("hidden");
      }
      const resubmitSection = document.getElementById("modal-resubmit-section");
      if (app.status === "pending" || app.status === "rejected") {
        resubmitSection.classList.remove("hidden");
        resubmitRequestBtn.disabled = false;
        resubmitRequestBtn.textContent = "Request to Resubmit Application";
      } else {
        resubmitSection.classList.add("hidden");
      }
      modal.classList.remove("hidden");
      setTimeout(() => modalContent.classList.remove("opacity-0", "-translate-y-4"), 50);
    }

    function closeDetailsModal() {
      modalContent.classList.add("opacity-0", "-translate-y-4");
      setTimeout(() => modal.classList.add("hidden"), 300);
    }

    dashboardContent.addEventListener("click", (e) => {
      const viewBtn = e.target.closest(".view-details-btn");
      if (viewBtn) {
        const appId = viewBtn.dataset.appId;
        const selectedApp = applicationsData.find((app) => app.id.toString() === appId);
        if (selectedApp) openDetailsModal(selectedApp);
      }
      const resubmitBtn = e.target.closest(".resubmit-btn");
      if (resubmitBtn) {
        const appId = resubmitBtn.dataset.appId;
        const collegeId = resubmitBtn.dataset.collegeId;
        const collegeName = resubmitBtn.dataset.collegeName;
        window.location.href = `application.html?resubmitId=${appId}&collegeId=${collegeId}&name=${encodeURIComponent(collegeName)}`;
      }
    });

    closeModalBtn.addEventListener("click", closeDetailsModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeDetailsModal();
    });

    resubmitRequestBtn.addEventListener("click", async () => {
      if (
        !currentAppId ||
        !confirm("Are you sure you want to request a resubmission? This should only be done if your information was incorrect.")
      )
        return;
      showLoadingSpinner(resubmitRequestBtn);
      try {
        await fetchWithAuth(
          `${API_BASE_URL}/applications/${currentAppId}/request-resubmit`,
          {
            method: "POST",
          }
        );
        showMessageBox(
          "Your request has been sent successfully. You will be notified when an admin reviews it.",
          "success",
          () => {
            closeDetailsModal();
            renderDashboard(dashboardContent, (data) => {
              applicationsData = data;
            });
          }
        );
      } catch (error) {
        if (error.message !== "SessionExpired")
          showMessageBox(`Error: ${error.message}`, "error");
      } finally {
        hideLoadingSpinner(resubmitRequestBtn);
      }
    });

    renderDashboard(dashboardContent, (data) => {
      applicationsData = data;
    });
  }

  async function renderDashboard(dashboardContent, onDataFetched) {
    dashboardContent.innerHTML = `<div class="text-center py-12"><div class="loading-spinner w-12 h-12 mx-auto"></div><p class="text-gray-600 mt-4">Loading applications...</p></div>`;
    try {
      const applications = await fetchWithAuth(
        `${API_BASE_URL}/applications/me`
      );
      if (onDataFetched) onDataFetched(applications);
      if (applications.length === 0) {
        dashboardContent.innerHTML = `<div class="bg-gray-100 text-center py-12 px-6 rounded-lg"><h3 class="text-xl font-semibold text-gray-700">No applications found.</h3><p class="text-gray-500 mt-2">Find your ideal institution and apply today!</p><a href="index.html" class="mt-6 inline-block bg-yellow-400 text-black font-bold py-2 px-6 rounded-md hover:bg-yellow-500 transition">Browse Colleges</a></div>`;
        return;
      }
      dashboardContent.innerHTML = "";
      applications.forEach((app) => {
        const appCard = document.createElement("div");
        appCard.className = "bg-white p-6 rounded-xl shadow-lg mb-6";
        if (app.status === "resubmission_approved") {
          appCard.innerHTML = `
                        <div class="flex flex-col sm:flex-row justify-between sm:items-center">
                            <div>
                                <h3 class="text-xl font-bold text-gray-900">${app.college.name}</h3>
                                <p class="text-sm text-blue-600 font-semibold">Your request to resubmit has been approved.</p>
                                <p class="text-sm text-gray-500">Please correct your details and submit again.</p>
                            </div>
                            <div class="mt-4 sm:mt-0">
                                <button class="resubmit-btn text-white bg-green-500 hover:bg-green-600 font-bold px-4 py-2 rounded-md transition" data-app-id="${app.id}" data-college-id="${app.college.id}" data-college-name="${app.college.name}">Resubmit Now</button>
                            </div>
                        </div>`;
        } else {
          let statusClass, statusText;
          switch (app.status) {
            case "approved":
              statusClass = "bg-green-100 text-green-800";
              statusText = "Approved";
              break;
            case "rejected":
              statusClass = "bg-red-100 text-red-800";
              statusText = "Rejected";
              break;
            default:
              statusClass = "bg-orange-100 text-orange-800";
              statusText = "Pending Review";
              break;
          }
          appCard.innerHTML = `
                        <div class="flex flex-col sm:flex-row justify-between sm:items-center">
                            <div>
                                <h3 class="text-xl font-bold text-gray-900">${app.college.name}</h3>
                                <p class="text-sm text-gray-500">Submitted on: ${new Date(app.submissionDate).toLocaleDateString()}</p>
                                <p class="text-sm text-gray-500">Program: ${app.programOfInterest}</p>
                            </div>
                            <div class="mt-4 sm:mt-0 flex items-center space-x-3">
                                <span class="text-sm font-medium px-3 py-1 rounded-full ${statusClass}">${statusText}</span>
                                <button class="view-details-btn text-sm bg-gray-200 text-gray-800 px-3 py-1 rounded-md hover:bg-gray-300 transition" data-app-id="${app.id}">View Details</button>
                            </div>
                        </div>`;
        }
        dashboardContent.appendChild(appCard);
      });
    } catch (error) {
      if (error.message !== "SessionExpired") {
        dashboardContent.innerHTML = `<div class="text-center text-red-500">Failed to load dashboard. ${error.message}</div>`;
      }
    }
  }

  // --- START THE APP ---
  initializePage();
});