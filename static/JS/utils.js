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

export { convertToFeetInches, convertToInchesWithFraction };