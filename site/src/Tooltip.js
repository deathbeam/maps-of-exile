import { Tooltip as BsTooltip } from "bootstrap"
import React, { useEffect, useRef } from "react"

function Tooltip(p) {
  const childRef = useRef(undefined)

  useEffect(() => {
    const t = new BsTooltip(childRef.current, {
      title: p.text,
      placement: "top",
      trigger: "hover"
    })
    return () => t.dispose()
  }, [p.text])

  return React.cloneElement(p.children, { ref: childRef })
}

export default Tooltip