let unacquired_movie_form = document.querySelector(".unacquired_movie_convert_form");
let cancel_button = unacquired_movie_form.querySelector(".cancel_button");
let convert_button = document.querySelector(".convert_form_button");
let detail_table = document.querySelector(".detail");

cancel_button.addEventListener("click", e => {
    convert_form_button.click();
});

let size = unacquired_movie_form.querySelector("#id_size");
let exact_resolution = unacquired_movie_form.querySelector("#id_exact_resolution");
let video = unacquired_movie_form.querySelector("#id_video");
let audio = unacquired_movie_form.querySelector("#id_audio");

try {
    convert_button.addEventListener("click", e => {
        unacquired_movie_form.classList.toggle("hide");
        if (convert_button.innerText === "Convert") {
            detail_table.classList.remove("hide");
            convert_button.innerText = "Cancel";
            size.value = "";
            exact_resolution.value = "";
            video.value = "";
            audio.value = "";

            detail_table.scrollIntoView({
                behavior: "smooth",
                block: "end"
              });
        } else {
            convert_button.innerText = "Convert";
            detail_table.classList.add("hide");
        };
    });
} catch (TypeError) {
    
}