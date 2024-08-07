export default function addEventListeners() {
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

// This function changes the main image to the one clicked in the 'extra-image' class.
$(document).ready(addEventListeners);