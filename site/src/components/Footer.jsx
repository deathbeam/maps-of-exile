import './Footer.css'
import { githubRepo, mfAcademyInvite, preparedGlobals } from '../data'
import { memo } from 'react'

const Footer = () => (
  <div className="container-fluid p-4 text-end footer">
    <div className="d-lg-flex justify-content-between">
      <div>
        For raw data see:{' '}
        <a
          href="https://raw.githubusercontent.com/deathbeam/maps-of-exile/main/site/src/data/globals.json"
          target="_blank"
          rel="noreferrer"
        >
          globals.json
        </a>{' '}
        <a
          href="https://raw.githubusercontent.com/deathbeam/maps-of-exile/main/site/src/data/monsters.json"
          target="_blank"
          rel="noreferrer"
        >
          monsters.json
        </a>{' '}
        <a
          href="https://raw.githubusercontent.com/deathbeam/maps-of-exile/main/site/src/data/cards.json"
          target="_blank"
          rel="noreferrer"
        >
          cards.json
        </a>{' '}
        <a
          href="https://raw.githubusercontent.com/deathbeam/maps-of-exile/main/site/src/data/maps.json"
          target="_blank"
          rel="noreferrer"
        >
          maps.json
        </a>
        <br />
        Current league: <b>{preparedGlobals.league}</b>
        <br />
        Last data update: <b>{preparedGlobals.lastUpdate}</b>
      </div>
      <div>
        Contribute on{' '}
        <a href={githubRepo} target="_blank" rel="noreferrer">
          <i className="fa-brands fa-github" /> GitHub
        </a>
        . Also contains sources for all data used on the site.
        <br />
        Join the{' '}
        <a href={mfAcademyInvite} target="_blank" rel="noreferrer">
          <img src="/img/mfa_logo.png" alt="" width="24" height="24" /> MF Academy Discord
        </a>
        .
      </div>
    </div>
  </div>
)

export default memo(Footer)
