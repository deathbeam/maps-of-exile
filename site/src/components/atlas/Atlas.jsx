import { useAtom, useAtomValue } from 'jotai'
import { memo, useCallback, useEffect, useMemo } from 'react'
import ReactFlow, { ControlButton, Controls, Handle, Position, useReactFlow } from 'reactflow'
import 'reactflow/dist/base.css'

import { deduplicate, filter, mapLevel, ratingColor, tierColor } from '../../common'
import state from '../../state'
import MapImage from '../MapImage'
import './Atlas.css'

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
      voidstones: voidstones,
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

  const buttonClass = `btn btn-badge btn-dark ${mapColor}` + (atlasIcons ? ' atlas-button' : '')
  const label = (atlasScore ? Math.floor(map.score) + ' ' : '') + map.name

  return (
    <>
      <Handle type="source" position={Position.Top} className=" atlas-edge" />
      <Handle type="target" position={Position.Top} className=" atlas-edge" />
      <a href={`/#/atlas/${map.name}`}>
        {!!atlasIcons && (
          <MapImage
            icon={map.icon}
            name={map.name}
            type={map.type}
            level={mapLevel(map.levels, true, data.voidstones)}
          />
        )}
        {!!atlasLabels && <button className={buttonClass}>{label}</button>}
      </a>
    </>
  )
}

const Atlas = ({ selectedMap }) => {
  const flow = useReactFlow()
  const [atlasScore, setAtlasScore] = useAtom(state.input.atlasScore)
  const [atlasIcons, setAtlasIcons] = useAtom(state.input.atlasIcons)
  const [atlasLabels, setAtlasLabels] = useAtom(state.input.atlasLabels)
  const maps = useAtomValue(state.ratedMaps)
  const globals = useAtomValue(state.globals)
  const parsedSearch = useAtomValue(state.parsedSearch)
  const voidstones = useAtomValue(state.input.voidstones)

  const nodeTypes = useMemo(() => ({ background: BackgroundNode, map: MapNode }), [])
  const mapsOnAtlas = useMemo(() => maps.filter(m => m.connected.length > 0 && m.atlas), [maps])
  const matchingNodes = useMemo(
    () =>
      mapsOnAtlas
        .filter(m =>
          selectedMap
            ? m.name === selectedMap.name || m.connected.map(c => c.name).includes(selectedMap.name)
            : filter(parsedSearch, m.search)
        )
        .map(m => m.name),
    [mapsOnAtlas, parsedSearch, selectedMap]
  )

  const fitMatching = useCallback(
    () =>
      flow.fitView({
        nodes: matchingNodes.map(n => ({ id: n }))
      }),
    [flow, matchingNodes]
  )

  useEffect(() => {
    setTimeout(fitMatching, 150)
  }, [fitMatching])

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
            width: globals && globals.atlas ? globals.atlas.width * scale : 0,
            height: globals && globals.atlas ? globals.atlas.height * scale : 0
          },
          zIndex: -1
        }
      ].concat(mapsOnAtlas.map(m => toNode(m, matchingNodes, atlasScore, atlasIcons, atlasLabels, voidstones))),
      edges: deduplicate(
        mapsOnAtlas.flatMap(m => toLinks(m)),
        'id'
      )
    }),
    [globals, mapsOnAtlas, matchingNodes, atlasScore, atlasIcons, atlasLabels, voidstones]
  )

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

export default memo(Atlas)
