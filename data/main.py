import json
import math
import os
import re
import sys
from decimal import Decimal
from math import ceil

import requests
import yaml
from bs4 import BeautifulSoup

dir_path = os.path.dirname(os.path.realpath(__file__))


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return str(o)
        return super(DecimalEncoder, self).default(o)


def find_shortest_substring(entry, entries):
    substring_set = set()

    for i in range(len(entry)):
        for j in range(i + 1, len(entry) + 1):
            substring = entry[i:j]
            substring_set.add(substring)

    shortest_substring = ""
    for substring in sorted(list(substring_set)):
        if (
            shortest_substring == "" or len(substring) < len(shortest_substring)
        ) and sum(1 for e in entries if substring in e) == 1:
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
            destination[key] = destination.get(key, []) + value
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

    out["droppool_weight"] = total_droppool
    return out


def get_card_data(key, config, card_extra):
    league = config["league"]

    print(f"Getting card data from wiki")
    wiki_cards = requests.get(
        config["wiki"]["api"],
        params={
            "action": "cargoquery",
            "format": "json",
            "smaxage": 0,
            "maxage": 0,
            "limit": "500",
            "tables": "items",
            "fields": "items.name,items.drop_level,items.drop_level_maximum,items.drop_areas,items.drop_monsters",
            "where": f'items.class_id="DivinationCard" AND items.drop_enabled="1"',
        },
    ).json()["cargoquery"]
    wiki_cards = list(
        map(
            lambda x: {
                "name": x["title"]["name"],
                "drop": {
                    "areas": list(
                        filter(None, x["title"].get("drop areas", "").split(","))
                    ),
                    "monsters": list(
                        filter(None, x["title"].get("drop monsters", "").split(","))
                    ),
                    "min_level": int(x["title"].get("drop level", "0")),
                    "max_level": int(x["title"].get("drop level maximum"))
                    if "drop level maximum" in x["title"]
                    else None,
                },
            },
            wiki_cards,
        )
    )

    id = config["decks"]["sheet-id"]
    name = config["decks"]["sheet-name"]
    threshold = config["decks"]["overwrite-threshold"]
    print(f"Getting card amounts from {name}")
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{name}?key={key}"
    amounts = requests.get(url).json()["values"]
    amounts_total = int(amounts.pop(0)[0])
    amounts = list(
        map(
            lambda x: {"name": x[0].strip(), "value": int(x[3])},
            filter(lambda x: len(x) > 0, amounts),
        )
    )

    id = config["weights"]["sheet-id"]
    name = config["weights"]["sheet-name"]
    print(f"Getting card weights from {name}")
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{name}?key={key}"
    weights = requests.get(url).json()["values"]
    weights.pop(0)
    weights.pop(0)
    weights = list(map(lambda x: {"name": x[1].strip(), "value": int(x[2])}, weights))

    patient_amount = next(x["value"] for x in amounts if x["name"] == "The Patient")
    patient_weight = next(x["value"] for x in weights if x["name"] == "The Patient")
    sample_weight = Decimal(patient_weight) / (
        Decimal(patient_amount) / Decimal(amounts_total)
    )

    print(f"Getting card prices for {league} and Standard")
    prices = requests.get(config["prices"] + league).json()["lines"]
    standardPrices = requests.get(config["prices"] + "Standard").json()["lines"]

    out = []
    for price_card in standardPrices:
        reward = ""
        if price_card.get("explicitModifiers", []):
            reward = (
                re.sub("<[^>]+>", "", price_card["explicitModifiers"][0]["text"])
                .replace("{", "")
                .replace("}", "")
                .replace("\n", ", ")
            )

        card = {
            "name": price_card["name"],
            "price": next(
                map(
                    lambda x: x["chaosValue"],
                    filter(lambda x: x["name"] == price_card["name"], prices),
                ),
                0,
            )
            or 0,
            "standardPrice": price_card["chaosValue"],
            "stack": price_card.get("stackSize", 1),
            "art": price_card["artFilename"],
            "reward": reward,
            "ninja": config["ninja"] + price_card["detailsId"],
        }

        amount_card = next(
            (x["value"] for x in amounts if x["name"] == price_card["name"]), None
        )
        weight_card = next(
            (x["value"] for x in weights if x["name"] == price_card["name"]), None
        )

        if amount_card:
            weight_mult = Decimal(amount_card) / Decimal(amounts_total)
            new_weight = math.floor(
                (sample_weight * weight_mult) / Decimal(math.exp(2 / 3))
            )

            percent_change = abs(
                (new_weight - weight_card) / weight_card * 100
                if weight_card
                else threshold
            )

            if percent_change >= threshold:
                old_weight = weight_card or 0
                weight_card = new_weight
                print(
                    f"Making assumption for weight for {price_card['name']} with amount {amount_card} based on sample amount {patient_amount} and weight {patient_weight}, setting it to {weight_card} from {old_weight}"
                )

        if weight_card:
            card["weight"] = weight_card
        else:
            print(f"Weight for card {card['name']} not found")

        wiki = next(filter(lambda x: x["name"] == card["name"], wiki_cards), None)
        if wiki:
            merge(wiki, card)

        extra = next(filter(lambda x: x["name"] == card["name"], card_extra), None)
        if extra:
            merge(extra, card)

        out.append(card)

    return sorted(out, key=lambda d: d["name"])


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
                        "boss": {"separated": x[11].strip() == "o"},
                        "info": {
                            "boss": x[8].strip(),
                        },
                        "layout": {
                            "few_obstacles": x[10].strip() == "o",
                            "outdoors": x[12].strip() == "o",
                            "linear": x[13].strip() == "o",
                        },
                    },
                    r,
                )
            )
        else:
            out = out + list(
                map(
                    lambda x: {
                        "name": x[1].strip().replace(" Map", "").replace("’", "'")
                        + " Map",
                        "boss": {"separated": x[12].strip() == "o"},
                        "info": {
                            "boss": x[8].strip(),
                        },
                        "layout": {
                            "few_obstacles": x[11].strip() == "o",
                            "outdoors": x[13].strip() == "o",
                            "linear": x[14].strip() == "o",
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
                "layout": rescale(int(x[2]), 0, 5, 10),
                "density": rescale(int(x[3]), 0, 5, 10),
                "boss": rescale(int(x[5]), 0, 5, 10),
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
    print(f"Getting map metadata from wiki")
    wiki_maps = requests.get(
        config["wiki"]["api"],
        params={
            "action": "cargoquery",
            "format": "json",
            "smaxage": 0,
            "maxage": 0,
            "limit": "500",
            "tables": "maps,items,areas",
            "join_on": "items._pageID=maps._pageID,maps.area_id=areas.id",
            "fields": "items.name,maps.area_id,maps.area_level,areas.boss_monster_ids,maps.unique_area_id",
            "group_by": "items.name",
            "where": "items.class_id='Map' AND maps.area_id LIKE '%MapWorlds%'",
        },
    ).json()["cargoquery"]
    return list(map(lambda x: x["title"], wiki_maps))


def get_maps(key, config):
    meta = get_map_meta(key, config)
    map_ratings = get_map_ratings(key, config)
    map_wiki = get_map_wiki(config)

    out = []
    url = config["poedb"]["list"]
    print(f"Getting maps from url {url}")
    r = requests.get(url)
    soup = BeautifulSoup(r.content, "html.parser")
    mapslist = soup.find(id="MapsList").find("table").find("tbody").find_all("tr")

    for row in mapslist:
        cols = row.find_all("td")
        name = cols[3].text

        if not name:
            continue

        map_url = cols[3].find("a").attrs["href"]
        map_url = config["poedb"]["base"] + map_url
        out_map = {"name": name.strip(), "poedb": map_url}

        out.append(out_map)

    base_names = sorted(
        list(map(lambda x: x["name"], out)) + ["Harbinger Map", "Engraved Ultimatum"]
    )
    mapslist = soup.find(id="MapsUnique").find("table").find("tbody").find_all("tr")

    for row in mapslist:
        cols = row.find_all("td")
        href = cols[1].find("a")
        name = href.text
        map_url = href.attrs["href"]
        map_url = config["poedb"]["base"] + map_url

        for n in base_names:
            if not n.endswith(" Map") and not n.endswith("Ultimatum"):
                continue
            name = name.replace(n, "")

        out.append({"name": name.strip(), "poedb": map_url})

    out = list(filter(lambda x: x["name"] not in config["ignored"], out))
    out = deduplicate(sorted(out, key=lambda d: d["name"]), "name")
    out_names = list(map(lambda x: x["name"], out))

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
        name = m["name"].replace(" Synthesised Map", "")
        m["name"] = name
        unique = not name.endswith(" Map")
        m["shorthand"] = find_shortest_substring(name.replace(" Map", ""), out_names)
        m["boss"] = {}
        m["layout"] = {}
        m["rating"] = {}
        m["info"] = {}
        m["unique"] = unique

        existing_meta = next(filter(lambda x: x["name"] == name, meta), None)
        if existing_meta:
            merge(existing_meta, m)
        existing_rating = next(
            filter(lambda x: x["name"] == name.replace(" Map", ""), map_ratings), None
        )
        if existing_rating:
            existing_rating = existing_rating.copy()
            if existing_rating["density_unreliable"]:
                m["info"][
                    "density"
                ] = "Missing exact mob count, density rating might be unreliable"
            existing_rating.pop("name")
            existing_rating.pop("density_unreliable")
            m["rating"] = existing_rating
        existing_wiki = next(filter(lambda x: x["name"] == name, map_wiki), None)
        if existing_wiki:
            if unique and "unique area id" in existing_wiki:
                m["id"] = existing_wiki["unique area id"]
            else:
                m["id"] = existing_wiki["area id"]
            if "boss monster ids" in existing_wiki:
                m["boss"]["ids"] = sorted(
                    list(
                        set(filter(None, existing_wiki["boss monster ids"].split(",")))
                    )
                )
        existing_position = next(
            filter(lambda x: x["name"] == name.replace(" Map", ""), map_positions), None
        )
        if existing_position:
            m["x"] = existing_position["x"]
            m["y"] = existing_position["y"]

    return out


def get_map_data(map_data, extra_map_data):
    url = map_data["poedb"]
    map_data.pop("poedb")

    # PoeDB map metadata
    print(f"Getting map data for {map_data['name']} from url {url}")
    s = requests.Session()
    r = s.get(url)
    soup = BeautifulSoup(r.content, "html.parser")
    maptabs = soup.find("div", class_="tab-content").findChildren(
        "div", recursive=False
    )

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
            if name == "monster level" and "level" not in map_data:
                if map_data.get("tiers"):
                    continue
                map_data["level"] = int(value.text.strip())
            elif name == "boss":
                map_data["boss"]["names"] = sorted(
                    list(set(map(lambda x: x.text.strip(), value.find_all("a"))))
                )
            elif name == "atlas linked":
                map_data["connected"] = sorted(
                    list(set(map(lambda x: x.text.strip(), value.find_all("a"))))
                )
            elif name == "the pantheon":
                map_data["pantheon"] = next(
                    map(lambda x: x.text.strip(), value.find_all("a"))
                )
            elif name == "tags":
                if "cannot_be_twinned" in value.text.strip():
                    map_data["boss"]["not_twinnable"] = True
                if "no_boss" in value.text.strip():
                    map_data["boss"].pop("ids", None)
            elif name == "icon" and "icon" not in map_data:
                map_data["icon"] = value.text.strip()

    # Merge existing data
    existing = next(
        filter(lambda x: x["name"] == map_data["name"], extra_map_data), None
    )
    if existing:
        merge(existing, map_data)
    return map_data


def get_maps_template(maps, existing_maps):
    out = existing_maps.copy()

    for map in maps:
        new_map = {
            "name": map["name"],
            "image": False,
            "layout": {
                "league_mechanics": None,
                "delirium_mirror": None,
                "outdoors": None,
                "linear": None,
                "few_obstacles": None,
            },
            "boss": {
                "not_spawned": None,
                "rushable": None,
                "phases": None,
                "soft_phases": None,
                "separated": None,
            },
        }

        existing_map = next(filter(lambda x: x["name"] == map["name"], out), None)
        if existing_map:
            merge(existing_map, new_map)
            out.remove(existing_map)
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
            map(lambda x: x["name"].replace(" Map", ""), maps),
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
    body.append(
        number_input(
            "Boss rating", "Map boss rating. If you dont know simply leave at None.", 10
        )
    )

    body.append(
        checkbox_input(
            "Layout",
            "Map layout metadata. If you dont know simply leave the box unchecked.",
            [
                "**League mechanics** - If map is good for league mechanics that require some space (Breach, Legion)",
                "**Delirium mirror** - If you can hold delirium mirror through whole map or delirium mirror gets good value in it",
                "**Outdoors** - If map is outdoors or indoors (Dunes vs Cells for example)",
                "**Linear** - If map is linear instead of having multiple paths to take. Map counts as linear even if the line goes in circle",
                "**Few obstacles** - If map does not have a lot of obstacles (so for example is good for shield charging around)",
            ],
        )
    )

    body.append(
        checkbox_input(
            "Boss",
            "Map boss metadata. If you dont know simply leave the box unchecked.",
            [
                "**Not spawned** - If boss is not spawned on entering the map (important for Altar farming, can be verified by checking for boss altars spawning or not)",
                "**Rushable** - If boss is close to map start or can be rushed quickly and reliably, a lot quicker than completing whole map",
                "**Phases** - If boss has hard phases that force you to wait (delay on initial boss spawn counts too)",
                "**Soft phases** - If boss has soft phases that can be bypassed with DPS (teleports at certain threshold, heals, partial damage reduction)",
                "**Separated** - If boss room is separated from rest of the map",
            ],
        )
    )

    return template


def main():
    with open(dir_path + "/config.yaml", "r") as f:
        config = yaml.safe_load(f)

    args = sys.argv
    fetch_globals = False
    fetch_cards = False
    fetch_maps = False

    if len(args) > 1:
        if "globals" in args[1]:
            fetch_globals = True

        if "cards" in args[1]:
            fetch_cards = True

        if "maps" in args[1]:
            fetch_maps = True

    config = config["data"]
    api_key = os.environ["GOOGLE_API_KEY"]

    if fetch_cards:
        # Get extra card data
        with open(dir_path + "/cards.json", "r") as f:
            card_extra = json.load(f)

        cards = get_card_data(api_key, config, card_extra)
        with open(dir_path + "/../site/src/data/cards.json", "w") as f:
            f.write(
                json.dumps(clean(cards), indent=4, cls=DecimalEncoder, sort_keys=True)
            )

    if fetch_globals:
        globals = get_globals_data(config)
        with open(dir_path + "/../site/src/data/globals.json", "w") as f:
            f.write(json.dumps(globals, indent=4, cls=DecimalEncoder, sort_keys=True))

    if fetch_maps:
        # Get basic map data
        maps = get_maps(api_key, config)

        # Get extra map data
        with open(dir_path + "/maps.json", "r") as f:
            map_extra = get_maps_template(maps, json.load(f))
        with open(dir_path + "/maps.json", "w") as f:
            f.write(json.dumps(map_extra, indent=4, cls=DecimalEncoder, sort_keys=True))

        # Create github template
        issue_template = get_issue_template(maps)
        with open(dir_path + "/../.github/ISSUE_TEMPLATE/map_data.yml", "w") as f:
            f.write(
                yaml.dump(issue_template, default_flow_style=False, sort_keys=False)
            )

        # Write detailed map data
        maps = list(map(lambda x: get_map_data(x, map_extra), maps))
        with open(dir_path + "/../site/src/data/maps.json", "w") as f:
            f.write(
                json.dumps(clean(maps), indent=4, cls=DecimalEncoder, sort_keys=True)
            )


if __name__ == "__main__":
    main()
