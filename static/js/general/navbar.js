// dropdown
let dropdown = document.querySelector(".nav_dropdown");
document.addEventListener("click", e => {
  let nav_items = document.querySelector(".nav_items");
  let nav_dropdown_items = document.querySelector(".nav_dropdown_items");

 if (e.target.classList.contains("hamburger_click") || !e.target.classList.contains("hamburger_click") && nav_dropdown_items.classList.contains("active") && nav_items.classList.contains("active")) {
    nav_items.classList.toggle("active");
    nav_dropdown_items.classList.toggle("active");
  
    let top = document.querySelector(".nav_dropdown_items .top a");
    let middle = document.querySelector(".nav_dropdown_items .middle a");
    let bottom = document.querySelector(".nav_dropdown_items .bottom a");
  
    top.innerText = "Add Movie";
    middle.innerText = "Add Tv-Show";
    bottom.innerText = "Add Unacquired";
  
    nav_items.classList.toggle("hamburger_visible");
    nav_dropdown_items.classList.toggle("nav_dropdown_items_pointer");  
  } else if (e.target.classList.contains("nav_dropdown_button") || !e.target.classList.contains("nav_dropdown_button") && nav_dropdown_items.classList.contains("active")) {
    let top = document.querySelector(".nav_dropdown_items .top a");
    let middle = document.querySelector(".nav_dropdown_items .middle a");
    let bottom = document.querySelector(".nav_dropdown_items .bottom a");
    
    top.innerText = "Movie";
    middle.innerText = "Tv-Show";
    bottom.innerText = "Unacquired";
  
    let nav_dropdown = document.querySelector(".nav_dropdown");
  
    nav_dropdown.classList.toggle("active");
    nav_dropdown_items.classList.toggle("active");

    let caret_down_svg = document.querySelector(".caret-down-svg");
    caret_down_svg.classList.toggle("active");
  } else {
    return;
  };

});

let hamburger = document.querySelector(".hamburger");
let nav_dropdown_button = document.querySelector(".nav_dropdown_button");

if (window.innerWidth < 680) {
  hamburger.addEventListener("mouseover", function hamburgerVisibility() {
    let nav_items = document.querySelector(".nav_items");
    let nav_dropdown_items = document.querySelector(".nav_dropdown_items");
    nav_items.classList.add("nav_items_visibility");
    nav_dropdown_items.classList.add("nav_dropdown_items_visibility");
    hamburger.removeEventListener("mouseover", hamburgerVisibility);
  });
} else {
  nav_dropdown_button.addEventListener("mouseover", function dropdownVisibility() {
    let nav_dropdown_items = document.querySelector(".nav_dropdown_items");
    nav_dropdown_items.classList.add("nav_dropdown_items_visibility");
    nav_dropdown_button.removeEventListener("mouseover", dropdownVisibility);
  });
  let nav_items = document.querySelector(".nav_items");
  let nav_dropdown_items = document.querySelector(".nav_dropdown_items");
  nav_items.classList.remove("nav_items_visibility");
  nav_dropdown_items.classList.remove("nav_dropdown_items_visibility");
};

window.addEventListener("resize", function() {
  let nav_items = document.querySelector(".nav_items");
  let nav_dropdown_items = document.querySelector(".nav_dropdown_items");
  if (window.innerWidth < 680) {
    hamburger.addEventListener("mouseover", function hamburgerVisibility() {
      nav_items.classList.add("nav_items_visibility");
      nav_dropdown_items.classList.add("nav_dropdown_items_visibility");
      hamburger.removeEventListener("mouseover", hamburgerVisibility);
    });
  } else {
    nav_dropdown_button.addEventListener("mouseover", function dropdownVisibility() {
      let nav_dropdown_items = document.querySelector(".nav_dropdown_items");
      nav_dropdown_items.classList.add("nav_dropdown_items_visibility");
      nav_dropdown_button.removeEventListener("mouseover", dropdownVisibility);
    });
    nav_items.classList.remove("nav_items_visibility");
    nav_dropdown_items.classList.remove("nav_dropdown_items_visibility");
  };
});