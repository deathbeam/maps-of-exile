# poe-tools

Shows and filters map/card/map metadata from various sources.

## Adding new map

For new map, the ideal collection of attributes are:  

```
image: <image>

layout:
  outdoors: true/false
  linear: true/false
  league mechanics: true/false
  delirium mirror: true/false

boss:
  not spawned: true/false
  rushable: true/false
  phases: true/false
  soft phases: true/false
```

**image**: is simply a screenshot, ideally of just the overlay avoiding
UI/debuff icons etc. Try to clear the whole map and if possible try to take the
screenshot in dark area so the overlay is visible. For overlay map settings,
set:  
* **Landscape transparency** to max  
* **Map transparency** to max  
* **Map zoom** to minimum  
  
**layout**:  
**outdoors**: if map is outdoors or not  
**linear**: if map is basically just a line, doesnt matter if the line goes in
circle or not  
**league mechanics**: if you feel like map is good for breach/legion  
**delirium mirror**: if you can reasonably hold delirium mirror through the map  
  
**boss**:  
**not spawned**: if boss do not spawns on load (testable with altars getting or
not getting boss option). Filling this one out is not super necessary unless the
boss is similar to Jungle Valley boss and then double check just in case  
**rushable**: if boss can be reasonably rushed way sooner than you would
normally go through the map  
**phases**: if boss has forced phases that you have to wait for (wait time at
start of fight counts too)  
**soft phases** if boss gets damage reduction or heals, but can be ignored with
enough damage  

Then simply open new issue: https://github.com/deathbeam/poe-tools/issues/new/choose with this info.

## Sources of data

**Stacked Decks card spreadsheet** by **_🐌** from **Prohibited Library** discord:  
https://docs.google.com/spreadsheets/d/104ESCXdjVGBSF1BNbClfoilVEYC7pIHZxOSsb5W-_r4

**Estimated Divination Card weights spreadsheet** from **Prohibited Library** discord:
https://docs.google.com/spreadsheets/d/1m2oZfqkVK69p6vO2mPDavGJvF5DT_FknDe1y2uG9bpc

**Map ratings spreadsheet** by **FixFaxer**:
https://docs.google.com/spreadsheets/d/1fIs8sdvgZG7iVouPdtFkbRx5kv55_xVja8l19yubyRU

**Mob count spreadsheet** by **not_Shorex**:
https://docs.google.com/spreadsheets/d/10ssi9lOJvDOo3G8Iq5xRyDv6-nbCJSxJhB5ANtaUn6w

**Card prices** from **PoeNinja**:  
https://poe.ninja/challenge/divination-cards  
https://poe.ninja/api/data/itemoverview?league=Crucible&type=DivinationCard (api call)

**Map metadata** from **PoeDB**:  
https://poedb.tw/us/Maps#MapsList  
https://poedb.tw/us/Colonnade_Map (example of single map)
https://docs.google.com/spreadsheets/d/1BQVhe_4f2ujyzhQ9uKbAkU_j1bOUKCDxpjwdVx8MfV4 (original source of some PoeDB metadata)

**Map card drops** from **PoeWiki**:  
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
