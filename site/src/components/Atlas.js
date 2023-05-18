import { useEffect, useMemo, useRef, useState } from 'react'
import { deduplicate, filter, ratingColor, scrollToElement, tierColor } from '../common'
import ReactFlow, { ControlButton, Controls } from 'reactflow'

import 'reactflow/dist/base.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import useKeyPress from '../hooks/useKeyPress'

function toNode(map, matchingNodes, scoreHeatmap) {
  let mapColor = 'text-secondary'

  if (matchingNodes.includes(map.name)) {
    if (scoreHeatmap) {
      mapColor = `text-${ratingColor(map.score, 10)}`
    } else {
      mapColor = `text-${tierColor(map)}`
    }
  }

  return {
    id: map.name,
    position: {
      x: map.x * 2,
      y: map.y * 2
    },
    data: {
      label: (scoreHeatmap ? map.score + ' ' : '') + map.name
    },
    className: `badge bg-dark border-1 ${mapColor}`
  }
}

function toLinks(map) {
  return map.connected.map(c => {
    const con = [map.name, c].sort()

    return {
      id: con[0] + '-' + con[1],
      source: con[0],
      target: con[1],
      type: 'simplebezier'
    }
  })
}

function onNodeClick(e, node) {
  scrollToElement(node.id)
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
  const [full, setFull] = useState(false)
  const [scoreHeatmap, setScoreHeatmap] = useState(false)

  const connectedMaps = useMemo(() => maps.filter(m => m.connected.length > 0 && m.x > 0 && m.y > 0), [maps])

  const matchingNodes = useMemo(
    () => connectedMaps.filter(m => filter(currentSearch, m.search)).map(m => m.name),
    [connectedMaps, currentSearch]
  )

  const data = useMemo(
    () => ({
      nodes: connectedMaps.map(m => toNode(m, matchingNodes, scoreHeatmap)),
      edges: deduplicate(
        connectedMaps.flatMap(m => toLinks(m)),
        'id'
      )
    }),
    [connectedMaps, matchingNodes, scoreHeatmap]
  )

  useKeyPress(['Escape'], () => {
    if (full) {
      setFull(false)
    }
  })

  useEffect(() => {
    setTimeout(() => fitView(flowRef.current, matchingNodes), 150)
  }, [matchingNodes, full])

  return (
    <div
      className="d-none d-md-block bg-atlas"
      style={{
        height: full ? '100vh' : '50vh'
      }}
    >
      <ReactFlow
        zoomOnScroll={full}
        preventScrolling={full}
        nodesConnectable={false}
        nodesDraggable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        nodes={data.nodes}
        edges={data.edges}
        onNodeClick={onNodeClick}
        attributionPosition="bottom left"
        onInit={flow => {
          flowRef.current = flow
          fitView(flowRef.current, matchingNodes)
        }}
      >
        <Controls position="bottom-right" showInteractive={false} showFitView={false}>
          <ControlButton onClick={() => fitView(flowRef.current, matchingNodes)} title="Reset position">
            <i className="fa-solid fa-fw fa-arrows-rotate" />
          </ControlButton>
          <ControlButton onClick={() => setScoreHeatmap(!scoreHeatmap)} title="Score heatmap">
            <i
              className="fa-solid fa-fw fa-sack-dollar"
              style={{
                color: scoreHeatmap ? 'green' : 'black'
              }}
            />
          </ControlButton>
          <ControlButton onClick={() => setFull(!full)} title="Fullscreen">
            {full ? <i className="fa-solid fa-fw fa-minimize" /> : <i className="fa-solid fa-fw fa-expand" />}
          </ControlButton>
        </Controls>
      </ReactFlow>
    </div>
  )
}

export default Atlas
