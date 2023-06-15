import BaseController from "./basecontroller.js";
import MyModel from "../model/model.js";
import { $, navigate } from "../tools.js";

class LoginController extends BaseController {
  constructor() {
    super();
    this.model = new MyModel();
    this.addEventListeners();
    this.loginForm = $("#login-form");
    this.loginForm.addEventListener("submit", (event) =>
      this.handleLogin(event)
    );
  }

  addEventListeners() {
    $("#signup-btn").addEventListener("click", () => navigate("signup"));
    $("#cancel-login").addEventListener("click", () => navigate("index"));
  }

  async handleLogin(event) {
    event.preventDefault();
    const firstName = $("#firstName").value;
    const password = $("#password").value;

    try {
      const response = await this.model.login(firstName, password);
      console.log("Login response:", response);

      if (response.token) {
        localStorage.setItem("jwt_token", response.token);
        navigate("index");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Mot de passe ou nom d'utilisateur incorrect !",
        buttonsStyling: false,
        customClass: {
          confirmButton: "btn",
        },
      });
    }
  }
}

export default () => (window.loginController = new LoginController());
