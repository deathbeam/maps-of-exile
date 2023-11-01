import 'reactflow/dist/base.css'
import './Atlas.css'

import { useCallback, useEffect, useMemo } from 'react'
import ReactFlow, { ControlButton, Controls, Handle, Position, useReactFlow } from 'reactflow'
import { deduplicate, filter, mapLevel, ratingColor, tierColor } from '../../common'
import usePersistedState from '../../hooks/usePersistedState'
import MapImage from '../MapImage'
import { preparedGlobals } from '../../data'

const scale = 3
const offset = 6
const bgId = 'bg'

function toNode(map, matchingNodes, atlasScore, atlasIcons, atlasLabels, voidstones, setCurrentMap) {
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
      voidstones: voidstones,
      onClick: () => setCurrentMap(map.name),
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
      id: con[0] + '-' + con[1],
      source: con[0],
      target: con[1]
    }
  })
}

function BackgroundNode({ data }) {
  return <img src={data.image} width={data.width} height={data.height} alt="" />
}

function MapNode({ id, data }) {
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

  const buttonClass = `btn btn-badge btn-dark ${mapColor}` + (atlasIcons ? ' atlas-button' : '')
  const label = (atlasScore ? Math.floor(map.score) + ' ' : '') + map.name

  return (
    <>
      <Handle type="source" position={Position.Top} className=" atlas-edge" />
      <Handle type="target" position={Position.Top} className=" atlas-edge" />
      {!!atlasIcons && (
        <MapImage
          icon={map.icon}
          name={map.name}
          type={map.type}
          level={mapLevel(map.levels, true, data.voidstones)}
          onClick={data.onClick}
        />
      )}
      {!!atlasLabels && (
        <button className={buttonClass} onClick={data.onClick}>
          {label}
        </button>
      )}
    </>
  )
}

const Atlas = ({ maps, currentSearch, currentMap, voidstones, setCurrentMap }) => {
  const flow = useReactFlow()
  const [atlasScore, setAtlasScore] = usePersistedState('atlasScore', false)
  const [atlasIcons, setAtlasIcons] = usePersistedState('atlasIcons', true)
  const [atlasLabels, setAtlasLabels] = usePersistedState('atlasLabels', true)

  const nodeTypes = useMemo(() => ({ background: BackgroundNode, map: MapNode }), [])
  const connectedMaps = useMemo(() => maps.filter(m => m.connected.length > 0 && m.atlas), [maps])
  const matchingNodes = useMemo(
    () =>
      connectedMaps
        .filter(m =>
          currentMap
            ? m.name === currentMap || m.connected.map(c => c.name).includes(currentMap)
            : filter(currentSearch, m.search)
        )
        .map(m => m.name),
    [connectedMaps, currentSearch, currentMap]
  )

  const fitMatching = useCallback(
    () =>
      flow.fitView({
        nodes: matchingNodes.map(n => ({ id: n }))
      }),
    [flow, matchingNodes]
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
            image: '/img/atlas.webp',
            width: preparedGlobals['atlas']['width'] * scale,
            height: preparedGlobals['atlas']['height'] * scale
          },
          zIndex: -1
        }
      ].concat(
        connectedMaps.map(m => toNode(m, matchingNodes, atlasScore, atlasIcons, atlasLabels, voidstones, setCurrentMap))
      ),
      edges: deduplicate(
        connectedMaps.flatMap(m => toLinks(m)),
        'id'
      )
    }),
    [connectedMaps, matchingNodes, atlasScore, atlasIcons, atlasLabels, voidstones, setCurrentMap]
  )

  useEffect(() => {
    setTimeout(() => fitMatching(), 150)
  }, [fitMatching])

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
        onInit={fitMatching}
      >
        <Controls position="bottom-right" showInteractive={false} showFitView={false}>
          <ControlButton onClick={fitMatching} title="Reset position">
            <i className="fa-solid fa-fw fa-refresh" />
          </ControlButton>
          <ControlButton onClick={() => setAtlasIcons(!atlasIcons)} title="Map icons">
            <i className={'fa-solid fa-fw fa-image' + (atlasIcons ? ' text-primary' : '')} />
          </ControlButton>
          <ControlButton onClick={() => setAtlasLabels(!atlasLabels)} title="Map labels">
            <i className={'fa-solid fa-fw fa-message' + (atlasLabels ? ' text-primary' : '')} />
          </ControlButton>
          <ControlButton onClick={() => setAtlasScore(!atlasScore)} title="Score heatmap">
            <i className={'fa-solid fa-fw fa-star' + (atlasScore ? ' text-primary' : '')} />
          </ControlButton>
        </Controls>
      </ReactFlow>
    </div>
  )
}

export default Atlas
