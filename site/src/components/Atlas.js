import { useEffect, useMemo, useRef } from 'react'
import { filter } from '../common'
import ReactFlow, { ControlButton, Controls } from 'reactflow'

import 'reactflow/dist/base.css'

function toNode(map, matchingNodes) {
  const tier = map.tiers[0]
  let tierColor = 'text-light'
  if (!matchingNodes.includes(map.name)) {
    tierColor = 'text-secondary'
  } else if (map.unique) {
    tierColor = 'text-unique'
  } else if (tier >= 11) {
    tierColor = 'text-danger'
  } else if (tier >= 6) {
    tierColor = 'text-warning'
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
    className: `badge bg-dark border-1 ${tierColor}`
  }
}

function toLinks(map) {
  return (map.connected || []).map(c => ({
    id: map.name + '-' + c,
    source: map.name,
    target: c,
    interactionWidth: 0
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
      <Controls position="bottom-right" showInteractive={false}>
        <ControlButton onClick={() => fitView(flowRef.current, matchingNodes)} title="action">
          <div>↺</div>
        </ControlButton>
      </Controls>
    </ReactFlow>
  )
}

export default Atlas
