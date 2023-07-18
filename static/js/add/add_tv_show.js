const missing_container = document.querySelector(".missing_container");

function selectFilePath(new_file_paths) {
    let modal = document.querySelector("#audio-modal");
    modal.style.transition = "top 0.4s";
    modal.classList.add("show");
    requestAnimationFrame(fadeIn);
    document.body.style.overflow = "hidden";

    const container = modal.querySelector(".audio-tracks");

    for (let file_path = 0; file_path < new_file_paths.length; file_path++) {
        container.insertAdjacentHTML("beforeend", `<span id="audio-track-${file_path}" class="audio-track">${new_file_paths[file_path].current_name}</span>`);
        container.querySelector(`#audio-track-${file_path}`).addEventListener("click", e => {
            if (e.shiftKey) {
                console.log("Shifting");
                verifyName(new_file_paths[file_path]);
            } else {
                if (!new_file_paths[file_path].renamed) {
                    verifyName(new_file_paths[file_path]);
                } else {
                    actionConfirm(new_file_paths[file_path]);
                }
            }
        });
    }

    function removeModalListeners() {
        container.querySelectorAll("#audio-track").forEach(e => {
            e.removeEventListener("click", actionConfirm);
        });
    };

    const csrftoken = Cookies.get('csrftoken');

    async function verifyName(file_path) {
        container.innerHTML = ``;
        container.classList.add("verify-name");
        container.insertAdjacentHTML("beforeend", `
            <div>
                <i class="loading-svg hide">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <path d="M304 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z" />
                    </svg>
                </i>
                <p id="verify-current-name">${file_path.current_name}</p>
                <p id="verify-new-name">${file_path.new_name}</p>
                <div>
                    <div>
                        <label for="correct_id">
                            <a href="https://thetvdb.com/" target="_blank">TVDB ID</a>
                        </label>
                        <div class="background">
                            <input type="number" name="correct_id" min="0" required="" id="id_correct_id">
                        </div>
                        <button class="btn btn-blue">Confirm</button>
                    </div>
                </div>
            </div>
        `);        
        container.querySelector("button").addEventListener("click", () => {
            let correct_id = Number(container.querySelector("#id_correct_id").value);
            let rename = false;
            if (correct_id === 0) {
                rename = true;
            }
            try {
                renameContent(file_path, correct_id, rename);
            } catch (error) {
                missing_container.classList.remove("hide");
                missing_container.querySelector("h2").innerText = "[FileBot] Rename Failed!";
            }
        })
    }

    async function renameContent(file_path, correct_id, rename) {

        if (correct_id !== 0) {
            file_path.id = correct_id;
        }

        if (rename) {
            file_path.rename = true;
        } else {
            file_path.rename = false;
        }

        container.querySelector(".loading-svg").classList.remove("hide");
        
        response = await fetch(`/api/rename`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken,
            },
            accept: "application.json",
            mode: "same-origin",
            body: JSON.stringify(file_path),
        });
        response = await response.json();
        if (response === "error") {
            missing_container.classList.remove("hide");
            missing_container.querySelector("h2").innerText = "Rename Failed!";
            missing_container.addEventListener("click", () => {
                missing_container.classList.add("hide");
            })
        }

        container.querySelector(".loading-svg").classList.add("hide");
        actionConfirm(response);
    }

    async function actionConfirm(file_path) {
            if (file_path.id !== undefined) {
                // check if tv show exists
                let response = await fetch(`/api/verify-id/tv-show/${file_path.id}`);
                response = await response.json();
        
                if (response[0]) {
                    if (response[1]) {
                        document.querySelector(".title h1").innerText = "Convert Tv-Show";
                        const submit = document.querySelector(".submit_button input");
                        submit.classList.add("btn-red");
                        submit.classList.remove("btn-blue");
                        submit.value = "Convert";

                        let response_detail = await fetch(`/api/unacquired-tv-show-detail/${response[2]}`);
                        response_detail = await response_detail.json();

                        document.querySelector("#id_last_watched_date").value = response_detail.last_watched_date;
                        document.querySelector("#id_last_watched_season").value = response_detail.last_watched_season;
                        document.querySelector("#id_last_watched_episode").value = response_detail.last_watched_episode;

                        document.querySelector("form").addEventListener("submit", handleForm);
                        async function handleForm(e) {
                            e.preventDefault();

                            data = {
                                name: file_path.name,
                                tvdb_id: file_path.id,
                                file_path: `${file_path.base_path}/${file_path.new_name}`,
                                last_watched_date: response_detail.last_watched_date,
                                last_watched_season: response_detail.last_watched_season,
                                last_watched_episode: response_detail.last_watched_episode,
                            };

                            let request = await fetch(`/api/convert-tv-show/${response_detail.id}`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "X-CSRFToken": csrftoken,
                                },
                                accept: "application.json",
                                mode: "same-origin",
                                body: JSON.stringify(data),
                            });

                            setTimeout(function () {
                                window.location.replace(`/tv-show/${response_detail.id}/`);
                            }, 350);
                        }
                    } else {
                        console.log("Tv-Show already exists!")
                        missing_container.classList.remove("hide");
                        missing_container.addEventListener("click", () => {
                            missing_container.classList.add("hide");
                        })
                        missing_container.querySelector("h2").innerText = "Tv-Show already exists!";
                        // disable model / clean up
                        modal.style.transition = "top 2s";
                        requestAnimationFrame(fadeOut);
                        document.body.removeAttribute("style");
                        modal.classList.remove("show");
                        removeModalListeners();
                        setTimeout(e => {
                            container.classList.remove("verify-name");
                            container.innerHTML = ``;
                        }, 250)
                        return
                    }
                }
            
                // set values
                document.querySelector("#id_file_path").value = `${file_path.base_path}/${file_path.new_name}`;
                document.querySelector("#id_name").value = file_path.name;
                document.querySelector("#id_tvdb_id").value = file_path.id;
            }
        
            // disable model / clean up
            modal.style.transition = "top 2s";
            requestAnimationFrame(fadeOut);
            document.body.removeAttribute("style");
            modal.classList.remove("show");
            removeModalListeners();
            setTimeout(e => {
                container.classList.remove("verify-name");
                container.innerHTML = ``;
            }, 250)
    };
};


async function fetchNewPaths() {
    response = await fetch(`/api/list-new-files/tv-shows`);
    response = await response.json();

    missing_container.classList.add("hide");
    missing_container.querySelector("h2").innerText = "Cannot Find";

    if (response.length > 0) {
        selectFilePath(response, document)
    }
}

fetchNewPaths();