# poe-tools

Shows and filters map/card/map metadata from various sources. None of these data are made up or manually inputted (by me).
There are still some subjective data coming from PoeDB or missing data, especially the **Boss** column showing boss
difficulty but that usually isn't the deciding factor.

## Sources of data

**Stacked Decks card spreadsheet** by **_🐌** from **Prohibited Library** discord:  
https://docs.google.com/spreadsheets/d/104ESCXdjVGBSF1BNbClfoilVEYC7pIHZxOSsb5W-_r4

**Map metadata** from **PoeDB**:  
https://poedb.tw/us/Maps#MapsList  
https://poedb.tw/us/Colonnade_Map (example of single map)

**Map ratings spreadsheet** by **FixFaxer**:
https://docs.google.com/spreadsheets/d/1fIs8sdvgZG7iVouPdtFkbRx5kv55_xVja8l19yubyRU

**Card prices** from **PoeNinja**:  
https://poe.ninja/challenge/divination-cards  
https://poe.ninja/api/data/itemoverview?league=Crucible&type=DivinationCard (api call)  

**Card drops** from **PoeWiki**:  
https://www.poewiki.net/wiki/Colonnade_Map  

## So what it actually does?

The site is split to 2 parts, data generator and then the actual site.

### Data generator

First, it grabs all card price data from Poe ninja. This builds the initial card list.

Then it grabs data from stacked deck spreadsheet, calculates card chance for every card listed in that spreadsheet compared to total stacked decks opened, then matches this chance with cards from ninja and assign this as new metadata for cards. This spreadsheet does not have every card tracked just the more important ones, but for purposes of the site its enough.

This card list with "drop chance" metadata is stored to be used in site in .json

Then it grabs map ratings from spreadsheet.

Then it grabs list of maps from PoeDB. Then iterates every map, for every map it grabs metadata for the map from PoeDD, cards found in the map from Poe wiki and matches map ratings with map name.

This map list with PoeDB, PoeWiki and spreadsheet metadata is also stored to be used in site in .json.

### Site

Site simply displays all the maps with metadata, builds some tags from misc info from maps and then matches the card metadata from cards .json with card names found in map in map .json.

Then it builds filter and score on top.

There are 4 factors for score:

Layout, Density, Boss, Cards

Layout, Density and Boss is simple, each is number from 0 to 5.

Cards is a bit more complicated.

I multiply price of every card by its drop chance, then add all the card "values" together to build card score for map. The card display for every map is also sorted by card score. Actually its not that complicated nvm.

And on top of this you can assign "weight" to every part of the score, so Layout weight simply multiplies the Layout value by x etc etc.

In the end every part of the score is added together and then recalculated to be in between 0 and 100 (for nicer display,do not rly changes anything). And then maps are sorted by that.
