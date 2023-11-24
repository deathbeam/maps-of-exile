# Maps of Exile

Shows and filters map/card/map metadata from various sources.

## Adding or updating map metadata

### For non-developers

Simplest way to add new map even if you are not knowledgeable about inner workings of the project or do not know how to code is to
[open an issue](https://github.com/deathbeam/maps-of-exile/issues/new?labels=map-data&template=map_data.yml&title=Enter+map+name+here) and someone will implement it.  

### For developers

#### Running data updater

You need to have `GOOGLE_API_KEY` to grab data sheets via google api (see [Setting up API keys](https://support.google.com/googleapi/answer/6158862?hl=en)). This is free and you can generate one for yourself.

Install dependencies:
```bash
pip install --user -r data/requirements.txt
```

Update data:
```bash
python data/main.py globals,monsters,cards,maps
```

#### Running the site

Install dependencies:
```bash
(cd site && npm install)
```

Run the site:
```bash
(cd site && npm run start)
```

#### Understanding the data

[/data/cards.json](/data/cards.json) contains extra card metadata  
[/data/maps.json](/data/maps.json) contains extra map metadata  

Full format for map metadata is:

```json
{
  "name": "Map name",
  "tags": {
    "league_mechanics": false,
    "delirium_mirror": false,
    "outdoors": false,
    "linear": false,
    "few_obstacles": false,
    "boss_not_spawned": false,
    "boss_rushable": false,
    "boss_phases": false,
    "boss_soft_phases": false,
    "boss_separated": false
  },
  "rating": {
    "layout": 10,
    "density": 10,
    "boss": 10
  },
  "info": {
    "field_name": "additional info about field. can be 'boss' for boss notes, 'density' for density notes, 'not_spawned' for tag notes etc etc",
    "boss": "boss notes example"
  }
}
```

See issue mentioned in [For-non-developers](#for-non-developers) section for reference for fields.

## Sources of data

### Spreadsheets

**Stacked Decks card + weight spreadsheet for 3.22** by **nerdyjoe** from **Prohibited Library** discord:
https://docs.google.com/spreadsheets/d/1PmGES_e1on6K7O5ghHuoorEjruAVb7dQ5m7PGrW7t80

**Stacked Decks card spreadsheet for 3.21** by **_🐌** from **Prohibited Library** discord (used as fallback when weight for card is not found):  
https://docs.google.com/spreadsheets/d/104ESCXdjVGBSF1BNbClfoilVEYC7pIHZxOSsb5W-_r4

**Mob count spreadsheet** by **not_Shorex** (used for **Density**, contains exact mob counts per maps, averaged):  
https://docs.google.com/spreadsheets/d/10ssi9lOJvDOo3G8Iq5xRyDv6-nbCJSxJhB5ANtaUn6w  

**Map ratings spreadsheet** by **FixFaxer** (used for **Layout**, **Boss** and as fallback when mob count is not found):  
https://docs.google.com/spreadsheets/d/1fIs8sdvgZG7iVouPdtFkbRx5kv55_xVja8l19yubyRU  

**Map reference spreadsheet** by **Anjerosan** (used for boss notes and various metadata about layout, like outdoors/linear etc):  
https://docs.google.com/spreadsheets/d/10rPJ5oMb5DoQ55iqWkiVonq5KofUWl8DJgPfQJIlrb0  

### Websites/APIs

**Area data** from **PoeWiki** (used for listing all maps and areas and grabbing area levels and area bosses):  
https://www.poewiki.net/wiki/Area:MapAtziri2 (example of **Alluring Abyss**)

**Card data** from **PoeWiki** (used for listing all cards and getting card metadata like drop sources and drop restrictions):  
https://www.poewiki.net/wiki/House_of_Mirrors (example of **House of Mirrors**)

**Monster data** from **PoeWiki** (used for getting monster names for monster IDs):  
https://www.poewiki.net/wiki/Monster:Metadata/Monsters/Atziri/Atziri2 (example of **Atziri**)

**Layout images** from **PoeWiki** (a lot of them filled by me and other contributors here):
https://www.poewiki.net/wiki/File:Cemetery_Map_area_screenshot.jpg

**Card prices** from **PoeNinja** (used for assigning card prices + getting card data like art, stack size and rewards):  
https://poe.ninja/challenge/divination-cards  
https://poe.ninja/api/data/itemoverview?league=Crucible&type=DivinationCard (api call)

**Map metadata** from **PoeDB** (used for retrieving area art, area tags and atlas data like atlas position, connected maps, atlas map area levels):  
https://poedb.tw/us/Maps#MapsList  
https://poedb.tw/us/Colonnade_Map (example of single map)

**Images** from **Poe CDN** (used for map images, card art):  
https://web.poecdn.com/image/Art/2DItems/Maps/UniqueMap2.png (example)  


## So what it actually does?

The site is split to 2 parts, data generator and then the actual site.

### Data generator ([/data](/data))

First, it grabs all cards from Poe Wiki (contains drop area ids, drop monster ids, drop level requirements). This builds the initial card list.

Then, it grabs all card price data from Poe ninja and merges this data with card list.

Then it grabs card weight data from card weight spreadsheet and merges this data with card list.  

Then it grabs data from stacked deck spreadsheet to get weights for newer cards missing from card weight spreadsheet and calculates weight for new cards based on common denominator (in this case Patient card which is present in both card weight spreadsheet and stacked deck spreadsheet)  

This card list with card prices, card metadata and card weights is stored to be used in site as .json.  

Then in grabs list of all areas from Poe Wiki (this contains area ids, area monsters, area levels).

Then it grabs extra map metadata from PoeDB (atlas position, map connections, pantheon, up-to-date area levels) and merges this data with map list.

Then it grabs map density from spreadsheet (in raw mob count) and merges the data with map list  

Then it grabs map ratings from spreadsheet (layout, density, boss) and merges the data with map list (it will avoid setting density on maps that already have density set, e.g density coming from exact mob count)  

Then it grabs map metadata from spreadsheet (boss info, some misc tags like outdoors, linear etc) and merges the data with map list  

This map list with PoeDB, PoeWiki and spreadsheet metadata is also stored to be used in site in .json.  

### Site ([/site](/site))

Site simply displays all the maps with metadata, builds some tags from misc info from maps and then matches the card metadata from cards .json with card names found in map in map .json.  

Then it builds filter and score on top.  

There are 4 factors for score:  

Layout, Density, Boss, Cards  

Layout, Density and Boss is simple, each is number from 0 to 10.  

Cards is a bit more complicated.  

I multiply price of every card by its drop chance (calculated by comparing card weight with total drop pool weight and map weight), then add all the card "values" together to build card score for map. The card display for every map is also sorted by card score.   

And on top of this you can assign "weight" to every part of the score, so Layout weight simply multiplies the Layout value by x etc etc.  

In the end every part of the score is added together and then recalculated to be in between 0 and 100 (for nicer display,do not rly changes anything). And then maps are sorted by that.  
