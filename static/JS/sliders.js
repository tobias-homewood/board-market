import { convertToFeetInches, convertToInchesWithFraction } from "./utils.js";

export default function initSliders() {
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
        isNaN(savedMaxLength) || savedMaxLength === "" || savedMaxLength > 180
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
        isNaN(savedMaxDepth) || savedMaxDepth > 5 * 16 ? 5 * 16 : savedMaxDepth;

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
        isNaN(savedMaxVolume) || savedMaxVolume > 100 ? 100 : savedMaxVolume;

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
        isNaN(savedMinDelivery) || savedMinDelivery < 0 ? 0 : savedMinDelivery;
    var maxDelivery =
        isNaN(savedMaxDelivery) || savedMaxDelivery > 3 ? 3 : savedMaxDelivery;

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
}
