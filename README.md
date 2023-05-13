# poe-tools

Shows and filters map/card/map metadata from various sources.

## Adding new map

### For non-developers

Simplest way to add new map even if you are not knowledgeable about inner workings of the project or do not know how to code is to
[open an issue](https://github.com/deathbeam/poe-tools/issues/new?labels=map-data&template=map_data.yml&title=Enter+map+name+here) and someone will implement it.  

### For developers

[/data/maps.json](/data/maps.json) contains extra map metadata  
[/site/public/layout](/site/public/layout/) contains layout images  

Full format for map metadata is:

```json
{
  "name": "Map name",
  "image": false,
  "layout": {
    "league_mechanics": false,
    "delirium_mirror": false,
    "outdoors": false,
    "linear": false,
    "few_obstacles": false
  },
  "boss": {
    "not_spawned": false,
    "rushable": false,
    "phases": false,
    "soft_phases": false,
    "separated": false,
    "notes": "boss notes"
  },
  "rating": {
    "layout": 10,
    "density": 10,
    "boss": 10
  }
}
```

See issue mentioned in [For-non-developers](#for-non-developers) section for reference for fields.

## Sources of data

**Stacked Decks card spreadsheet** by **_🐌** from **Prohibited Library** discord (used as fallback when weight for card is not found, e.g newer cards):  
https://docs.google.com/spreadsheets/d/104ESCXdjVGBSF1BNbClfoilVEYC7pIHZxOSsb5W-_r4

**Estimated Divination Card weights spreadsheet for 3.20** from **Prohibited Library** discord (used for getting card weights):
https://docs.google.com/spreadsheets/d/1m2oZfqkVK69p6vO2mPDavGJvF5DT_FknDe1y2uG9bpc

**Map ratings spreadsheet** by **FixFaxer** (used for **Layout**, **Boss** and as fallback when mob count is not found):
https://docs.google.com/spreadsheets/d/1fIs8sdvgZG7iVouPdtFkbRx5kv55_xVja8l19yubyRU

**Mob count spreadsheet** by **not_Shorex** (used for **Density**, contains exact mob counts per maps, averaged):
https://docs.google.com/spreadsheets/d/10ssi9lOJvDOo3G8Iq5xRyDv6-nbCJSxJhB5ANtaUn6w

**Map reference spreadsheet** by **Anjerosan** (used for boss notes and various metadata about layout, like outdoors/linear etc):
https://docs.google.com/spreadsheets/d/10rPJ5oMb5DoQ55iqWkiVonq5KofUWl8DJgPfQJIlrb0

**Card prices** from **PoeNinja** (used for listing all cards and assigning them prices + getting card data like stack size and rewards):  
https://poe.ninja/challenge/divination-cards  
https://poe.ninja/api/data/itemoverview?league=Crucible&type=DivinationCard (api call)

**Map metadata** from **PoeDB** (used for map tiers, map listings, boss names, card drops):  
https://poedb.tw/us/Maps#MapsList  
https://poedb.tw/us/Colonnade_Map (example of single map)

**Map card drops** from **PoeWiki** (used to verify poedb card drops):  
https://www.poewiki.net/wiki/Colonnade_Map  

## So what it actually does?

The site is split to 2 parts, data generator and then the actual site.

### Data generator

First, it grabs all card price data from Poe ninja. This builds the initial card list.

Then it grabs data from stacked deck spreadsheet, calculates card chance for every card listed in that spreadsheet compared to total stacked decks opened, then matches this chance with cards from ninja and assign this as new metadata for cards. This spreadsheet does not have every card tracked just the more important ones, but for purposes of the site its enough.

This card list with "drop chance" metadata is stored to be used in site in .json

Then it grabs map ratings from spreadsheet (layout, density, boss).

Then it grabs map density from spreadsheet (in raw mob count).

Then it grabs list of maps from PoeDB. Then iterates every map, for every map it grabs metadata for the map from PoeDD, cards found in the map from Poe wiki and matches map ratings and map density with map name.

This map list with PoeDB, PoeWiki and spreadsheet metadata is also stored to be used in site in .json.

### Site

Site simply displays all the maps with metadata, builds some tags from misc info from maps and then matches the card metadata from cards .json with card names found in map in map .json.

Then it builds filter and score on top.

There are 4 factors for score:

Layout, Density, Boss, Cards

Layout, Density and Boss is simple, each is number from 0 to 10.

Cards is a bit more complicated.

I multiply price of every card by its drop chance, then add all the card "values" together to build card score for map. The card display for every map is also sorted by card score. Actually its not that complicated nvm.

And on top of this you can assign "weight" to every part of the score, so Layout weight simply multiplies the Layout value by x etc etc.

In the end every part of the score is added together and then recalculated to be in between 0 and 100 (for nicer display,do not rly changes anything). And then maps are sorted by that.
