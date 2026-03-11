const movieGrid = document.getElementById('movieGrid');
const watchlistGrid = document.getElementById('watchlistGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const statusMessage = document.getElementById('statusMessage');
const themeToggle = document.getElementById('themeToggle');
const resultCount = document.getElementById('resultCount');
const watchlistEmpty = document.getElementById('watchlistEmpty');
const chips = document.querySelectorAll('.chip');
const body = document.body;

const movieModal = document.getElementById('movieModal');
const closeModal = document.getElementById('closeModal');
const modalPoster = document.getElementById('modalPoster');
const modalTitle = document.getElementById('modalTitle');
const modalOverview = document.getElementById('modalOverview');
const modalMeta = document.getElementById('modalMeta');
const castList = document.getElementById('castList');
const trailerContainer = document.getElementById('trailerContainer');

const TMDB_API_KEY = '071a639027ebd9c6724c3eeda14366db';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_PROFILE_BASE = 'https://image.tmdb.org/t/p/w185';

let watchlist = [];

/* Theme Toggle */
themeToggle.addEventListener('click', () => {
  const icon = themeToggle.querySelector('i');
  const isLight = body.getAttribute('data-theme') === 'light';

  if (isLight) {
    body.removeAttribute('data-theme');
    icon.className = 'fa-regular fa-moon';
  } else {
    body.setAttribute('data-theme', 'light');
    icon.className = 'fa-regular fa-sun';
  }
});

/* Search Movies */
async function searchMovies(queryFromChip = null) {
  const query = queryFromChip || searchInput.value.trim();

  if (!query) {
    statusMessage.textContent = 'Please enter a movie title.';
    return;
  }

  statusMessage.textContent = 'Searching movies...';
  movieGrid.innerHTML = '';
  resultCount.textContent = '';

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      statusMessage.textContent = `Showing results for "${query}"`;
      resultCount.textContent = `${data.results.length} found`;
      renderMovies(data.results);
    } else {
      statusMessage.textContent = 'No movies found.';
      movieGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <i class="fa-solid fa-circle-exclamation"></i>
          <p>No results found. Try another title.</p>
        </div>
      `;
    }
  } catch (error) {
    statusMessage.textContent = 'Network error. Please try again.';
    movieGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="fa-solid fa-wifi"></i>
        <p>Could not connect to the movie service.</p>
      </div>
    `;
  }
}

/* Render Movies */
function renderMovies(movies) {
  movieGrid.innerHTML = movies.map(movie => {
    const poster = movie.poster_path
      ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
      : 'https://via.placeholder.com/300x450?text=No+Image';

    return `
      <div class="movie-card">
        <div class="movie-poster">
          <img src="${poster}" alt="${movie.title}">
          <span class="movie-type">Movie</span>
        </div>
        <div class="card-content">
          <h3>${movie.title}</h3>
          <p>${movie.release_date ? movie.release_date.slice(0, 4) : 'Unknown year'}</p>
          <div class="card-actions">
            <button 
              class="add-btn add-watchlist-btn"
              data-id="${movie.id}"
              data-title="${escapeHtml(movie.title)}"
              data-poster="${poster}">
              + Watchlist
            </button>
            <button 
              class="details-btn details-watch-btn"
              data-id="${movie.id}">
              View Details
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* Show Movie Details */
async function showMovieDetails(movieId) {
  movieModal.classList.remove('hidden');
  castList.innerHTML = '<p>Loading cast...</p>';
  trailerContainer.innerHTML = '<p style="padding:12px;">Loading trailer...</p>';

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`
    );
    const movie = await response.json();

    const poster = movie.poster_path
      ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
      : 'https://via.placeholder.com/300x450?text=No+Image';

    modalPoster.src = poster;
    modalPoster.alt = movie.title || 'Movie poster';
    modalTitle.textContent = movie.title || 'Untitled';
    modalOverview.textContent = movie.overview || 'No overview available.';
    modalMeta.textContent = `${movie.release_date || 'Unknown date'} • ${movie.runtime || '?'} mins • Rating: ${movie.vote_average || 'N/A'}/10`;

    renderCast(movie.credits?.cast || []);
    renderTrailer(movie.videos?.results || []);
  } catch (error) {
    modalTitle.textContent = 'Error';
    modalOverview.textContent = 'Could not load movie details.';
    modalMeta.textContent = '';
    castList.innerHTML = '<p>No cast information available.</p>';
    trailerContainer.innerHTML = '<p style="padding:12px;">Could not load trailer.</p>';
  }
}

/* Render Cast */
function renderCast(cast) {
  if (!cast.length) {
    castList.innerHTML = '<p>No cast information available.</p>';
    return;
  }

  castList.innerHTML = cast.slice(0, 12).map(actor => {
    const profile = actor.profile_path
      ? `${TMDB_PROFILE_BASE}${actor.profile_path}`
      : 'https://via.placeholder.com/185x278?text=No+Image';

    return `
      <div class="cast-card">
        <img src="${profile}" alt="${actor.name}">
        <div class="cast-info">
          <h4>${actor.name}</h4>
          <p>as ${actor.character || 'Unknown character'}</p>
        </div>
      </div>
    `;
  }).join('');
}

/* Render Trailer */
function renderTrailer(videos) {
  const trailer = videos.find(video =>
    video.site === 'YouTube' &&
    (video.type === 'Trailer' || video.type === 'Teaser')
  );

  if (!trailer) {
    trailerContainer.innerHTML = '<p style="padding:12px;">No trailer available.</p>';
    return;
  }

  trailerContainer.innerHTML = `
    <iframe
      src="https://www.youtube.com/embed/${trailer.key}"
      title="${trailer.name}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen>
    </iframe>
  `;
}

/* Watchlist */
function addToWatchlist(id, title, poster) {
  if (watchlist.some(movie => movie.id === id)) {
    statusMessage.textContent = `"${title}" is already in your watchlist.`;
    return;
  }

  watchlist.push({ id, title, poster });
  updateWatchlist();
  statusMessage.textContent = `"${title}" added to watchlist.`;
}

function removeFromWatchlist(id) {
  watchlist = watchlist.filter(movie => movie.id !== id);
  updateWatchlist();
}

function updateWatchlist() {
  watchlistEmpty.style.display = watchlist.length === 0 ? 'block' : 'none';

  watchlistGrid.innerHTML = watchlist.map(movie => `
    <div class="movie-card">
      <div class="movie-poster">
        <img src="${movie.poster}" alt="${movie.title}">
        <span class="movie-type">Saved</span>
      </div>
      <div class="card-content">
        <h3>${movie.title}</h3>
        <p>Ready to watch later</p>
        <div class="card-actions">
          <button class="remove-btn remove-watchlist-btn" data-id="${movie.id}">
            Remove
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

/* Search Button */
searchBtn.addEventListener('click', () => searchMovies());

/* Enter Key */
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    searchMovies();
  }
});

/* Live helper */
searchInput.addEventListener('input', () => {
  const count = searchInput.value.trim().length;
  if (count === 0) {
    statusMessage.textContent = '';
  } else {
    statusMessage.textContent = `Typing: ${count} character${count > 1 ? 's' : ''}`;
  }
});

/* Chip Search */
chips.forEach(chip => {
  chip.addEventListener('click', () => {
    const query = chip.dataset.query;
    searchInput.value = query;
    searchMovies(query);
  });
});

/* Event Delegation */
document.addEventListener('click', (e) => {
  const addBtn = e.target.closest('.add-watchlist-btn');
  const removeBtn = e.target.closest('.remove-watchlist-btn');
  const detailsBtn = e.target.closest('.details-watch-btn');

  if (addBtn) {
    const id = addBtn.dataset.id;
    const title = addBtn.dataset.title;
    const poster = addBtn.dataset.poster;
    addToWatchlist(id, title, poster);
  }

  if (removeBtn) {
    removeFromWatchlist(removeBtn.dataset.id);
  }

  if (detailsBtn) {
    showMovieDetails(detailsBtn.dataset.id);
  }
});

/* Close Modal */
closeModal.addEventListener('click', () => {
  movieModal.classList.add('hidden');
  trailerContainer.innerHTML = '';
});

movieModal.addEventListener('click', (e) => {
  if (e.target === movieModal) {
    movieModal.classList.add('hidden');
    trailerContainer.innerHTML = '';
  }
});

/* Escape helper */
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}