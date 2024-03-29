import { memo } from 'react'

import './Loader.css'

const Loader = ({ loading }) => (
  <div className="fixed-top animated loader" style={{ display: loading ? 'block' : 'none' }} />
)

export default memo(Loader)
