import { useEffect, useMemo, useRef } from 'react'
import { filter } from '../common'
import ReactFlow, { ControlButton, Controls } from 'reactflow'

import 'reactflow/dist/base.css'
import '@fortawesome/fontawesome-free/css/all.min.css'

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
  return map.connected.map(c => ({
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

const Atlas = ({ maps, currentSearch, atlasFull, setAtlasFull }) => {
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
    setTimeout(() => fitView(flowRef.current, matchingNodes), 150)
  }, [matchingNodes, atlasFull])

  return (
    <div
      className="d-none d-md-block bg-atlas"
      style={{
        height: atlasFull ? '100vh' : '50vh'
      }}
    >
      <ReactFlow
        zoomOnScroll={atlasFull}
        preventScrolling={atlasFull}
        nodesConnectable={false}
        nodesDraggable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        nodes={data.nodes}
        edges={data.edges}
        onNodeClick={onNodeClick}
        onInit={flow => {
          flowRef.current = flow
          fitView(flowRef.current, matchingNodes)
        }}
      >
        <Controls position="bottom-right" showInteractive={false} showFitView={false}>
          <ControlButton onClick={() => fitView(flowRef.current, matchingNodes)} title="action">
            <i className="fa-solid fa-fw fa-arrows-rotate" />
          </ControlButton>
          <ControlButton onClick={() => setAtlasFull(!atlasFull)} title="action">
            {atlasFull ? <i className="fa-solid fa-fw fa-minimize" /> : <i className="fa-solid fa-fw fa-expand" />}
          </ControlButton>
        </Controls>
      </ReactFlow>
    </div>
  )
}

export default Atlas
