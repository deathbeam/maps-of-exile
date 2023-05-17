import { useEffect, useMemo, useRef } from 'react'
import { filter } from '../common'
import ReactFlow, { Controls } from 'reactflow'

import 'reactflow/dist/base.css'

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
    position: {
      x: map.x * 2,
      y: map.y * 2
    },
    data: {
      label: map.name
    },
    style: {
      color: color
    },
    className: 'badge bg-dark'
  }
}

function toLinks(map) {
  return (map.connected || []).map(c => ({
    id: map.name + '-' + c,
    source: map.name,
    target: c
  }))
}

function onNodeClick(e, node) {
  window.location.hash = node.id
}

function fitView(flow, matchingNodes) {
  if (!flow) {
    return
  }

  flow.fitView({
    nodes: matchingNodes.map(n => ({ id: n }))
  })
}

const Atlas = ({ maps, currentSearch }) => {
  const flowRef = useRef()
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

  useEffect(() => {
    fitView(flowRef.current, matchingNodes)
  }, [matchingNodes])

  return (
    <ReactFlow
      nodes={data.nodes}
      edges={data.edges}
      onNodeClick={onNodeClick}
      onInit={flow => {
        flowRef.current = flow
        fitView(flowRef.current, matchingNodes)
      }}
    >
      <Controls position="bottom-right" />
    </ReactFlow>
  )
}

export default Atlas
