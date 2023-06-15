import { fetchJSON, $ } from "../tools.js";

// Classe MyModel contenant les méthodes pour communiquer avec l'API
export default class MyModel {
  constructor() {
    this.apiUrl = "http://localhost:3333";
  }

  // --- Compte utilisateur ---

  // Récupérer les informations du compte
  async getAccountInfo(token) {
    const url = `${this.apiUrl}/users/account`;
    try {
      const response = await fetchJSON(url, token);

      console.log("Response from getAccountInfo:", response);

      const accountInfo = {
        userId: response.userId,
        firstName: response.firstName,
        lastName: response.lastName,
        permissions: response.permissions,
        createdAt: response.createdAt,
      };

      return accountInfo;
    } catch (error) {
      console.error("Error getting account info:", error);
      throw error;
    }
  }

  // Inscription d'un nouvel utilisateur
  async signup(firstName, lastName, password, isAdmin, recaptchaToken) {
    const url = `${this.apiUrl}/users/signup`;
    const data = {
      firstName: firstName,
      lastName: lastName,
      password: password,
      isAdmin: isAdmin,
      "g-recaptcha-response": recaptchaToken,
    };

    try {
      const response = await fetchJSON(url, undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  }

  // Connexion d'un utilisateur
  async login(firstName, password) {
    const url = `${this.apiUrl}/auth/login`;
    const data = {
      firstName: firstName,
      password: password,
    };

    try {
      const response = await fetchJSON(url, undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  }

  // Suppression d'un compte utilisateur
  async deleteAccount(token) {
    const url = `${this.apiUrl}/users/delete`;
    try {
      const response = await fetchJSON(url, token, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      return response;
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  }

  // Vérification du token JWT
  async verifyToken(token) {
    const url = `${this.apiUrl}/auth/verify-token`;

    try {
      const response = await fetchJSON(url, token);
      return response.valid;
    } catch (error) {
      console.error("Error verifying token:", error);
      throw error;
    }
  }

  // --- Films ---

  // Récupérer les films par genre
  async fetchMoviesByGenres(genreIds, pageNumber) {
    try {
      const response = await fetchJSON(
        `${this.apiUrl}/movies/by-genres?genreIds=${genreIds.join(
          ","
        )}&page=${pageNumber}`
      );
      return response;
    } catch (error) {
      throw new Error("Failed to fetch movies by genres: " + error);
    }
  }

  // Récupérer les films par page
  async fetchMoviesByPage(pageNumber) {
    try {
      const response = await fetchJSON(
        `${this.apiUrl}/movies/movie?page=${pageNumber}`
      );
      const extractedData = response.movies;
      //console.log("API response:", JSON.stringify(response, null, 2));
      return extractedData;
    } catch (error) {
      throw new Error("Failed to fetch movies by page: " + error);
    }
  }

  // Récupérer les films sauvegardés
  async fetchSavedMovies(page = 1, pageSize = 5) {
    try {
      const response = await fetchJSON(
        `${this.apiUrl}/movies/movie?page=${page}&pageSize=${pageSize}`
      );
      //console.log("API response:", JSON.stringify(response, null, 2));

      // Extraire l'objet 'movies' interne
      const extractedData = response.movies;
      return extractedData;
    } catch (error) {
      throw new Error("Failed to fetch saved movies: " + error);
    }
  }

  // Rechercher des films
  async searchMovies(query, pageNumber) {
    try {
      const response = await fetchJSON(
        `${this.apiUrl}/movies/search?query=${encodeURIComponent(
          query
        )}&page=${pageNumber}`
      );
      return response;
    } catch (error) {
      throw new Error("Failed to search movies: " + error);
    }
  }

  // Récupérer les films populaires
  async fetchPopularMovies() {
    try {
      return await fetchJSON(`${this.apiUrl}/movies/movie`);
    } catch (error) {
      throw new Error("Failed to fetch popular movies: " + error);
    }
  }

  // --- Films favoris ---

  // Ajouter un film aux favoris
  async addFavoriteMovie(movieId, token) {
    const url = `${this.apiUrl}/favorite-movies/${movieId}`;
    try {
      const response = await fetchJSON(url, token, {
        method: "POST",
      });
      return response;
    } catch (error) {
      console.error("Error adding favorite movie:", error);
      throw error;
    }
  }

  // Supprimer un film des favoris
  async removeFavoriteMovie(movieId, token) {
    const url = `${this.apiUrl}/favorite-movies/${movieId}`;
    try {
      const response = await fetchJSON(url, token, {
        method: "DELETE",
      });
      return response;
    } catch (error) {
      console.error("Error removing favorite movie:", error);
      throw error;
    }
  }

  // Vérifier si un film est dans les favoris
  async isMovieInFavorites(movieId, token) {
    const url = `${this.apiUrl}/favorite-movies/${movieId}`;
    try {
      const response = await fetchJSON(url, token);
      //console.log(`Réponse de l'API pour le film ${movieId} :`, response);
      const isInFavorites = response.isInFavorites;
      //console.log(`Le film ${movieId} est-il dans les favoris ?`,isInFavorites);
      return isInFavorites;
    } catch (error) {
      console.error("Error checking favorite movie:", error);
      throw error;
    }
  }

  // Récupérer la liste des films favoris
  async getFavoriteMovies(token) {
    const url = `${this.apiUrl}/favorite-movies/`;
    try {
      const response = await fetchJSON(url, token);
      return response;
    } catch (error) {
      console.error("Error fetching favorite movies:", error);
      throw error;
    }
  }

  // --- Votes ---

  // Récupérer le pourcentage de votes
  async fetchVotePercentage(movieId) {
    try {
      return await fetchJSON(`${this.apiUrl}/movies/${movieId}/vote`);
    } catch (error) {
      throw new Error("Failed to fetch vote percentage: " + error);
    }
  }

  // Voter "j'aime" pour un film
  async likeMovie(movieId, token) {
    const url = `${this.apiUrl}/movies/${movieId}/like`;

    try {
      console.log("Sending like request for movieId:", movieId);
      const response = await fetchJSON(url, token, {
        method: "POST",
      });
      console.log("API response for like:", response);
      if (!response) {
        throw new Error("Failed to like movie");
      }
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Voter "je n'aime pas" pour un film
  async dislikeMovie(movieId, token) {
    const url = `${this.apiUrl}/movies/${movieId}/dislike`;

    try {
      console.log("Sending dislike request for movieId:", movieId);
      const response = await fetchJSON(url, token, {
        method: "POST",
      });
      console.log("API response for dislike:", response);
      if (!response) {
        throw new Error("Failed to dislike movie");
      }
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Récupérer le vote de l'utilisateur pour un film
  async getUserVote(movieId, jwtToken) {
    try {
      const response = await fetchJSON(
        `${this.apiUrl}/movies/${movieId}/uservote`,
        jwtToken
      );

      return response.userVote;
    } catch (error) {
      console.error("Error fetching user vote:", error);
      return null;
    }
  }

  // Supprimer le vote d'un utilisateur pour un film
  async removeVote(movieId, token) {
    const url = `${this.apiUrl}/movies/${movieId}/vote`;

    try {
      console.log("Sending remove vote request for movieId:", movieId);
      const response = await fetchJSON(url, token, {
        method: "DELETE",
      });
      console.log("API response for remove vote:", response);
      if (!response) {
        console.error("Remove vote response is empty or undefined");
        throw new Error("Failed to remove vote");
      } else {
        console.log("Successfully removed vote for movieId:", movieId);
      }
      return response;
    } catch (error) {
      console.error("Error removing vote for movieId:", movieId, error);
      throw error;
    }
  }

  // --- Commentaires ---

  // Récupérer les commentaires d'un film

  async getComments(movieId, token) {
    const url = `${this.apiUrl}/comments/${movieId}`;

    try {
      console.log("Fetching comments for movieId:", movieId);
      const response = await fetchJSON(url, token);
      console.log("API response for get comments:", response);
      if (!response) {
        console.error("Get comments response is empty or undefined");
        throw new Error("Failed to get comments");
      } else {
        console.log("Successfully fetched comments for movieId:", movieId);
      }
      return response;
    } catch (error) {
      console.error("Error fetching comments for movieId:", movieId, error);
      throw error;
    }
  }

  // Envoyer un commentaire pour un film

  async submitComment(movieId, content, token) {
    const url = `${this.apiUrl}/comments`;

    console.log("Submitting comment data:", { movieId, content });

    try {
      console.log("Submitting comment for movieId:", movieId);
      const response = await fetchJSON(url, token, {
        method: "POST",
        body: JSON.stringify({ movieId, content }),
      });

      console.log("Successfully submitted comment for movieId:", movieId);
      return response;
    } catch (error) {
      console.error("Error submitting comment for movieId:", movieId, error);
      throw error;
    }
  }

  // Editer un commentaire pour un film

  async editComment(commentId, newCommentText, token) {
    const url = `${this.apiUrl}/comments/${commentId}`;

    console.log("Editing comment data:", { commentId, newCommentText });

    try {
      console.log("Editing comment for commentId:", commentId);
      const response = await fetchJSON(url, token, {
        method: "PUT",
        body: JSON.stringify({ content: newCommentText }),
      });

      console.log("Successfully edited comment for commentId:", commentId);
      return response;
    } catch (error) {
      console.error("Error editing comment for commentId:", commentId, error);
      throw error;
    }
  }

  // Supprimer un commentaire pour un film

  async deleteComment(commentId, token) {
    const url = `${this.apiUrl}/comments/${commentId}`;

    console.log("Deleting comment for commentId:", commentId);

    try {
      const response = await fetchJSON(url, token, {
        method: "DELETE",
      });

      console.log("Successfully deleted comment for commentId:", commentId);
      return response;
    } catch (error) {
      console.error("Error deleting comment for commentId:", commentId, error);
      throw error;
    }
  }
}
