import json
import os
import re
import sys
from decimal import Decimal
from math import ceil

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
	total = rates.pop(0)[0]
	rates = list(filter(lambda x: len(x) > 0, rates))

	url = config["prices"].replace("{}", league)
	print(f"Getting card prices from {url}")
	r = requests.get(url)
	r = r.json()
	prices = r["lines"]

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
			"ninja": config["ninja"].replace("{}", price_card["detailsId"])
		}

		rate_card = next((x for x in rates if x[0] == card["name"]), None)
		if rate_card:
			card["rate"] = Decimal(100) * Decimal(rate_card[3]) / Decimal(total)
		else:
			print(f"Rate for card {card['name']} not found")

		out.append(card)

	return sorted(out, key=lambda d: d["name"])


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


def get_map_data(map_data, extra_map_data, cards, ratings, config):
	url = map_data["poedb"]

	print(f"Getting map data for {map_data['name']} from url {url}")
	r = requests.get(url)
	soup = BeautifulSoup(r.content, "html.parser")
	tabcontent = soup.find("div", class_="tab-content")
	children = tabcontent.findChildren("div", recursive=False)
	offset = 0

	# Boss data
	data = children[offset]
	if "MapUnique" in data.get('id') or "Unique_Unique" in data.get('id'):
		offset += 1
		data = children[offset]
	table = data.find("table")
	body = table.find("tbody")
	rows = body.find_all("tr")
	map_data["boss"] = {}
	map_data["layout"] = {}
	map_data["rating"] = next(map(lambda x: {
		"layout": x["layout"],
		"density": x["density"],
		"boss": x["boss"]
	}, filter(lambda x: x["name"] == map_data["name"].replace(" Map", ""), ratings)), {})

	for row in rows:
		cols = row.find_all("td")
		name = cols[0].text.strip().lower()
		value = cols[1].text.strip()
		if name == "few obstacles" and value == "o":
			map_data["layout"]["few_obstacles"] = True
		elif name == "outdoors" and value == "o":
			map_data["layout"]["outdoors"] = True
		elif name == "linear" and value == "o":
			map_data["layout"]["linear"] = True
		elif name == "tileset":
			map_data["layout"]["tileset"] = value
		elif name == "boss based on":
			map_data["boss"]["based_on"] = value
		elif name == "boss notes":
			map_data["boss"]["notes"] = value
		elif name == "boss not in own room" and value == "x":
			map_data["boss"]["separated"] = True

	# Extra data
	map_cards = set([])
	offset += 1
	data = children[offset]
	if "MapUnique" in data.get('id') or "Unique_Unique" in data.get('id'):
		offset += 1
		data = children[offset]
	table = data.find("table")
	body = table.find("tbody")
	rows = body.find_all("tr")

	for row in rows:
		cols = row.find_all("td")
		name = cols[0].text.strip().lower()
		value = cols[1]
		if name == "boss":
			map_data["boss"]["names"] = sorted(list(set(map(lambda x: x.text.strip(), value.find_all("a")))))
		elif name == "atlas linked":
			map_data["connected"] = sorted(list(set(map(lambda x: x.text.strip(), value.find_all("a")))))
		elif name == "card tags":
			map_cards.update(map(lambda x: x.text.strip(), value.find_all("a")))
		elif name == "the pantheon":
			map_data["pantheon"] = next(map(lambda x: x.text.strip(), value.find_all("a")))

	# Card data
	wiki_name = map_data["name"].replace(" ", "_")
	url = config["cards"].replace("{}", wiki_name)
	print(f"Getting card data for {map_data['name']} from url {url}")
	r = requests.get(url)
	r = r.json()
	r = r["parse"]["text"]["*"]
	soup = BeautifulSoup(r, "html.parser")
	all_cards = map(lambda x: x.text.strip(), soup.find_all("span", class_="divicard-header"))

	map_data["wiki"] = config["wiki"].replace("{}", wiki_name)
	for child_card in all_cards:
		card = next((x for x in cards if x["name"] == child_card), None)
		if card:
			map_cards.add(card["name"])
	map_data["cards"] = sorted(list(map_cards))

	# Extra data
	existing = next(filter(lambda x: x["name"] == map_data["name"], extra_map_data), None)
	if existing:
		merge(existing, map_data)
	return map_data


def get_maps(config):
	url = config["list"]
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
		map_url = map_url.replace("/us/", "")
		map_url = config["poedb"].replace("{}", map_url)
		tiers = list(map(lambda x: int(x.strip()), cols[4].text.split(",")))
		out.append({
			"name": name,
			"tiers": tiers,
			"poedb": map_url
		})

	return sorted(out, key=lambda d: d["name"])


def get_maps_template(maps, existing_maps):
	out = existing_maps.copy()

	for map in maps:
		new_map = {
			"name": map["name"],
			"image": False,
			"layout": {
				"good_for_open_mechanics": None,
				"good_for_deli_mirror": None
			},
			"boss": {
				"not_spawned": None,
				"close_to_start": None,
				"phases": None,
				"soft_phases": None
			}
		}

		existing_map = next(filter(lambda x: x["name"] == map["name"], out), None)
		if existing_map:
			merge(existing_map, new_map)
			out.remove(existing_map)
		out.append(new_map)

	return out


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

	cards = get_card_data(api_key, config["league"], config["cards"])
	if fetch_cards:
		with open(dir_path + "/../site/src/data/cards.json", "w") as f:
			f.write(json.dumps(cards, indent=4, cls=DecimalEncoder))

	if fetch_maps:
		maps = get_maps(config["maps"])

		print("Merging extra map data")
		with open(dir_path + "/maps.json", "r") as f:
			map_extra = get_maps_template(maps, json.load(f))

		with open(dir_path + "/maps.json", "w") as f:
			f.write(json.dumps(map_extra, indent=4, cls=DecimalEncoder))

		map_ratings = get_map_ratings(api_key, config["maps"])
		maps = list(map(lambda x: get_map_data(x, map_extra, cards, map_ratings, config["maps"]), maps))
		with open(dir_path + "/../site/src/data/maps.json", "w") as f:
			f.write(json.dumps(clean(maps), indent=4, cls=DecimalEncoder))


if __name__ == "__main__":
	main()