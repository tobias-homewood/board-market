
// Function to convert inches to feet and inches
function convertToFeetInches(inches) {
    if (isNaN(inches)) return "";
    var feet = Math.floor(inches / 12);
    var remainingInches = inches % 12;
    return (feet ? feet + "'" : "") + " " + remainingInches + '"';
}

// Function to convert a decimal number to inches with fraction
function convertToInchesWithFraction(value) {
    if (isNaN(value)) return "";
    var wholeNumber = Math.floor(value);
    var fraction = value - wholeNumber;
    var fractionInSixteenths = Math.round(fraction * 16);

    if (fractionInSixteenths === 0) {
        return wholeNumber + '"';
    } else {
        return wholeNumber + " " + fractionInSixteenths + '/16"';
    }
}

$(document).ready(function() {
    // Debugging: Log the saved form data
    console.log("Saved Form Data:", localStorage.getItem('formData'));
    
    // Check if there's saved form data in localStorage
    var savedFormData = localStorage.getItem('formData');
    console.log("Document Ready - Saved Form Data:", savedFormData);
    if (savedFormData) {
        // Parse the saved form data
        var formDataArray = savedFormData.split('&');
        formDataArray.forEach(function(item) {
            var keyValue = item.split('=');
            var key = decodeURIComponent(keyValue[0]);
            var value = decodeURIComponent(keyValue[1].replace(/\+/g, ' '));
            // Set the form field
            $("[name='" + key + "']").val(value);
        });

        // Optionally, repopulate other saved values like sliders
        // Example for a slider:
        // var minLength = localStorage.getItem('minLength');
        // if(minLength) {
        //     $("#length-slider").slider("values", 0, minLength);
        // }

        // Trigger the updateResults function to load results based on saved form data
        updateResults();
    }
});

function updateResults() {
    console.log("updateResults has been called");
    var formData = $("form").serialize(); // Serialize the form data
    
    // Console log the serialized form data
    console.log("Serialized Form Data:", formData);

    // Save serialized form data to localStorage
    localStorage.setItem('formData', formData);
    console.log("Saved Form Data:", localStorage.getItem('formData'));

    var actionUrl = $("form").attr("action"); // Get the action URL from the form's 'action' attribute

    $.ajax({
        url: actionUrl,
        type: "GET",
        data: formData,
        success: function(response) {
            console.log("Success:", response);
            const boardsContainer = document.getElementById('board-container');
            boardsContainer.innerHTML = ''; // Clear existing boards

            response.boards.forEach(board => {
                const boardElement = document.createElement('div');
                boardElement.className = 'board';
                boardElement.innerHTML = `
                    <div class="board-header">
                        <div class="board-title-price">
                            <div class="price-details">
                                <p class="for-sale-rent ${board.sell_or_rent === 'For sale' ? 'sale' : 'rent'}">${board.sell_or_rent}</p>
                            </div>
                            <div class="board-title-container">
                                <p class="board-manufacturer">${board.board_manufacturer}</p>
                                <p class="board-model">${board.model}</p>
                            </div>
                        </div>
                        <div class="board-measurements">
                            <p>€${board.asking_price}</p>
                            <p>${board.board_length_feet}' ${board.board_length_inches}"</p>
                            <p>${board.volume_litres} L</p>
                        </div>
                    </div>
                    <div class="board-image-container" data-url="/board_profile/${board.board_id}">
                        <img src="${board.main_photo}" class="board-search board-image" alt="Board Image">
                        <div class="board-data-container">
                            <p class="board-data">Width: ${board.width_integer} ${board.width_fraction}</p>
                            <p class="board-data">Depth: ${board.depth_integer} ${board.depth_fraction}</p>
                            <p class="board-data">Condition: ${board.condition}</p>
                            <p class="board-data">Location: ${board.board_location_text}</p>
                            <p class="board-data">Delivery Options: ${board.delivery_options}</p>
                            <p class="board-data">Extra Details: ${board.extra_details}</p>
                            <p class="board-data">Added by: <a href="/user_profile/${board.username}">${board.username}</a></p>
                        </div>
                    </div>
                `;
                boardsContainer.appendChild(boardElement);
            });
        },
        error: function(xhr, status, error) {
            console.error("Error:", status, error);
        }
    });
}

$(function () {
    // Initialize length slider
    var savedMinLength = localStorage.getItem('minLength') ? parseInt(localStorage.getItem('minLength'), 10) : $("#length-slider").data("min-length");
    var savedMaxLength = localStorage.getItem('maxLength') ? parseInt(localStorage.getItem('maxLength'), 10) : $("#length-slider").data("max-length");

    var minLength = isNaN(savedMinLength) || savedMinLength === "" || savedMinLength < 0 ? 0 : savedMinLength;
    var maxLength = isNaN(savedMaxLength) || savedMaxLength === "" || savedMaxLength > 180 ? 180 : savedMaxLength;

    $("#length-slider").slider({
        range: true,
        min: 0,
        max: 180,
        values: [minLength, maxLength],
        slide: function (event, ui) {
            $("#min-length").val(ui.values[0]);
            $("#max-length").val(ui.values[1]);
            $("#length-value").text("Length: " + convertToFeetInches(ui.values[0]) + " - " + convertToFeetInches(ui.values[1]));
        },
        change: function(event, ui) {
            localStorage.setItem('minLength', ui.values[0]);
            localStorage.setItem('maxLength', ui.values[1]);
            updateResults();
        }
    });
    $("#length-value").text("Length: " + convertToFeetInches(minLength) + " - " + convertToFeetInches(maxLength));

    // Initialize price slider
    var savedMinPrice = localStorage.getItem('minPrice') ? parseInt(localStorage.getItem('minPrice'), 10) : $("#price-slider").data("min-price");
    var savedMaxPrice = localStorage.getItem('maxPrice') ? parseInt(localStorage.getItem('maxPrice'), 10) : $("#price-slider").data("max-price");

    var minPrice = isNaN(savedMinPrice) || savedMinPrice === "" || savedMinPrice < 0 ? 0 : savedMinPrice;
    var maxPrice = isNaN(savedMaxPrice) || savedMaxPrice === "" || savedMaxPrice > 2000 ? 2000 : savedMaxPrice;

    $("#price-slider").slider({
        range: true,
        min: 0,
        max: 2000,
        values: [minPrice, maxPrice],
        slide: function (event, ui) {
            $("#min-price").val(ui.values[0]);
            $("#max-price").val(ui.values[1]);
            $("#price-value").text("Price: €" + ui.values[0] + " - €" + ui.values[1]);
        },
        change: function(event, ui) {
            localStorage.setItem('minPrice', ui.values[0]);
            localStorage.setItem('maxPrice', ui.values[1]);
            updateResults();
        }
    });
    $("#price-value").text("Price: €" + minPrice + " - €" + maxPrice);

    // Initialize width slider
    var savedMinWidth = localStorage.getItem('minWidth') ? parseInt(localStorage.getItem('minWidth'), 10) : $("#width-slider").data("min-width") * 16;
    var savedMaxWidth = localStorage.getItem('maxWidth') ? parseInt(localStorage.getItem('maxWidth'), 10) : $("#width-slider").data("max-width") * 16;

    var minWidth = isNaN(savedMinWidth) || savedMinWidth < 0 ? 0 : savedMinWidth;
    var maxWidth = isNaN(savedMaxWidth) || savedMaxWidth > (30 * 16) ? (30 * 16) : savedMaxWidth;

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
            $("#width-value").text("Width: " + convertToInchesWithFraction(minValue) + " - " + convertToInchesWithFraction(maxValue));
        },
        change: function(event, ui) {
            localStorage.setItem('minWidth', ui.values[0]);
            localStorage.setItem('maxWidth', ui.values[1]);
            updateResults();
        }
    });
    $("#width-value").text("Width: " + convertToInchesWithFraction(minWidth / 16) + " - " + convertToInchesWithFraction(maxWidth / 16));

    // Initialize depth slider
    var savedMinDepth = localStorage.getItem('minDepth') ? parseInt(localStorage.getItem('minDepth'), 10) : $("#depth-slider").data("min-depth") * 16;
    var savedMaxDepth = localStorage.getItem('maxDepth') ? parseInt(localStorage.getItem('maxDepth'), 10) : $("#depth-slider").data("max-depth") * 16;

    var minDepth = isNaN(savedMinDepth) || savedMinDepth < 0 ? 0 : savedMinDepth;
    var maxDepth = isNaN(savedMaxDepth) || savedMaxDepth > (5 * 16) ? (5 * 16) : savedMaxDepth;

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
            $("#depth-value").text("Depth: " + convertToInchesWithFraction(minValue) + " - " + convertToInchesWithFraction(maxValue));
        },
        change: function(event, ui) {
            localStorage.setItem('minDepth', ui.values[0]);
            localStorage.setItem('maxDepth', ui.values[1]);
            updateResults();
        }
    });
    $("#depth-value").text("Depth: " + convertToInchesWithFraction(minDepth / 16) + " - " + convertToInchesWithFraction(maxDepth / 16));

    // Initialize volume slider
    var savedMinVolume = localStorage.getItem('minVolume') ? parseInt(localStorage.getItem('minVolume'), 10) : $("#volume-slider").data("min-volume");
    var savedMaxVolume = localStorage.getItem('maxVolume') ? parseInt(localStorage.getItem('maxVolume'), 10) : $("#volume-slider").data("max-volume");

    var minVolume = isNaN(savedMinVolume) || savedMinVolume < 0 ? 0 : savedMinVolume;
    var maxVolume = isNaN(savedMaxVolume) || savedMaxVolume > 100 ? 100 : savedMaxVolume;

    $("#volume-slider").slider({
        range: true,
        min: 0,
        max: 100,
        values: [minVolume, maxVolume],
        slide: function (event, ui) {
            $("#min-volume").val(ui.values[0]);
            $("#max-volume").val(ui.values[1]);
            $("#volume-value").text("Volume: " + ui.values[0] + " - " + ui.values[1]);
        },
        change: function(event, ui) {
            localStorage.setItem('minVolume', ui.values[0]);
            localStorage.setItem('maxVolume', ui.values[1]);
            updateResults();
        }
    });
    $("#volume-value").text("Volume: " + minVolume + " - " + maxVolume);

    var formSelectors = [
        "#sell_or_rent",
        "#board_location_coordinates",
        "#max_distance",
        "#board_manufacturer",
        "#model",
        "#condition",
        "#delivery_options",
        "#fin_setup",
        "#board_material"
    ];

    formSelectors.forEach(function(selector) {
        $(selector).change(function() {
            var selectedValue = $(this).val();
            localStorage.setItem($(this).attr('id'), selectedValue);
            updateResults();
        });
    });
});

    // Handle the reset button click event
    $('#reset-button').click(function() {
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
        $("#length-value").text("Length: 0\" - 15' 0\"");
        $("#price-value").text("Price: €0 - €2000");
        $("#width-value").text("Width: 0\" - 30\"");
        $("#depth-value").text("Depth: 0\" - 5\"");
        $("#volume-value").text("Volume: 0 - 100");

        // Reset the other inputs
        $("#sell_or_rent").prop('selectedIndex', 0);
        $("#max_distance").val('50');
        $("#board_manufacturer").val('');
        $("#model").val('');
        $("#condition").prop('selectedIndex', 0);
        $("#delivery_options").prop('selectedIndex', 0);
        $("#fin_setup").prop('selectedIndex', 0); // Reset fin_setup
        $("#board_material").prop('selectedIndex', 0); // Reset board_material
        $("#min-price").val('');
        $("#max-price").val('');

        // Update results after reset
        updateResults();
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
document.querySelectorAll('.board-image-container').forEach(function(element) {
    element.addEventListener('click', function() {
        var url = this.getAttribute('data-url');
        window.location.href = url;


    });
});

$(document).ready(function() {
    $(".favourite-form button, #delete-board-temp button").on("click", function(e) {
        e.stopPropagation();
    });
});

// This function changes the main image to the one clicked in the 'extra-image' class.
$(document).ready(function(){
    $(".extra-image").click(function(){
        var newSrc = $(this).attr("src");
        var index = $(this).index();

        // Remove the 'active' class from the current active carousel item
        $(".carousel-item.active").removeClass("active");

        // Change the 'src' attribute of the carousel image at the same index as the clicked extra image
        var carouselImage = $(".carousel-item").eq(index).find(".carousel-image");
        carouselImage.attr("src", newSrc);

        // Add the 'active' class to the carousel item at the same index as the clicked extra image
        $(".carousel-item").eq(index).addClass("active");
    });
});

// This function is used on the list board form to direct users to where they can change the location
var boardLocationText = document.getElementById('board-location-text');

if (boardLocationText) {
    boardLocationText.addEventListener('click', function() {
        alert('Change your location in the top right of the page');
    });
}

