import BaseController from "./basecontroller.js";
import MyModel from "../model/model.js";
import { $, navigate } from "../tools.js";
import genres from "../genres.js";

class MovieDetailsController extends BaseController {
  constructor(movie) {
    super();
    this.movie = movie;
    this.model = new MyModel();
    const token = localStorage.getItem("jwt_token");
    if (token) {
      this.accountInfo = this.model.getAccountInfo(token);
    }
    this.displayMovieDetails();
  }

  async displayMovieDetails() {
    const movieDetailsContainer = $("#movie-details-container");
    const releaseYear = new Date(this.movie.release_date).getFullYear();
    const genreNames = getGenreNames(this.movie.genre_ids);

    let userVote = null;
    const token = localStorage.getItem("jwt_token");
    if (token) {
      userVote = await this.model.getUserVote(this.movie.id, token);
    }

    const likeIconClass = userVote === "like" ? "active" : "";
    const dislikeIconClass = userVote === "dislike" ? "active" : "";
    const likeVoted = userVote === "like" ? "true" : "false";
    const dislikeVoted = userVote === "dislike" ? "true" : "false";

    const votePercentageData = await this.model.fetchVotePercentage(
      this.movie.id
    );
    const votePercentage = Math.trunc(votePercentageData.votePercentage);

    const movieDetailsContent = `
      <div class="product__action">
        <div class="element-wrapper">
          <button id="back-btn" class="btn btn--small">Retour à l'accueil</button>
        </div>
      </div>

      <div class="movie-details product light-content">
        <div class="backdrop-container">
          <img class="backdrop-img" src="https://image.tmdb.org/t/p/w1280${
            this.movie.backdrop_path
          }" alt="${this.movie.title}">
          <div class="overlay"></div>
        </div>
        <div class="product-header">
          <div class="product-header__blur"></div>
          <div class="product__wrapper element-wrapper">
            <h1 class="product__title">${this.movie.title}</h1>
            <div class="product__heading">
              ${genreNames.join(", ")} - (${releaseYear})
            </div>
            <div class="product__interaction">
              ${
                votePercentage
                  ? `
                <span class="badge badge--large">
                  <div class="chart chart--large">
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

                <div class="product__text">Notes des utilisateurs</div>
              `
                  : ""
              }
              <div class="product__vote">
                <span class="${likeIconClass} badge icon-thumb-up js-like"
                  data-movie-id="${this.movie.id}" data-voted="${likeVoted}">
                </span>
                <span class="${dislikeIconClass} badge icon-thumb-down js-dislike"
                  data-movie-id="${this.movie.id}" data-voted="${dislikeVoted}">
                </span>
              </div>
            </div>
            <div class="product__detail">
              <p class="product__overview">${this.movie.overview}</p>
            </div>
            <div id="comments-container" class="comment-container"></div>
          </div>
        </div>
      </div>
    `;

    movieDetailsContainer.innerHTML = movieDetailsContent;

    $("#comment-form").addEventListener("submit", (event) =>
      this.submitComment(event)
    );

    $("#back-btn").addEventListener("click", () => navigate("index"));

    this.addLikeDislikeIconClickListener();
    this.displayComments();
  }

  async addLikeDislikeIconClickListener() {
    const movieDetailsContainer = $("#movie-details-container");

    const updateVoteStatus = (icon, voted) => {
      if (voted) {
        icon.classList.add("active");
        icon.setAttribute("data-voted", "true");
      } else {
        icon.classList.remove("active");
        icon.setAttribute("data-voted", "false");
      }
    };

    const processVote = async (icon, action, oppositeIcon) => {
      const isVoted = icon.getAttribute("data-voted") === "true";
      const movieId = icon.getAttribute("data-movie-id");
      const token = localStorage.getItem("jwt_token");

      if (isVoted) {
        await this.model.removeVote(movieId, token);
        updateVoteStatus(icon, false);
      } else {
        if (oppositeIcon.getAttribute("data-voted") === "true") {
          await this.model.removeVote(movieId, token);
          updateVoteStatus(oppositeIcon, false);
        }
        await this.model[action](movieId, token);
        updateVoteStatus(icon, true);
      }
      await this.updateVotePercentage();
    };

    movieDetailsContainer.addEventListener("click", async (e) => {
      const likeIcon = e.target.closest(".js-like");
      const dislikeIcon = e.target.closest(".js-dislike");

      if (!likeIcon && !dislikeIcon) {
        return;
      }

      if (!this.isLoggedIn()) {
        const result = await Swal.fire({
          title: "Connexion requise",
          text: "Vous devez être connecté pour voter.",
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

      try {
        if (likeIcon) {
          const oppositeDislikeIcon =
            movieDetailsContainer.querySelector(".js-dislike");
          await processVote(likeIcon, "likeMovie", oppositeDislikeIcon);
        } else if (dislikeIcon) {
          const oppositeLikeIcon =
            movieDetailsContainer.querySelector(".js-like");
          await processVote(dislikeIcon, "dislikeMovie", oppositeLikeIcon);
        }
      } catch (error) {
        console.error("Error voting for movie:", error);
      }
    });
  }

  isLoggedIn() {
    const token = localStorage.getItem("jwt_token");
    return !!token;
  }

  async updateVotePercentage() {
    const votePercentageData = await this.model.fetchVotePercentage(
      this.movie.id
    );
    const votePercentage = Math.trunc(votePercentageData.votePercentage);
    const movieDetailsContainer = $("#movie-details-container");
    const votePercentageText =
      movieDetailsContainer.querySelector(".chart__text");
    const votePercentageCircle =
      movieDetailsContainer.querySelector(".chart__circle");

    if (votePercentageText && votePercentageCircle) {
      votePercentageText.innerHTML = `${votePercentage}<span class="chart__percent">%</span>`;
      votePercentageCircle.setAttribute(
        "stroke-dasharray",
        `${votePercentage}, 100`
      );
    }
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async displayComments() {
    const movieId = this.movie.id;
    const token = localStorage.getItem("jwt_token");
    const commentsContainer = $("#comments-container");

    try {
      const comments = await this.model.getComments(movieId, token);
      let accountInfo = null;
      let isAdmin = false;

      console.log("accountInfo:", accountInfo);
      console.log("isAdmin:", isAdmin);

      if (token) {
        accountInfo = await this.model.getAccountInfo(token);
        isAdmin = await this.isAdmin();
      }

      let commentsContent = "";

      if (comments.length === 0) {
        commentsContent = "<p>Aucun commentaire pour ce film.</p>";
      } else {
        comments.forEach((comment) => {
          const createdAt = new Date(comment.createdAt);
          const formattedDate = createdAt.toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          console.log("comment.userId:", comment.userId);
          console.log("comment.userId type:", typeof comment.userId);

          commentsContent += `
          <div class="comment">
            <div class="comment__author">${this.escapeHtml(
              comment.user.firstName
            )}</div>
            <small class="comment__date">${formattedDate}</small>
            <p class="comment__text">${this.escapeHtml(comment.content)}</p>
            ${
              isAdmin || (accountInfo && accountInfo.userId === comment.userId)
                ? `<button data-comment-id="${comment.id}" data-user-id="${comment.userId}" class="btn js-delete-comment-btn">Supprimer</button>`
                : ""
            }
          </div>
        `;
        });
      }

      commentsContainer.innerHTML = commentsContent;

      if (token) {
        document
          .querySelectorAll(".js-delete-comment-btn")
          .forEach((button) => {
            button.addEventListener("click", (event) => {
              const commentId = event.target.dataset.commentId;
              const commentUserId = event.target.dataset.userId;
              this.deleteComment(commentId, commentUserId);
            });
          });
      }
    } catch (error) {
      console.error("Error displaying comments:", error);
    }
  }

  async deleteComment(commentId, commentUserId) {
    const token = localStorage.getItem("jwt_token");
    const accountInfo = await this.model.getAccountInfo(token);
    if (
      !accountInfo.permissions.includes("admin") &&
      accountInfo.userId !== commentUserId
    ) {
      Swal.fire({
        title: "Erreur",
        text: "Vous n'avez pas la permission de supprimer ce commentaire.",
        icon: "error",
      });
      return;
    }

    try {
      await this.model.deleteComment(commentId, token);
      await this.displayComments();
      Swal.fire({
        title: "Succès",
        text: "Le commentaire a été supprimé.",
        icon: "success",
        buttonsStyling: false,
        customClass: {
          confirmButton: "btn",
        },
      });
    } catch (error) {
      Swal.fire({
        title: "Erreur",
        text: "Erreur lors de la suppression du commentaire.",
        icon: "error",
        buttonsStyling: false,
        customClass: {
          confirmButton: "btn",
        },
      });
    }
  }

  async submitComment(event) {
    event.preventDefault();

    const movieId = this.movie.id;
    const content = $("#comment-content").value;
    const token = localStorage.getItem("jwt_token");

    if (!content) {
      Swal.fire({
        title: "Erreur",
        text: "Veuillez saisir un commentaire.",
        icon: "error",
        buttonsStyling: false,
        customClass: {
          confirmButton: "btn",
        },
      });
      return;
    }

    if (!token) {
      Swal.fire({
        title: "Non autorisé",
        text: "Vous devez vous connecter pour envoyer un commentaire.",
        icon: "warning",
        buttonsStyling: false,
        customClass: {
          confirmButton: "btn",
        },
      });
      return;
    }

    try {
      await this.model.submitComment(movieId, content, token);
      $("#comment-content").value = "";
      await this.displayComments();
      Swal.fire({
        title: "Succès",
        text: "Votre commentaire a été ajouté.",
        icon: "success",
        buttonsStyling: false,
        customClass: {
          confirmButton: "btn",
        },
      });
    } catch (error) {
      Swal.fire({
        title: "Erreur",
        text: "Vous avez déjà envoyé un commentaire pour ce film.",
        icon: "error",
        buttonsStyling: false,
        customClass: {
          confirmButton: "btn",
        },
      });
    }
  }

  async isAdmin() {
    try {
      const token = localStorage.getItem("jwt_token");
      const accountInfo = await this.model.getAccountInfo(token);
      return accountInfo.permissions.includes("admin");
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }
}

function getGenreNames(genreIds) {
  return genreIds.map((id) => {
    const genre = genres.find((g) => g.id === id);
    return genre ? genre.name : "";
  });
}

export default (data) => {
  const movie = data.movie;
  window.movieDetailsController = new MovieDetailsController(movie);
};
