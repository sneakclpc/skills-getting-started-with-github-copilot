document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="spots-left">${spotsLeft} spots left</span></p>
          <div class="participant-section">
            <h5>Participants (${details.participants.length})</h5>
            <ul class="participant-list"></ul>
          </div>
        `;

        const participantList = activityCard.querySelector(".participant-list");
        const participantHeading = activityCard.querySelector(".participant-section h5");
        const spotsLeftLabel = activityCard.querySelector(".spots-left");

        if (details.participants.length === 0) {
          const emptyItem = document.createElement("li");
          emptyItem.className = "empty-participants";
          emptyItem.textContent = "No participants yet";
          participantList.appendChild(emptyItem);
        }

        details.participants.forEach((email) => {
          const listItem = document.createElement("li");
          const emailLabel = document.createElement("span");
          emailLabel.textContent = email;
          listItem.appendChild(emailLabel);

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "remove-participant";
          removeButton.setAttribute("aria-label", `Remove ${email} from ${name}`);
          removeButton.title = "Remove participant";
          removeButton.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M4 7h16M10 11v6M14 11v6M5 7l1 14h12l1-14M9 7V4h6v3" />
            </svg>
          `;
          removeButton.addEventListener("click", async () => {
            removeButton.disabled = true;

            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );
              const result = await response.json();

              if (!response.ok) {
                throw new Error(result.detail || "Unable to remove participant");
              }

              listItem.remove();
              const remainingParticipants = participantList.querySelectorAll("li").length;
              participantHeading.textContent = `Participants (${remainingParticipants})`;
              spotsLeftLabel.textContent = `${details.max_participants - remainingParticipants} spots left`;

              if (remainingParticipants === 0) {
                const emptyItem = document.createElement("li");
                emptyItem.className = "empty-participants";
                emptyItem.textContent = "No participants yet";
                participantList.appendChild(emptyItem);
              }

              messageDiv.textContent = result.message;
              messageDiv.className = "success";
              messageDiv.classList.remove("hidden");
            } catch (error) {
              removeButton.disabled = false;
              messageDiv.textContent = error.message || "Failed to remove participant. Please try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
              console.error("Error removing participant:", error);
            }
          });

          listItem.appendChild(removeButton);
          participantList.appendChild(listItem);
        });

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
