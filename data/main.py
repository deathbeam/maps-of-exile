import json
import os
import re
import sys
from decimal import Decimal
from math import ceil, floor

import requests
import yaml
from bs4 import BeautifulSoup


class DecimalEncoder(json.JSONEncoder):
	def default(self, o):
		if isinstance(o, Decimal):
			return str(o)
		return super(DecimalEncoder, self).default(o)


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
		if isinstance(value, dict):
			node = destination.setdefault(key, {})
			merge(value, node)
		else:
			destination[key] = value

	return destination


def get_card_data(key, league, config):
	id = config["decks"]["sheet-id"]
	name = config["decks"]["sheet-name"]
	print(f"Getting card rates from {name}")
	url = f"https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{name}?key={key}"
	r = requests.get(url)
	r = r.json()
	rates = r["values"]
	rates.pop(0)
	rates = list(map(lambda x: {
		"name": x[0].strip(),
		"value": int(x[3])
	}, filter(lambda x: len(x) > 0, rates)))

	id = config["weights"]["sheet-id"]
	name = config["weights"]["sheet-name"]
	print(f"Getting card weights from {name}")
	url = f"https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{name}?key={key}"
	r = requests.get(url)
	r = r.json()
	weights = r["values"]
	weights.pop(0)
	weights.pop(0)
	weights = list(map(lambda x: {
		"name": x[1].strip(),
		"value": int(x[2])
	}, weights))

	patient_rate_baseline = next(x["value"] for x in rates if x["name"] == "The Patient")
	patient_weight_baseline = next(x["value"] for x in rates if x["name"] == "The Patient")

	url = config["prices"].replace("{}", league)
	print(f"Getting card prices from {url}")
	r = requests.get(url)
	r = r.json()
	prices = r["lines"]

	for price_card in prices:
		rate_card = next((x["value"] for x in rates if x["name"] == price_card["name"]), None)
		weight_card = next((x["value"] for x in weights if x["name"] == price_card["name"]), None)

		if rate_card and not weight_card:
			rate = Decimal(patient_rate_baseline) / Decimal(rate_card) * Decimal(4 / 3)
			weight_rate = floor(Decimal(patient_weight_baseline) / rate)
			print(f"Making assumption for weight for {price_card['name']} based on The Patient ratio {rate}, setting it to {weight_rate}")
			weights.append({
				"name": price_card["name"],
				"value": weight_rate
			})

	out = []
	for price_card in prices:
		reward = ""
		if price_card.get("explicitModifiers", []):
			reward = re.sub("<[^>]+>", "", price_card["explicitModifiers"][0]["text"]).replace("{", "").replace("}", "").replace("\n", ", ")

		card = {
			"name": price_card["name"],
			"price": price_card["chaosValue"],
			"stack": price_card.get("stackSize", 1),
			"reward": reward,
			"ninja": config["ninja"].replace("{}", price_card["detailsId"]),
			"boss": price_card["name"] in config["boss-only"]
		}

		weight_card = next((x["value"] for x in weights if x["name"] == price_card["name"]), None)
		if weight_card:
			card["weight"] = weight_card
		else:
			print(f"Weight for card {card['name']} not found")

		out.append(card)

	return sorted(out, key=lambda d: d["name"])


def get_map_meta(key, config):
	meta = []
	for name in config["metadata"]["sheet-names"]:
		id = config["metadata"]["sheet-id"]
		print(f"Getting map metadata from {name}")
		url = f"https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{name}?key={key}"
		r = requests.get(url)
		r = r.json()
		r = r["values"]
		r = list(filter(lambda x: x, r))
		r.pop(0)
		r.pop(0)
		if "Unique" in name:
			meta = meta + list(map(lambda x: {
				"name": x[0].strip().replace(" Map", "").replace("’", "'"),
				"boss": {
					"notes": x[8].strip(),
					"separated": x[11].strip() == "o"
				},
				"layout": {
					"few_obstacles": x[10].strip() == "o",
					"outdoors": x[12].strip() == "o",
					"linear": x[13].strip() == "o"
				}
			}, r))
		else:
			meta = meta + list(map(lambda x: {
				"name": x[1].strip().replace(" Map", "").replace("’", "'") + " Map",
				"boss": {
					"notes": x[8].strip(),
					"separated": x[12].strip() == "o"
				},
				"layout": {
					"few_obstacles": x[11].strip() == "o",
					"outdoors": x[13].strip() == "o",
					"linear": x[14].strip() == "o"
				}
			}, r))

	return meta


def get_map_ratings(key, config):
	id = config["ratings"]["sheet-id"]
	name = config["ratings"]["sheet-name"]
	range = config["ratings"]["sheet-range"]
	print(f"Getting map ratings from {name}")
	url = f"https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{name}!{range}?key={key}"
	r = requests.get(url)
	r = r.json()
	ratings = r["values"]
	ratings = list(map(lambda x: {
		"name": x[0].strip().replace("Bazzar", "Bazaar"),
		"layout": rescale(int(x[2]), 0, 5, 10),
		"density": rescale(int(x[3]), 0, 5, 10),
		"boss": rescale(int(x[5]), 0, 5, 10),
		"density_unreliable": True
	}, ratings))

	id = config["density"]["sheet-id"]
	name = config["density"]["sheet-name"]
	range = config["density"]["sheet-range"]
	print(f"Getting map density from {name}")
	url = f"https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{name}!{range}?key={key}"
	r = requests.get(url)
	r = r.json()
	densities = r["values"]
	density_values = list(map(lambda x: int(x[1]), densities))
	density_min = min(density_values)
	density_values_new = set(density_values)
	density_values_new.remove(max(density_values_new))
	density_max = max(density_values_new)

	for density in densities:
		dens_name = density[0].strip().lower().replace("flooded mines", "flooded mine").replace("overgrown ruins", "overgrown ruin")
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
	r = requests.get(config["wiki"]["api"], params={
		"action": "cargoquery",
		"format": "json",
		"limit": "500",
		"tables": "maps,items,areas",
		"join_on": "items._pageID=maps._pageID,maps.area_id=areas.id",
		"fields": "items.name,maps.area_id,maps.area_level,areas.boss_monster_ids,maps.unique_area_id",
		"group_by": "items.name",
		"where": "items.class_id='Map' AND maps.area_id LIKE '%MapWorlds%'"
	})
	wiki_maps = list(map(lambda x: x["title"], r.json()["cargoquery"]))
	boss_ids = set([])
	for wiki_map in wiki_maps:
		if 'boss monster ids' in wiki_map:
			boss_ids.update(wiki_map['boss monster ids'].split(','))

	boss_cards = {}
	for boss in boss_ids:
		print(f"Getting card data for {boss} from wiki")
		params = {
			"action": "cargoquery",
			"format": "json",
			"limit": "500",
			"tables": "items",
			"fields": "items.name",
			"where": f'items.drop_monsters HOLDS "{boss}" AND items.class_id="DivinationCard" AND items.drop_enabled="1"'
		}

		r = requests.get(config["wiki"]["api"], params=params)
		boss_cards[boss] = boss_cards.get(boss, [])
		for card in r.json()["cargoquery"]:
			boss_cards[boss].append(card["title"]["name"])

	for existing_wiki in wiki_maps:
		if "boss monster ids" in existing_wiki:
			existing_wiki["cards"] = existing_wiki.get("cards", [])
			for existing_boss in existing_wiki["boss monster ids"].split(","):
				if existing_boss in boss_cards:
					existing_wiki["cards"] = existing_wiki["cards"] + boss_cards[existing_boss]

	return wiki_maps


def get_maps(key, config):
	meta = get_map_meta(key, config)
	map_ratings = get_map_ratings(key, config)
	map_wiki = get_map_wiki(config)

	url = config["poedb"]["list"]
	print(f"Getting maps from url {url}")

	r = requests.get(url)
	soup = BeautifulSoup(r.content, "html.parser")
	mapslist = soup.find(id="MapsList")
	table = mapslist.find("table")
	body = table.find("tbody")
	rows = body.find_all("tr")
	out = []

	for row in rows:
		cols = row.find_all("td")
		name = cols[3].text

		if not name:
			continue

		map_url = cols[3].find('a').attrs['href']
		map_url = config["poedb"]["base"].replace("{}", map_url)
		out.append({
			"name": name.strip(),
			"poedb": map_url
		})

	mapslist = soup.find(id="MapsUnique")
	table = mapslist.find("table")
	body = table.find("tbody")
	rows = body.find_all("tr")
	names = sorted(list(map(lambda x: x["name"], out)) + ["Harbinger Map", "Engraved Ultimatum"])

	for row in rows:
		cols = row.find_all("td")
		href = cols[1].find('a')
		name = href.text
		map_url = href.attrs['href']
		map_url = config["poedb"]["base"].replace("{}", map_url)

		for n in names:
			if not n.endswith(" Map") and not n.endswith("Ultimatum"):
				continue
			name = name.replace(n, "")

		out.append({
			"name": name.strip(),
			"poedb": map_url
		})

	out = list(filter(lambda x: x["name"] not in config["ignored"], out))
	out = deduplicate(sorted(out, key=lambda d: d["name"]), "name")

	for m in out:
		name = m["name"]
		m["unique"] = not name.endswith(" Map")
		existing_meta = next(filter(lambda x: x["name"] == name, meta), None)
		if existing_meta:
			merge(existing_meta, m)
		existing_rating = next(filter(lambda x: x["name"] == name.replace(" Map", ""), map_ratings), None)
		if existing_rating:
			existing_rating = existing_rating.copy()
			existing_rating.pop("name")
			m["rating"] = existing_rating
		existing_wiki = next(filter(lambda x: x["name"] == name, map_wiki), None)
		if existing_wiki:
			if m["unique"] and "unique area id" in existing_wiki:
				m["id"] = existing_wiki["unique area id"]
			else:
				m["id"] = existing_wiki["area id"]
			if "cards" in existing_wiki:
				m["cards"] = existing_wiki["cards"]

	return out


def get_map_data(map_data, extra_map_data, config):
	url = map_data["poedb"]
	map_data["boss"] = map_data.get("boss", {})
	map_data["rating"] = map_data.get("rating", {})
	map_cards = set(map_data.get("cards", []))

	# PoeDB map metadata
	print(f"Getting map data for {map_data['name']} from url {url}")
	r = requests.get(url)
	soup = BeautifulSoup(r.content, "html.parser")
	tabcontent = soup.find("div", class_="tab-content")
	children = tabcontent.findChildren("div", recursive=False)

	for data in children:
		table = data.find("table")
		if not table:
			continue
		body = table.find("tbody")
		if not body:
			continue
		rows = body.find_all("tr")
		if not rows:
			continue

		for row in rows:
			cols = row.find_all("td")
			name = cols[0].text.strip().lower()
			value = cols[1]
			if name == "monster level":
				if map_data.get("tiers"):
					continue
				value = int(value.text.strip())
				map_data["level"] = value
				tier = value - 67
				map_data["tiers"] = [
					tier,
					min(tier + 3, 16),
					min(tier + 7, 16),
					min(tier + 11, 16),
					min(tier + 15, 16)
				]
			elif name == "boss":
				map_data["boss"]["names"] = sorted(list(set(map(lambda x: x.text.strip(), value.find_all("a")))))
			elif name == "atlas linked":
				map_data["connected"] = sorted(list(set(map(lambda x: x.text.strip(), value.find_all("a")))))
			elif name == "card tags":
				map_cards.update(map(lambda x: x.text.strip(), value.find_all("a")))
			elif name == "the pantheon":
				map_data["pantheon"] = next(map(lambda x: x.text.strip(), value.find_all("a")))

	# Wiki card data
	map_data["wiki"] = config["wiki"]["base"].replace("{}", map_data["name"].replace(" ", "_"))
	if map_data["id"]:
		print(f"Getting card data for {map_data['name']} from wiki")
		params = {
			"action": "cargoquery",
			"format": "json",
			"limit": "500",
			"tables": "items",
			"fields": "items.name",
			"where": f'items.drop_areas HOLDS "{map_data["id"]}" AND items.class_id="DivinationCard" AND items.drop_enabled="1"'
		}

		r = requests.get(config["wiki"]["api"], params=params)
		for card in r.json()["cargoquery"]:
			map_cards.add(card["title"]["name"])

	map_data["cards"] = sorted(list(map_cards))

	# Merge existing data
	existing = next(filter(lambda x: x["name"] == map_data["name"], extra_map_data), None)
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
				"delirium_mirror": None
			},
			"boss": {
				"not_spawned": None,
				"rushable": None,
				"phases": None,
				"soft_phases": None
			}
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
		"body": body
	}

	def text_input(name, description, placeholder="", required=False):
		out = {
			"type": "textarea",
			"id": name.lower().replace(" ", "_"),
			"attributes": {
				"label": name,
				"description": description
			},
			"validations": {
				"required": required
			}
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
				"options": list(range(1, max + 1))
			},
			"validations": {
				"required": required
			}
		}

	def checkbox_input(name, description, values, required=False):
		return {
			"type": "checkboxes",
			"id": name.lower().replace(" ", "_"),
			"attributes": {
				"label": name,
				"description": description,
				"options": list(map(lambda x: { "label": x }, values))
			},
			"validations": {
				"required": required
			}
		}

	def dropdown_input(name, description, values, required=False):
		return {
			"type": "dropdown",
			"id": name.lower().replace(" ", "_"),
			"attributes": {
				"label": name,
				"description": description,
				"options": list(values)
			},
			"validations": {
				"required": required
			}
		}

	body.append(text_input("Issue description", "Write reasoning for this change below", "Reasoning for the change, e.g data are missing or I disagree with X or Y and here is why etc. You can also add extra info not contained in form here.", True))
	body.append(dropdown_input("Map name", "Select map from dropdown or leave at None if **title** is properly filled.", map(lambda x: x["name"].replace(" Map", ""), maps)))
	body.append(text_input("Map image", "Map layout image. If you dont have one simply leave empty.", "Upload layout image here"))

	body.append(number_input("Layout rating", "Map layout rating. If you dont know simply leave at None.", 10))
	body.append(number_input("Density rating", "Map density rating. If you dont know simply leave at None.", 10))
	body.append(number_input("Boss rating", "Map boss rating. If you dont know simply leave at None.", 10))

	body.append(checkbox_input("Layout", "Map layout metadata. If you dont know simply leave the box unchecked.", [
		"**League mechanics** - If map is good for league mechanics that require some space (Breach, Legion)",
		"**Delirium mirror** - If you can hold delirium mirror through whole map or delirium mirror gets good value in it",
		"**Outdoors** - If map is outdoors or indoors (Dunes vs Cells for example)",
		"**Linear** - If map is linear instead of having multiple paths to take. Map counts as linear even if the line goes in circle",
		"**Few obstacles** - If map does not have a lot of obstacles (so for example is good for shield charging around)"
	]))

	body.append(checkbox_input("Boss", "Map boss metadata. If you dont know simply leave the box unchecked.", [
		"**Not spawned** - If boss is not spawned on entering the map (important for Altar farming, can be verified by checking for boss altars spawning or not)",
		"**Rushable** - If boss is close to map start or can be rushed quickly and reliably, a lot quicker than completing whole map",
		"**Phases** - If boss has hard phases that force you to wait (delay on initial boss spawn counts too)",
		"**Soft phases** - If boss has soft phases that can be bypassed with DPS (teleports at certain threshold, heals, partial damage reduction)",
		"**Separated** - If boss room is separated from rest of the map"
	]))

	body.append(text_input("Boss Notes", "Map boss notes. If there isn't anything to add simply leave empty."))
	return template


def main():
	dir_path = os.path.dirname(os.path.realpath(__file__))
	with open (dir_path + "/config.yaml", "r") as f:
		config = yaml.safe_load(f)

	args = sys.argv
	fetch_cards = False
	fetch_maps = False

	if len(args) > 1:
		if 'cards' in args[1]:
			fetch_cards = True

		if 'maps' in args[1]:
			fetch_maps = True

	config = config["data"]
	api_key = os.environ['GOOGLE_API_KEY']

	if fetch_cards:
		cards = get_card_data(api_key, config["league"], config["cards"])
		with open(dir_path + "/../site/src/data/cards.json", "w") as f:
			f.write(json.dumps(cards, indent=4, cls=DecimalEncoder, sort_keys=True))

	if fetch_maps:
		# Get basic map data
		maps = get_maps(api_key, config["maps"])
		with open(dir_path + "/maps.json", "r") as f:
			map_extra = get_maps_template(maps, json.load(f))
		with open(dir_path + "/maps.json", "w") as f:
			f.write(json.dumps(map_extra, indent=4, cls=DecimalEncoder, sort_keys=True))

		# Create github template
		issue_template = get_issue_template(maps)
		with open(dir_path + "/../.github/ISSUE_TEMPLATE/map_data.yml", "w") as f:
			f.write(yaml.dump(issue_template, default_flow_style=False, sort_keys=False))

		maps = list(map(lambda x: get_map_data(x, map_extra, config["maps"]), maps))
		with open(dir_path + "/../site/src/data/maps.json", "w") as f:
			f.write(json.dumps(clean(maps), indent=4, cls=DecimalEncoder, sort_keys=True))


if __name__ == "__main__":
	main()