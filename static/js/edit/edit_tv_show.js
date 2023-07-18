/** @format */

let right_card_new_episodes = document.querySelector(".right_card_new_episodes");
let imdb_url = document.querySelector(".imdb_url");
let tmdb_url = document.querySelector(".tmdb_url");
let tvdb_url = document.querySelector(".tvdb_url");
let btn_convert = document.querySelector(".btn-convert");
let right_card_tags = document.querySelector(".right_card_tags");
let right_card_more_tags = document.querySelector(".right_card_more_tags");
let right_card_form = document.querySelector(".right-card.form");
let edit_button = document.querySelector(".edit-button");
let delete_button = document.querySelector(".info_action .delete-button");
let form = document.querySelector(".tv-show-form");
const moveable_right_card = document.querySelector(".moveable_right_card");
const cancel_button = document.querySelector(".cancel-button");

edit_button.addEventListener("click", (e) => {
  moveable_right_card.classList.add("move_left");
  setTimeout(() => {
    form.addEventListener("submit", submitForm);
  }, 300);
});

cancel_button.addEventListener("click", (e) => {
  moveable_right_card.classList.remove("move_left");
  form.removeEventListener("submit", submitForm);
});

async function submitForm(e) {
  e.preventDefault();
  let tv_show_id = window.location.href.split("/")[4];
  const csrftoken = Cookies.get("csrftoken");
  let url = `/api/update-tv-show/${tv_show_id}/`;

  let data, tvdb_id, last_watched_season, last_watched_episode;
  let name = document.querySelector("#id_name");
  let last_watched_date = document.querySelector("#id_last_watched_date");
  let file_path = document.querySelector("#id_file_path");
  tvdb_id = document.querySelector("#id_tvdb_id");
  last_watched_season = document.querySelector("#id_last_watched_season");
  last_watched_episode = document.querySelector("#id_last_watched_episode");

  data = {
    name: name.value,
    tvdb_id: tvdb_id.value,
    file_path: file_path.value,
    last_watched_date: last_watched_date.value,
    last_watched_season: last_watched_season.value,
    last_watched_episode: last_watched_episode.value,
  };

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
  console.log(response);

  try {
    if (response.file_path == "File path does not exist.") {
      console.log("File path does not exist.");
    }
  } catch (error) {}

  if (document.querySelector(".tv_show_name").innerText !== response.name) {
    window.location.reload();
  }

  name.value = response.name;
  last_watched_date.value = response.last_watched_date;
  tvdb_id.value = response.tvdb_id;
  file_path.value = response.file_path;
  last_watched_season.value = response.last_watched_season;
  last_watched_episode.value = response.last_watched_episode;
  document.querySelector(".imdb_url").setAttribute("href", `https://www.imdb.com/title/${response.imdb_id}`);
  document.querySelector(".tmdb_url").setAttribute("href", `https://www.themoviedb.org/tv/${response.tmdb_id}`);
  document.querySelector(".tvdb_url").setAttribute("href", `https://www.thetvdb.com/?id=${response.tvdb_id}&tab=series`);
  document.querySelector(".tvdb_id.tag").innerText = `TVDB - ${response.tvdb_id}`;

  if (response.last_watched_date != null) {
    try {
      let date = new Date(response.last_watched_date);

      let options = {
        year: "numeric",
        month: "short",
        day: "numeric",
      };

      let parsed_date = date.toLocaleDateString("en-US", options);
      let split_date = parsed_date.split(" ");
      let formatted_date = `${split_date[0]}. ${split_date[1]} ${split_date[2]}`;

      document.querySelector(".last_watched.tag").innerText = `Last Watched - ${formatted_date}`;
    } catch (TypeError) {
      document.querySelector(".last_watched.tag").innerText = `Last Watched - ${response.last_watched_date}`;
    }

    if (response.last_watched_season != null) {
      try {
        let date = new Date(response.last_watched_date);

        let options = {
          year: "numeric",
          month: "short",
          day: "numeric",
        };

        let parsed_date = date.toLocaleDateString("en-US", options);
        let split_date = parsed_date.split(" ");
        let formatted_date = `${split_date[0]}. ${split_date[1]} ${split_date[2]}`;

        document.querySelector(".last_watched.tag").innerText = `Last Watched - ${formatted_date} - Season ${response.last_watched_season}, Episode ${response.last_watched_episode}`;
      } catch (TypeError) {
        document.querySelector(".last_watched.tag").innerText = `Last Watched - ${response.last_watched_date} - Season ${response.last_watched_season}, Episode ${response.last_watched_episode}`;
      }
    }
  }

  document.querySelector(".poster_file").src = response.poster_file;
  moveable_right_card.classList.add("move_more_left");
  moveable_right_card.classList.remove("move_left");
  form.removeEventListener("submit", submitForm);
  localStorage.clear();
  setTimeout(() => {
    moveable_right_card.style.transition = "left 0.15s ease-in-out";
    moveable_right_card.classList.remove("move_more_left");
    moveable_right_card.style.transition = "left 0.3s ease-in-out";
  }, 525);
}

// show new episodes

let has_new_episodes = right_card_new_episodes.querySelector(".new_episodes_count");
if (has_new_episodes !== null) {
  has_new_episodes.addEventListener("click", showNewEpisodes);
}

let new_episodes_count_tag;
let new_episodes = document.querySelector(".new_episodes");

function showNewEpisodes() {
  if (!has_new_episodes.classList.contains("show")) {
    has_new_episodes.classList.toggle("show");
    right_card_tags.classList.toggle("hidden");
    right_card_more_tags.classList.toggle("hidden");
    imdb_url.classList.toggle("hidden");
    tmdb_url.classList.toggle("hidden");
    tvdb_url.classList.toggle("hidden");
    btn_convert.classList.toggle("hidden");
    delete_button.classList.toggle("hidden");
    edit_button.classList.toggle("hide");
    new_episodes_count_tag = right_card_new_episodes.querySelector("span").innerText;
    right_card_new_episodes.querySelector("span").innerText = "×";
    new_episodes.classList.toggle("hidden");
  } else {
    has_new_episodes.classList.toggle("show");
    right_card_tags.classList.toggle("hidden");
    right_card_more_tags.classList.toggle("hidden");
    imdb_url.classList.toggle("hidden");
    tmdb_url.classList.toggle("hidden");
    tvdb_url.classList.toggle("hidden");
    btn_convert.classList.toggle("hidden");
    delete_button.classList.toggle("hidden");
    edit_button.classList.toggle("hide");
    right_card_new_episodes.querySelector("span").innerText = new_episodes_count_tag;
    new_episodes.classList.toggle("hidden");
  }
}
