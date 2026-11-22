def price_with_tax(amount, tax_rate):
    return amount + amount * tax_rate


def average(values):
    if not values:
        return 0
    return sum(values) / len(values)


def passes_threshold(score, limit):
    return score >= limit
