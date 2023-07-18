document.querySelectorAll(".btn-delete").forEach(e => {
    e.addEventListener("click", () => {
        confirmTask(e.getAttribute("value"), e.getAttribute("season"), e.getAttribute("redirect"), e.getAttribute("unacquired"), e.getAttribute("content-type"), "Delete", "Are You Sure You Want To Delete?");
    });
});

document.querySelectorAll(".btn-convert").forEach(e => {
    e.addEventListener("click", () => {
        confirmTask(e.getAttribute("value"), e.getAttribute("season"), e.getAttribute("redirect"), e.getAttribute("unacquired"), e.getAttribute("content-type"), "Convert", "Are You Sure You Want To Convert?");
    });
});

try {
    let unacquired_movie_form = document.querySelector(".unacquired_movie_convert_form");
    unacquired_movie_form.addEventListener("submit", e => {
        e.preventDefault();
        confirmTask(e.target.getAttribute("value"), e.target.getAttribute("season"), e.target.getAttribute("redirect"), e.target.getAttribute("unacquired"), e.target.getAttribute("content-type"), "Convert", "Are You Sure You Want To Convert?");
    });
} catch (TypeError) {
}

// delete task
function confirmTask(id, season, redirect, unacquired, content_type, confirm_type, confirm_message) {
    let modal = document.querySelector("#confirm-modal");
    modal.style.transition = "top 0.4s";
    modal.classList.add("show");
    requestAnimationFrame(fadeIn);

    document.body.style.overflow = "hidden"; // this

    modal.querySelector(".action-confirm").addEventListener("click", actionConfirm);
    modal.querySelector(".action-cancel").addEventListener("click", actionCancel);
    modal.querySelector(".action-close").addEventListener("click", actionCancel);

    modal.querySelector(".action-confirm").innerText = confirm_type;
    modal.querySelector("h2").innerText = confirm_message;

    function removeModalListeners() {
        modal.querySelector(".action-cancel").removeEventListener("click", actionCancel);
        modal.querySelector(".action-close").removeEventListener("click", actionCancel);
        modal.querySelector(".action-confirm").removeEventListener("click", actionConfirm);
    };

    function actionCancel() {
        modal.style.transition = "top 2s";
        requestAnimationFrame(fadeOut);

        document.body.removeAttribute("style"); // this

        modal.classList.remove("show");
        removeModalListeners();
    };

    const csrftoken = Cookies.get('csrftoken');
    let delete_url, convert_url, is_season;
    let entry = `entry-${content_type}-${id}`
    switch (content_type) {
        case "tv-show":
            delete_url = `/api/delete-tv-show/${id}`;
            convert_url = `/api/convert-tv-show/${id}`;
            break;
        case "movie":
            delete_url = `/api/delete-movie/${id}`;
            convert_url = `/api/convert-movie/${id}`;
            break;
        case "unacquired-tv-show":
            delete_url = `/api/delete-unacquired-tv-show/${id}`;
            convert_url = `/api/convert-tv-show/${id}`;
            break;
        case "unacquired-movie":
            delete_url = `/api/delete-unacquired-movie/${id}`;
            convert_url = `/api/convert-movie/${id}`;
            break;
        case "season":
            delete_url = `/api/delete-season/${id}/${season}`;
            entry = `season-${season}`;
            is_season = true;
            break;
        case "drive":
            delete_url = `/api/delete-drive/${id}`;
            break;
    };

    // console.log(url, entry);

    async function actionConfirm() {
        removeModalListeners();

        if (confirm_type === "Delete") {
            let request = await fetch(delete_url, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrftoken,
                },
                accept: "application.json",
                mode: "same-origin",
            });
            if (redirect === "true") {
                let redirect = "/";
                let previous_url = document.referrer.split("/");
                switch (previous_url[3]) {
                    case "search":
                        redirect = "/search";
                        break;
                    case "home":
                        try {
                            redirect = `/home/${previous_url[4]}`
                        } catch (TypeError) {
                        }
                        break;
                }
                modal.style.transition = "top 2s";
                requestAnimationFrame(fadeOut);
                document.body.removeAttribute("style"); // this
                modal.classList.remove("show"); 
                setTimeout(function () {
                    window.location.replace(redirect);
                }, 350);
            } else {
                let current_url = window.location.href.split("/");
                modal.style.transition = "top 2s";
                requestAnimationFrame(fadeOut);
                document.body.removeAttribute("style"); // this
                modal.classList.remove("show"); 
    
                switch (current_url[3]) {
                    case "search":
                        if (document.querySelectorAll("tbody tr").length === 1) {
                            window.location.reload();
                        };
                        break;
                    case "home":
                        if (document.querySelectorAll(".item").length === 1) {
                            switch (current_url[4]) {
                                case "new-episodes":
                                    document.querySelector(`#${entry}`).insertAdjacentHTML("beforebegin", "<h2>No new episodes.</h2>");
                                    break;
                                case "not-seen":
                                    document.querySelector(`#${entry}`).insertAdjacentHTML("beforebegin", "<h2>No unseen content.</h2>");
                                    break;
                                case "can-rewatch":
                                    document.querySelector(`#${entry}`).insertAdjacentHTML("beforebegin", "<h2>No content to rewatch.</h2>");
                            };
                        };
                };
                if (current_url[3].length === 0) {document.querySelector(`#${entry}`).insertAdjacentHTML("beforebegin", "<h2>No new episodes.</h2>")};
    
                try {
                    document.querySelector(`#${entry}`).remove();
                } catch (TypeError) {
                    document.querySelector(`#drive-${id}`).remove();
                }
            };
        } else if (confirm_type === "Convert") {
            if (unacquired === "True" && content_type === "movie") {

                let name = unacquired_movie_form.querySelector("#id_name");
                let rip_type = unacquired_movie_form.querySelector("#id_rip_type");
                let size = unacquired_movie_form.querySelector("#id_size");
                let exact_resolution = unacquired_movie_form.querySelector("#id_exact_resolution");
                let general_resolution = unacquired_movie_form.querySelector("#id_general_resolution");
                let hdr_dv = unacquired_movie_form.querySelector("#id_hdr_dv");
                let dtsx_atmos = unacquired_movie_form.querySelector("#id_dtsx_atmos");
                let video = unacquired_movie_form.querySelector("#id_video");
                let audio = unacquired_movie_form.querySelector("#id_audio");
                let last_watched_date = unacquired_movie_form.querySelector("#id_last_watched_date");
                let tmdb_id = unacquired_movie_form.querySelector("#id_tmdb_id");
                let file_path = unacquired_movie_form.querySelector("#id_file_path");

                let hdr_dv_value, dtsx_atmos_value, last_watched_date_value;

                try {
                    hdr_dv_value = hdr_dv.value;   
                } catch (TypeError) {
                    hdr_dv_value = "none";
                }
            
                try {
                    dtsx_atmos_value = dtsx_atmos.value;   
                } catch (TypeError) {
                    dtsx_atmos_value = "none";
                }
            
                try {
                    last_watched_date_value = last_watched_date.value;
                } catch (TypeError) {
                    last_watched_date_value = undefined;
                }
            
                data = {
                    name: name.value,
                    rip_type: rip_type.value,
                    size: size.value,
                    exact_resolution: exact_resolution.value,
                    general_resolution: general_resolution.value,
                    hdr_dv: hdr_dv_value,
                    dtsx_atmos: dtsx_atmos_value,
                    video: video.value,
                    audio: audio.value,
                    last_watched_date: last_watched_date_value,
                    tmdb_id: tmdb_id.value,
                    file_path: file_path.value
                };

                let request = await fetch(convert_url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrftoken,
                    },
                    accept: "application.json",
                    mode: "same-origin",
                    body: JSON.stringify(data),
                });

                modal.style.transition = "top 2s";
                requestAnimationFrame(fadeOut);
                document.body.removeAttribute("style"); // this
                modal.classList.remove("show"); 
                setTimeout(function () {
                    window.location.replace(`/movie/${id}`);
                }, 350);
            } else {
                let request = await fetch(convert_url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrftoken,
                    },
                    accept: "application.json",
                    mode: "same-origin",
                });

                switch (unacquired) {
                    case "True":
                        switch(content_type) {
                            case "tv-show":
                              redirect = `/tv-show/${id}/`;
                              break;
                            case "movie":
                              redirect = `/movie/${id}/`;
                              break;
                          };
                        break;
                    case "False":
                        switch(content_type) {
                            case "tv-show":
                              redirect = `/unacquired-tv-show/${id}/`;
                              break;
                            case "movie":
                              redirect = `/unacquired-movie/${id}/`;
                              break;
                          };
                        break;
                };
    
                modal.style.transition = "top 2s";
                requestAnimationFrame(fadeOut);
                document.body.removeAttribute("style"); // this
                modal.classList.remove("show"); 
                setTimeout(function () {
                    window.location.replace(redirect);
                }, 350);
            };
        };

        if (is_season === true) {
            let total_seasons = document.querySelector(".total_seasons_info.tag").innerText.split(" ")[2];
            // console.log(total_seasons);
            if (Number(total_seasons) === 1) {
                document.querySelector(".detail").classList.add("hide");
            };
        };

    };
};

let is_shadow_animation_running = false;
let modal_shadow = document.querySelector(".modal-shadow")
let fade_out_opacity = 100;
function fadeOut() {
    is_shadow_animation_running = true;
    fade_out_opacity--;
    if (fade_out_opacity === 0) {
        modal_shadow.style.visibility = "hidden";
        setTimeout(() => {
            is_shadow_animation_running = false;
        }, 250);
    }
    modal_shadow.style.opacity = fade_out_opacity/100;
    if (fade_out_opacity > 0){
        requestAnimationFrame(fadeOut);
    } else {
        fade_out_opacity = 100;
    };
};

let fade_in_opacity = 0;
function fadeIn() {
    is_shadow_animation_running = true;
    if (fade_in_opacity === 0) {
        modal_shadow.style.visibility = "visible";
        setTimeout(() => {
            is_shadow_animation_running = false;
        }, 250);
    }
    fade_in_opacity++;
    modal_shadow.style.opacity = fade_in_opacity/100;
    if (fade_in_opacity < 100){
        requestAnimationFrame(fadeIn);
    } else {
        fade_in_opacity = 0;
    };
};

function waitForAnimationToFinish() {
    return new Promise((resolve) => {
      const checkCondition = () => {
        if (!is_shadow_animation_running) {
          resolve();
        } else {
          setTimeout(checkCondition, 50);
        }
      };
  
      checkCondition();
    });
  }