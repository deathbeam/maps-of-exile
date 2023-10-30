export function rescale(value, minValue, maxValue, scale) {
  return Math.min((scale * (value - minValue)) / (maxValue - minValue), scale)
}

export function deduplicate(a, key) {
  const seen = {}
  return a.filter(function (item) {
    const k = item[key]
    return seen.hasOwnProperty(k) ? false : (seen[k] = true)
  })
}

export function calculateScore(dataset, range) {
  const nonzerodataset = dataset.filter(m => m.value !== undefined && m.value != null)
  const min = Math.min(...nonzerodataset.map(o => o.value))
  const max = Math.max(...nonzerodataset.map(o => o.value))

  for (let entry of dataset) {
    if (entry.value) {
      entry.score = rescale(entry.value, min, max, range)
    } else {
      entry.score = 0
    }
  }

  return dataset
}

function filterOneOrMore(s, v) {
  if (typeof v === 'string') {
    return v.includes(s)
  }

  return v.some(m => m.includes(s))
}

export function filter(search, v) {
  let posMatched = true
  let negMatched = true

  for (let s of search) {
    if (s.neg) {
      negMatched = negMatched && !filterOneOrMore(s.value, v)
    } else {
      posMatched = posMatched && filterOneOrMore(s.value, v)
    }
  }

  return posMatched && negMatched
}

export function ratingColor(rating, scale = 1) {
  let color = 'danger'

  if (rating == null) {
    color = 'secondary'
  } else {
    if (rating >= 7 * scale) {
      color = 'success'
    } else if (rating >= 5 * scale) {
      color = 'info'
    } else if (rating >= 3 * scale) {
      color = 'warning'
    }
  }

  return color
}

export function tierColor(tiers, type, voidstones = 0) {
  const tier = tiers[voidstones]
  let color = 'light'

  if (type === 'unique map') {
    color = 'unique'
  } else if (tier >= 11) {
    color = 'danger'
  } else if (tier >= 6) {
    color = 'warning'
  }

  return color
}

export function priceImage(price) {
  let img = '/img/alch.png'
  if (price >= 100) {
    img = '/img/divine.png'
  } else if (price >= 20) {
    img = '/img/exalt.png'
  } else if (price >= 5) {
    img = '/img/chaos.png'
  }
  return img
}

export function cardBadge(card) {
  let badgeClass
  if (card.score >= 8) {
    badgeClass = 'bg-light text-dark'
  } else if (card.score >= 5) {
    badgeClass = 'bg-primary text-light'
  } else if (card.score >= 2) {
    badgeClass = 'bg-info text-dark'
  } else if (card.score >= 0.5) {
    badgeClass = 'bg-dark text-info border border-1 border-info'
  } else {
    badgeClass = 'bg-secondary text-dark'
  }

  if (card.unknown) {
    badgeClass += ' border border-1 border-dark shadow-info'
  } else if (card.weight === 0) {
    badgeClass += ' border border-1 border-dark shadow-danger'
  } else if (card.boss) {
    badgeClass += ' border border-1 border-dark shadow-warning'
  }

  badgeClass = `badge m-1 ${badgeClass}`
  return badgeClass
}

export function scrollToElement(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function copyToClipboard(ref) {
  ref.current.select()
  document.execCommand('copy')
}

export function mapTierToLevel(tier) {
  return tier - 1 + 68
}

export function mapLevelToTier(level) {
  return level + 1 - 68
}

export function parseValue(val, ref) {
  if (typeof ref === 'number') {
    return parseFloat(val)
  }

  if (typeof ref === 'boolean') {
    if (val === 1) {
      return true
    }

    if (val === 0) {
      return false
    }

    if (val === 'true') {
      return true
    }

    if (val === 'false') {
      return false
    }
  }

  return val
}
