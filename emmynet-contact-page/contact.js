
/* Mobile dropdown menu */
const menuToggle = document.getElementById("menuToggle");
const navbar = document.querySelector(".navbar");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", function () {
  const isOpen = navbar.classList.toggle("menu-open");

  menuToggle.setAttribute("aria-expanded", isOpen);
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation menu" : "Open navigation menu"
  );
});

/* Close menu after selecting a link */
navLinks.querySelectorAll("a").forEach(function (link) {
  link.addEventListener("click", function () {
    navbar.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
  });
});

document.addEventListener("DOMContentLoaded", function () {

    // Get the status elements from the HTML
    const statusContainer = document.getElementById("statusContainer");
    const statusText = document.getElementById("statusText");

    // Function to update the business status
    function updateBusinessStatus() {

        // Get the current Nigerian time
        const nigeriaTime = new Date();

        const hour = Number(
            new Intl.DateTimeFormat("en-GB", {
                timeZone: "Africa/Lagos",
                hour: "2-digit",
                hour12: false
            }).format(nigeriaTime)
        );

        // Check if the time is between 9 AM and 6 PM
        if (hour >= 9 && hour < 18) {

            // Display online status
            statusText.textContent = "We're Online";

            // Apply online styling
            statusContainer.classList.remove("offline");
            statusContainer.classList.add("online");

        } else {

            // Display offline status
            statusText.textContent = "We're Offline";

            // Apply offline styling
            statusContainer.classList.remove("online");
            statusContainer.classList.add("offline");
        }
    }

    // Check the status immediately after the page loads
    updateBusinessStatus();

    // Check the status again every minute
    setInterval(updateBusinessStatus, 60000);

});