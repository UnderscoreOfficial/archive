// fixing choice field to stay on the selected item when using the back/forward page buttons
document.querySelector("#id_type").selectedIndex = 0;


// changing form between movie/tv-show
let choice_field = document.querySelector("#id_type");
choice_field.addEventListener("change", changeFormType);

function changeFormType() {
    let seasons_and_episodes = document.querySelector("#seasons_and_episodes");
    let id_input = document.querySelector(".id_span input");
    let id_label = document.querySelector(".id_label");
    let name_span = document.querySelector(".name_span input");

    if (choice_field.value === "Movie") {
        seasons_and_episodes.style.display = "none";
        id_input.setAttribute("name", "tmdb_id");
        id_input.setAttribute("id", "id_tmdb_id");
        id_input.value = "";
        name_span.value = "";
        id_label.setAttribute("for", "tmdb_id_id");
        id_label.innerText = "TMDB ID";
        id_label.innerHTML = "<a href='https://www.themoviedb.org/' target='_blank'>TMDB ID</a>";
    } else {
        seasons_and_episodes.style.display = "block";
        id_input.setAttribute("name", "tvdb_id");
        id_input.setAttribute("id", "id_tvdb_id");
        id_input.value = "";
        name_span.value = "";
        id_label.setAttribute("for", "tvdb_id_id");
        id_label.innerHTML = "<a href='https://thetvdb.com/' target='_blank'>TVDB ID</a>";
    }
}


// getting form data
let form = document.querySelector("form");

form.addEventListener("submit", async e => {
    e.preventDefault();
    const csrftoken = Cookies.get("csrftoken")

    let type, name, id, last_watched_date, url, data;
    type = form.querySelector("#id_type");
    name = form.querySelector("#id_name");
    last_watched_date = form.querySelector("#id_last_watched_date");

    if (type.value === "Movie") {
        id = form.querySelector("#id_tmdb_id");
        url = "/api/create-unacquired-movie/";
        redirect_url = "/unacquired-movie/"
        data = JSON.stringify({
            "name": name.value,
            "tmdb_id": id.value,
            "last_watched_date": last_watched_date.value
        });
        console.log(data);
    } else {
        let last_watched_season, last_watched_episode;
        id = form.querySelector("#id_tvdb_id");
        last_watched_season = form.querySelector("#id_last_watched_season");
        last_watched_episode = form.querySelector("#id_last_watched_episode");
        url = "/api/create-unacquired-tv-show/";
        redirect_url = "/unacquired-tv-show/"
        data = JSON.stringify({
            "name": name.value,
            "tvdb_id": id.value,
            "last_watched_date": last_watched_date.value,
            "last_watched_season": last_watched_season.value,
            "last_watched_episode": last_watched_episode.value
        });

    }

    let response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
        },
        accept: "application.json",
        mode: "same-origin",
        body: data
    });

    form.reset();
    response = await response.json();
    console.log(response);
    window.location.replace(`${redirect_url}${response.id}/${response.unique_id}`)

});