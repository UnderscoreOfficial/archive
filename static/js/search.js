/** @format */

let footer = document.querySelector("footer");
footer.classList.add("hide");

let submit_form = document.querySelector(".submit_search");
let page_number_value = 1;

document.querySelectorAll(".page_number").forEach((e) => {
  e.addEventListener("click", function () {
    page_number_value = e.getAttribute("value");
    submit_form.click();
  });
});

let sorting = "";

let form = document.querySelector("form");
form.querySelectorAll("input[name='type_radio']").forEach((e) => {
  let disabled_unacquired = document.querySelector(".disabled_unacquired");

  if (e.value == "unacquired") {
    e.addEventListener("click", function () {
      form_search_query = form.querySelector("input[type='search']").value;
      form_type = form.querySelector("input[name='type_radio']:checked").value;
      form.reset();
      form.querySelector("input[type='search']").value = form_search_query;
      form.querySelector("input[value='unacquired']").checked = true;
      disabled_unacquired.style.pointerEvents = "none";
      disabled_unacquired.classList.add("disable");
    });
  } else {
    e.addEventListener("click", function () {
      disabled_unacquired.style.pointerEvents = "auto";
      disabled_unacquired.classList.remove("disable");
    });
  }
});

window.addEventListener("resize", (e) => {
  if (window.innerWidth <= 725) {
    form_search_query = form.querySelector("input[type='search']").value;
    form_type = form.querySelector("input[name='type_radio']:checked").value;
    form.reset();
    form.querySelector("input[type='search']").value = form_search_query;
    form.querySelector(`input[value='${form_type}']`).checked = true;
  }
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  let form_search_query, form_type, form_seen, form_new_episodes, form_rip_type, form_video_quality, form_hdr_dv, form_dtsx_dolbyatmos;
  form_search_query = form.querySelector("input[type='search']").value;
  form_type = form.querySelector("input[name='type_radio']:checked").value;
  form_seen = form.querySelector("input[name='watched_radio']:checked").value;
  form_new_episodes = form.querySelector("input[name='new_episodes_radio']:checked").value;
  form_hdr_dv = form.querySelector("input[name='hdr_dv_radio']:checked").value;
  form_dtsx_dolbyatmos = form.querySelector("input[name='dtsx_atmos_radio']:checked").value;
  form_rip_type = [];
  form.querySelectorAll("input[name='rip_type_checkbox']:checked").forEach((checkbox) => {
    form_rip_type.push(checkbox.value);
  });
  form_video_quality = [];
  form.querySelectorAll("input[name='video_quality_checkbox']:checked").forEach((checkbox) => {
    form_video_quality.push(checkbox.value);
  });

  let search_button = document.querySelector(".submit_search");
  let query = [form_search_query, form_type, form_seen, form_new_episodes, form_rip_type, form_video_quality, form_hdr_dv, form_dtsx_dolbyatmos];

  search_button.style.pointerEvents = "none";

  document.querySelectorAll(".page_number").forEach((e) => {
    e.style.pointerEvents = "none";
  });

  document.querySelectorAll(".sorting").forEach((e) => {
    e.style.pointerEvents = "none";
  });
  search(query);

  setTimeout(function () {
    let no_items = document.querySelector(".no_items");
    if (no_items) {
      document.querySelector(".search_table").classList.add("custom_no_items");
    }
  }, 10);

  setTimeout(() => {
    footer.classList.remove("hide");
    let submit_form_input = document.querySelector("#seach-form-input");
    submit_form_input.focus();
  }, 150);

  if (navigator.userAgent.indexOf("Safari") != -1 && navigator.userAgent.indexOf("Chrome") == -1) {
    setTimeout(function () {
      let content_info = document.querySelectorAll(".content_info");
      content_info.forEach((e) => {
        e.classList.add("safari");
      });
    }, 15);
    setTimeout(function () {
      let content_info = document.querySelectorAll(".content_info");
      content_info.forEach((e) => {
        if (!e.classList.contains("safari")) {
          e.classList.add("safari");
        }
      });
    }, 100);
  }

  setTimeout(function () {
    search_button.style.pointerEvents = "auto";

    document.querySelectorAll(".page_number").forEach((e) => {
      e.style.pointerEvents = "auto";
    });
    document.querySelectorAll(".sorting").forEach((e) => {
      e.style.pointerEvents = "auto";
    });
    document.querySelectorAll(".btn-delete").forEach((e) => {
      e.addEventListener("click", () => {
        confirmTask(e.getAttribute("value"), 0, e.getAttribute("redirect"), e.getAttribute("unacquired"), e.getAttribute("content-type"), "Delete", "Are You Sure You Want To Delete?");
      });
    });
    page_number_value = 1;
  }, 850);
});

let search_table = document.querySelector(".search_table");
let form_container = document.querySelector(".form_container form");

form_container.classList.add("hide");

submit_form.click();
setTimeout(function () {
  form_container.classList.remove("hide");
}, 10);

async function search(query) {
  let none_options, table_results, request, response, html, new_tbody, url, table_head;
  search_table = document.querySelector(".search_table");
  table_results = document.querySelector(".table_results");
  table_head = document.querySelector(".table_head");
  new_tbody = document.createElement("tbody");
  let table_container = document.querySelector(".table_container");

  none_options = 0;
  for (i of query) if (i.length === 0) none_options++;

  if (none_options === 8 && !sorting.includes("descending") && !sorting.includes("ascending")) {
    url = "/api/list-all/";
    url += `page=${page_number_value}`;
    request = await fetch(url);
  } else {
    const csrftoken = Cookies.get("csrftoken");
    switch (query[1]) {
      case "Movie":
        url = "/api/list-movies/";
        break;
      case "Tv-Show":
        url = "/api/list-tv-shows/";
        break;
      case "unacquired":
        url = "/api/list-unacquired/";
        break;
      default:
        url = "/api/list-all/";
    }

    url += `page=${page_number_value}`;

    request = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken,
      },
      accept: "application.json",
      mode: "same-origin",
      body: JSON.stringify({
        search_query: query[0],
        watched_filter: query[2],
        new_episodes_filter: query[3],
        rip_type_filter: query[4],
        video_quality_filter: query[5],
        hdr_dv_filter: query[6],
        dtsx_atmos_filter: query[7],
        sorting: sorting,
      }),
    });
  }

  normal_response = await request.json();
  response = normal_response.data;

  let imagePromises = [];
  // table_head.style.removeProperty("display");

  let sorting_headers;

  if (normal_response == "No Items Found") {
    html = `
            <table class="search_table table_no_items">
                <thead class="table_head"></thead>
                <tbody class="table_results">
                    <td><h2 class="no_items">No Items Found!</h2></td>
                </tbody>
            </table>
        `;
    table_container.innerHTML = html;
  } else {
    let main_html;
    html_rows = [];

    response.forEach((content) => {
      let img = new Image();
      img.src = content.poster_file;
      let imagePromise = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      imagePromises.push(imagePromise);
    });

    let imagePromise = Promise.all(imagePromises).then(() => {
      response.forEach((content) => {
        let img = new Image();
        img.src = content.poster_file;
        html = createSearchResults(content, img.src);
        html_rows.push(html);
        // new_tbody.insertAdjacentHTML("beforeend", html);
      });
      // new_tbody.setAttribute("class", "table_results");
      // search_table.removeChild(table_results);
      // search_table.appendChild(new_tbody);
    });
    await imagePromise;

    let all_rows = "";

    html_rows.forEach((e) => {
      all_rows += e;
    });

    // console.log(all_rows);

    if (document.querySelector(".sorting.last_updated") != null) {
      // console.log(sorting_headers);
      sorting_headers = `
                ${document.querySelector(".sorting.last_watched").outerHTML}
                ${document.querySelector(".sorting.seasons").outerHTML}
                ${document.querySelector(".sorting.size").outerHTML}
                ${document.querySelector(".sorting.last_updated").outerHTML}
            `;
    } else {
      sorting_headers = `
                <th class="sorting last_watched" value="watched_descending">
                    <div>
                        <span>Last Watched</span>
                    </div>
                </th>
                <th class="sorting seasons" value="seasons_descending">
                    <div>
                        <span>Seasons</span>
                    </div>
                </th>
                <th class="sorting size" value="size_descending">
                    <div>
                        <span>Size</span>
                    </div>
                </th>
                <th class="sorting last_updated" value="updated_descending">
                    <div>
                        <span>Last Updated</span>
                    </div>
                </th>
            `;
    }

    main_html = `
        <table class="search_table">
                <thead class="table_head">
                <tr>
                    <th id="paginator" col-span="1"></th>
                    <th></th>
                    ${sorting_headers}
                </tr>
            </thead>
            <tbody class="table_results">
                ${all_rows}
            </tbody>
        </table>
        `;

    table_container.innerHTML = main_html;

    document.querySelectorAll(".sorting").forEach((e) => {
      e.addEventListener("click", function () {
        let sorting_type = e.getAttribute("value").split("_");

        sorting = e.getAttribute("value");

        document.querySelectorAll(".sorting").forEach((e) => {
          let split = e.getAttribute("value").split("_");
          if (split[0] !== sorting_type[0]) {
            e.setAttribute("value", `${split[0]}_descending`);
            try {
              let arrow = document.querySelector("#arrow");
              arrow.remove();
            } catch (TypeError) {}
          }
        });

        if (sorting_type[sorting_type.length - 1] == "descending") {
          e.setAttribute("value", `${sorting_type[0]}_ascending`);
          e.querySelector("div").innerHTML += `<i id="arrow" class="angle-down-svg"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" height="20" width="16"><path d="M169.4 342.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 274.7 54.6 137.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"/></svg></i>`;
        } else if (sorting_type[sorting_type.length - 1] == "ascending") {
          e.setAttribute("value", sorting_type[0]);
          e.querySelector("div").innerHTML += `<i id="arrow" class="angle-up-svg"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="16"><path d="M169.4 137.4c12.5-12.5 32.8-12.5 45.3 0l160 160c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L192 205.3 54.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l160-160z"/></svg></i>`;
        } else {
          e.setAttribute("value", `${sorting_type[0]}_descending`);
        }

        submit_form.click();
      });
    });

    if (normal_response.last_page > normal_response.first_page) {
      let pages_html = "";

      if (page_number_value != normal_response.first_page) {
        pages_html += `
                    <span class="page_number quick_select step first_page" value="1" style="pointer-events: none;">
                        <i class="backward-step-svg">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                <path d="M267.5 440.6c9.5 7.9 22.8 9.7 34.1 4.4s18.4-16.6 18.4-29V96c0-12.4-7.2-23.7-18.4-29s-24.5-3.6-34.1 4.4l-192 160L64 241V96c0-17.7-14.3-32-32-32S0 78.3 0 96V416c0 17.7 14.3 32 32 32s32-14.3 32-32V271l11.5 9.6 192 160z"/>
                            </svg>
                        </i>
                    </span>
                    <span class="page_number quick_select previous_page" value="${page_number_value - 1}" style="pointer-events: none;">
                        <i class="caret-left-svg">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512">
                            <path d="M9.4 278.6c-12.5-12.5-12.5-32.8 0-45.3l128-128c9.2-9.2 22.9-11.9 34.9-6.9s19.8 16.6 19.8 29.6l0 256c0 12.9-7.8 24.6-19.8 29.6s-25.7 2.2-34.9-6.9l-128-128z"/>
                        </svg>
                        </i>
                    </span>
                `;
      }

      normal_response.all_pages.forEach((page) => {
        if (page == page_number_value) {
          pages_html += `
                    <span class="page_number number active" value="${page}" style="pointer-events: none;">${page}</span>
                    `;
        } else {
          pages_html += `
                    <span class="page_number number" value="${page}" style="pointer-events: none;">${page}</span>
                    `;
        }
      });

      if (page_number_value != normal_response.last_page) {
        pages_html += `
                    <span class="page_number quick_select next_page" value="${page_number_value + 1}" style="pointer-events: none;">
                        <i class="caret-right-svg">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512">
                                <path d="M246.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-9.2-9.2-22.9-11.9-34.9-6.9s-19.8 16.6-19.8 29.6l0 256c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l128-128z"/>
                            </svg>
                        </i>
                    </span>
                    <span class="page_number quick_select step last_page" value="${normal_response.last_page}" style="pointer-events: none;">
                        <i class="forward-step-svg">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                <path d="M52.5 440.6c-9.5 7.9-22.8 9.7-34.1 4.4S0 428.4 0 416V96C0 83.6 7.2 72.3 18.4 67s24.5-3.6 34.1 4.4l192 160L256 241V96c0-17.7 14.3-32 32-32s32 14.3 32 32V416c0 17.7-14.3 32-32 32s-32-14.3-32-32V271l-11.5 9.6-192 160z"/>
                            </svg>
                        </i>
                    </span>
                `;
      }

      let paginator = document.querySelector("#paginator");
      paginator.innerHTML = `<div class="pages">${pages_html}</div>`;

      document.querySelectorAll(".page_number").forEach((e) => {
        if (Number(page_number_value) != Number(e.getAttribute("value"))) {
          e.addEventListener("click", function () {
            page_number_value = Number(e.getAttribute("value"));
            submit_form.click();
          });
        }
      });
    } else {
      let paginator = document.querySelector("#paginator");
      paginator.innerHTML = "";
    }
  }

  if (query[1] === "unacquired") {
    document.querySelector(".sorting.seasons").classList.add("hide");
    document.querySelector(".sorting.size").classList.add("hide");

    document.querySelector(".sortable.last_watched").classList.add("custom");
    document.querySelector(".space").classList.add("custom");

    const style = document.querySelector("style");
    if (style) {
      style.remove();
    }
  } else if (query[1] === "Tv-Show") {
    document.querySelector(".sorting.size").classList.remove("hide");
    document.querySelectorAll(".search.size_data").forEach((e) => {
      e.classList.remove("hide");
    });

    document.querySelector(".sorting.seasons").classList.remove("hide");
    document.querySelectorAll(".search.season_data").forEach((e) => {
      e.classList.remove("hide_season");
    });

    document.querySelector(".sortable.last_watched").classList.add("custom");
    document.querySelector(".sortable.last_watched span").classList.add("custom");
    document.querySelector(".space").classList.add("custom");

    const style = document.createElement("style");
    style.innerHTML = `
            @media (max-width: 1380px) {
                .sorting {
                  display: none;
                }
            
                td.last_watched {
                  display: none;
                  width: 0px;
                }
            
                td.season_data {
                  display: none;
                  width: 0px;
                }
            
                td.size_data {
                  display: none;
                  width: 0px;
                }
            
                td.last_updated {
                  width: 0px;
                }
            
                td.last_updated span {
                  display: none;
                  min-width: 0px;
                  width: 0px;
                }
            
                .sortable.last_updated {
                  min-width: 15px;
                }
            
                table {
                  min-width: 95%;
                }
                .space.custom {
                    width: 0px;
                }
              }
        `;

    document.head.appendChild(style);
  } else {
    document.querySelector(".sorting.size").classList.remove("hide");
    document.querySelectorAll(".search.size_data").forEach((e) => {
      e.classList.remove("hide");
    });

    document.querySelector(".sorting.seasons").classList.add("hide");
    document.querySelectorAll(".search.season_data").forEach((e) => {
      e.classList.add("hide");
    });

    document.querySelector(".sortable.last_watched").classList.remove("custom");
    try {
      document.querySelector(".sortable.last_watched span").classList.remove("custom");
    } catch (TypeError) {}
    document.querySelector(".space").classList.remove("custom");

    const style = document.querySelector("style");
    if (style) {
      style.remove();
    }
  }
}

function createSearchResults(content, img) {
  let html, base_url, entry, content_type;

  let last_watched_date;
  if (content.last_watched_date !== null) {
    // console.log(content.last_watched_date);
    let date = new Date(content.last_watched_date.replace(/-/g, "/").replace(/T.+/, ""));

    let options = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };

    let parsed_date = date.toLocaleDateString("en-US", options);
    let split_date = parsed_date.split(" ");
    let formatted_date = `${split_date[0]}. ${split_date[1]} ${split_date[2]}`;

    last_watched_date = `
            <td class="sortable last_watched">
                <span>${formatted_date}</span>
            </td>
        `;
  } else {
    last_watched_date = `<td class="sortable last_watched"></td>`;
  }

  let last_updated;
  let date = new Date(content.updated);

  let options = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  let parsed_date = date.toLocaleDateString("en-US", options);
  let split_date = parsed_date.split(" ");
  let formatted_date = `${split_date[0]}. ${split_date[1]} ${split_date[2]}`;

  last_updated = formatted_date;

  if (content.unacquired === true) {
    if (content.type === "Tv-Show") {
      base_url = "/unacquired-tv-show/";
      content_type = "unacquired-tv-show";
      entry = `entry-${content_type}-${content.id}`;
    } else if (content.type === "Movie") {
      base_url = "/unacquired-movie/";
      content_type = "unacquired-movie";
      entry = `entry-${content_type}-${content.id}`;
    }
    html = `
        <tr id="${entry}">
            <td class="img_td" col-span="1">
                <a href="${base_url}${content.id}/${content.unique_id}">
                    <img src="${img}" alt="">
                </a>
                <div class="mobile_name hide">
                    <a class="content_name" href="${base_url}${content.id}/${content.unique_id}">${content.name}</a>
                    <a class="btn-delete" value="${content.id}" content-type="${content_type}">
                        <i class="trash-can-svg">
                            <svg class="trash-can-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                                <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                            </svg>
                        </i>
                    </a>
                </div>
            </td>
            <td class="content_info">
                <div class="top">
                    <a class="content_name" href="${base_url}${content.id}/${content.unique_id}">${content.name}</a>
                    <a class="btn-delete" value="${content.id}" content-type="${content_type}">
                        <i class="trash-can-svg">
                            <svg class="trash-can-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                                <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                            </svg>
                        </i>
                    </a>
                </div>
                <div class="bottom">
                    <span class="tag">${content.type}</span>
                </div>
            </td>
            <td class="space"></td>
            ${last_watched_date}
            <td class="sortable last_updated">
                <span>${last_updated}</span>
            </td>
        </tr>
    `;
  } else {
    if (content.type === "Tv-Show") {
      base_url = "/tv-show/";
      entry = `entry-tv-show-${content.id}`;

      let total_seasons;
      if (content.total_seasons > 1) {
        total_seasons = `
                    <td class="sortable search season_data">
                        <span>${content.total_seasons} Seasons</span>
                    </td>
                `;
      } else {
        total_seasons = `
                <td class="sortable search season_data">
                    <span>${content.total_seasons} Season</span>
                </td>
            `;
      }

      html = `
                <tr id="${entry}">
                    <td class="img_td" col-span="1">
                        <a href="${base_url}${content.id}/${content.unique_id}">
                            <img src="${img}" alt="">
                        </a>
                        <div class="mobile_name hide">
                            <a class="content_name" href="${base_url}${content.id}/${content.unique_id}">${content.name}</a>
                            <a class="btn-delete" value="${content.id}" content-type="tv-show">
                                <i class="trash-can-svg">
                                    <svg class="trash-can-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                                        <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                                    </svg>
                                </i>
                            </a>
                        </div>
                    </td>
                    <td class="content_info">
                        <div class="top">
                            <a class="content_name" href="${base_url}${content.id}/${content.unique_id}">${content.name}</a>
                            <a class="btn-delete" value="${content.id}" content-type="tv-show">
                                <i class="trash-can-svg">
                                    <svg class="trash-can-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                                        <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                                    </svg>
                                </i>
                            </a>
                        </div>
                        <div class="bottom">
                            <span class="tag">${content.type}</span>
                        </div>
                    </td>
                    <td class="space"></td>
                    ${last_watched_date}
                    ${total_seasons}
                    <td class="sortable search size_data">
                        <span>${content.size} GB</span>
                    </td>
                    <td class="sortable last_updated">
                        <span>${last_updated}</span>
                    </td>
                </tr>
            `;
    } else if (content.type === "Movie") {
      base_url = "/movie/";
      entry = `entry-movie-${content.id}`;
      let rip_type, hdr_dv, dtsx_atmos;

      switch (content.rip_type) {
        case "webrip":
          rip_type = "WebRip";
          break;
        case "webdl":
          rip_type = "WebDL";
          break;
        case "bluray_encode":
          rip_type = "BluRay Encode";
          break;
        case "remux":
          rip_type = "Remux";
          break;
      }

      switch (content.hdr_dv) {
        case "hdr_dv":
          hdr_dv = "HDR-DV";
          break;
        case "hdr":
          hdr_dv = "HDR";
          break;
        case "dv":
          hdr_dv = "DV";
          break;
        case "none":
          hdr_dv = null;
          break;
      }

      switch (content.dtsx_atmos) {
        case "dtsx_dolbyatmos":
          dtsx_atmos = "DTS:X - DolbyAtmos";
          break;
        case "dtsx":
          dtsx_atmos = "DTS:X";
          break;
        case "dolbyatmos":
          dtsx_atmos = "DolbyAtmos";
          break;
        case "none":
          dtsx_atmos = null;
          break;
      }

      if (dtsx_atmos !== null) {
        dtsx_atmos = `<span class="tag">${dtsx_atmos}</span>`;
      } else {
        dtsx_atmos = "";
      }

      if (hdr_dv !== null) {
        hdr_dv = `<span class="tag">${hdr_dv}</span>`;
      } else {
        hdr_dv = "";
      }

      html = `
                <tr id="${entry}">
                    <td class="img_td">
                        <a href="${base_url}${content.id}/${content.unique_id}">
                            <img src="${img}" alt=""/>
                        </a>
                        <div class="mobile_name hide">
                            <a class="content_name" href="${base_url}${content.id}/${content.unique_id}">${content.name}</a>
                            <a class="btn-delete" value="${content.id}" content-type="movie">
                                <i class="trash-can-svg">
                                    <svg class="trash-can-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                                        <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                                    </svg>
                                </i>
                            </a>
                        </div>
                    </td>
                    <td class="content_info">
                        <div class="top">
                            <a class="content_name" href="${base_url}${content.id}/${content.unique_id}">${content.name}</a>
                            <a class="btn-delete" value="${content.id}" content-type="movie">
                                <i class="trash-can-svg">
                                    <svg class="trash-can-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                                        <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                                    </svg>
                                </i>
                            </a>
                        </div>
                        <div class="bottom">
                            <span class="tag">${content.type}</span>
                            <span class="tag">${content.exact_resolution}</span>
                            <span class="tag">${rip_type}</span>
                            ${hdr_dv}
                            ${dtsx_atmos}
                        </div>
                    </td>
                    <td class="space"></td>
                    ${last_watched_date}
                    <td class="sortable search season_data">
                        <span></span>
                    </td>
                    <td class="sortable search size_data">
                        <span>${content.size} GB</span>
                    </td>
                    <td class="sortable last_updated">
                        <span>${last_updated}</span>
                    </td>
                </tr>
            `;
    }
  }

  return html;
}

setTimeout(function () {
  if (document.querySelectorAll("td").length === 0) {
    let table_container = document.querySelector(".table_container");

    html = `
            <table class="search_table table_no_items">
                <thead class="table_head"></thead>
                <tbody class="table_results">
                    <td><h2 class="no_items">No Items Found!</h2></td>
                </tbody>
            </table>
        `;
    table_container.innerHTML = html;
  }
}, 500);
