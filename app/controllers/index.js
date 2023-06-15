import BaseController from "./basecontroller.js";
import MyModel from "../model/model.js";
import { $, navigate } from "../tools.js";
import { displayGenres } from "../genres.js";

class IndexController extends BaseController {
  constructor() {
    super();
    this.model = new MyModel();
    this.currentPage = 1;
    this.searchDebounce = null;
    this.pageNumberElement = $("#pageNumber");
    this.displayPopularMovies();
    displayGenres();
    this.setupGenreFilter();
    this.addEventListeners();
    this.displayAccountButton();
    this.displayLogoutButton();
    this.updateAuthButtons();

    setInterval(() => this.checkTokenExpiration(), 5 * 60 * 1000); //5 minutes en millisecondes
  }

  addEventListeners() {
    $("#signup-btn").addEventListener("click", () => navigate("signup"));
    $("#login-btn").addEventListener("click", () => navigate("login"));
    $("#account-btn").addEventListener("click", () => this.navigateToAccount());
    $("#search-bar").addEventListener("input", (e) =>
      this.searchMovies(e.target.value)
    );
    $("#load-more-btn").addEventListener("click", () => this.loadMoreMovies());
    $("#logout-btn").addEventListener("click", () => this.logout());
    $("#clear-filters").addEventListener("click", () =>
      this.setupClearFiltersButton()
    );
  }

  async checkTokenExpiration() {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      try {
        const isValid = await this.model.verifyToken(token);
        if (!isValid) {
          localStorage.removeItem("jwt_token");
          this.showReconnectPopup();
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du jeton:", error);
        console.log("Déconnexion de l'utilisateur.");
        localStorage.removeItem("jwt_token");
        this.showReconnectPopup();
      }
    }
  }

  showReconnectPopup() {
    Swal.fire({
      title: "Session expirée",
      text: "Votre session a expiré, veuillez vous reconnecter.",
      icon: "warning",
      buttonsStyling: false,
      customClass: {
        confirmButton: "btn",
        cancelButton: "btn btn--outline",
      },
      showCancelButton: true,
      confirmButtonText: "Se reconnecter",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("login");
      } else {
        localStorage.removeItem("jwt_token");
        this.displayAccountButton();
        this.displayLogoutButton();
      }
    });
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
      this.displayAccountButton();
      this.displayLogoutButton();
      this.updateAuthButtons();
    }
  }

  navigateToAccount() {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      navigate("account");
      this.displayAccountButton();
    } else {
      Swal.fire({
        title: "Connexion requise",
        text: "Vous devez être connecté pour accéder à cette page.",
        icon: "info",
        buttonsStyling: false,
        customClass: {
          confirmButton: "btn",
          cancelButton: "btn btn--outline",
        },
        confirmButtonText: "OK",
        showCancelButton: true,
        cancelButtonText: "Annuler",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("login");
        }
      });
    }
  }

  isLoggedIn() {
    const token = localStorage.getItem("jwt_token");
    return !!token;
  }

  async displayMovies(movies, append = false) {
    const movieContainer = document.querySelector(".watch-list");
    if (!append) {
      movieContainer.innerHTML = "";
    }

    const token = localStorage.getItem("jwt_token");

    for (const movie of movies) {
      const isInFavorites = token
        ? await this.model.isMovieInFavorites(movie.id, token)
        : false;
      //const favoriteIconClass = isInFavorites ? "active" : "";

      // Récupérer le pourcentage des votes pour le film
      const votePercentageData = await this.model.fetchVotePercentage(movie.id);
      const votePercentage = Math.trunc(votePercentageData.votePercentage);

      const movieCard = `
      <li class="watch-list__item">
        <div class="card card--glow">
          <img class="card__img" src="https://image.tmdb.org/t/p/w500${
            movie.poster_path
          }" alt="${movie.title}" data-movie-id="${movie.id}">
          <div class="card__zoom js-card-zoom">${movie.title}</div>
        </div>
        <span class="badge badge--top-left icon-favorite" data-movie-id="${
          movie.id
        }" data-is-favorite="${isInFavorites}">
          Ajouter à mes films favoris
          <span class="icon-heart"></span>
        </span>
        ${
          votePercentage
            ? `
          <span class="badge badge--top-left2">
            <div class="chart">
              <span class="chart__text">${votePercentage}<span class="chart__percent">%</span></span>
              <svg viewBox="0 0 36 36" class="chart__circular">
                <defs>
                  <linearGradient id="myGradient">
                    <stop offset="0%"   stop-color="#08f4ff" />
                    <stop offset="100%" stop-color="#fd44bf" />
                  </linearGradient>
                </defs>
                <path class="chart__circle"
                  stroke="url(#myGradient)"
                  stroke-dasharray="${votePercentage}, 100"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
          </span>
        `
            : ""
        }
      </li>
    `;

      movieContainer.innerHTML += movieCard;
    }

    document.querySelectorAll(".js-card-zoom").forEach((cardZoom) => {
      cardZoom.addEventListener("click", () => {
        const img = cardZoom.previousElementSibling;
        const movieId = img.dataset.movieId;
        const movie = movies.find((m) => m.id == movieId);
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

        if (!this.isLoggedIn()) {
          const result = await Swal.fire({
            title: "Connexion requise",
            text: "Vous devez être connecté pour ajouter un film à vos favoris.",
            icon: "info",
            buttonsStyling: false,
            customClass: {
              confirmButton: "btn",
              cancelButton: "btn btn--outline",
            },
            showCancelButton: true,
            confirmButtonText: "Connexion",
            cancelButtonText: "Annuler",
          });

          if (result.isConfirmed) {
            navigate("login");
          }

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

  async displayPopularMovies(force = false) {
    try {
      const selectedGenres = Array.from(
        document.querySelectorAll(
          ".js-filter-movie-type input[type=checkbox]:checked"
        )
      ).map((checkbox) => parseInt(checkbox.value));

      if (selectedGenres.length === 0 || force) {
        const moviesData = await this.model.fetchMoviesByPage(this.currentPage);
        this.displayMovies(moviesData.movies, true);
      }
    } catch (error) {
      console.error("Error displaying popular movies:", error);
    }
  }

  displayNoMoviesFound() {
    const movieContainer = $(".watch-list");
    movieContainer.innerHTML = `
      <div class="message">
        Aucun film ne correspond à vos filtres ! Veuillez réessayer.
      </div>
    `;
  }

  displayAccountButton() {
    const accountButton = $("#account-btn");
    const token = localStorage.getItem("jwt_token");
    if (token) {
      this.model.verifyToken(token).then((isValid) => {
        if (isValid) {
          accountButton.style.display = "inline-block";
        } else {
          accountButton.style.display = "none";
        }
      });
    } else {
      accountButton.style.display = "none";
    }
  }

  displayLogoutButton() {
    const logoutButton = $("#logout-btn");
    const token = localStorage.getItem("jwt_token");
    if (token) {
      this.model.verifyToken(token).then((isValid) => {
        if (isValid) {
          logoutButton.style.display = "inline-block";
        } else {
          logoutButton.style.display = "none";
        }
      });
    } else {
      logoutButton.style.display = "none";
    }
  }

  updateAuthButtons() {
    const signupButton = $("#signup-btn");
    const loginButton = $("#login-btn");
    const token = localStorage.getItem("jwt_token");

    if (token) {
      this.model.verifyToken(token).then((isValid) => {
        if (isValid) {
          signupButton.style.display = "none";
          loginButton.style.display = "none";
        } else {
          signupButton.style.display = "inline";
          loginButton.style.display = "inline";
        }
      });
    } else {
      signupButton.style.display = "inline";
      loginButton.style.display = "inline";
    }
  }

  async searchMovies(query) {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(async () => {
      if (!query) {
        await this.updateMovieList();
        return;
      }

      const moviesData = await this.model.searchMovies(query, this.currentPage);
      const queryWords = query.toLowerCase().split(" ");
      const filteredMovies = moviesData.movies.filter((movie) => {
        const titleWords = movie.title.toLowerCase().split(" ");
        return queryWords.every((word) =>
          titleWords.some((titleWord) => titleWord.startsWith(word))
        );
      });

      if (filteredMovies.length === 0) {
        this.displayNoMoviesFound();
      } else {
        this.displayMovies(filteredMovies);
      }
    }, 300); // Délai de 300ms avant l'envoi de la requête
  }

  async loadMoreMovies() {
    this.currentPage++;
    this.pageNumberElement.textContent = this.currentPage;
    await this.updateMovieList(true);
  }

  setupGenreFilter() {
    const clearFiltersButton = $("#clear-filters");
    document
      .querySelectorAll(".js-filter-movie-type input[type=checkbox]")
      .forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
          this.updateMovieList();
          clearFiltersButton.classList.add("active");
        });
      });
  }

  setupClearFiltersButton() {
    const clearFiltersButton = $("#clear-filters");
    if (clearFiltersButton) {
      location.reload();
    } else {
      console.error("Le bouton 'clear-filters' est introuvable dans le DOM.");
    }
  }

  resetGenreCheckboxes() {
    document
      .querySelectorAll(".js-filter-movie-type input[type=checkbox]")
      .forEach((checkbox) => {
        checkbox.checked = false;
      });
  }

  async updateMovieList(append = false) {
    const clearFiltersButton = $("#clear-filters");
    const selectedGenres = Array.from(
      document.querySelectorAll(
        ".js-filter-movie-type input[type=checkbox]:checked"
      )
    ).map((checkbox) => parseInt(checkbox.value));

    let moviesData;

    if (selectedGenres.length === 0) {
      moviesData = await this.model.fetchMoviesByPage(this.currentPage);
      clearFiltersButton.classList.remove("active");
    } else {
      moviesData = await this.model.fetchMoviesByGenres(
        selectedGenres,
        this.currentPage
      );
    }

    const filteredMovies = moviesData.movies;

    if (filteredMovies.length === 0) {
      this.displayNoMoviesFound();
    } else {
      this.displayMovies(filteredMovies, append);
      this.markFavoriteIcons();
    }
  }
}

export default () => (window.indexController = new IndexController());
