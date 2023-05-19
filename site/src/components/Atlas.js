import './Atlas.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { deduplicate, filter, ratingColor, scrollToElement, tierColor } from '../common'
import ReactFlow, { ControlButton, Controls, Handle, Panel, Position } from 'reactflow'

import 'reactflow/dist/base.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { possibleVoidstones } from '../data'
import useKeyPress from '../hooks/useKeyPress'
import usePersistedState from '../hooks/usePersistedState'

const scale = 3
const fullWidth = 1003.52
const fullHeight = 564.48
const offset = 8
const bgId = 'bg'

function toNode(map, matchingNodes, atlasScore, atlasVoidstones, atlasIcons, atlasLabels) {
  let opacity = 1

  if (!matchingNodes.includes(map.name)) {
    opacity = 0.4
  }

  return {
    id: map.name,
    parentNode: bgId,
    type: 'map',
    position: {
      x: map.x * scale + offset,
      y: map.y * scale + offset
    },
    data: {
      atlasScore,
      atlasVoidstones,
      atlasIcons,
      atlasLabels,
      map
    },
    style: {
      opacity
    },
    selectable: true
  }
}

function toLinks(map) {
  return map.connected.map(c => {
    const con = [map.name, c].sort()

    return {
      id: con[0] + '-' + con[1],
      source: con[0],
      target: con[1]
    }
  })
}

function fitView(flow, matchingNodes) {
  if (!flow) {
    return
  }

  flow.fitView({
    nodes: matchingNodes.map(n => ({ id: n }))
  })
}

function BackgroundNode({ data }) {
  return <img src={data.image} width={data.width} height={data.height} alt="" />
}

function MapNode({ id, data }) {
  const atlasScore = data.atlasScore
  const atlasVoidstones = data.atlasVoidstones
  const atlasIcons = data.atlasIcons
  const atlasLabels = data.atlasLabels
  const map = data.map

  let mapColor
  if (atlasScore) {
    mapColor = `text-${ratingColor(map.score, 10)}`
  } else {
    mapColor = `text-${tierColor(map, atlasVoidstones)}`
  }

  const buttonClass = `nodrag btn btn-dark ${mapColor}` + (atlasIcons ? ' atlas-button' : '')
  const label = (atlasScore ? map.score + ' ' : 'T' + map.tiers[parseInt(atlasVoidstones)] + ' ') + map.name

  return (
    <div>
      <Handle type="source" position={Position.Top} className=" atlas-edge" />
      <Handle type="target" position={Position.Top} className=" atlas-edge" />
      {!!atlasIcons && (
        <img
          src={map.icon}
          onError={e => (e.target.src = '/map.webp')}
          className="nodrag"
          alt=""
          loading="lazy"
          width="47"
          height="47"
          onClick={() => scrollToElement(id)}
        />
      )}
      {!!atlasLabels && (
        <button className={buttonClass} onClick={() => scrollToElement(id)}>
          {label}
        </button>
      )}
    </div>
  )
}

const Atlas = ({ maps, currentSearch }) => {
  const flowRef = useRef()
  const [full, setFull] = useState(false)
  const [atlasScore, setAtlasScore] = usePersistedState('atlasScore', false)
  const [atlasVoidstones, setAtlasVoidstones] = usePersistedState('atlasVoidstones', 0)
  const [atlasIcons, setAtlasIcons] = usePersistedState('atlasIcons', true)
  const [atlasLabels, setAtlasLabels] = usePersistedState('atlasLabels', true)

  const nodeTypes = useMemo(() => ({ background: BackgroundNode, map: MapNode }), [])
  const connectedMaps = useMemo(() => maps.filter(m => m.connected.length > 0 && m.x > 0 && m.y > 0), [maps])
  const matchingNodes = useMemo(
    () => connectedMaps.filter(m => filter(currentSearch, m.search)).map(m => m.name),
    [connectedMaps, currentSearch]
  )

  const data = useMemo(
    () => ({
      nodes: [
        {
          id: bgId,
          type: 'background',
          position: {
            x: 0,
            y: 0
          },
          data: {
            image: '/atlas.webp',
            width: fullWidth * scale,
            height: fullHeight * scale
          },
          zIndex: -10,
          className: 'nodrag'
        }
      ].concat(connectedMaps.map(m => toNode(m, matchingNodes, atlasScore, atlasVoidstones, atlasIcons, atlasLabels))),
      edges: deduplicate(
        connectedMaps.flatMap(m => toLinks(m)),
        'id'
      )
    }),
    [connectedMaps, matchingNodes, atlasScore, atlasVoidstones, atlasIcons, atlasLabels]
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
      className="d-none d-md-block"
      style={{
        width: '100%',
        height: full ? '100vh' : '50vh',
        backgroundColor: 'black'
      }}
    >
      <ReactFlow
        zoomOnScroll={full}
        preventScrolling={full}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        nodes={data.nodes}
        edges={data.edges}
        nodeTypes={nodeTypes}
        nodeOrigin={[0.5, 0.5]}
        defaultEdgeOptions={{
          type: 'simplebezier'
        }}
        proOptions={{
          hideAttribution: true
        }}
        onInit={flow => {
          flowRef.current = flow
          fitView(flowRef.current, matchingNodes)
        }}
      >
        <Panel position="bottom-left" className="card bg-light text-dark">
          <div className="card-body p-1">
            <i className="fa-solid fa-fw fa-gem" title="Voidstones" />{' '}
            <div className="btn-group" role="group">
              {possibleVoidstones.map(v => (
                <>
                  <button
                    className={'btn ' + (v === atlasVoidstones ? 'btn-dark' : 'text-secondary btn-outline-dark')}
                    onClick={e => setAtlasVoidstones(v)}
                  >
                    {v}
                  </button>
                </>
              ))}
            </div>
          </div>
        </Panel>
        <Controls position="bottom-right" showInteractive={false} showFitView={false}>
          <ControlButton onClick={() => fitView(flowRef.current, matchingNodes)} title="Reset position">
            <i className="fa-solid fa-fw fa-refresh" />
          </ControlButton>
          <ControlButton onClick={() => setAtlasIcons(!atlasIcons)} title="Map icons">
            <i
              className="fa-solid fa-fw fa-image"
              style={{
                color: atlasIcons ? 'blue' : 'black'
              }}
            />
          </ControlButton>
          <ControlButton onClick={() => setAtlasLabels(!atlasLabels)} title="Map labels">
            <i
              className="fa-solid fa-fw fa-message"
              style={{
                color: atlasLabels ? 'blue' : 'black'
              }}
            />
          </ControlButton>
          <ControlButton onClick={() => setAtlasScore(!atlasScore)} title="Score heatmap">
            <i
              className="fa-solid fa-fw fa-star"
              style={{
                color: atlasScore ? 'blue' : 'black'
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
