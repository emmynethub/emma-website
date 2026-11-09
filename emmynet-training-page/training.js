 
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

// Open pop-up
function openContactPopup() {
    document.getElementById("contactPopup").style.display = "flex";
}

// Close pop-up
function closeContactPopup() {
    document.getElementById("contactPopup").style.display = "none";
}

// Close pop-up when clicking outside
window.addEventListener("click", function(event) {
    const popup = document.getElementById("contactPopup");

    if (event.target === popup) {
        closeContactPopup();
    }
});

 // Simple interactive dots for the testimonials section.
    // Replace these sample testimonials with your real learner feedback before publishing.
    const testimonialSets = [
      [
        { image: "assets/testimonial-david.jpg", alt: "David O.", quote: "Before Emmynet ICT Hub, I had zero coding experience. Today, I’m a Frontend Developer at a great company. The hands-on projects and mentorship changed everything!", name: "— David O.", role: "Frontend Developer at TechNova" },
        { image: "assets/testimonial-mary.jpg", alt: "Mary A.", quote: "The team training program was excellent. Our staff learned practical skills we could apply immediately, and the projects were tailored to our business needs.", name: "— Mary A.", role: "HR Manager, StartUpX" }
      ],
      [
        { image: "assets/testimonial-mary.jpg", alt: "Mary A.", quote: "The instructors made difficult topics easier to understand, and the practical exercises helped me build confidence.", name: "— Mary A.", role: "IT & Data Fundamentals Learner" },
        { image: "assets/testimonial-david.jpg", alt: "David O.", quote: "I finished the course with real projects to show employers and a clearer plan for my technology career.", name: "— David O.", role: "Web Development Graduate" }
      ],
      [
        { image: "assets/testimonial-david.jpg", alt: "David O.", quote: "The mentorship and feedback helped me improve my coding and problem-solving skills every week.", name: "— David O.", role: "Frontend Developer" },
        { image: "assets/testimonial-mary.jpg", alt: "Mary A.", quote: "The training was structured around our team's needs, and we could use the skills straight away.", name: "— Mary A.", role: "Corporate Training Partner" }
      ],
      [
        { image: "assets/testimonial-mary.jpg", alt: "Mary A.", quote: "I appreciated the supportive learning environment and the focus on practical skills, not just theory.", name: "— Mary A.", role: "Training Graduate" },
        { image: "assets/testimonial-david.jpg", alt: "David O.", quote: "The portfolio projects gave me a strong starting point to apply for technology roles.", name: "— David O.", role: "Web Development Graduate" }
      ]
    ];

    const testimonialGrid = document.getElementById("testimonialGrid");
    const dotButtons = document.querySelectorAll(".dots button");

    // Draw the selected pair of testimonials on the page.
    function showTestimonials(setNumber) {
      testimonialGrid.innerHTML = testimonialSets[setNumber].map(item => `
        <article class="testimonial">
          <img src="${item.image}" alt="${item.alt}">
          <div>
            <p><span class="quote-mark">“</span>${item.quote}</p>
            <strong>${item.name}</strong>
            <small>${item.role}</small>
          </div>
        </article>
      `).join("");

      dotButtons.forEach(button => {
        button.classList.toggle("active", Number(button.dataset.set) === setNumber);
      });
    }

    dotButtons.forEach(button => {
      button.addEventListener("click", () => showTestimonials(Number(button.dataset.set)));
    });