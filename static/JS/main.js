// Function to convert inches to feet and inches
function convertToFeetInches(inches) {
    if (isNaN(inches)) return "";
    var feet = Math.floor(inches / 12);
    var remainingInches = inches % 12;
    return (feet ? feet + "'" : "") + " " + remainingInches + '"';
}

// Function to convert decimal inches to inches with fraction
function convertToInchesWithFraction(decimalInches) {
    var wholeInches = Math.floor(decimalInches);
    var fraction = decimalInches - wholeInches;
    var closestFraction = (Math.round(fraction * 16) / 16).toFixed(2); // Round to nearest 1/16
    var fractions = {
        "0.00": "",
        0.06: "1/16",
        0.12: "1/8",
        0.19: "3/16",
        0.25: "1/4",
        0.31: "5/16",
        0.38: "3/8",
        0.44: "7/16",
        "0.50": "1/2",
        0.56: "9/16",
        0.62: "5/8",
        0.69: "11/16",
        0.75: "3/4",
        0.81: "13/16",
        0.88: "7/8",
        0.94: "15/16",
    };
    var fractionString = fractions[closestFraction]
        ? fractions[closestFraction]
        : "";
    return wholeInches + (fractionString ? " " + fractionString : "") + '"';
}

$(document).ready(function () {
    if (window.location.pathname === "/search_boards") {
        console.log("Saved Form Data:", localStorage.getItem("formData"));

        var savedFormData = localStorage.getItem("formData");
        console.log("Document Ready - Saved Form Data:", savedFormData);
        if (savedFormData) {
            var formDataArray = savedFormData.split("&");
            formDataArray.forEach(function (item) {
                var keyValue = item.split("=");
                var key = decodeURIComponent(keyValue[0]);
                var value = decodeURIComponent(keyValue[1].replace(/\+/g, " "));

                // Exclude CSRF token from being set
                if (key !== "csrf_token") {
                    $("[name='" + key + "']").val(value);
                }
            });
            // Repopulate other saved values and trigger updates as needed
        }

        // Call updateResults after the form data has been repopulated
        updateResults();
    }
});

function updateResults() {
    console.log("updateResults has been called");
    const boardsContainer = document.getElementById("board-container");

    // Retrieve CSRF token from meta tag
    const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        .getAttribute("content");

    var formData = $("form").serialize();
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

if (window.location.pathname === "/search_boards") {
    (function () {
        // Initialize length slider
        var savedMinLength = localStorage.getItem("minLength")
            ? parseInt(localStorage.getItem("minLength"), 10)
            : $("#length-slider").data("min-length");
        var savedMaxLength = localStorage.getItem("maxLength")
            ? parseInt(localStorage.getItem("maxLength"), 10)
            : $("#length-slider").data("max-length");

        var minLength =
            isNaN(savedMinLength) || savedMinLength === "" || savedMinLength < 0
                ? 0
                : savedMinLength;
        var maxLength =
            isNaN(savedMaxLength) ||
            savedMaxLength === "" ||
            savedMaxLength > 180
                ? 180
                : savedMaxLength;

        $("#length-slider").slider({
            range: true,
            min: 0,
            max: 180,
            values: [minLength, maxLength],
            slide: function (event, ui) {
                $("#min-length").val(ui.values[0]);
                $("#max-length").val(ui.values[1]);
                $("#length-value").text(
                    "Length: " +
                        convertToFeetInches(ui.values[0]) +
                        " - " +
                        convertToFeetInches(ui.values[1])
                );
            },
            change: function (event, ui) {
                localStorage.setItem("minLength", ui.values[0]);
                localStorage.setItem("maxLength", ui.values[1]);
                updateResults();
            },
        });
        $("#length-value").text(
            "Length: " +
                convertToFeetInches(minLength) +
                " - " +
                convertToFeetInches(maxLength)
        );

        // Initialize price slider
        var savedMinPrice = localStorage.getItem("minPrice")
            ? parseInt(localStorage.getItem("minPrice"), 10)
            : $("#price-slider").data("min-price");
        var savedMaxPrice = localStorage.getItem("maxPrice")
            ? parseInt(localStorage.getItem("maxPrice"), 10)
            : $("#price-slider").data("max-price");

        var minPrice =
            isNaN(savedMinPrice) || savedMinPrice === "" || savedMinPrice < 0
                ? 0
                : savedMinPrice;
        var maxPrice =
            isNaN(savedMaxPrice) || savedMaxPrice === "" || savedMaxPrice > 2000
                ? 2000
                : savedMaxPrice;

        $("#price-slider").slider({
            range: true,
            min: 0,
            max: 2000,
            values: [minPrice, maxPrice],
            slide: function (event, ui) {
                $("#min-price").val(ui.values[0]);
                $("#max-price").val(ui.values[1]);
                $("#price-value").text(
                    "Price: €" + ui.values[0] + " - €" + ui.values[1]
                );
            },
            change: function (event, ui) {
                localStorage.setItem("minPrice", ui.values[0]);
                localStorage.setItem("maxPrice", ui.values[1]);
                updateResults();
            },
        });
        $("#price-value").text("Price: €" + minPrice + " - €" + maxPrice);

        // Initialize width slider
        var savedMinWidth = localStorage.getItem("minWidth")
            ? parseInt(localStorage.getItem("minWidth"), 10)
            : $("#width-slider").data("min-width") * 16;
        var savedMaxWidth = localStorage.getItem("maxWidth")
            ? parseInt(localStorage.getItem("maxWidth"), 10)
            : $("#width-slider").data("max-width") * 16;

        var minWidth =
            isNaN(savedMinWidth) || savedMinWidth < 0 ? 0 : savedMinWidth;
        var maxWidth =
            isNaN(savedMaxWidth) || savedMaxWidth > 30 * 16
                ? 30 * 16
                : savedMaxWidth;

        $("#width-slider").slider({
            range: true,
            min: 0 * 16,
            max: 30 * 16,
            step: 1,
            values: [minWidth, maxWidth],
            slide: function (event, ui) {
                var minValue = ui.values[0] / 16;
                var maxValue = ui.values[1] / 16;

                $("#min-width").val(minValue);
                $("#max-width").val(maxValue);
                $("#width-value").text(
                    "Width: " +
                        convertToInchesWithFraction(minValue) +
                        " - " +
                        convertToInchesWithFraction(maxValue)
                );
            },
            change: function (event, ui) {
                localStorage.setItem("minWidth", ui.values[0]);
                localStorage.setItem("maxWidth", ui.values[1]);
                updateResults();
            },
        });
        $("#width-value").text(
            "Width: " +
                convertToInchesWithFraction(minWidth / 16) +
                " - " +
                convertToInchesWithFraction(maxWidth / 16)
        );

        // Initialize depth slider
        var savedMinDepth = localStorage.getItem("minDepth")
            ? parseInt(localStorage.getItem("minDepth"), 10)
            : $("#depth-slider").data("min-depth") * 16;
        var savedMaxDepth = localStorage.getItem("maxDepth")
            ? parseInt(localStorage.getItem("maxDepth"), 10)
            : $("#depth-slider").data("max-depth") * 16;

        var minDepth =
            isNaN(savedMinDepth) || savedMinDepth < 0 ? 0 : savedMinDepth;
        var maxDepth =
            isNaN(savedMaxDepth) || savedMaxDepth > 5 * 16
                ? 5 * 16
                : savedMaxDepth;

        $("#depth-slider").slider({
            range: true,
            min: 0 * 16,
            max: 5 * 16,
            step: 1,
            values: [minDepth, maxDepth],
            slide: function (event, ui) {
                var minValue = ui.values[0] / 16;
                var maxValue = ui.values[1] / 16;

                $("#min-depth").val(minValue);
                $("#max-depth").val(maxValue);
                $("#depth-value").text(
                    "Depth: " +
                        convertToInchesWithFraction(minValue) +
                        " - " +
                        convertToInchesWithFraction(maxValue)
                );
            },
            change: function (event, ui) {
                localStorage.setItem("minDepth", ui.values[0]);
                localStorage.setItem("maxDepth", ui.values[1]);
                updateResults();
            },
        });
        $("#depth-value").text(
            "Depth: " +
                convertToInchesWithFraction(minDepth / 16) +
                " - " +
                convertToInchesWithFraction(maxDepth / 16)
        );

        // Initialize volume slider
        var savedMinVolume = localStorage.getItem("minVolume")
            ? parseInt(localStorage.getItem("minVolume"), 10)
            : $("#volume-slider").data("min-volume");
        var savedMaxVolume = localStorage.getItem("maxVolume")
            ? parseInt(localStorage.getItem("maxVolume"), 10)
            : $("#volume-slider").data("max-volume");

        var minVolume =
            isNaN(savedMinVolume) || savedMinVolume < 0 ? 0 : savedMinVolume;
        var maxVolume =
            isNaN(savedMaxVolume) || savedMaxVolume > 100
                ? 100
                : savedMaxVolume;

        $("#volume-slider").slider({
            range: true,
            min: 0,
            max: 100,
            values: [minVolume, maxVolume],
            slide: function (event, ui) {
                $("#min-volume").val(ui.values[0]);
                $("#max-volume").val(ui.values[1]);
                $("#volume-value").text(
                    "Volume: " + ui.values[0] + " - " + ui.values[1]
                );
            },
            change: function (event, ui) {
                localStorage.setItem("minVolume", ui.values[0]);
                localStorage.setItem("maxVolume", ui.values[1]);
                updateResults();
            },
        });
        $("#volume-value").text(
            "Volume: " + minVolume + " - " + maxVolume + " Litres"
        );

        // Initialize condition slider
        var conditionLabels = ["Poor", "Good", "Great", "Excellent", "New"];
        var savedMinCondition = localStorage.getItem("minCondition")
            ? parseInt(localStorage.getItem("minCondition"), 10)
            : $("#condition-slider").data("min-condition");
        var savedMaxCondition = localStorage.getItem("maxCondition")
            ? parseInt(localStorage.getItem("maxCondition"), 10)
            : $("#condition-slider").data("max-condition");

        var minCondition =
            isNaN(savedMinCondition) || savedMinCondition < 0
                ? 0
                : savedMinCondition;
        var maxCondition =
            isNaN(savedMaxCondition) || savedMaxCondition > 4
                ? 4
                : savedMaxCondition;

        $("#condition-slider").slider({
            range: true,
            min: 0,
            max: 4,
            values: [minCondition, maxCondition],
            slide: function (event, ui) {
                $("#min-condition").val(ui.values[0]);
                $("#max-condition").val(ui.values[1]);
                $("#condition-value").text(
                    "Condition: " +
                        conditionLabels[ui.values[0]] +
                        " - " +
                        conditionLabels[ui.values[1]]
                );
            },
            change: function (event, ui) {
                localStorage.setItem("minCondition", ui.values[0]);
                localStorage.setItem("maxCondition", ui.values[1]);
                updateResults();
            },
        });
        $("#condition-value").text(
            "Condition: " +
                conditionLabels[minCondition] +
                " - " +
                conditionLabels[maxCondition]
        );

        // Initialize delivery slider
        var deliveryLabels = [
            "Pick up only",
            "Local delivery",
            "National delivery",
            "International delivery",
        ];
        var savedMinDelivery = localStorage.getItem("minDelivery")
            ? parseInt(localStorage.getItem("minDelivery"), 10)
            : $("#delivery-slider").data("min-delivery");
        var savedMaxDelivery = localStorage.getItem("maxDelivery")
            ? parseInt(localStorage.getItem("maxDelivery"), 10)
            : $("#delivery-slider").data("max-delivery");

        var minDelivery =
            isNaN(savedMinDelivery) || savedMinDelivery < 0
                ? 0
                : savedMinDelivery;
        var maxDelivery =
            isNaN(savedMaxDelivery) || savedMaxDelivery > 3
                ? 3
                : savedMaxDelivery;

        $("#delivery-slider").slider({
            range: true,
            min: 0,
            max: 3,
            values: [minDelivery, maxDelivery],
            slide: function (event, ui) {
                $("#min-delivery").val(ui.values[0]);
                $("#max-delivery").val(ui.values[1]);
                $("#delivery-value").text(
                    "Delivery: " +
                        deliveryLabels[ui.values[0]] +
                        " - " +
                        deliveryLabels[ui.values[1]]
                );
            },
            change: function (event, ui) {
                localStorage.setItem("minDelivery", ui.values[0]);
                localStorage.setItem("maxDelivery", ui.values[1]);
                updateResults();
            },
        });
        $("#delivery-value").text(
            "Delivery: " +
                deliveryLabels[minDelivery] +
                " - " +
                deliveryLabels[maxDelivery]
        );

        var formSelectors = [
            "#sell_or_rent",
            "#board_location_coordinates",
            "#max_distance",
            "#board_manufacturer",
            "#model",
            "#delivery_options",
            "#fin_setup",
            "#board_material",
        ];

        formSelectors.forEach(function (selector) {
            $(selector).change(function () {
                var selectedValue = $(this).val();
                localStorage.setItem($(this).attr("id"), selectedValue);
                updateResults();
            });
        });
    })();
}

// Handle the reset button click event
$("#reset-button").click(function () {
    // Reset the sliders
    $("#length-slider").slider("values", [0, 180]);
    $("#min-length").val(0);
    $("#max-length").val(180);

    $("#price-slider").slider("values", [0, 2000]);
    $("#min-price").val(0);
    $("#max-price").val(2000);

    $("#width-slider").slider("values", [0, 30 * 16]);
    $("#min-width").val(0);
    $("#max-width").val(30);

    $("#depth-slider").slider("values", [0, 5 * 16]);
    $("#min-depth").val(0);
    $("#max-depth").val(5);

    $("#volume-slider").slider("values", [0, 100]);
    $("#min-volume").val(0);
    $("#max-volume").val(100);

    // Reset the slider labels
    $("#length-value").text('Length: 0" - 15\' 0"');
    $("#price-value").text("Price: €0 - €2000");
    $("#width-value").text('Width: 0" - 30"');
    $("#depth-value").text('Depth: 0" - 5"');
    $("#volume-value").text("Volume: 0 - 100");

    // Reset the other inputs
    $("#sell_or_rent").prop("selectedIndex", 0);
    $("#max_distance").val("50");
    $("#board_manufacturer").val("");
    $("#model").val("");
    $("#condition").prop("selectedIndex", 0);
    $("#delivery_options").prop("selectedIndex", 0);
    $("#fin_setup").prop("selectedIndex", 0); // Reset fin_setup
    $("#board_material").prop("selectedIndex", 0); // Reset board_material
    $("#min-price").val("");
    $("#max-price").val("");

    // Update results after reset
    setTimeout(function () {
        updateResults();
    }, 500);
});

// This block of code is responsible for handling the click event on the filters element.
// When the filters element is clicked, the display style of the filter-form is toggled between 'none' and 'block'.
document.addEventListener("DOMContentLoaded", (event) => {
    var filtersElement = document.getElementById("filters-show-hide-button");
    if (filtersElement) {
        filtersElement.addEventListener("click", function () {
            var form = document.getElementById("filter-form");
            if (form.style.display === "none") {
                form.style.display = "block";
            } else {
                form.style.display = "none";
            }
        });
    }
});

// This function navigates to a URL for the board that is stored in 'data-url' attribute when an element with class 'board-image-container' is clicked.
document.querySelectorAll(".board-image-container").forEach(function (element) {
    element.addEventListener("click", function (event) {
        // Check if the click was on a form button or any of its children
        if (
            event.target.closest(
                ".favourite-form button, .delete-board-temp button"
            )
        ) {
            // If the click was on a favorite or delete button, do nothing
            // The form submission is handled by the jQuery code below
            return;
        }
        var url = this.getAttribute("data-url");
        window.location.href = url;
    });
});

function addEventListeners() {
    // Prevent double submission
    $("#list-board-form").on("submit", function () {
        $("#submit-button").prop("disabled", true);
        $("#upload-message").show(); // Show the upload message
    });

    // Remove any existing click event listeners on the button to prevent multiple bindings
    $(".favourite-form button").off("click");

    // Handle favourite action
    $(".favourite-form button").on("click", function (e) {
        e.preventDefault(); // Prevent the default form submission
        e.stopPropagation();

        var $form = $(this).closest("form");
        var actionUrl = $form.attr("action");
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute("content");
        var $heartIcon = $(this).find(".bi-heart, .bi-heart-fill"); // Find the heart icon within the button

        $.ajax({
            url: actionUrl,
            type: "POST",
            data: $form.serialize(), // This already includes the CSRF token if your form is set up correctly
            beforeSend: function (xhr) {
                xhr.setRequestHeader("X-CSRFToken", csrfToken); // Set the CSRF token in the request header
            },
            success: function (response) {
                console.log("Success:", response);
                // Assuming response is a string that includes the login prompt
                if (
                    typeof response === "string" &&
                    response.includes("Please log in to access this page.")
                ) {
                    window.location.href = "/login"; // Redirect to the login page
                } else if (typeof response === "object") {
                    // Handle favourite action
                    if (response.action === "added") {
                        $heartIcon
                            .removeClass("bi-heart")
                            .addClass("bi-heart-fill text-red");
                    } else if (response.action === "removed") {
                        $heartIcon
                            .removeClass("bi-heart-fill text-red")
                            .addClass("bi-heart");
                    }
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", status, error);
                alert("An error occurred: " + error);
            },
        });
    });

    // Remove any existing click event listeners on the button to prevent multiple bindings
    $(".delete-board-temp button").off("click");

    // Handle delete action
    $(".delete-board-temp button").on("click", function (e) {
        e.preventDefault(); // Prevent the default form submission
        e.stopPropagation();

        var $form = $(this).closest("form");
        var actionUrl = $form.attr("action");
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute("content");

        $.ajax({
            url: actionUrl,
            type: "POST",
            data: $form.serialize(), // This already includes the CSRF token if your form is set up correctly
            beforeSend: function (xhr) {
                xhr.setRequestHeader("X-CSRFToken", csrfToken); // Set the CSRF token in the request header
            },
            success: function (response) {
                console.log("Success:", response);
                // Assuming response is a string that includes the login prompt
                if (
                    typeof response === "string" &&
                    response.includes("Please log in to access this page.")
                ) {
                    window.location.href = "/login"; // Redirect to the login page
                } else if (typeof response === "object") {
                    // Handle delete action
                    if (response.status === "success") {
                        $form.closest(".board-item").remove(); // Assuming the board item is wrapped in an element with class 'board-item'
                        updateResults();
                    } else if (response.status === "error") {
                        alert(response.message);
                    }
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", status, error);
                alert("An error occurred: " + error);
            },
        });
    });

    $(".extra-image").click(function () {
        var newSrc = $(this).attr("src");
        var index = $(this).index();

        // Remove the 'active' class from the current active carousel item
        $(".carousel-item.active").removeClass("active");

        // Change the 'src' attribute of the carousel image at the same index as the clicked extra image
        var carouselImage = $(".carousel-item")
            .eq(index)
            .find(".carousel-image");
        carouselImage.attr("src", newSrc);

        // Add the 'active' class to the carousel item at the same index as the clicked extra image
        $(".carousel-item").eq(index).addClass("active");
    });
}

// This function changes the main image to the one clicked in the 'extra-image' class.
$(document).ready(addEventListeners);

// This function is used on the list board form to direct users to where they can change the location
var boardLocationText = document.getElementById("board-location-text");

if (boardLocationText) {
    boardLocationText.addEventListener("click", function () {
        alert("Change your location in the top right of the page");
    });
}
