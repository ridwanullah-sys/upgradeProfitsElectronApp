const username = document.querySelector("#username");
const password = document.querySelector("#password");
const confirm_password = document.querySelector("#confirm-password");
const username_label = document.querySelector("#username-label");
const confirm_password_label = document.querySelector(
  "#confirm-password-label"
);
const submit_auth = document.querySelector("#submit-auth");
const Input = document.querySelector("#Input");
const error = document.querySelector("#error");
const title = document.querySelector("#title");

let usernameValue;
let passwordValue;
let confirm_passwordValue;
let loading;

const reg = async () => {
  const originalText = submit_auth.innerText;
  error.style.display = "none";
  submit_auth.innerText = "Loading...";
  if (!usernameValue || !passwordValue || !confirm_passwordValue) {
    error.style.display = "block";
    error.innerText = "All inputs are required";
    submit_auth.innerText = originalText;
    throw "All inputs are required";
  }
  if (passwordValue != confirm_passwordValue) {
    error.style.display = "block";
    error.innerText = "Unmatched password";
    submit_auth.innerText = originalText;
    throw "unmatched password";
  }
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(passwordValue, salt);
  const inputs = { usernameValue, passwordValue: hash };
  const string = JSON.stringify(inputs);
  window.localStorage.setItem("user", string);
  ipcRenderer.send("authenticate");
};

const login = async (value) => {
  const originalText = submit_auth.innerText;
  error.style.display = "none";
  submit_auth.innerText = "Loading...";
  const match = await bcrypt.compare(passwordValue, value.passwordValue);
  if (!match) {
    error.style.display = "block";
    error.innerText = "Wrong password";
    submit_auth.innerText = originalText;
    throw "Wrong password";
  }
  ipcRenderer.send("authenticate");
};

const handleAuth = (value) => {
  if (value) {
    username_label.innerText = value.usernameValue;
    submit_auth.innerText = "Login";
    title.Text = "Login";
    submit_auth.addEventListener("click", () => login(value));
    username.style.display = "none";
    confirm_password.style.display = "none";
    confirm_password_label.style.display = "none";
  } else {
    submit_auth.addEventListener("click", reg);
  }
};

username.addEventListener("input", (e) => {
  usernameValue = e.target.value;
});

password.addEventListener("input", (e) => {
  passwordValue = e.target.value;
});

confirm_password.addEventListener("input", (e) => {
  confirm_passwordValue = e.target.value;
});

const string = window.localStorage.getItem("user");
handleAuth(JSON.parse(string));
