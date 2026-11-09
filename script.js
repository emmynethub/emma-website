// Open and close the mobile navigation dropdown.
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

menuToggle.addEventListener("click", function () {
  const menuIsOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", menuIsOpen);
});

// Close the dropdown after a visitor chooses a page section.
mainNav.querySelectorAll("a").forEach(function (link) {
  link.addEventListener("click", function () {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});
