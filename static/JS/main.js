import updateResults from "./updateResults.js";
import initSliders from "./sliders.js";

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


if (window.location.pathname === "/search_boards") {
    initSliders();
}

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

// This function is used on the list board form to direct users to where they can change the location
var boardLocationText = document.getElementById("board-location-text");

if (boardLocationText) {
    boardLocationText.addEventListener("click", function () {
        alert("Change your location in the top right of the page");
    });
}
