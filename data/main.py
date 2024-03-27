import json
import math
import mimetypes
import os
import re
import sys
import time
import html
import urllib
from decimal import Decimal
from math import ceil
from wikitextparser import remove_markup

import requests
import yaml
from bs4 import BeautifulSoup

dir_path = os.path.dirname(os.path.realpath(__file__))


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return str(o)
        return super(DecimalEncoder, self).default(o)


def get_image_path(directory, name, ext):
    name = re.sub(r"[^a-zA-Z0-9 ]", "", name).replace(" Map", "").lower().replace(" ", "_")
    return f"/img/{directory}/{name}{ext}"


def save_image(directory, name, res):
    content_type = res.headers["content-type"]
    ext = mimetypes.guess_extension(content_type)
    path = get_image_path(directory, name, ext)
    with open(f"{dir_path}/../site/public{path}", "wb") as f:
        f.write(res.content)
    return path


def find_shortest_substring(entry, entries):
    substring_set = set()

    for i in range(len(entry)):
        for j in range(i + 1, len(entry) + 1):
            substring = entry[i:j]
            substring_set.add(substring)

    shortest_substring = ""
    for substring in sorted(list(substring_set)):
        if (shortest_substring == "" or len(substring) < len(shortest_substring)) and sum(
            1 for e in entries if substring in e
        ) == 1:
            shortest_substring = substring

    if not shortest_substring:
        return entry

    return shortest_substring


def rescale(value, min_value, max_value, scale):
    return min(ceil(scale * (value - min_value) / (max_value - min_value)), scale)


def deduplicate(lst, prop):
    seen_props = set()
    new_list = []
    for obj in lst:
        if obj[prop] not in seen_props:
            new_list.append(obj)
            seen_props.add(obj[prop])
    return new_list


def clean(d):
    if isinstance(d, dict):
        return {k: clean(v) for k, v in d.items() if v is not None}
    elif isinstance(d, list):
        return [clean(v) for v in d]
    else:
        return d


def merge(source, destination):
    for key, value in source.items():
        if value is None:
            continue

        if isinstance(value, dict):
            node = destination.setdefault(key, {})
            merge(value, node)
        elif isinstance(value, list):
            destination[key] = list(dict.fromkeys(destination.get(key, []) + value))
        else:
            destination[key] = value

    return destination


def get_globals_data(config):
    out = {}

    url = config["poedb"]["list"]
    print(f"Getting atlas data from url {url}")
    r = requests.get(url)
    soup = BeautifulSoup(r.content, "html.parser")
    atlasimage = soup.find(id="AtlasNodeSVG").find("image")

    out["atlas"] = {
        "width": float(atlasimage.attrs["width"]),
        "height": float(atlasimage.attrs["height"]),
    }

    url = config["poedb"]["constants"]
    print(f"Getting game constants from url {url}")
    r = requests.get(url)
    soup = BeautifulSoup(r.content, "html.parser")
    dropoollist = soup.find(id="DropPool").find("table").find("tbody").find_all("tr")

    total_droppool = 0

    for row in dropoollist:
        cols = row.find_all("td")
        name = cols[0].text

        if name == "HeistEquipment":
            continue

        total_droppool += int(cols[1].text)

    out["league"] = config["league"]
    out["lastUpdate"] = time.time() * 1000
    out["droppool_weight"] = total_droppool
    return out


def get_card_data(key, config, card_extra):
    def clean_card_text(text, with_commas=False):
        text = remove_markup(text)
        text = text.replace("<br>", ", " if with_commas else " ")
        text = text.replace("<br/>", ", " if with_commas else " ")
        soup = BeautifulSoup(text, "html.parser")
        for e in soup.find_all("span", {"class": "c-item-hoverbox__display"}):
            e.decompose()
        return soup.get_text().replace("16x16px|link=|alt=", "").replace("..", ".")

    league = config["league"]

    print(f"Getting card data from wiki")
    wiki_cards = requests.get(
        config["wiki"]["api"],
        params={
            "action": "cargoquery",
            "format": "json",
            "smaxage": 1,
            "maxage": 1,
            "limit": "500",
            "tables": "items,divination_cards,stackables",
            "join_on": "items._pageName=divination_cards._pageName,items._pageName=stackables._pageName",
            "fields": "items.name,items.drop_level,items.drop_level_maximum,items.drop_areas,items.drop_monsters,items.drop_text,items.description,divination_cards.card_art,stackables.stack_size",
            "where": f'items.class_id="DivinationCard" AND items.drop_enabled="1" AND items._pageName NOT LIKE "%User:%"',
        },
    ).json()["cargoquery"]
    wiki_cards = list(
        map(
            lambda x: {
                "name": x["name"],
                "stack_size": int(x.get("stack size", "1")),
                "reward": clean_card_text(x.get("description", "") or "", True),
                "art": x.get("card art", ""),
                "drop": {
                    "text": clean_card_text(x.get("drop text", "") or ""),
                    "areas": list(
                        map(
                            lambda x: x.strip(),
                            filter(
                                lambda x: x and not x.startswith("MapAtlas"),
                                (x.get("drop areas", "") or "").split(","),
                            ),
                        )
                    ),
                    "monsters": list(
                        map(
                            lambda x: x.strip(),
                            filter(None, (x.get("drop monsters", "") or "").split(",")),
                        )
                    ),
                    "min_level": int(x.get("drop level", "0") or "0"),
                    "max_level": int(x.get("drop level maximum")) if x.get("drop level maximum") else None,
                },
            },
            map(lambda x: x["title"], wiki_cards),
        )
    )
    print(f"Found {len(wiki_cards)} cards")

    card_chances = {}
    card_weights = {}

    weight_threshold = config["weights"]["overwrite-threshold"]
    for weight_sheet in config["weights"]["sheets"]:
        id = weight_sheet["sheet-id"]
        name = weight_sheet["sheet-name"]
        key_col = weight_sheet["key"]
        value_col = weight_sheet["value"]
        skip_num = weight_sheet.get("skip", 0)
        print(f"Getting card weights from {name}")
        url = f"https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{name}?key={key}"
        weights = requests.get(url).json()["values"]
        for i in range(0, skip_num):
            weights.pop(0)
        for card in weights:
            name = card[key_col].strip()
            value = int(card[value_col])
            original_value = card_weights.get(name, 0)
            percent_change = abs(
                (value - original_value) / original_value * 100 if original_value else weight_threshold
            )

            if percent_change >= weight_threshold:
                card_weights[name] = value

    for card, mapping in config.get("mappings", {}).items():
        card_weight = card_weights.get(mapping["card"], 0)
        if not card_weight:
            continue
        card_weights[card] = card_weight * mapping["mult"]
        print(
            f"Making assumption for weight for {card} based on mapping to {mapping['card']} weight with multiplier {mapping['mult']}, setting it to {card_weights[card]}"
        )

    deck_threshold = config["decks"]["overwrite-threshold"]
    for deck_sheet in config["decks"]["sheets"]:
        id = deck_sheet["sheet-id"]
        name = deck_sheet["sheet-name"]
        key_col = deck_sheet["key"]
        value_col = deck_sheet["value"]
        total_col = deck_sheet["total"]
        skip_num = deck_sheet.get("skip", 0)
        print(f"Getting card amounts from {name}")
        url = f"https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{name}?key={key}"
        amounts = requests.get(url).json()["values"]
        for i in range(0, skip_num):
            amounts.pop(0)
        amounts_total = int(amounts.pop(0)[total_col])
        for card in amounts:
            if not card:
                continue
            name = card[key_col].strip()
            value = int(card[value_col])
            original_chance = card_chances.get(name, 0)
            new_chance = Decimal(value) / Decimal(amounts_total)
            percent_change = abs(
                (new_chance - original_chance) / original_chance * 100 if original_chance else deck_threshold
            )

            if percent_change >= deck_threshold:
                card_chances[name] = new_chance

    patient_chance = card_chances["The Patient"]
    patient_weight = card_weights["The Patient"]
    sample_weight = Decimal(patient_weight) / Decimal(patient_chance)

    print(f"Getting card prices for {league} and Standard")
    prices = requests.get(config["ninja"]["cardprices"] + league).json()["lines"]
    standard_prices = requests.get(config["ninja"]["cardprices"] + "Standard").json()["lines"]

    print(f"Getting currency prices for {league} and Standard")
    currency_prices = requests.get(config["ninja"]["currencyprices"] + league).json()["lines"]
    standard_currency_prices = requests.get(config["ninja"]["currencyprices"] + "Standard").json()["lines"]

    def find_reward_price(card, prices, price):
        if price and price > config["card-price-threshold"]:
            return price
        reward = card["reward"]
        stack = card["stack_size"]
        if not reward or reward == "":
            return price
        match = re.match(r"(\d+x)?([\s\w]+)", reward)
        count = match.group(1)
        cur = match.group(2).strip()

        for p in prices:
            if p["currencyTypeName"] == cur:
                return p["chaosEquivalent"] * ((int(count.replace("x", "").strip()) if count else 1) / stack)
        return price

    out = []
    for wiki_card in wiki_cards:
        name = wiki_card["name"]
        price_card = next(filter(lambda x: x["name"] == name, prices), {})
        standard_price_card = next(filter(lambda x: x["name"] == name, standard_prices), {})

        reward_price = find_reward_price(wiki_card, currency_prices, price_card.get("chaosValue"))
        standard_reward_price = find_reward_price(
            wiki_card, standard_currency_prices, standard_price_card.get("chaosValue")
        )

        if reward_price != price_card.get("chaosValue"):
            print(
                f"Adjusting reward price for {name} to {reward_price} instead of {price_card.get('chaosValue')}. Reward: {wiki_card['reward']}, Stack: {wiki_card['stack_size']}"
            )

        card = {
            "name": name,
            "stack": wiki_card["stack_size"],
            "reward": wiki_card["reward"],
            "art": standard_price_card.get("artFilename", price_card.get("artFilename")),
            "price": reward_price,
            "standardPrice": standard_reward_price,
            "ninja": config["ninja"]["cardbase"]
            + (standard_price_card.get("detailsId", price_card.get("detailsId")) or ""),
            "drop": wiki_card["drop"],
        }

        chance_card = card_chances.get(name)
        weight_card = card_weights.get(name)

        if chance_card:
            new_weight = math.floor((sample_weight * chance_card) / Decimal(math.exp(2 / 3)))

            percent_change = abs((new_weight - weight_card) / weight_card * 100 if weight_card else deck_threshold)

            if percent_change >= deck_threshold:
                old_weight = weight_card or 0
                weight_card = new_weight
                print(
                    f"Making assumption for weight for {name} with chance {chance_card} based on sample chance {patient_chance} and weight {patient_weight}, setting it to {weight_card} from {old_weight}"
                )

        if weight_card:
            card["weight"] = weight_card
        else:
            print(f"Weight for card {name} not found")

        extra = next(filter(lambda x: x["name"] == card["name"], card_extra), None)
        if extra:
            merge(extra, card)

        out.append(card)

    return sorted(out, key=lambda d: d["name"])


def get_monsters(config):
    def get_map_wiki_inner(offset):
        return requests.get(
            config["wiki"]["api"],
            params={
                "action": "cargoquery",
                "format": "json",
                "smaxage": 0,
                "maxage": 0,
                "limit": 500,
                "offset": offset,
                "tables": "monsters",
                "fields": "monsters.name, monsters.metadata_id",
                "where": "(monsters.name NOT LIKE '%DNT%' AND monsters.name NOT LIKE '%UNUSED%') AND (monsters.is_boss=true OR monsters.mod_ids HOLDS LIKE '%Boss%' OR monsters.monster_type_id LIKE '%Boss%' OR monsters.metadata_id LIKE '%Boss%' OR monsters.metadata_id LIKE '%ChampionTreasurer%' OR monsters.metadata_id LIKE '%Exile%' OR monsters.metadata_id LIKE '%VaalArchitect%' OR monsters.metadata_id LIKE '%Breach%' OR monsters.metadata_id LIKE '%Hellscape%' OR monsters.metadata_id LIKE '%Abyss%' OR monsters.metadata_id LIKE '%TentaclePortal%' OR monsters.metadata_id LIKE '%AtlasInvader%')",
            },
        ).json()["cargoquery"]

    print(f"Getting monster metadata from wiki")
    wiki_monsters = []
    cur_offset = 0
    while True:
        res = get_map_wiki_inner(cur_offset)
        if len(res) == 0:
            break
        cur_offset += len(res)
        wiki_monsters += res
    print(f"Found {len(wiki_monsters)} monsters")
    wiki_monsters = list(map(lambda x: x["title"], wiki_monsters))
    out = {}
    for monster in wiki_monsters:
        out[monster.get("metadata id").strip()] = html.unescape(monster.get("name")).strip()
    return out


def get_map_meta(key, config):
    out = []
    for name in config["metadata"]["sheet-names"]:
        id = config["metadata"]["sheet-id"]
        print(f"Getting map metadata from {name}")
        url = f"https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{name}?key={key}"
        r = requests.get(url).json()["values"]
        r = list(filter(lambda x: x, r))
        r.pop(0)
        r.pop(0)

        if "Unique" in name:
            out = out + list(
                map(
                    lambda x: {
                        "name": x[0].strip().replace(" Map", "").replace("’", "'"),
                        "tags": {
                            "boss_separated": x[11].strip() == "o",
                            "few_obstacles": x[10].strip() == "o",
                            "outdoors": x[12].strip() == "o",
                            "linear": x[13].strip() == "o",
                        },
                        "info": {
                            "boss": x[8].strip(),
                        },
                    },
                    r,
                )
            )
        else:
            out = out + list(
                map(
                    lambda x: {
                        "name": x[1].strip().replace(" Map", "").replace("’", "'") + " Map",
                        "tags": {
                            "boss_separated": x[12].strip() == "o",
                            "few_obstacles": x[11].strip() == "o",
                            "outdoors": x[13].strip() == "o",
                            "linear": x[14].strip() == "o",
                        },
                        "info": {
                            "boss": x[8].strip(),
                        },
                    },
                    r,
                )
            )

    return out


def get_map_ratings(key, config):
    id = config["ratings"]["sheet-id"]
    name = config["ratings"]["sheet-name"]
    range = config["ratings"]["sheet-range"]
    print(f"Getting map ratings from {name}")
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{name}!{range}?key={key}"
    ratings = requests.get(url).json()["values"]
    ratings = list(
        map(
            lambda x: {
                "name": x[0].strip().replace("Bazzar", "Bazaar"),
                "layout": rescale(int(x[1]), 0, 5, 10),
                "density": rescale(int(x[2]), 0, 5, 10),
                "boss": rescale(int(x[4]), 0, 5, 10),
                "density_unreliable": True,
            },
            ratings,
        )
    )

    id = config["density"]["sheet-id"]
    name = config["density"]["sheet-name"]
    range = config["density"]["sheet-range"]
    print(f"Getting map density from {name}")
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{name}!{range}?key={key}"
    densities = requests.get(url).json()["values"]
    density_values = list(map(lambda x: int(x[1]), densities))
    density_min = min(density_values)
    density_values_new = set(density_values)
    density_values_new.remove(max(density_values_new))
    density_max = max(density_values_new)

    for density in densities:
        dens_name = (
            density[0]
            .strip()
            .lower()
            .replace("flooded mines", "flooded mine")
            .replace("overgrown ruins", "overgrown ruin")
        )
        rating = next(filter(lambda x: x["name"].lower() == dens_name, ratings), None)
        if rating:
            rating["density"] = rescale(int(density[1]), density_min, density_max, 10)
            rating["density_unreliable"] = False

    for rating in ratings:
        if rating["density_unreliable"]:
            print("Density rating is unreliable for " + rating["name"])
    return ratings


def get_map_wiki(config):
    def get_map_wiki_inner(offset):
        return requests.get(
            config["wiki"]["api"],
            params={
                "action": "cargoquery",
                "format": "json",
                "smaxage": 0,
                "maxage": 0,
                "limit": 500,
                "offset": offset,
                "tables": "areas",
                "fields": "areas.name, areas.id, areas.area_level, areas.is_map_area, areas.is_unique_map_area, areas.monster_ids, areas.boss_monster_ids, areas.connection_ids, areas.act, areas.main_page",
                "where": "areas.area_level != 0 AND areas.is_legacy_map_area=false AND areas.is_hideout_area=false AND areas.is_town_area=false AND areas.is_labyrinth_area=false AND areas.is_labyrinth_airlock_area=false AND areas.is_labyrinth_boss_area=false AND areas.is_vaal_area=false AND (areas.is_map_area OR areas.is_unique_map_area OR areas.act != 11 AND (areas.id LIKE '1_%' OR areas.id LIKE '2_%') OR areas.id LIKE '%Labyrinth%')",
            },
        ).json()["cargoquery"]

    print(f"Getting map metadata from wiki")
    wiki_maps = []
    cur_offset = 0
    while True:
        res = get_map_wiki_inner(cur_offset)
        if len(res) == 0:
            break
        cur_offset += len(res)
        wiki_maps += res
    print(f"Found {len(wiki_maps)} areas")
    return list(map(lambda x: x["title"], wiki_maps))


def get_maps(key, config):
    meta = get_map_meta(key, config)
    map_ratings = get_map_ratings(key, config)
    map_wiki = get_map_wiki(config)

    cleaned_maps = {}
    for m in map_wiki:
        name = m.get("name")
        id = m.get("id")
        level = int(m.get("area level"))
        act = int(m.get("act"))

        main_page = m.get("main page", "") or ""
        if main_page:
            name = main_page

        name = re.sub(r"\([^)]+\)", "", name)
        name = name.strip()
        is_map_area = m.get("is map area", "0") != "0"
        is_unique_map_area = m.get("is unique map area", "0") != "0"
        is_act_area = (
            not is_unique_map_area and not is_map_area and act < 11 and (id.startswith("1_") or id.startswith("2_"))
        )

        if not is_act_area and any(x in name or x in id for x in config["ignored"]):
            print(f"Found ignored area {name}, skipping")
            continue

        map_type = "special map"
        if is_unique_map_area:
            map_type = "unique map"
        elif is_map_area:
            if " Map" not in name:
                map_type = "special map"
            else:
                map_type = "map"
        elif is_act_area:
            map_type = "act area"

        out_map = {
            "ids": [id],
            "levels": [level],
            "name": name,
            "poedb": config["poedb"]["base"] + urllib.parse.quote(name.replace(" ", "_").replace("'", "").strip()),
            "type": map_type,
        }

        if is_act_area:
            out_map["connected"] = (m.get("connection ids", "") or "").split(",")

        if m.get("boss monster ids"):
            out_map["boss_ids"] = sorted(list(set(filter(None, m["boss monster ids"].split(",")))))

        existing_map = cleaned_maps.get(name)
        if existing_map:
            merge(existing_map, out_map)
        cleaned_maps[name] = out_map

    out = sorted(list(cleaned_maps.values()), key=lambda x: x["name"])
    # Filter out act areas (you can't search for them)
    out_names = list(filter(lambda x: x["type"] != "act area", out))
    out_names = list(map(lambda x: x["name"].lower(), out_names))

    # Add flavor text and map tab text to make sure map's shorthand doesn't trigger these
    out_names.append("travel to this map by using it in a personal map device. maps can only be used once")
    out_names.append("atlas bonus complete")

    url = config["poedb"]["list"]
    print(f"Getting atlas data from url {url}")
    r = requests.get(url)
    soup = BeautifulSoup(r.content, "html.parser")
    mapssvg = soup.find(id="AtlasNodeSVG")
    maplinks = mapssvg.find_all("a")

    map_positions = []
    for maplink in maplinks:
        txt = maplink.find("text")
        map_positions.append(
            {
                "name": txt.text.strip(),
                "x": int(txt.attrs["x"]),
                "y": int(txt.attrs["y"]),
            }
        )

    for m in out:
        name = m["name"]
        m["shorthand"] = find_shortest_substring(name.replace(" Map", "").lower(), out_names)
        m["tags"] = {}
        m["rating"] = {}
        m["info"] = {}

        existing_meta = next(filter(lambda x: x["name"] == name, meta), None)
        if existing_meta:
            merge(existing_meta, m)
        existing_rating = next(filter(lambda x: x["name"] == name.replace(" Map", ""), map_ratings), None)
        if existing_rating:
            existing_rating = existing_rating.copy()
            if existing_rating["density_unreliable"]:
                m["info"]["density"] = "Missing exact mob count, density rating might be unreliable"
            existing_rating.pop("name")
            existing_rating.pop("density_unreliable")
            m["rating"] = existing_rating
        existing_position = next(filter(lambda x: x["name"] == name.replace(" Map", ""), map_positions), None)
        if existing_position:
            m["atlas"] = True
            m["x"] = existing_position["x"]
            m["y"] = existing_position["y"]

        m["ids"].sort()
        m["levels"].sort()
        (m.get("boss_ids") or []).sort()

    return out


def get_map_data(map_data, extra_map_data, config):
    url = map_data.get("poedb")
    map_data.pop("poedb")

    s = requests.Session()

    # Wiki image
    print(f"Getting wiki image data for {map_data['name']}")
    image_path = config["wiki"]["filepath"] + map_data["name"].replace(" ", "_") + "_area_screenshot"
    r = s.get(image_path + ".png", allow_redirects=False)
    if r.status_code != 301:
        r = s.get(image_path + ".jpg", allow_redirects=False)
    if r.status_code == 301:
        loc = r.headers["location"]
        print(f"Found map image {loc}")
        map_data["image"] = loc

    # PoeDB map metadata
    print(f"Getting map data for {map_data['name']} from url {url}")
    r = s.get(url)
    soup = BeautifulSoup(r.content, "html.parser")
    tabs = soup.find("div", class_="tab-content")
    maptabs = tabs and tabs.findChildren("div", recursive=False)
    maptabs = maptabs or []

    level_found = False
    for data in maptabs:
        table = data.find("table")
        if not table:
            continue
        tbody = table.find("tbody")
        if not tbody:
            continue
        rows = tbody.find_all("tr")
        if not rows:
            continue

        for row in rows:
            cols = row.find_all("td")
            name = cols[0].text.strip().lower()
            value = cols[1]
            if name == "monster level" and not level_found and map_data.get("atlas"):
                level = int(value.text.strip())
                if level:
                    level_found = True
                    map_data["levels"][0] = level
            elif name == "atlas linked":
                map_data["connected"] = sorted(list(set(map(lambda x: x.text.strip(), value.find_all("a")))))
            elif name == "the pantheon":
                map_data["pantheon"] = next(map(lambda x: x.text.strip(), value.find_all("a")))
            elif name == "tags":
                if "cannot_be_twinned" in value.text.strip():
                    map_data["tags"]["boss_not_twinnable"] = True
                if "no_boss" in value.text.strip():
                    map_data.pop("boss_ids", None)
            elif name == "icon" and "icon" not in map_data:
                map_data["icon"] = value.text.strip()

    if "icon" not in map_data:
        val = soup.find(id="MapDeviceRecipes")
        if val:
            img_tags = val.find_all("img")
            if img_tags:
                icon = img_tags[0]["src"]
                r = s.get(icon)
                if r.ok:
                    print(f"Found map icon {icon}")
                    map_data["icon"] = save_image("icon", map_data["name"], r)

    if map_data.get("atlas"):
        level = map_data["levels"][0]
        map_data["levels"] = [
            level,
            min(level + 3, 83),
            min(level + 7, 83),
            min(level + 11, 83),
            min(level + 15, 83),
        ]

    # Merge existing data
    existing = next(filter(lambda x: x["name"] == map_data["name"], extra_map_data), None)
    if existing:
        merge(existing, map_data)
    return map_data


def get_maps_template(maps, existing_maps, overwrite=False):
    out = [] if overwrite else existing_maps.copy()

    for map in maps:
        new_map = {
            "name": map["name"],
            "tags": {
                "league_mechanics": None,
                "delirium_mirror": None,
                "outdoors": None,
                "linear": None,
                "few_obstacles": None,
                "boss_not_spawned": None,
                "boss_rushable": None,
                "boss_phases": None,
                "boss_soft_phases": None,
                "boss_separated": None,
            },
        }

        existing_map = next(
            filter(lambda x: x["name"] == map["name"], existing_maps if overwrite else out),
            None,
        )
        if existing_map:
            layout = existing_map.pop("layout", None)
            if layout:
                for k, v in layout.items():
                    if v is not None:
                        new_map["tags"][k] = v

            boss = existing_map.pop("boss", None)
            if boss:
                for k, v in boss.items():
                    if v is not None:
                        new_map["tags"]["boss_" + k] = v

            merge(existing_map, new_map)
            if existing_map in out:
                out.remove(existing_map)
        if "map" in map["type"]:
            out.append(new_map)

    return sorted(out, key=lambda d: d["name"])


def get_issue_template(maps):
    body = []
    template = {
        "name": "Fill some extra info about map",
        "description": "Enter missing or correct existing info about map",
        "title": "Enter map name here",
        "labels": ["map-data"],
        "body": body,
    }

    def text_input(name, description, placeholder="", required=False):
        out = {
            "type": "textarea",
            "id": name.lower().replace(" ", "_"),
            "attributes": {"label": name, "description": description},
            "validations": {"required": required},
        }

        if placeholder:
            out["attributes"]["placeholder"] = placeholder

        return out

    def number_input(name, description, max, required=False):
        return {
            "type": "dropdown",
            "id": name.lower().replace(" ", "_"),
            "attributes": {
                "label": name,
                "description": description,
                "options": list(range(1, max + 1)),
            },
            "validations": {"required": required},
        }

    def checkbox_input(name, description, values, required=False):
        return {
            "type": "checkboxes",
            "id": name.lower().replace(" ", "_"),
            "attributes": {
                "label": name,
                "description": description,
                "options": list(map(lambda x: {"label": x}, values)),
            },
            "validations": {"required": required},
        }

    def dropdown_input(name, description, values, required=False):
        return {
            "type": "dropdown",
            "id": name.lower().replace(" ", "_"),
            "attributes": {
                "label": name,
                "description": description,
                "options": list(values),
            },
            "validations": {"required": required},
        }

    body.append(
        text_input(
            "Issue description",
            "Write reasoning for this change below",
            "Reasoning for the change, e.g data are missing or I disagree with X or Y and here is why etc. You can also add extra info not contained in form here for example boss notes or notes for any other fields.",
            True,
        )
    )
    body.append(
        dropdown_input(
            "Map name",
            "Select map from dropdown or leave at **None** if title is properly filled.",
            map(
                lambda x: x["name"].replace(" Map", ""),
                filter(lambda x: "map" in x["type"], maps),
            ),
        )
    )
    body.append(
        text_input(
            "Map image",
            "Map layout image. If you dont have one simply leave empty.",
            "Upload layout image here",
        )
    )

    body.append(
        number_input(
            "Layout rating",
            "Map layout rating. If you dont know simply leave at None.",
            10,
        )
    )
    body.append(
        number_input(
            "Density rating",
            "Map density rating. If you dont know simply leave at None.",
            10,
        )
    )
    body.append(number_input("Boss rating", "Map boss rating. If you dont know simply leave at None.", 10))

    body.append(
        checkbox_input(
            "Tags",
            "Map tags metadata. If you dont know simply leave the box unchecked.",
            [
                "**League mechanics** - If map is good for league mechanics that require some space (Breach, Legion)",
                "**Delirium mirror** - If you can hold delirium mirror through whole map or delirium mirror gets good value in it",
                "**Outdoors** - If map is outdoors or indoors (Dunes vs Cells for example)",
                "**Linear** - If map is linear instead of having multiple paths to take. Map counts as linear even if the line goes in circle",
                "**Few obstacles** - If map does not have a lot of obstacles (so for example is good for shield charging around)",
                "**Boss Not spawned** - If boss is not spawned on entering the map (important for Altar farming, can be verified by checking for boss altars spawning or not)",
                "**Boss Rushable** - If boss is close to map start or can be rushed quickly and reliably, a lot quicker than completing whole map",
                "**Boss Phases** - If boss has hard phases that force you to wait (delay on initial boss spawn counts too)",
                "**Boss Soft phases** - If boss has soft phases that can be bypassed with DPS (teleports at certain threshold, heals, partial damage reduction)",
                "**Boss Separated** - If boss room is separated from rest of the map",
            ],
        )
    )

    return template


def main():
    with open(dir_path + "/config.yaml", "r") as f:
        config = yaml.safe_load(f)

    args = sys.argv
    fetch_globals = False
    fetch_monsters = False
    fetch_cards = False
    fetch_maps = False
    overwrite = False

    if len(args) > 1:
        if "overwrite" in args[1]:
            overwrite = True

        if "globals" in args[1]:
            fetch_globals = True

        if "monsters" in args[1]:
            fetch_monsters = True

        if "cards" in args[1]:
            fetch_cards = True

        if "maps" in args[1]:
            fetch_maps = True

    config = config["data"]
    api_key = os.environ["GOOGLE_API_KEY"]

    if fetch_globals:
        globals = get_globals_data(config)
        with open(dir_path + "/../site/src/data/globals.json", "w") as f:
            f.write(json.dumps(globals, indent=4, cls=DecimalEncoder, sort_keys=True))

    if fetch_monsters:
        monsters = get_monsters(config)
        with open(dir_path + "/../site/src/data/monsters.json", "w") as f:
            f.write(json.dumps(monsters, indent=4, cls=DecimalEncoder, sort_keys=True))

    if fetch_cards:
        # Get extra card data
        with open(dir_path + "/cards.json", "r") as f:
            card_extra = json.load(f)

        cards = get_card_data(api_key, config, card_extra)
        with open(dir_path + "/../site/src/data/cards.json", "w") as f:
            f.write(json.dumps(clean(cards), indent=4, cls=DecimalEncoder, sort_keys=True))

    if fetch_maps:
        # Get basic map data
        maps = get_maps(api_key, config)

        # Get extra map data
        with open(dir_path + "/maps.json", "r") as f:
            map_extra = get_maps_template(maps, json.load(f), overwrite)
        with open(dir_path + "/maps.json", "w") as f:
            f.write(json.dumps(map_extra, indent=4, cls=DecimalEncoder, sort_keys=True))

        # Create GitHub template
        issue_template = get_issue_template(maps)
        with open(dir_path + "/../.github/ISSUE_TEMPLATE/map_data.yml", "w") as f:
            f.write(yaml.dump(issue_template, default_flow_style=False, sort_keys=False))

        # Write detailed map data
        maps = list(map(lambda x: get_map_data(x, map_extra, config), maps))
        with open(dir_path + "/../site/src/data/maps.json", "w") as f:
            f.write(json.dumps(clean(maps), indent=4, cls=DecimalEncoder, sort_keys=True))


if __name__ == "__main__":
    main()
