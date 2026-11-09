
const password = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

togglePassword.addEventListener("click", function () {
    if (password.type === "password") {
        password.type = "text";
        togglePassword.classList.replace("bi-eye-slash", "bi-eye");
    } else {
        password.type = "password";
        togglePassword.classList.replace("bi-eye", "bi-eye-slash");
    }
});


const statesByCountry = {
  Nigeria: [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
  "Ekiti", "Enugu", "FCT (Abuja)", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe",
  "Zamfara"
],
  Ghana: ["Greater Accra", "Ashanti", "Western", "Volta"],
  USA: ["California", "Texas", "New York", "Florida"],
};

const countrySelect = document.getElementById("country");
const stateSelect = document.getElementById("state");

countrySelect.addEventListener("change", function () {
  stateSelect.innerHTML = '<option value="" disabled selected>Select state</option>';

  const states = statesByCountry[this.value] || [];
  states.forEach(function (state) {
    const option = document.createElement("option");
    option.value = state;
    option.textContent = state;
    stateSelect.appendChild(option);
  });

  stateSelect.disabled = false;
});