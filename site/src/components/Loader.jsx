import './Loader.css'

const Loader = ({ loading }) => (
  <div className="fixed-top animated loader" style={{ display: loading.value ? 'block' : 'none' }} />
)

export default Loader
