import BaseController from "./basecontroller.js";
import MyModel from "../model/model.js";
import { $, navigate } from "../tools.js";

class SignupController extends BaseController {
  constructor() {
    super();
    this.model = new MyModel();
    this.addEventListeners();
    this.signupForm = $("#signup-form");
    this.signupForm.addEventListener("submit", (event) =>
      this.handleSignup(event)
    );
  }

  addEventListeners() {
    $("#login-btn").addEventListener("click", () => navigate("login"));
    $("#cancel-signup").addEventListener("click", () => navigate("index"));
  }

  async handleSignup(event) {
    event.preventDefault();

    const recaptchaToken = await new Promise((resolve) => {
      grecaptcha
        .execute("6LcVbuUlAAAAAM2yDQS6571-zE7g7-_McQU2yDfC", {
          action: "signup",
        })
        .then(resolve);
    });

    // Expression régulière pour valider les noms
    const nameRegex = /^[A-Za-z\s]+$/;

    const firstName = $("#firstName").value.trim();
    const lastName = $("#lastName").value.trim();
    const passwordInput = $("#password");
    const password = passwordInput.value.trim();
    const isAdmin = false;

    // Vérifie si le prénom est valide
    if (!nameRegex.test(firstName)) {
      Swal.fire(
        "Erreur",
        "Le prénom doit contenir uniquement des lettres.",
        "error"
      );
      return;
    }

    // Nettoyer et valider le prénom
    if (firstName.length > 50) {
      Swal.fire(
        "Erreur",
        "Le prénom doit avoir moins de 50 caractères.",
        "error"
      );
      return;
    }

    // Vérifie si le nom est valide
    if (!nameRegex.test(lastName)) {
      Swal.fire(
        "Erreur",
        "Le nom doit contenir uniquement des lettres.",
        "error"
      );
      return;
    }

    // Nettoyer et valider le nom
    if (lastName.length > 50) {
      Swal.fire("Erreur", "Le nom doit avoir moins de 50 caractères.", "error");
      return;
    }

    // Vérifier si le mot de passe est trop court
    if (password.length < 5) {
      Swal.fire(
        "Erreur",
        "Le mot de passe doit contenir au moins 5 caractères.",
        "error"
      );
      return;
    }

    // Nettoyer et valider le mot de passe
    if (password.length > 50) {
      Swal.fire(
        "Erreur",
        "Le mot de passe doit contenir entre 5 et 50 caractères.",
        "error"
      );
      return;
    }

    try {
      const response = await this.model.signup(
        firstName,
        lastName,
        password,
        isAdmin,
        recaptchaToken
      );
      console.log("Signup response:", response);

      if (response.success) {
        Swal.fire({
          icon: "success",
          title: "Inscription réussie !",
          buttonsStyling: false,
          customClass: {
            confirmButton: "btn",
          },
        });
        navigate("login");
      }
    } catch (error) {
      console.error("Error signing up:", error);

      if (error.status === 400) {
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: "Un utilisateur avec ce prénom existe déjà.",
          buttonsStyling: false,
          customClass: {
            confirmButton: "btn",
          },
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: "Une erreur s'est produite pendant l'inscription. Veuillez réessayer.",
          buttonsStyling: false,
          customClass: {
            confirmButton: "btn",
          },
        });
      }
    }
  }
}

export default () => (window.signupController = new SignupController());
