document.querySelectorAll(".content_count.count_toggle").forEach(e => {
    e.addEventListener("click", () => {
        e.querySelector(".average_size.average").classList.toggle("hide");
        e.querySelector(".average_size.median").classList.toggle("hide");
    });
})


let add_button = document.querySelector(".add_button");
document.querySelector("form").addEventListener("submit", addDrive);

add_button.addEventListener("click", e => {
    let form_inner = document.querySelector(".form_inner");
    let plus_svg = document.querySelector(".plus_svg");
    form_inner.classList.toggle("hide");
    plus_svg.classList.toggle('svg-animation');
    document.querySelector(".drives").classList.toggle("hide");

    let form_list_title = document.querySelector(".form_list_title h2");
    document.querySelector(".form_list_title").classList.toggle("add");
    if (form_list_title.innerText === "Drives") {
        form_list_title.innerText = "Add Drives";
    } else {
        form_list_title.innerText = "Drives";
    };
});
 
async function addDrive(e) {
    e.preventDefault();
    const csrftoken = Cookies.get("csrftoken")

    let name = document.querySelector("#id_drive_name");
    let path = document.querySelector("#id_drive_path");
    let size = document.querySelector("#id_drive_space");
    let type = document.querySelector("#id_drive_type");

    let data = JSON.stringify({
        "drive_name": name.value,
        "drive_path": path.value,
        "drive_space": size.value,
        "drive_type": type.value
    });

    let response = await fetch("/api/add-drive/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
        },
        accept: "application.json",
        mode: "same-origin",
        body: data
    });

    response = await response.json();

    let html = `
        <div id="drive-${response.id}" class="drive">
            <span class="drive_info"><span class="drive_name_info">${response.drive_name} (${response.drive_type})</span> ${response.drive_space} GB</span>
            <span class="drive_path">${response.drive_path}</span>
            <a class="btn-delete" value=${response.id} content-type="drive">
            <i class="trash-can-svg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                    <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                </svg>
                </i>
            </a>
        </div>
    `;

    let drives = document.querySelector(".drives"); 
    drives.insertAdjacentHTML("beforeend", html);

    let button_delete = document.querySelector(`#drive-${response.id} .btn-delete`);
    button_delete.addEventListener("click", e => {
        confirmTask(button_delete.getAttribute("value"), button_delete.getAttribute("season"), button_delete.getAttribute("redirect"), button_delete.getAttribute("unacquired"), button_delete.getAttribute("content-type"), "Delete", "Are You Sure You Want To Delete?");
    });

    document.querySelector("form").reset();
    document.querySelector(".form_list_title h2").innerText = "Drives";
    document.querySelector(".form_list_title").classList.toggle("add");
    document.querySelector(".form_inner").classList.toggle("hide");
    document.querySelector(".plus_svg").classList.toggle('svg-animation');
    document.querySelector(".drives").classList.toggle("hide");
};