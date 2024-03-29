import globalsData from './data/globals.json'

export const wikiBase = 'https://www.poewiki.net/wiki/'
export const divcordDiscord = 'https://discord.gg/jsN2gsDUyM'
export const mapIconBase = 'https://web.poecdn.com/image/'
export const cardArtBase = 'https://web.poecdn.com/image/divination-card/'
export const defaultCardBaseline = 'The Chains that Bind'
export const githubRepo = 'https://github.com/deathbeam/maps-of-exile'
export const issueTemplate = `${githubRepo}/issues/new?labels=map-data&template=map_data.yml&title=Enter+map+name+here`
export const mfAcademyInvite = 'https://discord.gg/mfacademy'
export const globals = {
  ...globalsData,
  lastUpdate: new Date(globalsData.lastUpdate).toLocaleString()
}
