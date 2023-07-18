setTimeout(function() {
    let content_info = document.querySelectorAll(".content_info");
    if (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1) {
        content_info.forEach(e => {
            e.classList.add("safari");
        });
    };
}, 25);

try {
    document.querySelectorAll("#id_storage_space option").forEach(e => {
        if (e.innerText === "---------") {
            e.innerText = "None";
        };
    });
} catch (TypeError) {}