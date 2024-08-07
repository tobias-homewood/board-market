import updateResults from "./updateResults.js";
import initSliders from "./sliders.js";

// This is used on the search_boards page
if (window.location.pathname === "/search_boards") {
    $(document).ready(function () {
        initSliders();
        updateResults();
        var filtersElement = document.getElementById("filters-show-hide-button");
        filtersElement.addEventListener("click", function () {
            var form = document.getElementById("filter-form");
            if (form.style.display === "none") {
                form.style.display = "block";
            } else {
                form.style.display = "none";
            }
        });
    });
}
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
