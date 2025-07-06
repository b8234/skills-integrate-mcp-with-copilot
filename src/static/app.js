document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  // Toolbar controls
  const filterCategory = document.getElementById("filter-category");
  const sortActivities = document.getElementById("sort-activities");
  const searchActivities = document.getElementById("search-activities");

  let allActivities = {};

  // Helper: Extract category from activity name (demo purpose)
  function getCategory(name, details) {
    // Example: Use first word as category, or add a 'category' field to backend for real use
    if (details.category) return details.category;
    if (name.toLowerCase().includes("team")) return "Sports";
    if (name.toLowerCase().includes("club")) return "Club";
    if (name.toLowerCase().includes("class")) return "Class";
    if (name.toLowerCase().includes("debate")) return "Debate";
    return "Other";
  }

  // Populate category filter
  function populateCategories(activities) {
    const categories = new Set();
    Object.entries(activities).forEach(([name, details]) => {
      categories.add(getCategory(name, details));
    });
    filterCategory.innerHTML = '<option value="">All</option>' +
      Array.from(categories)
        .map((cat) => `<option value="${cat}">${cat}</option>`)
        .join("");
  }

  // Render activities with filters, sort, and search
  function renderActivities() {
    let filtered = Object.entries(allActivities);
    // Filter by category
    if (filterCategory.value) {
      filtered = filtered.filter(
        ([name, details]) => getCategory(name, details) === filterCategory.value
      );
    }
    // Search
    const search = searchActivities.value.trim().toLowerCase();
    if (search) {
      filtered = filtered.filter(
        ([name, details]) =>
          name.toLowerCase().includes(search) ||
          details.description.toLowerCase().includes(search) ||
          details.schedule.toLowerCase().includes(search)
      );
    }
    // Sort
    if (sortActivities.value === "name") {
      filtered.sort((a, b) => a[0].localeCompare(b[0]));
    } else if (sortActivities.value === "time") {
      filtered.sort((a, b) => a[1].schedule.localeCompare(b[1].schedule));
    }
    // Render
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
    filtered.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";
      const spotsLeft = details.max_participants - details.participants.length;
      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;
      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;
      activitiesList.appendChild(activityCard);
      // Add option to select dropdown
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  // Fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      allActivities = await response.json();
      populateCategories(allActivities);
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML = "<p>Error loading activities.</p>";
    }
  }

  // Event listeners for toolbar
  filterCategory.addEventListener("change", renderActivities);
  sortActivities.addEventListener("change", renderActivities);
  searchActivities.addEventListener("input", renderActivities);

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );
      const result = await response.json();
      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    }
  });

  // Initialize app
  fetchActivities();
});
