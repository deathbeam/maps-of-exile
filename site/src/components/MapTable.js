import Map from './Map'

const MapTable = ({ maps, voidstonesInput, currentSearch, addToInput, cardValueSourceInput }) => (
  <table className="table table-responsive table-striped mb-0">
    <thead>
      <tr>
        <th scope="col">
          <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
            <span className="tooltip-tag-text">
              Map name, colored based on natural tier with map tiers for each Voidstone next to it.
              <br />
              Under it <b>Score</b> calculated by summing Layout, Density, Boss and Card ratings multiplied by their
              respective weights and recalculated to number betwen 0 and 100.
              <hr />
              <span className="badge bg-light text-dark m-1">tier 1-5</span>
              <span className="badge bg-warning text-dark m-1">tier 6-10</span>
              <span className="badge bg-danger text-dark m-1">tier 11-16</span>
              <hr />
              <span className="badge bg-danger text-dark m-1">bad/unknown</span>
              <span className="badge bg-warning text-dark m-1">>=30 neutral</span>
              <span className="badge bg-info text-dark m-1">>=50 good</span>
              <span className="badge bg-success text-dark m-1">>=70 great</span>
            </span>
            Map
          </span>
        </th>
        <th scope="col" className="d-none d-md-table-cell">
          <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
            <span className="tooltip-tag-text">
              How straightforward is the map to clear or how good it is for league mechanics.
              <br />
              This data is opinionated, if you disagree with any rating please open issue on GitHub with explanation.
              <hr />
              <span className="badge bg-secondary text-dark m-1">unknown</span>
              <span className="badge bg-danger text-dark m-1">bad</span>
              <span className="badge bg-warning text-dark m-1">>=3 neutral</span>
              <span className="badge bg-info text-dark m-1">>=5 good</span>
              <span className="badge bg-success text-dark m-1">>=7 great</span>
            </span>
            Layout
          </span>
        </th>
        <th scope="col" className="d-none d-md-table-cell">
          <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
            <span className="tooltip-tag-text">
              How many total base mobs does the map have. Do not accounts for extra sources of mobs like league
              mechanics and sextants.
              <br />
              This data is based on actual mob counts in maps counted using rampage. Some newer maps and unique maps
              might be missing data as they still need to be collected.
              <hr />
              <span className="badge bg-secondary text-dark m-1">unknown</span>
              <span className="badge bg-danger text-dark m-1">bad</span>
              <span className="badge bg-warning text-dark m-1">>=3 neutral</span>
              <span className="badge bg-info text-dark m-1">>=5 good</span>
              <span className="badge bg-success text-dark m-1">>=7 great</span>
            </span>
            Density
          </span>
        </th>
        <th scope="col" className="d-none d-md-table-cell">
          <span className="tooltip-tag tooltip-tag-right tooltip-tag-notice">
            <span className="tooltip-tag-text">
              How annoying/dangerous is the boss to kill.
              <br />
              This data is opinionated, if you disagree with any rating please open issue on GitHub with explanation.
              <hr />
              <span className="badge bg-secondary text-dark m-1">unknown</span>
              <span className="badge bg-danger text-dark m-1">hard/annoying</span>
              <span className="badge bg-warning text-dark m-1">>=3 neutral</span>
              <span className="badge bg-info text-dark m-1">>=5 alright</span>
              <span className="badge bg-success text-dark m-1">>=7 easy/fast</span>
            </span>
            Boss
          </span>
        </th>
        <th scope="col">
          <span className="tooltip-tag tooltip-tag-bottom tooltip-tag-notice">
            <span className="tooltip-tag-text">Maps adjacent to this map on atlas with score on left.</span>
            Connected
          </span>
        </th>
        <th scope="col">
          <span className="tooltip-tag tooltip-tag-left tooltip-tag-notice">
            <span className="tooltip-tag-text">
              Cards that drop in the map sorted by <b>drop rate</b> and <b>price</b>. Cards under minimum price are
              filtered out from rating. Adjust <b>Average card per map</b> if the card drop rates are not matching with
              your observed results.
              <hr />
              <span className="badge bg-secondary text-dark m-1">not very good</span>
              <span className="badge bg-dark border border-1 border-info text-info m-1">>=0.5 decent</span>
              <span className="badge bg-info text-dark m-1">>=2 good</span>
              <span className="badge bg-primary text-light m-1">>=5 great</span>
              <span className="badge bg-light text-dark m-1">>=8 amazing</span>
            </span>
            Cards
          </span>
        </th>
      </tr>
    </thead>
    <tbody>
      {maps.map(m => (
        <Map
          key={m.name}
          map={m}
          voidstones={voidstonesInput}
          currentSearch={currentSearch}
          addToInput={addToInput}
          cardValueSourceInput={cardValueSourceInput}
        />
      ))}
    </tbody>
  </table>
)

export default MapTable
