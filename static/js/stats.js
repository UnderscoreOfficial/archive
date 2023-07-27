/** @format */

document.querySelectorAll(".content_count.toggleable").forEach((e) => {
  e.addEventListener("click", () => {
    e.querySelector(".average").classList.toggle("hide");
    e.querySelector(".median").classList.toggle("hide");
  });
});

let add_button = document.querySelector(".add_button");
document.querySelector("form").addEventListener("submit", addDrive);

const form = document.querySelector("form");
const plus_svg = document.querySelector(".plus_svg");

add_button.addEventListener("click", (e) => {
  plus_svg.classList.toggle("svg-animation");
  form.classList.toggle("add-drive-move");
});

async function addDrive(e) {
  e.preventDefault();
  const csrftoken = Cookies.get("csrftoken");

  let name = document.querySelector("#id_drive_name");
  let path = document.querySelector("#id_drive_path");
  let size = document.querySelector("#id_drive_space");
  let type = document.querySelector("#id_drive_type");

  let data = JSON.stringify({
    drive_name: name.value,
    drive_path: path.value,
    drive_space: size.value,
    drive_type: type.value,
  });

  let response = await fetch("/api/add-drive/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrftoken,
    },
    accept: "application.json",
    mode: "same-origin",
    body: data,
  });

  response = await response.json();

  // Come back once finished stats frontend redesign

  let html = `
        <div id="drive-${response.id}" class="drive">
            <span class="drive_info"><span class="drive_name_info">${response.drive_name} ${response.drive_path}</span> ${response.drive_space} GB</span>
            <span class="drive_path">${response.drive_type}</span>
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
  button_delete.addEventListener("click", (e) => {
    confirmTask(button_delete.getAttribute("value"), button_delete.getAttribute("season"), button_delete.getAttribute("redirect"), button_delete.getAttribute("unacquired"), button_delete.getAttribute("content-type"), "Delete", "Are You Sure You Want To Delete?");
  });

  document.querySelector("form").reset();

  plus_svg.classList.toggle("svg-animation");
  form.classList.toggle("add-drive-move");
}

// stats tab switcher

const active_arrows = document.querySelectorAll(".clickable-arrow-region");
active_arrows.forEach((e) => {
  e.addEventListener("click", statsTabSwitcher);
});

function statsTabSwitcher(e) {
  const is_left = e.target.classList.contains("left");
  const movable = document.querySelector(".stats_inner_container");
  const arrow_left = document.querySelector(".clickable-arrow-region.left");
  const arrow_right = document.querySelector(".clickable-arrow-region.right");

  if (is_left) {
    movable.style.transition = null;
    movable.classList.remove("go-to-show-lengths");
    arrow_left.classList.remove("active");
    arrow_right.classList.add("active");
  } else {
    movable.classList.add("go-to-show-lengths");
    arrow_left.classList.add("active");
    arrow_right.classList.remove("active");
    setTimeout(() => {
      movable.style.transition = "none";
    }, 500);
  }
}

const type_sorting = document.querySelector(".type.sorting");
const watched_sorting = document.querySelector(".seen-watched.sorting");
const search_input = document.querySelector(".search");
const filter_input = document.querySelector(".filter");
const order_button = document.querySelector(".order");

let is_shifting = false;
document.addEventListener("keydown", (e) => {
  if (e.key === "Shift") {
    is_shifting = true;
  } else {
    is_shifting = false;
  }
});

document.addEventListener("keyup", (e) => {
  is_shifting = false;
});

let previous_watch_state = undefined;
let previous_watch_state_text = undefined;

type_sorting.addEventListener("click", async (e) => {
  const tool_tip = type_sorting.querySelector(".stat-tool-tip");
  const watched_tool_tip = watched_sorting.querySelector(".stat-tool-tip");
  if (is_shifting) {
    if (!type_sorting.classList.contains("unacquired")) {
      type_sorting.classList.remove("hide-unacquired");
      type_sorting.classList.remove("sort-tv-shows");
      type_sorting.classList.remove("sort-movies");
      type_sorting.classList.add("unacquired");
      type_sorting.classList.add("all");
      tool_tip.innerText = "Tv-Shows & Movies & Unacquired";
      if (previous_watch_state == undefined) {
        if (watched_sorting.classList.contains("sort-not-watched")) {
          previous_watch_state = "sort-not-watched";
          previous_watch_state_text = "Not Watched";
        } else if (watched_sorting.classList.contains("sort-watched")) {
          previous_watch_state = "sort-watched";
          previous_watch_state_text = "Watched";
        } else {
          previous_watch_state = "all";
          previous_watch_state_text = "Not Watched & Watched";
        }
        watched_sorting.classList.remove("sort-not-watched");
        watched_sorting.classList.remove("sort-watched");
        watched_sorting.classList.add("all");
        watched_tool_tip.innerText = "Not Watched & Watched";
      }
    } else {
      if (type_sorting.classList.contains("all")) {
        type_sorting.classList.remove("hide-unacquired");
        type_sorting.classList.remove("all");
        type_sorting.classList.add("sort-tv-shows");
        tool_tip.innerText = "Tv-Shows & Unacquired";
      } else {
        type_sorting.classList.remove("unacquired");
        type_sorting.classList.remove("hide-unacquired");
        type_sorting.classList.remove("sort-tv-shows");
        type_sorting.classList.add("sort-movies");
        tool_tip.innerText = "Movies & Unacquired";
      }
    }
  } else {
    if (!type_sorting.classList.contains("hide-unacquired")) {
      type_sorting.classList.remove("unacquired");
      type_sorting.classList.remove("sort-tv-shows");
      type_sorting.classList.remove("sort-movies");
      type_sorting.classList.add("hide-unacquired");
      type_sorting.classList.add("all");
      tool_tip.innerText = "Tv-Shows & Movies";
      if (previous_watch_state !== undefined) {
        watched_sorting.classList.remove("sort-not-watched");
        watched_sorting.classList.remove("sort-watched");
        watched_sorting.classList.remove("all");
        watched_sorting.classList.add(previous_watch_state);
        watched_tool_tip.innerText = previous_watch_state_text;
        previous_watch_state = undefined;
        previous_watch_state_text = undefined;
      }
    } else if (type_sorting.classList.contains("all")) {
      type_sorting.classList.remove("all");
      type_sorting.classList.add("hide-unacquired");
      type_sorting.classList.add("sort-tv-shows");
      tool_tip.innerText = "Tv-Shows";
    } else if (type_sorting.classList.contains("sort-tv-shows")) {
      type_sorting.classList.remove("sort-tv-shows");
      type_sorting.classList.add("hide-unacquired");
      type_sorting.classList.add("sort-movies");
      tool_tip.innerText = "Movies";
    } else {
      type_sorting.classList.remove("sort-movies");
      type_sorting.classList.add("hide-unacquired");
      type_sorting.classList.add("all");
      tool_tip.innerText = "Tv-Shows & Movies";
    }
  }
  await buildLengthTable(await getLengths());
  search();
});

watched_sorting.addEventListener("click", async (e) => {
  const tool_tip = watched_sorting.querySelector(".stat-tool-tip");
  if (watched_sorting.classList.contains("sort-not-watched")) {
    watched_sorting.classList.remove("sort-not-watched");
    watched_sorting.classList.add("sort-watched");
    tool_tip.innerText = "Watched";
  } else if (watched_sorting.classList.contains("sort-watched")) {
    watched_sorting.classList.remove("sort-watched");
    watched_sorting.classList.add("all");
    tool_tip.innerText = "Not Watched & Watched";
  } else {
    watched_sorting.classList.remove("all");
    if (!type_sorting.classList.contains("hide-unacquired")) {
      watched_sorting.classList.add("sort-watched");
      tool_tip.innerText = "Watched";
    } else {
      watched_sorting.classList.add("sort-not-watched");
      tool_tip.innerText = "Not Watched";
    }
  }
  await buildLengthTable(await getLengths());
  search();
});

async function getLengths() {
  const order_sort = document.querySelector(".order");
  const watched_sort = document.querySelector(".seen-watched.sorting");
  const type_sort = document.querySelector(".type.sorting");

  // default values
  let unacquired = "false";
  let type = "not-watched";
  let content_type = "all";
  let order = "default";

  if (!type_sort.classList.contains("hide-unacquired")) {
    unacquired = "true";
  }

  if (watched_sort.classList.contains("sort-watched")) {
    type = "watched";
  } else if (watched_sort.classList.contains("all")) {
    type = "all";
  }

  if (type_sort.classList.contains("sort-tv-shows")) {
    content_type = "tv-show";
  } else if (type_sort.classList.contains("sort-movies")) {
    content_type = "movie";
  }

  if (order_sort.classList.contains("toggle-order")) {
    order = "reversed";
  }

  const response = await fetch(`/api/list-content-lengths/${unacquired}/${type}/${content_type}/${order}`);
  return await response.json();
}

async function buildLengthTable(items) {
  const table_container = document.querySelector(".table-container tbody");
  let html = "";
  await items;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (item.unacquired) {
      const url = item.type === "Tv-Show" ? `/unacquired-tv-show/${item.content_id}` : `/unacquired-movie/${item.content_id}`;
      html += `
        <tr>
          <td>
            <a href="${url}" target="_blank">${item.name}</a>
              <span class="unacquired-indicator colored-svg">
                  <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512">
                      <path d="M32 32H480c17.7 0 32 14.3 32 32V96c0 17.7-14.3 32-32 32H32C14.3 128 0 113.7 0 96V64C0 46.3 14.3 32 32 32zm0 128H480V416c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V160zm128 80c0 8.8 7.2 16 16 16H336c8.8 0 16-7.2 16-16s-7.2-16-16-16H176c-8.8 0-16 7.2-16 16z"/>
                  </svg>
              </span>
          </td>
          <td>${item.length} Hours</td>
        </tr>
      `;
    } else {
      const url = item.type === "Tv-Show" ? `/tv-show/${item.content_id}` : `/movie/${item.content_id}`;
      html += `
        <tr>
          <td>
            <a href="${url}" target="_blank">${item.name}</a>
          </td>
          <td>${item.length} Hours</td>
        </tr>
      `;
    }
  }
  table_container.innerHTML = html;
}

let tags = JSON.parse(localStorage.getItem("length_tags") || null);
if (tags === null) {
  tags = [];
} else if (tags.length > 0) {
  filterBuild(tags);
}

order_button.addEventListener("click", async () => {
  order_button.classList.toggle("toggle-order");
  order_button.querySelector("svg").classList.toggle("flip-svg");
  await buildLengthTable(await getLengths());
  if (search_input.value.length > 0 || tags.length > 0) {
    search();
  }
});

search_input.addEventListener("input", search);

async function search() {
  const table = document.querySelector(".table-container");
  const no_results = document.querySelector(".no-results");
  const result_tag = document.querySelector(".results span");
  no_results.classList.add("hide");
  table.classList.remove("hide-overflow-y");
  table.classList.remove("hide");
  let results = 0;
  if (search_input.value.length > 0 || tags.length > 0) {
    const table_container = document.querySelectorAll(".table-container tbody tr");
    table_container.forEach((e) => {
      e.classList.add("tr-remove");
      const name = e.querySelector("td").innerText.toLowerCase();
      let valid = false;
      if (name.includes(search_input.value.toLowerCase())) {
        e.classList.remove("tr-remove");
        valid = true;
      }
      tags.forEach((i) => {
        if (name.includes(i)) {
          e.classList.add("tr-remove");
          valid = false;
        }
      });
      if (valid) {
        results++;
      }
    });
    const visible_rows = document.querySelectorAll(".table-container tbody tr:not(.tr-remove)");
    for (let i = 0; i < visible_rows.length; i++) {
      if (i % 2 == 0) {
        visible_rows[i].style.backgroundColor = "rgb(50, 50, 50)";
        visible_rows[i].style.color = "rgb(225, 225, 225)";
      } else {
        visible_rows[i].style.backgroundColor = "rgb(40, 40, 40)";
        visible_rows[i].style.color = "rgb(255, 255, 255)";
      }
    }
    result_tag.innerText = results;
    if (results < 15) {
      table.classList.add("hide-overflow-y");
    }

    if (results == 0) {
      table.classList.add("hide");
      no_results.classList.remove("hide");
    }
  } else {
    if (order_button.classList.contains("toggle-order")) {
      const length = await getLengths();
      buildLengthTable(length);
      result_tag.innerText = length.length;
    } else {
      const length = await getLengths();
      buildLengthTable(length);
      result_tag.innerText = length.length;
    }
  }
}

filter_input.addEventListener("keyup", filterTag);

async function filterBuild(tags) {
  const tags_element = document.querySelector(".exclude-filter-tags");
  tags.forEach((tag) => {
    tags_element.insertAdjacentHTML("afterbegin", `<li>${tag}</li>`);
    const exclude_filters = document.querySelectorAll(".exclude-filter-tags li");
    exclude_filters.forEach((e) => {
      if (e.innerText === tag) {
        e.addEventListener("click", removeTag);
      }
    });
  });
  search();
}

async function filterTag(e) {
  const tags_element = document.querySelector(".exclude-filter-tags");
  if (e.key === "Enter") {
    let tag = filter_input.value.trim().toLowerCase();
    if (tag.length > 0) {
      tags.push(tag);
      filter_input.value = "";
      tags_element.insertAdjacentHTML("afterbegin", `<li>${tag}</li>`);
      if (!tags_element.classList.contains("tags-opacity")) {
        filter_input.focus();
        tags_element.classList.add("tags-opacity");
      }
      const exclude_filters = document.querySelectorAll(".exclude-filter-tags li");
      exclude_filters.forEach((e) => {
        if (e.innerText === tag) {
          e.addEventListener("click", removeTag);
        }
      });
      localStorage.setItem("length_tags", JSON.stringify(tags));
      search();
    }
  }
}

function removeTag(e) {
  const exclude_filters = document.querySelectorAll(".exclude-filter-tags li");
  exclude_filters.forEach((i) => {
    if (i.innerText === e.target.innerText) {
      i.remove();
      const index = tags.indexOf(i.innerText);
      if (index !== -1) {
        tags.splice(index, 1);
        localStorage.setItem("length_tags", JSON.stringify(tags));
        search();
      }
    }
  });
}

// ctrl f goes to the search box

window.addEventListener("keydown", (e) => {
  const left_arrow = document.querySelector(".clickable-arrow-region.left");
  if (left_arrow.classList.contains("active")) {
    if (e.ctrlKey && e.key === "f") {
      if (search_input === document.activeElement) {
        return true;
      } else {
        e.preventDefault();
        search_input.focus();
      }
    }
  }
  return true;
});

filter_input.addEventListener("focusin", () => {
  const tags_element = document.querySelector(".exclude-filter-tags");
  const exclude_filters = document.querySelectorAll(".exclude-filter-tags li");
  if (exclude_filters.length > 0) {
    tags_element.classList.add("tags-opacity");
  }
});

filter_input.addEventListener("focusout", (e) => {
  const tags_element = document.querySelector(".exclude-filter-tags");
  tags_element.classList.remove("tags-opacity");
});
