import 'reactflow/dist/base.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './Atlas.css'

import { useCallback, useEffect, useMemo } from 'react'
import ReactFlow, { ControlButton, Controls, Handle, Panel, Position, useReactFlow } from 'reactflow'
import { deduplicate, filter, ratingColor, scrollToElement, tierColor } from '../common'
import useKeyPress from '../hooks/useKeyPress'
import usePersistedState from '../hooks/usePersistedState'
import MapImage from './MapImage'
import { possibleVoidstones, preparedGlobals } from '../data'

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
      voidstones: parseInt(voidstones),
      map: {
        name: map.name,
        tiers: map.tiers,
        icon: map.icon,
        unique: map.unique,
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
    mapColor = `text-${tierColor(map.tiers, map.unique, data.voidstones)}`
  }

  const buttonClass = `btn btn-badge btn-dark ${mapColor}` + (atlasIcons ? ' atlas-button' : '')
  const label = (atlasScore ? map.score + ' ' : '') + map.name

  return (
    <>
      <Handle type="source" position={Position.Top} className=" atlas-edge" />
      <Handle type="target" position={Position.Top} className=" atlas-edge" />
      {!!atlasIcons && (
        <MapImage
          icon={map.icon}
          unique={map.unique}
          tier={map.tiers[data.voidstones]}
          onClick={() => scrollToElement(id)}
        />
      )}
      {!!atlasLabels && (
        <button className={buttonClass} onClick={() => scrollToElement(id)}>
          {label}
        </button>
      )}
    </>
  )
}

const Atlas = ({ maps, currentSearch, full, setFull, voidstones, setVoidstones }) => {
  const flow = useReactFlow()
  const [atlasScore, setAtlasScore] = usePersistedState('atlasScore', false)
  const [atlasIcons, setAtlasIcons] = usePersistedState('atlasIcons', true)
  const [atlasLabels, setAtlasLabels] = usePersistedState('atlasLabels', true)

  const nodeTypes = useMemo(() => ({ background: BackgroundNode, map: MapNode }), [])
  const connectedMaps = useMemo(() => maps.filter(m => m.connected.length > 0 && m.x > 0 && m.y > 0), [maps])
  const matchingNodes = useMemo(
    () => connectedMaps.filter(m => filter(currentSearch, m.search)).map(m => m.name),
    [connectedMaps, currentSearch]
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
      ].concat(connectedMaps.map(m => toNode(m, matchingNodes, atlasScore, atlasIcons, atlasLabels, voidstones))),
      edges: deduplicate(
        connectedMaps.flatMap(m => toLinks(m)),
        'id'
      )
    }),
    [connectedMaps, matchingNodes, atlasScore, atlasIcons, atlasLabels, voidstones]
  )

  useKeyPress(['Escape'], () => {
    if (full) {
      setFull(false)
    }
  })

  useEffect(() => {
    setTimeout(() => fitMatching(), 150)
  }, [fitMatching, full])

  return (
    <div
      className="d-none d-md-block"
      style={{
        width: '100%',
        height: full ? '100vh' : '35vh',
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
        onInit={fitMatching}
      >
        <Panel position="bottom-left" className="card bg-dark">
          <div className="card-body p-1">
            <i className="fa-solid fa-fw fa-gem" title="Voidstones" />{' '}
            <div className="btn-group" role="group">
              {possibleVoidstones.map(v => (
                <>
                  <button
                    className={'btn ' + (v === voidstones ? 'btn-info text-dark' : 'text-body btn-outline-secondary')}
                    onClick={e => setVoidstones(v)}
                  >
                    {v}
                  </button>
                </>
              ))}
            </div>
          </div>
        </Panel>
        <Controls position="bottom-right" showInteractive={false} showFitView={false}>
          <ControlButton onClick={fitMatching} title="Reset position">
            <i className="fa-solid fa-fw fa-refresh" />
          </ControlButton>
          <ControlButton onClick={() => setAtlasIcons(!atlasIcons)} title="Map icons">
            <i className={'fa-solid fa-fw fa-image' + (atlasIcons ? ' text-info' : '')} />
          </ControlButton>
          <ControlButton onClick={() => setAtlasLabels(!atlasLabels)} title="Map labels">
            <i className={'fa-solid fa-fw fa-message' + (atlasLabels ? ' text-info' : '')} />
          </ControlButton>
          <ControlButton onClick={() => setAtlasScore(!atlasScore)} title="Score heatmap">
            <i className={'fa-solid fa-fw fa-star' + (atlasScore ? ' text-info' : '')} />
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
