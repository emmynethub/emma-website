 
 // Toggle each FAQ answer open or closed.
    document.querySelectorAll(".faq-question").forEach(function (button) {
      button.addEventListener("click", function () {
        const item = button.closest(".faq-item");
        const isOpen = item.classList.toggle("open");
        button.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    });

    // Search the questions and answers as the visitor types.
    const searchInput = document.getElementById("faqSearch");
    const faqItems = Array.from(document.querySelectorAll(".faq-item"));
    const answerCards = Array.from(document.querySelectorAll(".answer-card"));
    const noResults = document.getElementById("noResults");

    searchInput.addEventListener("input", function () {
      const query = searchInput.value.toLowerCase().trim();
      let matches = 0;

      // Hide or show each question based on its question and answer text.
      faqItems.forEach(function (item) {
        const text = item.innerText.toLowerCase();
        const matched = text.includes(query);
        item.style.display = matched ? "" : "none";
        if (matched) matches++;
      });

      // During a search, show matching summary cards instead of the default examples.
      answerCards.forEach(function (card) {
        const text = card.innerText.toLowerCase();
        const matched = query !== "" && text.includes(query);
        card.classList.toggle("visible", matched);
      });

      noResults.style.display = query !== "" && matches === 0 ? "block" : "none";

      // With an empty search, restore the four highlighted answer cards from the reference.
      if (query === "") {
        answerCards.forEach(function (card) { card.classList.add("visible"); });
      }
    });

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

