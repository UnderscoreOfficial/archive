const table = document.querySelector("table");
const observer = new MutationObserver((mutationsList) => {
  for (let mutation of mutationsList) {
    if (mutation.type === 'childList' && mutation.target.tagName === 'TABLE' && mutation.removedNodes.length >= 0) {
      updateTvShowData(window.location.href.split("/")[4]);
    }
  }
});
observer.observe(table, { childList: true });


let season_numbers;
let add_season_button = document.querySelector(".add_season_button");
add_season_button.addEventListener("click", e => {
    season_numbers = 0;
    document.querySelectorAll(".season_number").forEach(e => {
        if (e.getAttribute("value") >= season_numbers) {
            season_numbers = Number(e.getAttribute("value"));
        } 
    });

    // console.log(season_numbers)
    document.querySelector(".detail").classList.remove("hide");

    let table = document.querySelector("table");
 
    let current_season;
    try {
        current_season = document.querySelector(".edit_season_number.season_number").getAttribute("value");
    } catch (TypeError) {
        current_season = season_numbers+1;
    }

    if (add_season_button.innerText === "Add Season") {
        add_season_button.innerText = "Cancel";

        let new_form = updateEmptyForm(current_season);
        table.insertAdjacentHTML("beforeend", new_form);

        mediaInfo(current_season);

        document.querySelector(".empty_form_cancel_button").addEventListener("click", e => {
            add_season_button.click();
        });

        document.querySelectorAll(".season_edit_button").forEach(e => {
            e.classList.toggle("hide");
        });

        let season_form = document.querySelector(".season_form");
        let empty_form_save_button = document.querySelector(".empty_form_save_button");
        season_form.addEventListener("submit", saveForm);

        document.querySelector(`#season-${current_season}`).scrollIntoView({
            behavior: "smooth",
            block: "end"
          });

        let inputs = document.querySelectorAll("input");

        inputs.forEach(e => {
            e.addEventListener("input", function() {
                let style = window.getComputedStyle(e);
                let ctx = document.createElement("canvas").getContext("2d");
                ctx.font = style.getPropertyValue("font-size") + " " + style.getPropertyValue("font-family");
                let characterWidth = ctx.measureText(e.value).width;
                if (characterWidth >= 168) {
                    e.style.width = (characterWidth) + "px";
                }
                if (characterWidth <= 168) {
                    e.style.width = (168) + "px";
                }
            });
        });
        
        document.querySelector(".edit_season_number").addEventListener("dblclick", editSeasonNumber);
        document.querySelector(".empty_form_body .season_actions").classList.toggle("empty");
    } else {
        add_season_button.innerText = "Add Season";
        let season_form = document.querySelector(".season_form");
        // let empty_form_save_button = document.querySelector(".empty_form_save_button");
        season_form.removeEventListener("submit", saveForm);
        // table.querySelector(`#season-${current_season}`).removeChild(document.querySelector(".empty_form_button"));
        table.removeChild(document.querySelector(".empty_form_body"));
        document.querySelectorAll(".season_edit_button").forEach(e => {
            e.classList.toggle("hide");
        });
        // document.querySelector(".empty_form_body .season_actions").classList.toggle("empty");

        let total_seasons = document.querySelector(".total_seasons_info.tag").innerText.split(" ")[2];
        if (Number(total_seasons) === 0) {
            document.querySelector(".detail").classList.add("hide");
        }

        document.querySelector(`.info`).scrollIntoView({
            behavior: "smooth",
            block: "end"
        });
    };
});

document.querySelectorAll(".season_number").forEach(e => {
    document.querySelector(`#season-${e.getAttribute("value")} .season_edit_button`).addEventListener("click", e => {
        editSeason(e.target.getAttribute("value"));
    });
});
function editSeason(season_number) {
    let season_entry = document.querySelector(`#season-${season_number}`);
    let edit_button = season_entry.querySelector(".season_edit_button");

    let delete_button = season_entry.querySelector(".season_delete_button");
    let save_button = season_entry.querySelector(".season_save_button");
    let season_form = document.querySelector(".season_form");
    document.querySelector(".add_season_button").classList.toggle("hide");
    edit_button.classList.toggle("hide");
    save_button.classList.toggle("hide");
    delete_button.classList.toggle("hide");

    document.querySelectorAll(".season_edit_button").forEach(e => {
        e.classList.toggle("hide");
    });

    if (edit_button.getAttribute("button-type") === "edit") {
        edit_button.setAttribute("button-type", "cancel");
        edit_button.innerHTML = `
        <i class="edit-svg cancel-x" value="${season_number}">
            ×
        </i>
        `
        season_form.addEventListener("submit", updateForm);
        season_entry.querySelector(".season_data_updated_row").classList.toggle("disabled");
        season_entry.querySelectorAll(".editable").forEach(e => {
            e.classList.toggle("hide");
        });
        season_entry.querySelectorAll(".season_form_tag").forEach(e => {
            e.classList.toggle("hide");
        });

        season_entry.querySelector(".season_number").classList.add("edit_season_number")
        // document.querySelector(".edit_season_number").addEventListener("dblclick", editSeasonNumber);
    } else {
        edit_button.setAttribute("button-type", "edit");
        edit_button.innerHTML = `
        <i class="edit-svg" value="${season_number}">
            <svg xmlns="http://www.w3.org/2000/svg"
                 viewBox="0 0 512 512"
                 value="${season_number}">
                <path value="${season_number}" d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z"/>
            </svg>
        </i>
        `
        season_form.removeEventListener("submit", updateForm);
        season_entry.querySelector(".season_data_updated_row").classList.toggle("disabled");
        season_entry.querySelectorAll(".season_form_tag").forEach(e => {
            e.classList.toggle("hide");
        });
        season_entry.querySelectorAll(".editable").forEach(e => {
            e.classList.toggle("hide");
        });

        season_entry.querySelector(".season_number").classList.remove("edit_season_number")
        // season_entry.querySelector(".season_number").classList.remove("edit_season_number");
    };
};

function editSeasonNumber() {
    let current_season;
    try {
        current_season = document.querySelector(".edit_season_number.season_number").getAttribute("value");
    } catch (TypeError) {
        current_season = season_numbers.length+1;
    }
    document.querySelector(".edit_season_number").innerHTML = `<span>Season <input type="number" id="id_season_number" min="1" step="1" value="${current_season}"></span>`;
    document.querySelector("#id_season_number").focus();  

    document.querySelector("#id_season_number").addEventListener("blur", moveSeasonLocation);
    document.querySelector("#id_season_number").addEventListener("keydown", e => {
        if (e.key === "Enter") {
            document.querySelector("#id_season_number").removeEventListener("blur", moveSeasonLocation);
            moveSeasonLocation();
        }
    });
}

async function updateForm(e) {
    e.preventDefault();
    const csrftoken = Cookies.get("csrftoken")
    let tv_show_id = window.location.href.split("/")[4];
    let season = document.querySelector(".edit_season_number.season_number");
    let season_tbody =  document.querySelector(`#season-${season.getAttribute("value")}`);
    let rip_type = season_tbody.querySelector("#id_rip_type");
    let size = season_tbody.querySelector("#id_size");
    let exact_resolution = season_tbody.querySelector("#id_exact_resolution");
    let general_resolution = season_tbody.querySelector("#id_general_resolution");
    let hdr_dv = season_tbody.querySelector("#id_hdr_dv");
    let dtsx_atmos = season_tbody.querySelector("#id_dtsx_atmos");
    let video = season_tbody.querySelector("#id_video");
    let audio = season_tbody.querySelector("#id_audio");

    let data = {
        season: season.getAttribute("value"),
        rip_type: rip_type.value,
        size: size.value,
        exact_resolution: exact_resolution.value,
        general_resolution: general_resolution.value,
        hdr_dv: hdr_dv.value,
        dtsx_atmos: dtsx_atmos.value,
        video: video.value,
        audio: audio.value
    };

    let url = `/api/update-tv-show/${tv_show_id}/${season.getAttribute("value")}`;

    let response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
        },
        accept: "application.json",
        mode: "same-origin",
        body: JSON.stringify(data)
    });
    response = await response.json();

    // console.log(response);
    // console.log(data);
    // console.log(JSON.stringify(data));

    updateTvShowData(tv_show_id);

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
    season_tbody.querySelector(".season_data_rip_type").innerHTML = `<span>${response_rip_type}</span>`;

    let response_hdr_dv = "";
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
        season_tbody.querySelector(".season_data_hdr_dv").innerHTML = `<span>${response_hdr_dv}</span>`;

        if (response_hdr_dv.length === 0) {
            season_tbody.querySelector(".season_data_hdr_dv_row").classList.add("hide");
        }
    } catch (TypeError) {
    }
    if (season_tbody.querySelector(".season_data_hdr_dv") === null) {
        season_tbody.querySelector(".season_data_hdr_dv_row").classList.add("hide");
    };

    let response_dtsx_atmos = "";
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
        season_tbody.querySelector(".season_data_dtsx_atmos").innerHTML = `<span>${response_dtsx_atmos}</span>`;
        if (response_dtsx_atmos.length === 0) {
            season_tbody.querySelector(".season_data_dtsx_atmos_row").classList.add("hide");
        }
    } catch (TypeError) {
    };

    if (season_tbody.querySelector(".season_data_dtsx_atmos") === null) {
        season_tbody.querySelector(".season_data_dtsx_atmos_row").classList.add("hide");
    };

    season_tbody.querySelector(".season_data_size").innerHTML = `<span>${response.size} GB</span>`;
    season_tbody.querySelector(".season_data_exact_resolution").innerHTML = `<span>${response.exact_resolution}</span>`;
    season_tbody.querySelector(".season_data_general_resolution").innerHTML = `<span>${response.general_resolution}</span>`;
    season_tbody.querySelector(".season_data_video").innerHTML = `<span>${response.video}</span>`;
    season_tbody.querySelector(".season_data_audio").innerHTML = `<span>${response.audio}</span>`;

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

        season_tbody.querySelector(".season_data_updated").innerHTML = `<span>${parsed_date}</span>`;
    } catch (TypeError) {
        season_tbody.querySelector(".season_data_updated").innerHTML = `<span>${response.updated}</span>`;
    }

    let edit_button = season_tbody.querySelector(".season_edit_button");
    let delete_button = season_tbody.querySelector(".season_delete_button");
    let save_button = season_tbody.querySelector(".season_save_button");
    let season_form = document.querySelector(".season_form");
    document.querySelector(".add_season_button").classList.toggle("hide");
    edit_button.classList.toggle("hide");
    save_button.classList.toggle("hide");
    delete_button.classList.toggle("hide");

    document.querySelectorAll(".season_edit_button").forEach(e => {
        e.classList.toggle("hide");
    });

    edit_button.setAttribute("button-type", "edit");
    edit_button.innerHTML = `
    <i class="edit-svg" value="${season.getAttribute("value")}">
        <svg xmlns="http://www.w3.org/2000/svg"
             viewBox="0 0 512 512"
             value="${season.getAttribute("value")}">
            <path value="${season.getAttribute("value")}" d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z"/>
        </svg>
    </i>
    `
    season_form.removeEventListener("submit", updateForm);
    season_tbody.querySelector(".season_data_updated_row").classList.toggle("disabled");
    season_tbody.querySelectorAll(".season_form_tag").forEach(e => {
        e.classList.toggle("hide");
    });
    season_tbody.querySelectorAll(".editable").forEach(e => {
        e.classList.toggle("hide");
    });

    document.querySelector(".edit_season_number").removeEventListener("dblclick", editSeasonNumber);
    season_tbody.querySelector(".edit_season_number").classList.remove("edit_season_number");
};

async function saveForm(e) {
    e.preventDefault();
    const csrftoken = Cookies.get("csrftoken")
    let tv_show_id = window.location.href.split("/")[4];
    let season = document.querySelector(".edit_season_number.season_number");
    let season_tbody =  document.querySelector(`#season-${season.getAttribute("value")}`);
    let rip_type = season_tbody.querySelector("#id_rip_type");
    let size = season_tbody.querySelector("#id_size");
    let exact_resolution = season_tbody.querySelector("#id_exact_resolution");
    let general_resolution = season_tbody.querySelector("#id_general_resolution");
    let hdr_dv = season_tbody.querySelector("#id_hdr_dv");
    let dtsx_atmos = season_tbody.querySelector("#id_dtsx_atmos");
    let video = season_tbody.querySelector("#id_video");
    let audio = season_tbody.querySelector("#id_audio");

    let data = {
        season: season.getAttribute("value"),
        rip_type: rip_type.value,
        size: size.value,
        exact_resolution: exact_resolution.value,
        general_resolution: general_resolution.value,
        hdr_dv: hdr_dv.value,
        dtsx_atmos: dtsx_atmos.value,
        video: video.value,
        audio: audio.value
    };

    let url = `/api/create-tv-show-season/${tv_show_id}/`;

    let response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
        },
        accept: "application.json",
        mode: "same-origin",
        body: JSON.stringify(data)
    });
    response = await response.json();

    // console.log(response);
    // console.log(data);
    // console.log(JSON.stringify(data));

    updateTvShowData(tv_show_id);

    try {
        let add_season_buttons = document.querySelector(".empty_form_button");
        add_season_buttons.parentNode.removeChild(add_season_buttons);
    } catch (TypeError) {
    }

    document.querySelector(".edit_season_number").removeEventListener("dblclick", editSeasonNumber);
    document.querySelector(".empty_form_body .season_actions").classList.toggle("empty");
    season_tbody.classList.remove("empty_form_body");
    season_tbody.classList.add("season");
    season_tbody.querySelector(".edit_season_number").classList.remove("edit_season_number");

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
    season_tbody.querySelector(".season_data_rip_type").innerHTML = `<span>${response_rip_type}</span>`;

    let response_hdr_dv = "";
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
        season_tbody.querySelector(".season_data_hdr_dv").innerHTML = `<span>${response_hdr_dv}</span>`;

        if (response_hdr_dv.length === 0) {
            season_tbody.querySelector(".season_data_hdr_dv_row").classList.toggle("hide");
        }
    } catch (TypeError) {
    }

    let response_dtsx_atmos = "";
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
        season_tbody.querySelector(".season_data_dtsx_atmos").innerHTML = `<span>${response_dtsx_atmos}</span>`;
        if (response_dtsx_atmos.length === 0) {
            season_tbody.querySelector(".season_data_dtsx_atmos_row").classList.toggle("hide");
        }
    } catch (TypeError) {
    }

    season_tbody.querySelector(".season_data_size").innerHTML = `<span>${response.size} GB</span>`;
    season_tbody.querySelector(".season_data_exact_resolution").innerHTML = `<span>${response.exact_resolution}</span>`;
    season_tbody.querySelector(".season_data_general_resolution").innerHTML = `<span>${response.general_resolution}</span>`;
    season_tbody.querySelector(".season_data_video").innerHTML = `<span>${response.video}</span>`;
    season_tbody.querySelector(".season_data_audio").innerHTML = `<span>${response.audio}</span>`;

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

        season_tbody.querySelector(".season_data_updated").innerHTML = `<span>${parsed_date}</span>`;
    } catch (TypeError) {
        season_tbody.querySelector(".season_data_updated").innerHTML = `<span>${response.updated}</span>`;
    }

    season_tbody.querySelectorAll(".season_form_tag").forEach(e => {
        e.classList.toggle("hide");
    });

    season_tbody.querySelectorAll(".editable").forEach(e => {
        e.classList.toggle("hide");
    });

    // season_tbody.querySelector(".season_data_updated_row").classList.toggle("disabled");
    
    let season_form = document.querySelector(".season_form");
    season_form.removeEventListener("submit", saveForm);
    add_season_button.innerText = "Add Season";
    document.querySelectorAll(".season_edit_button").forEach(e => {
        e.classList.toggle("hide");
    });

    season_tbody.querySelector(".season_edit_button").addEventListener("click", e => {
        editSeason(e.target.getAttribute("value"));
    });

    btn = season_tbody.querySelector(".season_delete_button");
    season_tbody.querySelector(".season_delete_button").addEventListener("click", e => {
        confirmTask(btn.getAttribute("value"), btn.getAttribute("season"), btn.getAttribute("redirect"), btn.getAttribute("unacquired"), btn.getAttribute("content-type"), "Delete", "Are You Sure You Want To Delete?");
    });

    const missing_container = season_tbody.querySelector(".missing_container");
    missing_container.classList.add("hide");

    document.querySelector(`.info`).scrollIntoView({
        behavior: "smooth",
        block: "end"
    });
};

async function updateTvShowData(tv_show_id) {
    let response = await fetch(`/api/tv-show-detail/${tv_show_id}/`);
    response = await response.json();

    document.querySelector(".total_seasons_info").innerText = `Total Seasons ${response.total_seasons}`;
    document.querySelector(".total_size_info").innerText = `Total Size ${response.size} GB`;
};

function moveSeasonLocation() {
    let season_value = document.querySelector("#id_season_number").value;
    let season_header = document.querySelector(".edit_season_number");
    let season_number;
    try {
        season_number = document.querySelector(".edit_season_number.season_number").getAttribute("value");
    } catch (TypeError) {
        season_number = document.querySelectorAll(".season_number").length;
    }
    let season_exists = false;
    if (season_value == season_number) {
        season_header.innerHTML = `<span>Season ${season_number}</span>`;
    } else if (season_value > 0) {
        for (season of document.querySelectorAll(".season_number")) {
            if (season_value === season.getAttribute("value")) {
                season_exists = true;
                break;
            };
        };
        if (season_exists === false) {
            let current_season = document.querySelector(`#season-${season_number}`);
            let new_season_location = document.querySelector(`#season-${season_value-1}`);
            let empty_form_button = document.querySelector(".empty_form_button");

            let counter = 1;
            while (new_season_location === null) {
                new_season_location = document.querySelector(`#season-${season_value-counter}`);
                if (season_value-counter === 0) {
                    new_season_location = 0;
                    break;
                }
                counter++;
            }

            if (new_season_location !== 0) {
                try {
                    new_season_location.insertAdjacentElement("afterend", current_season);
                    document.querySelector(".edit_season_number.season_number").setAttribute("value", season_value);
                    current_season.setAttribute("id", `season-${season_value}`);
                } catch (TypeError) {}
            } else if (new_season_location === 0) {
                try {
                    table.insertAdjacentElement("afterbegin", current_season)
                    document.querySelector(".edit_season_number.season_number").setAttribute("value", season_value);
                    current_season.setAttribute("id", `season-${season_value}`);
                } catch (TypeError) {}
            }

            season_header.innerHTML = `<span>Season ${season_value}</span>`;

            mediaInfo(season_value);
            document.querySelector(`#season-${season_value}`).scrollIntoView({
                behavior: "smooth",
                block: "end"
              });
        } else {
            season_header.innerHTML = `<span>Season ${season_number}</span>`;
        };
    } else {
        season_header.innerHTML = `<span>Season ${season_number}</span>`;
    };
}

function updateEmptyForm(season) {

    let empty_form = `
    <tbody id="season-${season}" class="empty_form_body">
        <tr class="empty_form_button">
            <td>
                <button type="button" class="empty_form_cancel_button">×</button>
                <input class="empty_form_save_button season_save_button" value="" type="submit" />
            </td>
        </tr>
        <tr class="season_head">
            <th class="empty_th">
                <div class="loading-container">
                    <i class="loading-svg hide">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <path d="M304 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z"/>
                        </svg>
                    </i>
                </div>
            </th>
            <th class="season_number edit_season_number" value="${season}" colspan="2">
                <span>Season ${season}</span>
                <div class="missing_container hide">
                    <span class="close_missing">×</span>
                    <h2>Cannot Find</h2>
                    <p></p>
                </div>
            </th>
            <th class="season_actions">
                <div class="season_actions_outer">
                    <div class="season_actions_inner">
                        <a class="season_edit_button"
                           type="button"
                           value="${season}"
                           button-type="edit">
                            <i class="edit-svg" value="${season}">
                                <svg xmlns="http://www.w3.org/2000/svg"
                                     viewBox="0 0 512 512"
                                     value="${season}">
                                    <path value="${season}" d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z"/>
                                </svg>
                            </i>
                        </a>
                        <a class="season_delete_button btn-delete"
                           value="${window.location.href.split("/")[4]}"
                           season="${season}"
                           content-type="season"
                           type="button">
                            <i class="trash-can-svg">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                                    <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                                </svg>
                            </i>
                        </a>
                        <input class="season_save_button hide" type="submit" value="" />
                    </div>
                </div>
            </th>
        </tr>
        <tr>
            <th>
                <span>
                    Rip Type
                </span>
            </th>
            <td class="season_data_rip_type editable hide"></td>
            <td class="season_form_tag">
                <span>
                    <select name="rip_type" id="id_rip_type">
                        <option value="webrip">
                            WebRip
                        </option>
                        <option value="webdl" selected>
                            WebDL
                        </option>
                        <option value="bluray_encode">
                            BluRay Encode
                        </option>
                        <option value="remux">
                            Remux
                        </option>
                    </select>
                </span>
            </td>
        </tr>
        <tr>
            <th>
                <span>
                    Size
                </span>
            </th>
            <td class="season_data_size editable hide">
            </td>
            <td class="season_form_tag">
                <span>
                    <input type="number" name="size" min="0" step="0.01" required id="id_size">
                </span>
            </td>
        </tr>
        <tr>
            <th>
                <span>
                    Exact Resolution
                </span>
            </th>
            <td class="season_data_exact_resolution editable hide"></td>
            <td class="season_form_tag">
                <span>
                    <input type="text"
                           name="exact_resolution"
                           maxlength="20"
                           minlength="5"
                           required
                           id="id_exact_resolution">
                </span>
            </td>
        </tr>
        <tr>
            <th>
                <span>
                    General Resolution
                </span>
            </th>
            <td class="season_data_general_resolution editable hide"></td>
            <td class="season_form_tag">
                <span>
                    <select name="general_resolution" id="id_general_resolution">
                        <option value="480p">
                            480p
                        </option>
                        <option value="720p">
                            720p
                        </option>
                        <option value="1080i">
                            1080i
                        </option>
                        <option value="1080p" selected>
                            1080p
                        </option>
                        <option value="2160p">
                            2160p
                        </option>
                    </select>
                </span>
            </td>
        </tr>
        <tr class="season_data_hdr_dv_row">
            <th>
                <span>
                    HDR / DV
                </span>
            </th>
            <td class="season_data_hdr_dv editable hide"></td>
            <td class="season_form_tag">
                <span>
                    <select name="hdr_dv" id="id_hdr_dv">
                        <option value="none" selected>
                            None
                        </option>
                        <option value="hdr_dv">
                            HDR-DV
                        </option>
                        <option value="hdr">
                            HDR
                        </option>
                        <option value="dv">
                            DV
                        </option>
                    </select>
                </span>
            </td>
        </tr>
        <tr class="season_data_dtsx_atmos_row">
            <th>
                <span>
                    DTS:X / Dolby Atmos
                </span>
            </th>
            <td class="season_data_dtsx_atmos editable hide"></td>
            <td class="season_form_tag">
                <span>
                    <select name="dtsx_atmos" id="id_dtsx_atmos">
                        <option value="none" selected>
                            None
                        </option>
                        <option value="dtsx_dolbyatmos">
                            DTS:X - DolbyAtmos
                        </option>
                        <option value="dtsx">
                            DTS:X
                        </option>
                        <option value="dolbyatmos">
                            DolbyAtmos
                        </option>
                    </select>
                </span>
            </td>
        </tr>
        <tr>
            <th>
                <span>
                    Video Info
                </span>
            </th>
            <td class="season_data_video editable hide"></td>
            <td class="season_form_tag">
                <span>
                    <input type="text"
                           name="video"
                           maxlength="1000"
                           minlength="5"
                           required
                           id="id_video">
                </span>
            </td>
        </tr>
        <tr>
            <th>
                <span>
                    Audio Info
                </span>
            </th>
            <td class="season_data_audio editable hide"></td>
            <td class="season_form_tag">
                <span>
                    <input type="text"
                           name="audio"
                           maxlength="1000"
                           minlength="5"
                           required
                           id="id_audio">
                </span>
            </td>
        </tr>
        <tr class="season_data_updated_row">
            <th>
                <span>
                    Last Updated
                </span>
            </th>
            <td class="season_data_updated"></td>
        </tr>
        <tr class="tr_spacer">
        </tr>
    </tbody>      
    `
    return empty_form;
}



async function getMediaInfo(current_season, loading_svg) {
    const csrftoken = Cookies.get("csrftoken")
    response = await fetch(`/api/tv-show-detail/${window.location.href.split("/")[4]}/`);
    tv_show_detail = await response.json();

    let season_exist;
    try {
        season_exist = document.querySelector(`#Season ${current_season}`);
    } catch (error) {
        season_exist = false
    }

    const cached_data = localStorage.getItem(`Season ${current_season}`);
    if (cached_data) {
        return JSON.parse(cached_data);
    } else if(season_exist !== false) {
        loading_svg.classList.add("hide");
        return;
    } else {
        let file_path = {"path": `${tv_show_detail.file_path}/Season ${current_season}`}
        response = await fetch(`/api/mediainfo`, {
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
            if (response == "[Media Info] File Does Not Exist!") {
                throw new Error(`[Media Info] File Does Not Exist!`); 
            } else {
                localStorage.setItem(`Season ${current_season}`, JSON.stringify(response));
            }
            return response;
        } catch (error) {
            loading_svg.classList.add("hide");
            throw new Error(`File Does Not Exist!: ${error}`);
        }
    }
}

function changeSelectValue(selectElement, desiredValue) {
    let selectOptions = selectElement.options;
    for (let opt, j = 0; opt = selectOptions[j]; j++) {
        if (opt.value == desiredValue) {
            selectElement.selectedIndex = j;
            break;
        }
    }
}

async function mediaInfo(current_season) {
    let tbody = document.querySelector(`#season-${current_season}`);
    let loading_svg = tbody.querySelector(".loading-svg");
    loading_svg.classList.remove("hide");

    const rip_types = ["remux", "web-dl", "webdl", "web-rip", "webrip", "bluray", "dvd", "dvdrip", "brrip", "hdtv"];
    const resolutions = ["480p", "720p", "1080i", "1080p", "2160p"];
    const audio_type = ["Meridian Lossless Packing FBA with 16-channel presentation", "Joint Object Coding", "DTS XLL X"]
    const video_types = ["BT.709", "BT.2020"];
    const file_video_types = ["HYBRiD", "DV", "HDR"];

    let not_found = [];
    const missing_container = tbody.querySelector(".missing_container");
    missing_container.classList.add("hide");
    missing_container.querySelector("h2").innerText = "Cannot Find";

    try {
        response = await getMediaInfo(current_season, loading_svg);
    } catch (error) {
        loading_svg.classList.add("hide");
        console.log("File Does Not Exist!");

        missing_container.classList.remove("hide");
        missing_container.addEventListener("click", () => {
            missing_container.classList.add("hide");
        })
        missing_container.querySelector("h2").innerText = "File Does Not Exist!";
        return;
    }

    const split_file_data = response.file_name.toLowerCase().split(/\[\d+\]/)[1].split(".");
    const file_info = split_file_data.slice(1, split_file_data.length - 1);

    if (!(response.file_size === undefined)) {
        tbody.querySelector("#id_size").value = response.file_size;
    } else {
        not_found.push("File Size");
    }

    if (!(response.resolution === undefined)) {
        tbody.querySelector("#id_exact_resolution").value = response.resolution;
    } else {
        not_found.push("Exact Resolution");
    }

    if (!(response.video === undefined)) {
        tbody.querySelector("#id_video").value = response.video;
    } else {
        not_found.push("Video");
    }

    try {
        const found_elements = rip_types.find(e => file_info.includes(e.toLowerCase()));
        if (found_elements === "remux" || found_elements === "dvd" || found_elements === "dvdrip" || found_elements === "brrip") {
            changeSelectValue(tbody.querySelector("#id_rip_type"), "remux");
        } else if (found_elements === "web-dl" || found_elements === "webdl" || found_elements === "hdtv") {
            changeSelectValue(tbody.querySelector("#id_rip_type"), "webdl");
        } else if (found_elements === "web-rip" || found_elements === "webrip") {
            changeSelectValue(tbody.querySelector("#id_rip_type"), "webrip");
        } else if (found_elements === "bluray") {
            changeSelectValue(tbody.querySelector("#id_rip_type"), "bluray_encode");
        } else {
            changeSelectValue(tbody.querySelector("#id_rip_type"), "webrip");
            console.log("Cannot get Rip Type");
            not_found.push("Rip Type");
        }
    } catch (error) {
        changeSelectValue(tbody.querySelector("#id_rip_type"), "webrip");
        console.log("Cannot get Rip Type");
        not_found.push("Rip Type");
    }

    try {
        const found_elements = resolutions.find(e => file_info.includes(e.toLowerCase()));
    
        if (found_elements === undefined) {
            console.log("Cannot get General Resolution");
            not_found.push("General Resolution");
        } else {
            changeSelectValue(tbody.querySelector("#id_general_resolution"), found_elements);
        }
    } catch (error) {
        console.log("Cannot get General Resolution");
        not_found.push("General Resolution");
    }

    try {
        const found_elements = video_types.find(e => tbody.querySelector("#id_video").value.toLowerCase().includes(e.toLowerCase()));
        if (found_elements === "BT.709") {
            changeSelectValue(tbody.querySelector("#id_hdr_dv"), "none");
        } else if (found_elements === "BT.2020") {
            const video_has = file_video_types.find(e => file_info.includes(e.toLowerCase()));
            if (video_has === "HYBRiD") {
                changeSelectValue(tbody.querySelector("#id_hdr_dv"), "hdr_dv");
            } else if (video_has === "HDR") {
                changeSelectValue(tbody.querySelector("#id_hdr_dv"), "hdr");
            } else if (video_has === "DV") {
                changeSelectValue(tbody.querySelector("#id_hdr_dv"), "dv");
            } else {
                console.log("Cannot get HDR / DV");
                not_found.push("HDR / DV");
            }
        } else {
            const video_has = file_video_types.find(e => file_info.includes(e.toLowerCase()));
            if (video_has === "HYBRiD") {
                changeSelectValue(tbody.querySelector("#id_hdr_dv"), "hdr_dv");
            } else if (video_has === "HDR") {
                changeSelectValue(tbody.querySelector("#id_hdr_dv"), "hdr");
            } else if (video_has === "DV") {
                changeSelectValue(tbody.querySelector("#id_hdr_dv"), "dv");
            } else {
                changeSelectValue(tbody.querySelector("#id_hdr_dv"), "none");
            }
        }
    } catch (error) {
        console.log("Cannot get HDR / DV");
        not_found.push("HDR / DV");
    }

    loading_svg.classList.add("hide");

    if (response.audio_tracks < 2) {
        try {
            if (response.audio[0] !== undefined) {
                tbody.querySelector("#id_audio").value = response.audio[0];
            } else {
                console.log("Cannot get Audio");
                not_found.push("Audio");
            }
        } catch (error) {
            console.log("Cannot get Audio");
            not_found.push("Audio");
        }

        try {
            const found_elements = audio_type.find(e => tbody.querySelector("#id_audio").value.toLowerCase().includes(e.toLowerCase()));
            if (found_elements === undefined) {
                changeSelectValue(tbody.querySelector("#id_dtsx_atmos"), "none");
            } else if (found_elements === "DTS XLL X") {
                changeSelectValue(tbody.querySelector("#id_dtsx_atmos"), "dtsx");
            } else if (found_elements === "Meridian Lossless Packing FBA with 16-channel presentation" || found_elements === "Joint Object Coding") {
                changeSelectValue(tbody.querySelector("#id_dtsx_atmos"), "dolbyatmos");
            } else {
                console.log("Cannot get DTS:X / Dolby Atmos")
                not_found.push("DTS:X / Dolby Atmos");
            }
            if (not_found.length > 0) {
                missing_container.classList.remove("hide");
                missing_container.addEventListener("click", () => {
                    missing_container.classList.add("hide");
                })
                missing_container.querySelector("p").innerText = not_found.join(", ");
            }
        } catch (error) {
            console.log("Cannot get DTS:X / Dolby Atmos")
            not_found.push("DTS:X / Dolby Atmos");
        };
    } else {
        selectAudioTrack(response.audio, tbody, audio_type, not_found);
        tbody.querySelector("td > span > #id_audio").addEventListener("dblclick", reselectAudio);
    }

    if (not_found.length > 0) {
        missing_container.classList.remove("hide");
        missing_container.addEventListener("click", () => {
            missing_container.classList.add("hide");
        })
        missing_container.querySelector("p").innerText = not_found.join(", ");
    }

    let audio = response.audio;
    function reselectAudio() {
        selectAudioTrack(audio, tbody, audio_type, not_found);
    }

    for (let i = current_season+1; i < 99; i++) {
        try {
            await getMediaInfo(i);
        } catch (error) {
            break;
        }
    }
}

window.addEventListener("beforeunload", () => {
    localStorage.clear();
});

window.addEventListener("unload", () => {
    localStorage.clear();
});