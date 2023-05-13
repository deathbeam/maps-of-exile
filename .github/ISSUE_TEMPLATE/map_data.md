name: Fill some extra info about map
description: Enter missing or correct existing info about map
title: '[Map] '
labels:
- map-info
body:
- type: dropdown
  id: map_name
  attributes:
    label: Map name
    description: Map name
    options:
    - Acton's Nightmare
    - Alleyways Map
    - Altered Distant Memory
    - Arachnid Nest Map
    - Arachnid Tomb Map
    - Arcade Map
    - Arid Lake Map
    - Armoury Map
    - Arsenal Map
    - Atoll Map
    - Augmented Distant Memory
    - Barrows Map
    - Beach Map
    - Belfry Map
    - Bone Crypt Map
    - Caer Blaidd, Wolfpack's Den
    - Caldera Map
    - Canyon Map
    - Castle Ruins Map
    - Cells Map
    - Cemetery Map
    - Chateau Map
    - City Square Map
    - Cold River Map
    - Colonnade Map
    - Colosseum Map
    - Conservatory Map
    - Coral Ruins Map
    - Core Map
    - Cortex
    - Courtyard Map
    - Coves Map
    - Crater Map
    - Crimson Temple Map
    - Crimson Township Map
    - Crystal Ore Map
    - Cursed Crypt Map
    - Death and Taxes
    - Defiled Cathedral Map
    - Desert Spring Map
    - Dig Map
    - Doryani's Machinarium
    - Dry Sea Map
    - Dunes Map
    - Dungeon Map
    - Excavation Map
    - Factory Map
    - Fields Map
    - Flooded Mine Map
    - Forbidden Woods Map
    - Forge of the Phoenix Map
    - Foundry Map
    - Frozen Cabins Map
    - Fungal Hollow Map
    - Geode Map
    - Grotto Map
    - Hall of Grandmasters
    - Hallowed Ground
    - Infested Valley Map
    - Infused Beachhead
    - Jungle Valley Map
    - Laboratory Map
    - Lair Map
    - Lair of the Hydra Map
    - Leyline Map
    - Lighthouse Map
    - "Maelstr\xF6m of Chaos"
    - Malformation Map
    - Mao Kun
    - Marshes Map
    - Maze Map
    - Maze of the Minotaur Map
    - Mineral Pools Map
    - Moon Temple Map
    - Museum Map
    - Necropolis Map
    - Oba's Cursed Trove
    - Olmec's Sanctum
    - Orchard Map
    - Overgrown Ruin Map
    - Overgrown Shrine Map
    - Phantasmagoria Map
    - Pier Map
    - Pillars of Arun
    - Pit Map
    - Pit of the Chimera Map
    - Plateau Map
    - Plaza Map
    - Poorjoy's Asylum
    - Port Map
    - Precinct Map
    - Primordial Blocks Map
    - Primordial Pool Map
    - Promenade Map
    - Racecourse Map
    - Ramparts Map
    - Relic Chambers Map
    - Replica Cortex
    - Replica Pillars of Arun
    - Replica Poorjoy's Asylum
    - Residence Map
    - Rewritten Distant Memory
    - Scriptorium Map
    - Shipyard Map
    - Shore Map
    - Shrine Map
    - Siege Map
    - Silo Map
    - Stagnation Map
    - Strand Map
    - Sulphur Vents Map
    - Temple Map
    - Terrace Map
    - The Beachhead
    - The Coward's Trial
    - The Putrid Cloister
    - The Tower of Ordeals
    - The Twilight Temple
    - The Vinktar Square
    - Thicket Map
    - Tower Map
    - Toxic Sewer Map
    - Tropical Island Map
    - Twisted Distant Memory
    - Underground River Map
    - Underground Sea Map
    - Untainted Paradise
    - Vaal Pyramid Map
    - Vaal Temple Map
    - Vaults of Atziri
    - Volcano Map
    - Waste Pool Map
    - Wasteland Map
    - Whakawairua Tuahu
    - Wharf Map
- type: dropdown
  id: layout_rating
  attributes:
    label: Layout rating
    description: Map layout rating
    options:
    - 1
    - 2
    - 3
    - 4
    - 5
    - 6
    - 7
    - 8
    - 9
    - 10
- type: dropdown
  id: density_rating
  attributes:
    label: Density rating
    description: Map density rating
    options:
    - 1
    - 2
    - 3
    - 4
    - 5
    - 6
    - 7
    - 8
    - 9
    - 10
- type: dropdown
  id: boss_rating
  attributes:
    label: Boss rating
    description: Map boss rating
    options:
    - 1
    - 2
    - 3
    - 4
    - 5
    - 6
    - 7
    - 8
    - 9
    - 10
- type: checkboxes
  id: layout
  attributes:
    label: Layout
    description: Map layout metadata
    options:
    - label: League mechanics
    - label: Delirium mirror
    - label: Outdoors
    - label: Linear
    - label: Few obstacles
- type: checkboxes
  id: boss
  attributes:
    label: Boss
    description: Map boss metadata
    options:
    - label: Not spawned
    - label: Rushable
    - label: Phases
    - label: Soft phases
    - label: Separated
