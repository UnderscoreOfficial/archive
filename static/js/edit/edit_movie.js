document.querySelector("#id_size").setAttribute("max", 9999);

let edit_button = document.querySelector(".edit_button");
let editable_items = document.querySelectorAll(".editable");
let form_elements = document.querySelectorAll(".form");
let form = document.querySelector(".movie_form");
edit_button.addEventListener("click", e => {    
    document.querySelector(".btn-delete").classList.toggle("hide");
    document.querySelector(".save_button").classList.toggle("hide");
    if (edit_button.classList.contains("edit")) {
        form.addEventListener("submit", submitForm);

        edit_button.classList.remove("edit");
        edit_button.classList.add("cancel");
        edit_button.innerHTML = `
            <i class="cancel-svg">×</i>
        `;

        editable_items.forEach(e => {
            e.classList.toggle("hide");
        })
        form_elements.forEach(e => {
            e.classList.toggle("hide");
        })

        document.querySelector(`footer`).scrollIntoView({
            behavior: "smooth",
            block: "end"
        });

        let hdr_dv_form = document.querySelector("#id_hdr_dv");
        let dtsx_atmos_form = document.querySelector("#id_dtsx_atmos");
        let rip_type_form = document.querySelector("#id_rip_type");
        let general_resolution_form = document.querySelector("#id_general_resolution");

        general_resolution_form.value = document.querySelector("#general_resolution_data").innerText.trim();

        let response_rip_type;
        switch(document.querySelector("#rip_type_data").innerText.trim()) {
            case "WebRip":
                response_rip_type = "webrip";
                break;
            case "WebDL":
                response_rip_type = "webdl";
                break;
            case "BluRay Encode":
                response_rip_type = "bluray_encode";
                break;
            case "Remux":
                response_rip_type = "remux";
                break;
        };
        rip_type_form.value = response_rip_type;
    
        try {
            let response_hdr_dv;
            switch(document.querySelector("#hdr_dv_data").innerText.trim()) {
                case "HDR-DV":
                    response_hdr_dv = "hdr_dv";
                    break;
                case "HDR":
                    response_hdr_dv = "hdr";
                    break;
                case "DV":
                    response_hdr_dv = "dv";
                    break;
                case "None":
                    response_hdr_dv = "none";
                    break;
            };
            hdr_dv_form.value = response_hdr_dv;
        } catch (TypeError) {
        }

        try {
            let response_dtsx_atmos;
            switch(document.querySelector("#dtsx_atmos_data").innerText.trim()) {
                case "DTS:X - DolbyAtmos":
                    response_dtsx_atmos = "dtsx_dolbyatmos";
                    break;
                case "DTS:X":
                    response_dtsx_atmos = "dtsx";
                    break;
                case "DolbyAtmos":
                    response_dtsx_atmos = "dolbyatmos";
                    break;
                case "None":
                    response_dtsx_atmos = "none";
                    break;
            };
            dtsx_atmos_form.value = response_dtsx_atmos;
        } catch (TypeError) {
        }
        
    } else {
        form.removeEventListener("submit", submitForm);

        edit_button.classList.remove("cancel");
        edit_button.classList.add("edit");
        edit_button.innerHTML = `
        <i class="edit-svg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z"/>
            </svg>
        </i>
        `;

        form_elements.forEach(e => {
            e.classList.toggle("hide");
        })
        editable_items.forEach(e => {
            e.classList.toggle("hide");
        })
        document.querySelector(".movie_form").reset();

        document.querySelector(`.movie_name`).scrollIntoView({
            behavior: "smooth",
            block: "end"
        });
    }


});


async function submitForm(e) {
    e.preventDefault();
    if (!this.checkValidity()) {
        return;
      }
    let movie_id = Number(window.location.href.split("/")[4]);
    const csrftoken = Cookies.get("csrftoken")
    
    let name, rip_type, size, exact_resolution, general_resolution, hdr_dv, dtsx_atmos, video, audio, last_watched_date, tmdb_id, hdr_dv_value, dtsx_atmos_value, last_watched_date_value;
    name = document.querySelector("#id_name");
    rip_type = document.querySelector("#id_rip_type");
    size = document.querySelector("#id_size");
    exact_resolution = document.querySelector("#id_exact_resolution");
    general_resolution = document.querySelector("#id_general_resolution");
    hdr_dv = document.querySelector("#id_hdr_dv");
    dtsx_atmos = document.querySelector("#id_dtsx_atmos");
    video = document.querySelector("#id_video");
    audio = document.querySelector("#id_audio");
    last_watched_date = document.querySelector("#id_last_watched_date");
    tmdb_id = document.querySelector("#id_tmdb_id");

    let file_path = document.querySelector("#id_file_path");

    // console.log(hdr_dv.value);
    // console.log(dtsx_atmos.value);

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

    if (last_watched_date.value === "") {
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
            file_path: file_path.value,
            tmdb_id: tmdb_id.value
        };
    } else {
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
            file_path: file_path.value,
            last_watched_date: last_watched_date.value,
            tmdb_id: tmdb_id.value
        };
    };

    // console.log(last_watched_date.getAttribute("value"));


    // console.log(JSON.stringify(data));


    let request = await fetch(`/api/update-movie/${movie_id}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
        },
        accept: "application.json",
        mode: "same-origin",
        body: JSON.stringify(data)
    });

    let response = await request.json();
    // console.log(response);

    // console.log(document.querySelector(".movie_name").innerText.trim());

    if(document.querySelector(".movie_name").innerText.trim() !== response.name.trim()) {
        window.location.reload();
    }

    size.setAttribute("value", response.size);
    exact_resolution.setAttribute("value", response.exact_resolution);
    video.setAttribute("value", response.video);
    audio.setAttribute("value", response.audio);
    tmdb_id.setAttribute("value", response.tmdb_id);
    last_watched_date.setAttribute("value", response.last_watched_date);   

    try {
        let date = new Date(response.updated);
    
        let options = {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true
        };
    
        let parsed_date = date.toLocaleDateString("en-US", options);
        let split_date = parsed_date.split(" ");
        let formatted_date = `${split_date[0]} ${split_date[1]} ${split_date[2]}`;

        document.querySelector("#updated_data").innerHTML = `<span>${parsed_date}</span>`;
    } catch (TypeError) {}

    document.querySelector("#file_path_data").innerHTML = `<span>${response.file_path}</span>`
    document.querySelector("#size_data").innerHTML = `<span>${response.size} GB</span>`;
    document.querySelector("#exact_resolution_data").innerHTML = `<span>${response.exact_resolution}</span>`;
    document.querySelector("#general_resolution_data").innerHTML = `<span>${response.general_resolution}</span>`;
    document.querySelector("#tmdb_id_data").innerHTML = `<span>${response.tmdb_id}</span>`;
    document.querySelector("#video_data").innerHTML = `<span>${response.video}</span>`;
    document.querySelector("#audio_data").innerHTML = `<span>${response.audio}</span>`;
    document.querySelector(".tmdb_url").setAttribute("href", `https://www.themoviedb.org/movie/${response.tmdb_id}`);
    document.querySelector(".imdb_url").setAttribute("href", `https://www.imdb.com/title/${response.imdb_id}`);

    try {
        let date = new Date(response.last_watched_date.replace(/-/g, '\/').replace(/T.+/, ''));
    
        let options = {
            year: "numeric",
            month: "long",
            day: "numeric"
        };
    
        let parsed_date = date.toLocaleDateString("en-US", options);
        let split_date = parsed_date.split(" ");

        // console.log(response.last_watched_date);

        let formatted_date = `${split_date[0]} ${split_date[1]} ${split_date[2]}`;

        document.querySelector("#last_watched_date_data").innerHTML = `<span>${formatted_date}</span>`;
    } catch (TypeError) {
    }

    let response_rip_type;
    switch(response.rip_type) {
        case "webrip":
            response_rip_type = "WebRip";
            break;
        case "webdl":
            response_rip_type = "WebDL";
            break;
        case "bluray_encode":
            response_rip_type = "BluRay Encode";
            break;
        case "remux":
            response_rip_type = "Remux";
            break;
    };
    document.querySelector("#rip_type_data").innerHTML = `<span>${response_rip_type}</span>`;

    let response_hdr_dv;
    switch(response.hdr_dv) {
        case "hdr_dv":
            response_hdr_dv = "HDR-DV";
            break;
        case "hdr":
            response_hdr_dv = "HDR";
            break;
        case "dv":
            response_hdr_dv = "DV";
            break;
        default:
            response_hdr_dv = "None";
            break;
    };
    try {
        document.querySelector("#hdr_dv_data").innerHTML = `<span>${response_hdr_dv}</span>`;
    } catch (TypeError) {
    }

    let response_dtsx_atmos;
    switch(response.dtsx_atmos) {
        case "dtsx_dolbyatmos":
            response_dtsx_atmos = "DTS:X - DolbyAtmos";
            break;
        case "dtsx":
            response_dtsx_atmos = "DTS:X";
            break;
        case "dolbyatmos":
            response_dtsx_atmos = "DolbyAtmos";
            break;
        default:
            response_dtsx_atmos = "None";
            break;
    };

    try {
        document.querySelector("#dtsx_atmos_data").innerHTML = `<span>${response_dtsx_atmos}</span>`;
    } catch (TypeError) {
    }

    document.querySelector(".poster_file").src = response.poster_file;

    // document.querySelector(".movie_form").reset();

    document.querySelector(".btn-delete").classList.toggle("hide");
    document.querySelector(".save_button").classList.toggle("hide");
    form.removeEventListener("submit", submitForm);

    edit_button.classList.remove("cancel");
    edit_button.classList.add("edit");
    edit_button.innerHTML = `
    <i class="edit-svg">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z"/>
        </svg>
    </i>
    `;

    form_elements.forEach(e => {
        e.classList.toggle("hide");
    });
    editable_items.forEach(e => {
        e.classList.toggle("hide");
    });

    document.querySelector(`.movie_name`).scrollIntoView({
        behavior: "smooth",
        block: "end"
    });
}