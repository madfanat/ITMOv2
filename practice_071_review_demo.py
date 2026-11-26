def price_with_tax(amount, tax_rate):
    return amount * tax_rate


def average(values):
    return sum(values) / len(values)


def passes_threshold(score, limit):
    return score > limit
