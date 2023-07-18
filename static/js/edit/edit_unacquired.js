/** @format */

let right_card_form = document.querySelector(".right-card.form");
let delete_button = document.querySelector(".delete_button");
let save_button = document.querySelector(".unacquired_form_container .save_button");
let edit_button = document.querySelector(".edit_button");
let right_card_tags = document.querySelector(".right_card_tags");
let imdb_url = document.querySelector(".imdb_url");
let tvdb_url = document.querySelector(".tvdb_url");
let tmdb_url = document.querySelector(".tmdb_url");
let convert_form_button = document.querySelector(".new_btn_convert");
let form = document.querySelector(".form");

const moveable_right_card = document.querySelector(".moveable_right_card");
const cancel_button_other = document.querySelector(".cancel-button");

edit_button.addEventListener("click", (e) => {
  moveable_right_card.classList.add("move_left");
  setTimeout(() => {
    form.addEventListener("submit", submitForm);
  }, 300);
});

cancel_button_other.addEventListener("click", (e) => {
  moveable_right_card.classList.remove("move_left");
  form.removeEventListener("submit", submitForm);
});

async function submitForm(e) {
  e.preventDefault();
  let current_url = window.location.href.split("/");
  let unacquired_id = current_url[4];
  let unacquired_type = current_url[3];
  const csrftoken = Cookies.get("csrftoken");
  let url = `/api/update-${unacquired_type}/${unacquired_id}`;

  let data, tvdb_id, tmdb_id, last_watched_season, last_watched_episode;
  let name = document.querySelector("#id_name");
  let last_watched_date = document.querySelector("#id_last_watched_date");

  if (unacquired_type === "unacquired-movie") {
    tmdb_id = document.querySelector("#id_tmdb_id");
    data = {
      name: name.value,
      tmdb_id: tmdb_id.value,
      last_watched_date: last_watched_date.value,
    };
  } else if (unacquired_type === "unacquired-tv-show") {
    tvdb_id = document.querySelector("#id_tvdb_id");
    last_watched_season = document.querySelector("#id_last_watched_season");
    last_watched_episode = document.querySelector("#id_last_watched_episode");

    data = {
      name: name.value,
      tvdb_id: tvdb_id.value,
      last_watched_date: last_watched_date.value,
      last_watched_season: last_watched_season.value,
      last_watched_episode: last_watched_episode.value,
    };
  }
  // console.log(data);

  let response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrftoken,
    },
    accept: "application.json",
    mode: "same-origin",
    body: JSON.stringify(data),
  });

  response = await response.json();

  if (document.querySelector(".unacquired_content_name").innerText.trim() !== response.name.trim()) {
    window.location.reload();
  }

  // console.log(response);

  name.value = response.name;
  last_watched_date.value = response.last_watched_date;
  document.querySelector(".imdb_url").setAttribute("href", `https://www.imdb.com/title/${response.imdb_id}`);

  if (unacquired_type === "unacquired-movie") {
    tmdb_id.value = response.tmdb_id;
    document.querySelector(".tmdb_url").setAttribute("href", `https://www.themoviedb.org/movie/${response.tmdb_id}`);
    document.querySelector(".tvdb_id.tag").innerText = `TMDB - ${response.tmdb_id}`;
  } else if (unacquired_type === "unacquired-tv-show") {
    tvdb_id.value = response.tvdb_id;
    // console.log(response.tvdb_id);
    last_watched_season.value = response.last_watched_season;
    last_watched_episode.value = response.last_watched_episode;
    document.querySelector(".tmdb_url").setAttribute("href", `https://www.themoviedb.org/tv/${response.tmdb_id}`);
    document.querySelector(".tvdb_url").setAttribute("href", `https://www.thetvdb.com/?id=${response.tvdb_id}&tab=series`);
    document.querySelector(".tvdb_id.tag").innerText = `TVDB - ${response.tvdb_id}`;
  }

  document.querySelector(".poster_file").src = response.poster_file;
  moveable_right_card.classList.add("move_more_left");
  moveable_right_card.classList.remove("move_left");
  form.removeEventListener("submit", submitForm);
  setTimeout(() => {
    moveable_right_card.style.transition = "left 0.15s ease-in-out";
    moveable_right_card.classList.remove("move_more_left");
    moveable_right_card.style.transition = "left 0.3s ease-in-out";
  }, 525);

  try {
    tvdb_url.classList.toggle("hidden");
  } catch (TypeError) {}
}
