import addEventListeners from "./eventListeners.js";

export default function updateResults() {
    console.log("updateResults has been called");
    const boardsContainer = document.getElementById("board-container");

    // Retrieve CSRF token from meta tag
    const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        .getAttribute("content");

    var formData = $("form").serialize();
    formData = formData.split("&").filter(item => !item.startsWith("csrf_token")).join("&");
    console.log("Serialized Form Data:", formData);
    localStorage.setItem("formData", formData);
    console.log("Saved Form Data:", localStorage.getItem("formData"));

    var actionUrl = $("form").attr("action");

    $.ajax({
        url: actionUrl,
        type: "GET",
        data: formData,
        beforeSend: function (xhr) {
            // Include CSRF token as header
            xhr.setRequestHeader("X-CSRF-Token", csrfToken);
        },
        success: function (response) {
            console.log("Success:", response);
            boardsContainer.innerHTML = "";
            const current_user_id = response.user_id;
            const favourites = response.favourites;

            response.boards.forEach((board) => {
                const boardElement = document.createElement("div");
                boardElement.className = "board";
                boardElement.innerHTML = `
                    <div class="board-header">
                        <div class="board-title-price">
                            <div class="price-details">
                                <p class="for-sale-rent ${
                                    board.sell_or_rent === "For sale"
                                        ? "sale"
                                        : "rent"
                                }">${board.sell_or_rent}</p>
                            </div>
                            <div class="board-title-container">
                                <p class="board-manufacturer">${
                                    board.board_manufacturer
                                }</p>
                                <p class="board-model">${board.model}</p>
                            </div>
                        </div>
                        <div class="board-measurements">
                            <p>€${board.asking_price}</p>
                            <p>${board.board_length_feet}' ${
                    board.board_length_inches
                }"</p>
                            <p>${board.volume_litres} L</p>
                        </div>
                    </div>
                    <div class="board-image-container" data-url="/board_profile/${
                        board.board_id
                    }">
                        <img src="${
                            board.main_photo
                        }" class="board-search board-image" alt="Board Image">
                        <div class="board-data-container">
                            <p class="board-data">Width: ${
                                board.width_integer
                            } ${board.width_fraction}</p>
                            <p class="board-data">Depth: ${
                                board.depth_integer
                            } ${board.depth_fraction}</p>
                            <p class="board-data">Condition: ${
                                board.condition
                            }</p>
                            <p class="board-data">Location: ${
                                board.board_location_text
                            }</p>
                            <p class="board-data">Delivery Options: ${
                                board.delivery_options
                            }</p>
                            <p class="board-data">Extra Details: ${
                                board.extra_details
                            }</p>
                            <p class="board-data">Added by: <a href="/user/${
                                board.username
                            }">${board.username}</a></p>
                        </div>
                   
                        ${
                            board.user_id !== current_user_id
                                ? `
                        <form class="favourite-form" method="POST" action="/toggle_favourite/${
                            board.board_id
                        }" data-board-id="${board.board_id}">
                            <input type="hidden" name="csrf_token" value="${csrfToken}">
                            <button type="submit" class="btn btn-link p-0 m-0 align-baseline">
                                <i class="heart-search bi ${
                                    favourites.indexOf(board.board_id) != -1
                                        ? "bi-heart-fill text-red"
                                        : "bi-heart"
                                }"></i>
                            </button>
                        </form>
                        `
                                : ""
                        }
                        ${
                            board.user_id === current_user_id
                                ? `
                        <form class="delete-board-temp" method="POST" action="/delete_board/${board.board_id}">
                            <input type="hidden" name="csrf_token" value="${csrfToken}">
                            <button type="submit" class="btn btn-link p-0 m-0 align-baseline">
                                <i class="bi bi-trash trash-temp"></i>
                            </button>
                        </form>
                    </div>
                    `
                                : ""
                        }
                `;
                boardsContainer.appendChild(boardElement);

                // Add click event listener to navigate on click
                boardElement
                    .querySelector(".board-image-container")
                    .addEventListener("click", function () {
                        window.location.href = this.getAttribute("data-url");
                    });

                addEventListeners();
            });
        },
        error: function (xhr, status, error) {
            console.error("Error:", status, error);
        },
    });
}