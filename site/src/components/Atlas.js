import { useMemo } from 'react'
import { filter } from '../common'
import Graph from './Graph'

function toNode(map, matchingNodes) {
  const tier = map.tiers[0]
  let color = 'white'

  if (!matchingNodes.includes(map.name)) {
    color = 'grey'
  } else if (map.unique) {
    color = 'brown'
  } else if (tier >= 11) {
    color = 'red'
  } else if (tier >= 6) {
    color = 'yellow'
  }

  return {
    id: map.name,
    label: map.name,
    color: color,
    mass: tier,
    x: map.x * 2,
    y: map.y * 2
  }
}

function toLinks(map) {
  return (map.connected || []).map(c => ({
    from: map.name,
    to: c
  }))
}

function adjustNetwork(network, matchingNodes) {
  console.info(matchingNodes)
  network.fit({
    nodes: matchingNodes
  })
}

const Atlas = ({ maps, currentSearch }) => {
  const connectedMaps = useMemo(() => maps.filter(m => m.connected.length > 0 && m.x > 0 && m.y > 0), [maps])

  const matchingNodes = useMemo(
    () => connectedMaps.filter(m => filter(currentSearch, m.search)).map(m => m.name),
    [connectedMaps, currentSearch]
  )

  const data = useMemo(
    () => ({
      nodes: connectedMaps.map(m => toNode(m, matchingNodes)),
      edges: connectedMaps.flatMap(m => toLinks(m))
    }),
    [connectedMaps, matchingNodes]
  )

  const options = {
    interaction: {
      dragNodes: false,
      zoomView: false
    },
    physics: false,
    nodes: {
      shape: 'dot',
      size: 12,
      shadow: true,
      font: '14px arial white'
    }
  }

  return <Graph data={data} options={options} getNetwork={n => adjustNetwork(n, matchingNodes)} />
}

export default Atlas
