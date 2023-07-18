const file_path = document.querySelector("#id_file_path");

file_path.addEventListener("blur", checkMediaInfo);
file_path.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        file_path.removeEventListener("blur", checkMediaInfo);
        checkMediaInfo();
    }
});

function checkMediaInfo() {
    mediaInfo(file_path.value);
}


async function getMediaInfo(loading_svg, url) {
    const csrftoken = Cookies.get("csrftoken")

    let file_path = {"path": url}
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
        }
        return response;
    } catch (error) {
        loading_svg.classList.add("hide");
        throw new Error(`[Media Info] File Does Not Exist!`);
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

async function mediaInfo(file_path) {
    let loading_svg = document.querySelector(".loading-svg");
    loading_svg.classList.remove("hide");
    const file_name = file_path.split("/")[3];
    const split_file_data = file_name.split(/\[\d+\]/)[1].trim().toLowerCase().split(".");
    const file_info = split_file_data.splice(0, split_file_data.length - 1);
    const rip_types = ["remux", "web-dl", "webdl", "web-rip", "webrip", "bluray", "dvd", "dvdrip", "brrip", "hdtv"];
    const resolutions = ["480p", "720p", "1080i", "1080p", "2160p"];
    const audio_type = ["Meridian Lossless Packing FBA with 16-channel presentation", "Joint Object Coding", "DTS XLL X"]
    const video_types = ["BT.709", "BT.2020"];
    const file_video_types = ["HYBRiD", "DV", "HDR"];

    let not_found = [];
    const missing_container = document.querySelector(".missing_container");
    missing_container.classList.add("hide");
    missing_container.querySelector("h2").innerText = "Cannot Find";

    try {
        response = await getMediaInfo(loading_svg, file_path);
    } catch (error) {
        loading_svg.classList.add("hide");
        console.log("File Does Not Exist!");

        missing_container.classList.remove("hide");
        missing_container.addEventListener("click", () => {
            missing_container.classList.add("hide");
        })
        missing_container.querySelector("h2").innerText = "File Does Not Exist!";
        return
    }

    try {
        const found_elements = rip_types.find(e => file_info.includes(e.toLowerCase()));
        if (found_elements === "remux" || found_elements === "dvd" || found_elements === "dvdrip" || found_elements === "brrip") {
            changeSelectValue(document.querySelector("#id_rip_type"), "remux");
        } else if (found_elements === "web-dl" || found_elements === "webdl" || found_elements === "hdtv") {
            changeSelectValue(document.querySelector("#id_rip_type"), "webdl");
        } else if (found_elements === "web-rip" || found_elements === "webrip") {
            changeSelectValue(document.querySelector("#id_rip_type"), "webrip");
        } else if (found_elements === "bluray") {
            changeSelectValue(document.querySelector("#id_rip_type"), "bluray_encode");
        } else {
            changeSelectValue(document.querySelector("#id_rip_type"), "webrip");
            console.log("Cannot get Rip Type");
            not_found.push("Rip Type");
        }
    } catch (error) {
        changeSelectValue(document.querySelector("#id_rip_type"), "webrip");
        console.log("Cannot get Rip Type");
        not_found.push("Rip Type");
    }

    try {
        const found_elements = resolutions.find(e => file_info.includes(e.toLowerCase()));
    
        if (found_elements === undefined) {
            console.log("Cannot get General Resolution");
            not_found.push("General Resolution");
        } else {
            changeSelectValue(document.querySelector("#id_general_resolution"), found_elements);
        }
    } catch (error) {
        console.log("Cannot get General Resolution");
        not_found.push("General Resolution");
    }

    try {
        if (response.file_size !== undefined && response.file_size > 0) {
            document.querySelector("#id_size").value = response.file_size;
        } else {
            console.log("Cannot get Size");
            not_found.push("Size");
        }
    } catch (error) {
        console.log("Cannot get Size");
        not_found.push("Size");
    }

    try {
        if (response.file_size !== undefined) {
            document.querySelector("#id_exact_resolution").value = response.resolution;
        } else {
            console.log("Cannot get Exact Resolution");
            not_found.push("Exact Resolution");
        }
    } catch (error) {
        console.log("Cannot get Exact Resolution");
        not_found.push("Exact Resolution");
    }

    try {
        if (response.video !== undefined) {
            document.querySelector("#id_video").value = response.video;
        } else {
            console.log("Cannot get Video");
            not_found.push("Video");
        }
    } catch (error) {
        console.log("Cannot get Video");
        not_found.push("Video");
    }

    try {
        const found_elements = video_types.find(e => document.querySelector("#id_video").value.toLowerCase().includes(e.toLowerCase()));
        if (found_elements === "BT.709") {
            changeSelectValue(document.querySelector("#id_hdr_dv"), "none");
        } else if (found_elements === "BT.2020") {
            const video_has = file_video_types.find(e => file_info.includes(e.toLowerCase()));
            if (video_has === "HYBRiD") {
                changeSelectValue(document.querySelector("#id_hdr_dv"), "hdr_dv");
            } else if (video_has === "HDR") {
                changeSelectValue(document.querySelector("#id_hdr_dv"), "hdr");
            } else if (video_has === "DV") {
                changeSelectValue(document.querySelector("#id_hdr_dv"), "dv");
            } else {
                console.log("Cannot get HDR / DV");
                not_found.push("HDR / DV");
            }
        } else {
            const video_has = file_video_types.find(e => file_info.includes(e.toLowerCase()));
            if (video_has === "HYBRiD") {
                changeSelectValue(document.querySelector("#id_hdr_dv"), "hdr_dv");
            } else if (video_has === "HDR") {
                changeSelectValue(document.querySelector("#id_hdr_dv"), "hdr");
            } else if (video_has === "DV") {
                changeSelectValue(document.querySelector("#id_hdr_dv"), "dv");
            } else {
                changeSelectValue(document.querySelector("#id_hdr_dv"), "none");
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
                document.querySelector("#id_audio").value = response.audio[0];
            } else {
                console.log("Cannot get Audio");
                not_found.push("Audio");
            }
        } catch (error) {
            console.log("Cannot get Audio");
            not_found.push("Audio");
        }
        try {
            const found_elements = audio_type.find(e => document.querySelector("#id_audio").value.toLowerCase().includes(e.toLowerCase()));
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
    } else if (response.audio_tracks >= 2){
        await waitForAnimationToFinish();
        selectAudioTrack(response.audio, document, audio_type, not_found);
    }
}

async function fetchNewPaths() {
    response = await fetch(`/api/list-new-files/movies`);
    response = await response.json();
    if (response.length > 0) {
        selectFilePath(response, document)
    }
}

fetchNewPaths();