import './Loader.css'
import { memo } from 'react'

const Loader = ({ loading }) => (
  <div className="fixed-top animated loader" style={{ display: loading ? 'block' : 'none' }} />
)

export default memo(Loader)
