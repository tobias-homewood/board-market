import math

# This function converts a fraction to a decimal
def fraction_to_decimal(fraction):
    if fraction == '':
        return None
    numerator, denominator = map(int, fraction.split('/'))
    return round(numerator / denominator, 10)

# This function converts feet to inches
def convert_feet_to_inches(feet):
    if feet is None:
        return 0
    inches = feet * 12
    return inches

# This function converts inches to feet and inches
def convert_inches_to_feet(inches):
    feet = inches // 12
    remaining_inches = inches % 12
    return f"{feet}' {remaining_inches}\""

def convert_decimal_to_fraction(value):
    try:
        value = float(value)
    except ValueError:
        return ''

    numerator = round(value * 16)
    denominator = 16

    if numerator == 0:
        return ''

    # Simplify the fraction
    gcd = math.gcd(numerator, denominator)
    numerator //= gcd
    denominator //= gcd

    return str(numerator) + ('' if denominator == 1 else '/' + str(denominator)) + '"'

def convert_decimal_to_sixteenth(value):
    try:
        value = float(value)
    except ValueError:
        return ''

    numerator = round(value * 16)
    denominator = 16

    if numerator == 0:
        return '0'

    return str(numerator) + ('' if denominator == 1 else '/' + str(denominator))