import BaseController from "./basecontroller.js";
import MyModel from "../model/model.js";
import { $, navigate } from "../tools.js";

class AccountController extends BaseController {
  constructor() {
    super();
    this.model = new MyModel();
    this.checkTokenAndLoadAccountInfo();
    this.displayFavoriteMovies();
    this.addEventListeners();
  }

  addEventListeners() {
    $("#logout-btn").addEventListener("click", () => this.logout());
    $("#back-btn").addEventListener("click", () => navigate("index"));
    $("#delete-btn").addEventListener("click", () => this.deleteAccount());
  }

  async deleteAccount() {
    const confirmation = await Swal.fire({
      title: "Supprimer le compte",
      text: "Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible.",
      icon: "warning",
      buttonsStyling: false,
      customClass: {
        confirmButton: "btn",
        cancelButton: "btn btn--outline",
      },
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer mon compte",
      cancelButtonText: "Annuler",
    });

    if (confirmation.isConfirmed) {
      try {
        const token = localStorage.getItem("jwt_token");
        await this.model.deleteAccount(token);
        console.log("Le compte a été supprimé avec succès.");
        Swal.fire({
          title: "Compte supprimé",
          text: "Votre compte a été supprimé avec succès.",
          icon: "success",
          buttonsStyling: false,
          customClass: {
            confirmButton: "btn",
          },
        });
        localStorage.removeItem("jwt_token");
        navigate("index");
      } catch (error) {
        Swal.fire({
          title: "Erreur",
          text: "Une erreur s'est produite lors de la suppression de votre compte.",
          icon: "error",
          buttonsStyling: false,
          customClass: {
            confirmButton: "btn",
          },
        });
      }
    }
  }

  async logout() {
    const confirmation = await Swal.fire({
      title: "Déconnexion",
      text: "Voulez-vous vraiment vous déconnecter ?",
      icon: "warning",
      buttonsStyling: false,
      customClass: {
        confirmButton: "btn",
        cancelButton: "btn btn--outline",
      },
      showCancelButton: true,
      confirmButtonText: "Oui, déconnectez-moi",
      cancelButtonText: "Annuler",
    });

    if (confirmation.isConfirmed) {
      Swal.fire({
        title: "Déconnexion réussie",
        icon: "success",
        buttonsStyling: false,
        customClass: {
          confirmButton: "btn",
        },
      });
      localStorage.removeItem("jwt_token");
      navigate("index");
    }
  }

  async checkTokenAndLoadAccountInfo() {
    try {
      const token = localStorage.getItem("jwt_token");
      if (token) {
        const isValid = await this.model.verifyToken(token);
        if (isValid) {
          this.loadAccountInfo(token);
        } else {
          console.error("Invalid token");
        }
      }
    } catch (error) {
      console.error("Error checking token:", error);
    }
  }

  async loadAccountInfo(token) {
    try {
      const userInfo = await this.model.getAccountInfo(token);
      $("#account-firstname").textContent = userInfo.firstName;
      $("#account-lastname").textContent = userInfo.lastName;
      $("#account-is-admin").textContent = userInfo.permissions;
    } catch (error) {
      console.error("Error loading account info:", error);
    }
  }

  async displayFavoriteMovies() {
    try {
      const token = localStorage.getItem("jwt_token");
      if (token) {
        const favoriteMovies = await this.model.getFavoriteMovies(token);
        this.createFavoriteMoviesList(favoriteMovies);
      }
    } catch (error) {
      console.error("Error fetching favorite movies:", error);
    }
  }

  async createFavoriteMoviesList(favoriteMovies) {
    const favoriteMoviesContainer = document.createElement("ul");
    favoriteMoviesContainer.classList.add("watch-list");
    const token = localStorage.getItem("jwt_token");

    for (const movie of favoriteMovies) {
      const isInFavorites = token
        ? await this.model.isMovieInFavorites(movie.id, token)
        : false;
      const movieCard = `
        <li class="watch-list__item">
          <div class="card card--glow">
            <img class="card__img" src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" data-movie-id="${movie.id}">
            <div class="card__zoom js-card-zoom">${movie.title}</div>
          </div>
          <span class="badge badge--top-left icon-favorite" data-movie-id="${movie.id}" data-is-favorite="${isInFavorites}">
            <span class="icon-heart"></span>
          </span>
        </li>
      `;
      favoriteMoviesContainer.innerHTML += movieCard;
    }

    document
      .querySelector(".account__favorite")
      .appendChild(favoriteMoviesContainer);

    document.querySelectorAll(".js-card-zoom").forEach((cardZoom) => {
      cardZoom.addEventListener("click", () => {
        const img = cardZoom.previousElementSibling;
        const movieId = img.dataset.movieId;
        const movie = favoriteMovies.find((m) => m.id == movieId);
        navigate("movie-details", { movie: movie });
      });
    });
    this.addFavoriteIconClickListener();
    this.markFavoriteIcons();
  }

  markFavoriteIcons() {
    const movieItems = document.querySelectorAll("[data-is-favorite='true']");
    movieItems.forEach((movieItem) => {
      movieItem.classList.add("active");
    });
  }

  async addFavoriteIconClickListener() {
    const favoriteIcons = document.querySelectorAll(".icon-favorite");

    favoriteIcons.forEach((favoriteIcon) => {
      favoriteIcon.addEventListener("click", async (e) => {
        console.log("Clique détecté sur l'icône du cœur");
        const movieId = favoriteIcon.getAttribute("data-movie-id");

        if (!movieId) {
          console.error("Erreur: l'identifiant du film est manquant");
          return;
        }

        const token = localStorage.getItem("jwt_token");

        try {
          const isInFavorites = await this.model.isMovieInFavorites(
            movieId,
            token
          );

          console.log("Le film est-il dans les favoris ?", isInFavorites);

          if (isInFavorites) {
            console.log("Suppression du film des favoris");
            await this.model.removeFavoriteMovie(movieId, token);
            favoriteIcon.classList.remove("active");
            favoriteIcon.setAttribute("data-is-favorite", "false");
            console.log("Le film a été supprimé des favoris");
          } else {
            console.log("Ajout du film aux favoris");
            await this.model.addFavoriteMovie(movieId, token);
            favoriteIcon.classList.add("active");
            favoriteIcon.setAttribute("data-is-favorite", "true");
            console.log("Le film a été ajouté aux favoris");
          }
          await this.updateFavoriteMoviesList();
        } catch (error) {
          console.error("Erreur lors de la modification des favoris:", error);
          Swal.fire({
            title: "Error",
            text: "An error occurred while updating your favorites. Please try again later.",
            icon: "error",
          });
        }
      });
    });
  }
  async updateFavoriteMoviesList() {
    const favoriteMoviesContainer =
      document.querySelector(".account__favorite");
    favoriteMoviesContainer.innerHTML = "";
    await this.displayFavoriteMovies();
  }
}

export default () => (window.accountController = new AccountController());
