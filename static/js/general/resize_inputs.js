
let inputs = document.querySelectorAll(".input_resize input");
inputs.forEach(e => {
    let style = window.getComputedStyle(e);
    let ctx = document.createElement("canvas").getContext("2d");
    ctx.font = style.getPropertyValue("font-size") + " " + style.getPropertyValue("font-family");
    let characterWidth = ctx.measureText(e.value).width;
    e.style.width = (characterWidth) + "pt";
});

function resizeInputs() {
    let inputs = document.querySelectorAll(".input_resize input");
    inputs.forEach(e => {
        e.addEventListener("input", function() {
            let style = window.getComputedStyle(e);
            let ctx = document.createElement("canvas").getContext("2d");
            ctx.font = style.getPropertyValue("font-size") + " " + style.getPropertyValue("font-family");
            let characterWidth = ctx.measureText(e.value).width;
            if (characterWidth >= 80) {
                e.style.width = (characterWidth) + "pt";
            }
            if (characterWidth <= 80) {
                e.style.width = "80pt";
            };
        });
    });
};

resizeInputs();