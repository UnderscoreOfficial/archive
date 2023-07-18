function selectAudioTrack(audio, tbody, audio_type, not_found) {
    let modal = document.querySelector("#audio-modal");
    modal.style.transition = "top 0.4s";
    modal.classList.add("show");
    requestAnimationFrame(fadeIn);
    document.body.style.overflow = "hidden";

    const audio_container = modal.querySelector(".audio-tracks");

    for (let audio_track = 0; audio_track < audio.length; audio_track++) {
        audio_container.insertAdjacentHTML("beforeend", `<span id="audio-track-${audio_track}" class="audio-track">${audio[audio_track]}</span>`);
        audio_container.querySelector(`#audio-track-${audio_track}`).addEventListener("click", () => {
            actionConfirm(audio_track);
        }, audio_track);
    }

    function removeModalListeners() {
        audio_container.querySelectorAll("#audio-track").forEach(e => {
            e.removeEventListener("click", actionConfirm);
        });
    };

    const csrftoken = Cookies.get('csrftoken');

    async function actionConfirm(audio_track) {
        let audio_track_text = audio_container.querySelector(`#audio-track-${audio_track}`).innerText;
        tbody.querySelector("#id_audio").value = audio_track_text;

        const found_elements = audio_type.find(e => tbody.querySelector("#id_audio").value.toLowerCase().includes(e.toLowerCase()));
        if (found_elements === undefined) {
            changeSelectValue(document.querySelector("#id_dtsx_atmos"), "none");
        } else if (found_elements === "DTS XLL X") {
            changeSelectValue(document.querySelector("#id_dtsx_atmos"), "dtsx");
        } else if (found_elements === "Meridian Lossless Packing FBA with 16-channel presentation" || found_elements === "Joint Object Coding") {
            changeSelectValue(document.querySelector("#id_dtsx_atmos"), "dolbyatmos");
        } else {
            console.log("Cannot get DTS:X / Dolby Atmos")
            not_found.push("DTS:X / Dolby Atmos");
        }

        modal.style.transition = "top 2s";
        requestAnimationFrame(fadeOut);
        document.body.removeAttribute("style");
        modal.classList.remove("show");
        removeModalListeners();
        const missing_container = tbody.querySelector(".missing_container");
        if (not_found.length > 0) {
            missing_container.classList.remove("hide");
            missing_container.addEventListener("click", () => {
                missing_container.classList.add("hide");
            })
            missing_container.querySelector("p").innerText = not_found.join(", ");
        }
        setTimeout(e => {
            audio_container.innerHTML = ``;
        }, 300)
    };
};


function selectFilePath(new_file_paths, tbody) {
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
                            <a href="https://www.themoviedb.org/" target="_blank">TMDB ID</a>
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
            renameContent(file_path, correct_id, rename);
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
        try {
            response = await response.json();
            container.querySelector(".loading-svg").classList.add("hide");
            actionConfirm(response);
        } catch (error) {
            container.querySelector(".loading-svg").classList.add("hide");
            console.log("Rename Failed!");
        }
    }

    async function actionConfirm(file_path) {
        if (file_path.id !== undefined) {
            // check if movie exists
            response = await fetch(`/api/verify-id/movie/${file_path.id}`);
            response = await response.json();

            if (response[0]) {
                if (response[1]) {
                    document.querySelector(".title h1").innerText = "Convert Movie";
                    const submit = document.querySelector(".submit_button input");
                    submit.classList.add("btn-red");
                    submit.classList.remove("btn-blue");
                    submit.value = "Convert";

                    let response_detail = await fetch(`/api/unacquired-movie-detail/${response[2]}`);
                    response_detail = await response_detail.json();
                    console.log(response_detail);

                    document.querySelector("#id_last_watched_date").value = response_detail.last_watched_date;

                    document.querySelector("form").addEventListener("submit", handleForm);
                    async function handleForm(e) {
                        e.preventDefault();

                        let rip_type = document.querySelector("#id_rip_type");
                        let size = document.querySelector("#id_size");
                        let exact_resolution = document.querySelector("#id_exact_resolution");
                        let general_resolution = document.querySelector("#id_general_resolution");
                        let hdr_dv = document.querySelector("#id_hdr_dv");
                        let dtsx_atmos = document.querySelector("#id_dtsx_atmos");
                        let video = document.querySelector("#id_video");
                        let audio = document.querySelector("#id_audio");
                        let hdr_dv_value, dtsx_atmos_value;
        
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

                        data = {
                            name: file_path.name,
                            rip_type: rip_type.value,
                            size: size.value,
                            exact_resolution: exact_resolution.value,
                            general_resolution: general_resolution.value,
                            hdr_dv: hdr_dv_value,
                            dtsx_atmos: dtsx_atmos_value,
                            video: video.value,
                            audio: audio.value,
                            last_watched_date: response_detail.last_watched_date,
                            tmdb_id: file_path.id,
                            file_path: `${file_path.base_path}/${file_path.new_name}`,
                        };

                        let request = await fetch(`/api/convert-movie/${response_detail.id}`, {
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
                            window.location.replace(`/movie/${response_detail.id}/`);
                        }, 350);
                    }
                } else {
                    console.log("Movie already exists!")
                    const missing_container = document.querySelector(".missing_container");   
                    missing_container.classList.remove("hide");
                    missing_container.addEventListener("click", () => {
                        missing_container.classList.add("hide");
                    })
                    missing_container.querySelector("h2").innerText = "Movie already exists!";
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
            tbody.querySelector("#id_file_path").value = `${file_path.base_path}/${file_path.new_name}`;
            tbody.querySelector("#id_name").value = file_path.name;
            tbody.querySelector("#id_tmdb_id").value = file_path.id;
        }
        // disable model / clean up
        modal.style.transition = "top 2s";
        requestAnimationFrame(fadeOut);
        document.body.removeAttribute("style");
        modal.classList.remove("show");
        removeModalListeners();
        checkMediaInfo();
        setTimeout(e => {
            container.classList.remove("verify-name");
            container.innerHTML = ``;
        }, 250)
    };
};