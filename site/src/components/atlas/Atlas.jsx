import 'reactflow/dist/base.css'
import './Atlas.css'

import { useMemo, useContext } from 'react'
import ReactFlow, { ControlButton, Controls, Handle, Position, useReactFlow } from 'reactflow'
import { deduplicate, filter, mapLevel, ratingColor, tierColor } from '../../common'
import MapImage from '../MapImage'
import { preparedGlobals } from '../../data'
import { Link } from 'react-router-dom'
import { AppState } from '../../state.js'
import { computed, useComputed, useSignalEffect } from '@preact/signals'

const scale = 3
const offset = 6
const bgId = 'bg'

function toNode(map, matchingNodes, atlasScore, atlasIcons, atlasLabels, voidstones) {
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
      atlasIcons,
      atlasLabels,
      voidstones,
      map: {
        name: map.name,
        levels: map.levels,
        icon: map.icon,
        type: map.type,
        score: map.score
      }
    },
    style: {
      opacity: matchingNodes.includes(map.name) ? 1 : 0.4
    },
    selectable: true
  }
}

function toLinks(map) {
  return map.connected.map(c => {
    const con = [map.name, c.name].sort()

    return {
      id: `${con[0]}-${con[1]}`,
      source: con[0],
      target: con[1]
    }
  })
}

function BackgroundNode({ data }) {
  return <img src={data.image} width={data.width} height={data.height} alt="" />
}

function MapNode({ data }) {
  const atlasScore = data.atlasScore
  const atlasIcons = data.atlasIcons
  const atlasLabels = data.atlasLabels
  const map = data.map

  let mapColor
  if (atlasScore) {
    mapColor = `text-${ratingColor(map.score, 10)}`
  } else {
    mapColor = `text-${tierColor(map.levels, true, map.type, data.voidstones)}`
  }

  const buttonClass = `btn btn-badge btn-dark ${mapColor}${atlasIcons ? ' atlas-button' : ''}`
  const label = (atlasScore ? `${Math.floor(map.score)} ` : '') + map.name

  return (
    <>
      <Handle type="source" position={Position.Top} className=" atlas-edge" />
      <Handle type="target" position={Position.Top} className=" atlas-edge" />
      <Link to={`/atlas/${map.name}`}>
        {!!atlasIcons && (
          <MapImage
            icon={map.icon}
            name={map.name}
            type={map.type}
            level={mapLevel(map.levels, true, data.voidstones)}
          />
        )}
        {!!atlasLabels && <button className={buttonClass}>{label}</button>}
      </Link>
    </>
  )
}

const Atlas = ({ currentMap }) => {
  const flow = useReactFlow()
  const nodeTypes = useMemo(() => ({ background: BackgroundNode, map: MapNode }), [])

  const state = useContext(AppState)
  const atlasScore = state.input.atlasScore
  const atlasIcons = state.input.atlasIcons
  const atlasLabels = state.input.atlasLabels
  const voidstones = state.input.voidstones
  const ratedMaps = state.ratedMaps
  const parsedSearch = state.parsedSearch
  const connectedMaps = useComputed(() => ratedMaps.value.filter(m => m.connected.length > 0 && m.atlas))
  const matchingNodes = useComputed(() =>
    connectedMaps.value
      .filter(m =>
        currentMap
          ? m.name === currentMap || m.connected.map(c => c.name).includes(currentMap)
          : filter(parsedSearch.value, m.search)
      )
      .map(m => m.name)
  )

  const fitMatching = () =>
    flow.fitView({
      nodes: matchingNodes.value.map(n => ({ id: n }))
    })

  useSignalEffect(() => {
    fitMatching()
  })

  const data = computed(() => ({
    nodes: [
      {
        id: bgId,
        type: 'background',
        position: {
          x: 0,
          y: 0
        },
        data: {
          image: '/img/atlas.webp',
          width: preparedGlobals['atlas']['width'] * scale,
          height: preparedGlobals['atlas']['height'] * scale
        },
        zIndex: -1
      }
    ].concat(
      connectedMaps.value.map(m =>
        toNode(m, matchingNodes.value, atlasScore.value, atlasIcons.value, atlasLabels.value, voidstones.value)
      )
    ),
    edges: deduplicate(
      connectedMaps.value.flatMap(m => toLinks(m)),
      'id'
    )
  }))

  return (
    <div
      className="d-none d-lg-block position-fixed"
      style={{
        width: '75%',
        height: '100vh',
        backgroundColor: 'black',
        top: 0,
        left: 0
      }}
    >
      <ReactFlow
        zoomOnScroll={true}
        preventScrolling={true}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        nodes={data.value.nodes}
        edges={data.value.edges}
        nodeTypes={nodeTypes}
        nodeOrigin={[0.5, 0.5]}
        defaultEdgeOptions={{
          type: 'simplebezier'
        }}
        proOptions={{
          hideAttribution: true
        }}
        onInit={fitMatching}
      >
        <Controls position="bottom-right" showInteractive={false} showFitView={false}>
          <ControlButton onClick={fitMatching} title="Reset position">
            <i className="fa-solid fa-fw fa-refresh" />
          </ControlButton>
          <ControlButton onClick={() => (atlasIcons.value = !atlasIcons.value)} title="Map icons">
            <i className={`fa-solid fa-fw fa-image${atlasIcons.value ? ' text-primary' : ''}`} />
          </ControlButton>
          <ControlButton onClick={() => (atlasLabels.value = !atlasLabels.value)} title="Map labels">
            <i className={`fa-solid fa-fw fa-message${atlasLabels.value ? ' text-primary' : ''}`} />
          </ControlButton>
          <ControlButton onClick={() => (atlasScore.value = !atlasScore.value)} title="Score heatmap">
            <i className={`fa-solid fa-fw fa-star${atlasScore.value ? ' text-primary' : ''}`} />
          </ControlButton>
        </Controls>
      </ReactFlow>
    </div>
  )
}

export default Atlas
