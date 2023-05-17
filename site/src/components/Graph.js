import { useEffect, useRef } from 'react'
import isEqual from 'lodash/isEqual'
import differenceWith from 'lodash/differenceWith'
import { DataSet } from 'vis-data/peer/esm/vis-data'
import { Network } from 'vis-network/peer/esm/vis-network'

import 'vis-network/styles/vis-network.css'

const defaultOptions = {
  physics: {
    stabilization: false
  },
  autoResize: false,
  edges: {
    smooth: false,
    width: 0.5,
    arrows: {
      to: {
        enabled: true,
        scaleFactor: 0.5
      }
    }
  }
}

const idIsEqual = (n1, n2) => n1.id === n2.id

function diff(cur, next, isEq) {
  const dataRemoved = differenceWith(cur.get(), next, isEq)
  const dataAdded = differenceWith(next, cur.get(), isEq)
  const dataChanged = differenceWith(differenceWith(next, cur.get(), isEqual), dataAdded)
  cur.remove(dataRemoved)
  cur.add(dataAdded)
  cur.update(dataChanged)
}

const Graph = ({ data, options = defaultOptions, style = { width: '100%', height: '100%' }, getNetwork }) => {
  const nodes = useRef(new DataSet(data.nodes))
  const edges = useRef(new DataSet(data.edges))
  const network = useRef(null)
  const container = useRef(null)

  useEffect(() => {
    network.current = new Network(container.current, { nodes: nodes.current, edges: edges.current }, options)

    if (getNetwork) {
      getNetwork(network.current)
    }
  })

  useEffect(() => {
    const nodesChange = !isEqual(nodes.current, data.nodes)
    const edgesChange = !isEqual(edges.current, data.edges)

    if (nodesChange) {
      diff(nodes.current, data.nodes, idIsEqual)
    }

    if (edgesChange) {
      diff(edges.current, data.edges, isEqual)
    }

    if ((nodesChange || edgesChange) && getNetwork) {
      getNetwork(network.current)
    }
  }, [data, getNetwork])

  useEffect(() => {
    network.current.setOptions(options)
  }, [options])

  return <div ref={container} style={style} />
}

export default Graph
