// ===== DOCUMENT READY =====
$(document).ready(function () {

  // ===== NAVBAR ACTIVE LINK =====
  let current = window.location.pathname.split("/").pop();

  $(".navbar-nav a").each(function () {
    let link = $(this).attr("href");
    if (link === current) {
      $(this).addClass("active");
    }
  });

  // ===== AUTO GENERATE YEARS =====
  const yearSelect = $("#year");

  if (yearSelect.length) {
    const currentYear = new Date().getFullYear();

    for (let y = currentYear; y >= 1980; y--) {
      yearSelect.append(`<option value="${y}">${y}</option>`);
    }
  }

});

// ===== NAVBAR SCROLL EFFECT =====
$(window).on("scroll", function () {
  if ($(window).scrollTop() > 50) {
    $(".glass-navbar").addClass("scrolled");
  } else {
    $(".glass-navbar").removeClass("scrolled");
  }
});

// ===== MARQUEE =====
const track = document.getElementById("track");

if (track) {
  track.innerHTML += track.innerHTML;

  const SPEED = 50;

  function setDuration() {
    const width = track.scrollWidth / 2;
    const duration = width / SPEED;
    track.style.setProperty("--duration", `${duration}s`);
  }

  setDuration();
  window.addEventListener("resize", setDuration);

  track.addEventListener("mouseenter", () => {
    track.style.animationPlayState = "paused";
  });

  track.addEventListener("mouseleave", () => {
    track.style.animationPlayState = "running";
  });

  document.addEventListener("shown.bs.modal", () => {
    track.style.animationPlayState = "paused";
  });

  document.addEventListener("hidden.bs.modal", () => {
    track.style.animationPlayState = "running";
  });
}

// ===== BACK TO TOP =====
const backToTopBtn = document.getElementById("backToTop");

if (backToTopBtn) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add("show");
    } else {
      backToTopBtn.classList.remove("show");
    }
  });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

// ===== TMDB FINDER =====
const API_KEY = "11d0550e6e15eab2f274fd22de846d4c";

// ===== TOP 10 CAROUSEL POSTERS FROM TMDB =====
async function loadCarouselPosters() {
  const posters = document.querySelectorAll(".tmdb-carousel-poster");

  for (const poster of posters) {
    const title = poster.dataset.title;
    const year = poster.dataset.year;

    try {
      let url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}`;

      if (year) {
        url += `&year=${year}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.results && data.results.length > 0 && data.results[0].poster_path) {
        poster.src = `https://image.tmdb.org/t/p/w500${data.results[0].poster_path}`;
      }
    } catch (error) {
      console.log("Could not load poster for:", title);
    }
  }
}

loadCarouselPosters();


// ===== TMDB FINDER =====
if ($("#searchBtn").length) {
  $("#searchBtn").click(function () {
    $("#searchBtn").prop("disabled", true).text("Loading...");

    let genre = $("#genre").val();
    let year = $("#year").val();

    let url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}`;

    if (genre) {
      url += `&with_genres=${genre}`;
    }

    if (year) {
      url += `&primary_release_year=${year}`;
    }

    $("#results").html("<p style='color:white;'>Loading movies...</p>");

    fetch(url)
      .then(res => res.json())
      .then(data => {
        $("#results").html("");

        if (!data.results || data.results.length === 0) {
          $("#results").html("<p style='color:white;'>No movies found</p>");
          return;
        }

        data.results.forEach(movie => {
          if (!movie.poster_path) return;

          let poster = "https://image.tmdb.org/t/p/w500" + movie.poster_path;

          $("#results").append(`
            <article class="card movie-card movie-item" data-id="${movie.id}">
              <div class="movie-poster">
                <img src="${poster}" alt="${movie.title}">
              </div>
              <div class="movie-bottom">
                <h6>${movie.title}</h6>
                <p>${movie.release_date ? movie.release_date.substring(0, 4) : "N/A"}</p>
              </div>
            </article>
          `);
        });
      })
      .catch(error => {
        console.error("Error:", error);
        $("#results").html("<p style='color:red;'>Error loading movies</p>");
      })
      .finally(() => {
        $("#searchBtn").prop("disabled", false).text("🔍 Find Movies");
      });
  });
}

// ===== CLICK MOVIE → OPEN MODAL =====
$(document).on("click", ".movie-item", function () {
  let movieId = $(this).data("id");

  fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}`)
    .then(res => res.json())
    .then(movie => {
      $("#modalTitle").text(movie.title);
      $("#modalYear").text("Year: " + (movie.release_date || "N/A"));
      $("#modalRating").text("⭐ Rating: " + movie.vote_average);
      $("#modalDesc").text(movie.overview);

      if (movie.poster_path) {
        $("#modalImg").attr("src", "https://image.tmdb.org/t/p/w500" + movie.poster_path);
      } else {
        $("#modalImg").attr("src", "");
      }

      let modal = new bootstrap.Modal(document.getElementById("movieModal"));
      modal.show();
    })
    .catch(error => {
      console.error("Error loading movie details:", error);
    });
});

// ===== RANDOM PAGE =====
const moodGenreMap = {
  sad: ["35", "10751", "10749"],
  happy: ["35", "12", "10402"],
  bored: ["28", "53", "878"],
  stressed: ["35", "16", "10751"],
  romantic: ["10749", "18"],
  excited: ["28", "12", "878"],
  tired: ["35", "10751", "16"]
};

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function fetchRandomMoviesForMood(mood, selectedGenre) {
  let genreToUse = selectedGenre;

  if (!genreToUse && mood && moodGenreMap[mood]) {
    const moodGenres = moodGenreMap[mood];
    genreToUse = moodGenres[Math.floor(Math.random() * moodGenres.length)];
  }

  let url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&vote_count.gte=200`;

  if (genreToUse) {
    url += `&with_genres=${genreToUse}`;
  }

  const res = await fetch(url);
  const data = await res.json();

  if (!data.results) return [];

  return shuffleArray(
    data.results.filter(movie => movie.poster_path && movie.overview)
  ).slice(0, 3);
}

function renderFeaturedMovie(movie) {
  const poster = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
  const year = movie.release_date ? movie.release_date.substring(0, 4) : "N/A";

  $("#screenResult").html(`
    <div class="featured-movie">
      <div class="featured-poster">
        <img src="${poster}" alt="${movie.title}">
      </div>
      <div class="featured-info">
        <h2>${movie.title}</h2>
        <div class="featured-meta">${year} • ⭐ ${movie.vote_average.toFixed(1)}</div>
        <p class="featured-overview">${movie.overview}</p>
        <div class="featured-actions">
          <button class="screen-btn featured-more-info" data-id="${movie.id}">
            More Info
          </button>
        </div>
      </div>
    </div>
  `);
}

function renderAltMovies(movies) {
  if (!movies.length) {
    $("#altResults").html("");
    $("#altTitle").hide();
    return;
  }

  $("#altTitle").show();

  const html = movies.map(movie => {
    const poster = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    const year = movie.release_date ? movie.release_date.substring(0, 4) : "N/A";

    return `
      <article class="alt-card">
        <img src="${poster}" alt="${movie.title}">
        <h6>${movie.title}</h6>
        <p>${year}</p>
        <button class="alt-more-info" data-id="${movie.id}">More Info</button>
      </article>
    `;
  }).join("");

  $("#altResults").html(html);
}

async function openRandomMovieModal(movieId) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}`);
    const movie = await res.json();

    $("#randomModalTitle").text(movie.title);
    $("#randomModalYear").text("Year: " + (movie.release_date || "N/A"));
    $("#randomModalRating").text("⭐ Rating: " + movie.vote_average);
    $("#randomModalDesc").text(movie.overview || "");

    if (movie.poster_path) {
      $("#randomModalImg").attr("src", "https://image.tmdb.org/t/p/w500" + movie.poster_path);
    } else {
      $("#randomModalImg").attr("src", "");
    }

    const trailerUrl = await fetchTrailerUrl(movieId);

    if (trailerUrl) {
      $("#randomTrailerBtn").attr("href", trailerUrl);
      $("#randomTrailerWrap").show();
    } else {
      $("#randomTrailerWrap").hide();
    }

    const modal = new bootstrap.Modal(document.getElementById("randomMovieModal"));
    modal.show();
  } catch (error) {
    console.error("Error loading random movie details:", error);
  }
}

async function runShuffle() {
  if (!$("#screenResult").length) return;

  const mood = $("#randomMood").val();
  const genre = $("#randomGenre").val();

  $("#screenResult").html(`
    <div class="screen-placeholder">
      <i class="bi bi-film"></i>
      <p>Shuffling movies...</p>
    </div>
  `);

  try {
    const movies = await fetchRandomMoviesForMood(mood, genre);

    if (!movies.length) {
      $("#screenResult").html(`
        <div class="screen-placeholder">
          <i class="bi bi-exclamation-circle"></i>
          <p>No movies found. Try another mood or genre.</p>
        </div>
      `);
      $("#altResults").html("");
      $("#altTitle").hide();
      $("#reshuffleBtn").hide();
      return;
    }

    renderFeaturedMovie(movies[0]);
    renderAltMovies(movies.slice(1));
    $("#reshuffleBtn").show();
  } catch (error) {
    console.error("Error shuffling movies:", error);
    $("#screenResult").html(`
      <div class="screen-placeholder">
        <i class="bi bi-exclamation-circle"></i>
        <p>Something went wrong. Please try again.</p>
      </div>
    `);
  }
}

if ($("#shuffleBtn").length) {
  $("#shuffleBtn").off("click").on("click", runShuffle);
}

if ($("#reshuffleBtn").length) {
  $("#reshuffleBtn").off("click").on("click", runShuffle);
}

$(document).off("click", ".featured-more-info, .alt-more-info");
$(document).on("click", ".featured-more-info, .alt-more-info", function () {
  const movieId = $(this).data("id");
  openRandomMovieModal(movieId);
});

// ===== RANDOM MOOD THEME =====
function updateRandomMoodTheme() {
  const randomPage = $(".random-page");
  const mood = $("#randomMood").val();

  if (!randomPage.length) return;

  randomPage.removeClass(
    "mood-sad mood-happy mood-bored mood-stressed mood-romantic mood-excited mood-tired"
  );

  if (mood) {
    randomPage.addClass(`mood-${mood}`);
  }
}

if ($("#randomMood").length) {
  $("#randomMood").off("change").on("change", updateRandomMoodTheme);
  updateRandomMoodTheme();
}
// ===== MOVIES PAGE =====
let popularMoviesData = [];
let topRatedMoviesData = [];
let classicMoviesData = [];

let popularVisibleCount = 6;
let topRatedVisibleCount = 6;
let classicVisibleCount = 6;

async function fetchMovieData(url) {
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

function renderMovieSection(movies, containerId, visibleCount) {
  const container = $(`#${containerId}`);
  container.html("");

  if (!movies.length) {
    container.html("<p style='color:white;'>No movies found</p>");
    return;
  }

  movies
    .filter(movie => movie.poster_path)
    .slice(0, visibleCount)
    .forEach(movie => {
      const poster = "https://image.tmdb.org/t/p/w500" + movie.poster_path;

      container.append(`
        <article class="card movie-card movies-page-item" data-id="${movie.id}">
          <div class="movie-poster">
            <img src="${poster}" alt="${movie.title}">
          </div>
          <div class="movie-bottom">
            <h6>${movie.title}</h6>
            <p>${movie.release_date ? movie.release_date.substring(0, 4) : "N/A"}</p>
          </div>
        </article>
      `);
    });
}

function updateLoadMoreButton(buttonId, movies, visibleCount) {
  const btn = $(`#${buttonId}`);

  if (!btn.length) return;

  const totalVisibleMovies = movies.filter(movie => movie.poster_path).length;

  if (visibleCount >= totalVisibleMovies) {
    btn.hide();
  } else {
    btn.show();
  }
}

function renderAllMovieSections() {
  renderMovieSection(popularMoviesData, "popularMovies", popularVisibleCount);
  renderMovieSection(topRatedMoviesData, "topRatedMovies", topRatedVisibleCount);
  renderMovieSection(classicMoviesData, "classicMovies", classicVisibleCount);

  updateLoadMoreButton("loadMorePopular", popularMoviesData, popularVisibleCount);
  updateLoadMoreButton("loadMoreTopRated", topRatedMoviesData, topRatedVisibleCount);
  updateLoadMoreButton("loadMoreClassics", classicMoviesData, classicVisibleCount);
}

async function loadMoviesPageSections() {
  if (!$("#popularMovies").length) return;

  try {
    const popularUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`;
    const topRatedUrl = `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}`;
    const classicsUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&primary_release_date.gte=1970-01-01&primary_release_date.lte=1999-12-31&sort_by=vote_average.desc&vote_count.gte=3000&page=1`;

    popularMoviesData = await fetchMovieData(popularUrl);
    topRatedMoviesData = await fetchMovieData(topRatedUrl);
    classicMoviesData = await fetchMovieData(classicsUrl);

    const topRatedIds = new Set(topRatedMoviesData.map(movie => movie.id));
    classicMoviesData = classicMoviesData.filter(movie => !topRatedIds.has(movie.id));

    renderAllMovieSections();

  } catch (error) {
    console.error("Error loading Movies page:", error);
    $("#popularMovies, #topRatedMovies, #classicMovies").html("<p style='color:red;'>Error loading movies</p>");
  }
}

loadMoviesPageSections();

// ===== LOAD MORE EVENTS =====
if ($("#loadMorePopular").length) {
  $("#loadMorePopular").on("click", function () {
    popularVisibleCount += 6;
    renderAllMovieSections();
  });
}

if ($("#loadMoreTopRated").length) {
  $("#loadMoreTopRated").on("click", function () {
    topRatedVisibleCount += 6;
    renderAllMovieSections();
  });
}

if ($("#loadMoreClassics").length) {
  $("#loadMoreClassics").on("click", function () {
    classicVisibleCount += 6;
    renderAllMovieSections();
  });
}

// ===== MOVIES PAGE MODAL =====
$(document).on("click", ".movies-page-item", async function () {
  const movieId = $(this).data("id");

  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}`);
    const movie = await res.json();

    $("#moviesModalTitle").text(movie.title);
    $("#moviesModalYear").text("Year: " + (movie.release_date || "N/A"));
    $("#moviesModalRating").text("⭐ Rating: " + movie.vote_average);
    $("#moviesModalDesc").text(movie.overview || "");

    if (movie.poster_path) {
      $("#moviesModalImg").attr("src", "https://image.tmdb.org/t/p/w500" + movie.poster_path);
    } else {
      $("#moviesModalImg").attr("src", "");
    }

    // 🎬 TRAILER LOGIC
    const trailerUrl = await fetchTrailerUrl(movieId);

    if (trailerUrl) {
      $("#moviesTrailerBtn").attr("href", trailerUrl);
      $("#moviesTrailerWrap").show();
    } else {
      $("#moviesTrailerWrap").hide();
    }

    const modal = new bootstrap.Modal(document.getElementById("moviesModal"));
    modal.show();

  } catch (error) {
    console.error("Error loading movies page modal:", error);
  }
});


async function fetchTrailerUrl(movieId) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`);
    const data = await res.json();

    if (!data.results || !data.results.length) return null;

    const trailer =
      data.results.find(v => v.site === "YouTube" && v.type === "Trailer") ||
      data.results.find(v => v.site === "YouTube");

    if (!trailer) return null;

    return `https://www.youtube.com/watch?v=${trailer.key}`;
  } catch (error) {
    console.error("Error loading trailer:", error);
    return null;
  }
}

// ===== MOVIES PAGE SEARCH =====
if ($("#moviesSearch").length) {
  $("#moviesSearch").on("input", function () {
    const query = $(this).val().toLowerCase().trim();

    $(".movies-page-item").each(function () {
      const title = $(this).find("h6").text().toLowerCase();

      if (title.includes(query)) {
        $(this).show();
      } else {
        $(this).hide();
      }
    });
  });
}

// ===== RANDOM MODE TOGGLE =====
if ($("#modeRandom").length && $("#modeMood").length) {
  $("#modeRandom").on("click", function () {
    $(this).addClass("active");
    $("#modeMood").removeClass("active");

    $("#randomControls").show();
    $("#moodRows").hide();
  });

  $("#modeMood").on("click", function () {
    $(this).addClass("active");
    $("#modeRandom").removeClass("active");

    $("#randomControls").hide();
    $("#moodRows").show();
  });
}

// ===== MOOD QUICK BUTTONS =====
$(document).on("click", ".mood-quick-btn", function () {
  const genre = $(this).data("genre");

  $(".mood-quick-btn").removeClass("active");
  $(this).addClass("active");

  $("#randomGenre").val(genre);
  $("#randomMood").val("");

  runShuffle();
});