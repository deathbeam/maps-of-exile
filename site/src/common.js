function rescale(value, minValue, maxValue, scale) {
  return Math.round(Math.min((scale * (value - minValue)) / (maxValue - minValue), scale) * 10) / 10
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
  const out = []

  for (let entry of dataset) {
    if (entry.value) {
      out.push({
        ...entry,
        score: rescale(entry.value, min, max, range)
      })
    } else {
      out.push(entry)
    }
  }

  return out.sort((a, b) => (b.score || 0) - (a.score || 0))
}

export function filter(search, v) {
  let posMatched = true
  let negMatched = true

  for (let s of search) {
    if (s.neg) {
      negMatched = negMatched && !v.some(m => m.trim().toLowerCase().includes(s.value))
    } else {
      posMatched = posMatched && v.some(m => m.trim().toLowerCase().includes(s.value))
    }
  }

  return posMatched && negMatched
}
