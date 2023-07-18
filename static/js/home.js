let items = document.querySelectorAll(".item_outer");
let item_container = document.querySelector(".item_container");
window.addEventListener("resize", gridSizeLimit);

function gridSizeLimit() {
    if (window.innerWidth > 2560) {
        if (items.length >= 7 && !item_container.classList.contains("item_container_limit")) {
            item_container.classList.add("item_container_limit");
        };
    } else {
        if (item_container.classList.contains("item_container_limit")) {
            item_container.classList.remove("item_container_limit");
        }; 
    };
};

gridSizeLimit();