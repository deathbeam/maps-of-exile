import json
import re
from decimal import Decimal

import requests
import yaml
from bs4 import BeautifulSoup


class DecimalEncoder(json.JSONEncoder):
	def default(self, o):
		if isinstance(o, Decimal):
			return str(o)
		return super(DecimalEncoder, self).default(o)


def load_config():
	with open ("config.yaml", "r") as f:
		return yaml.safe_load(f)


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
		card = {
			"name": price_card["name"],
			"price": price_card["chaosValue"],
			"ninja": config["ninja"].replace("{league}", league.lower()).replace("{id}", price_card["detailsId"])
		}

		rate_card = next((x for x in rates if x[0] == card["name"]), None)
		if rate_card:
			card["rate"] = Decimal(100) * Decimal(rate_card[3]) / Decimal(total)
		else:
			print(f"Rate for card {card['name']} not found")
			card["rate"] = None

		out.append(card)

	return sorted(out, key=lambda d: d["name"])


def get_map_data(map_data, cards, config):
	url = map_data["poedb"]

	print(f"Getting map data for {map_data['name']} from url {url}")
	r = requests.get(url)
	soup = BeautifulSoup(r.content, "html.parser")
	tabcontent = soup.find("div", class_="tab-content")
	children = tabcontent.findChildren("div", recursive=False)

	# Boss data
	data = children[0]
	table = data.find("table")
	body = table.find("tbody")
	rows = body.find_all("tr")

	map_data["layout"] = None
	map_data["density"] = None
	map_data["boss"] = {
		"rating": None
	}

	for row in rows:
		cols = row.find_all("td")
		name = cols[0].text
		value = cols[1].text.strip()
		if name == "Clearing Ability":
			map_data["layout"] = int(value)
		elif name == "Mob Count":
			map_data["density"] = int(value)
		elif name == "Boss Difficulty":
			map_data["boss"]["rating"] = 10 - int(re.sub("-.+", "", value))
		elif name == "Boss Based On":
			map_data["boss"]["based_on"] = value
		elif name == "Boss notes":
			map_data["boss"]["notes"] = value
		elif name == "Tileset":
			map_data["tileset"] = value

	# Extra data
	data = children[1]
	table = data.find("table")
	body = table.find("tbody")
	rows = body.find_all("tr")

	for row in rows:
		cols = row.find_all("td")
		name = cols[0].text
		value = cols[1]
		if name == "Boss":
			map_data["boss"]["name"] = ", ".join(map(lambda x: x.text, value.find_all("a")))

	# Card data
	wiki_name = map_data["name"].replace(" ", "_")
	url = config["cards"].replace("{}", wiki_name)
	print(f"Getting card data for {map_data['name']} from url {url}")
	r = requests.get(url)
	r = r.json()
	r = r["parse"]["text"]["*"]
	soup = BeautifulSoup(r, "html.parser")
	all_cards = map(lambda x: x.text.strip(), soup.find_all("span", class_="divicard-header"))

	map_cards = []
	map_data["cards"] = map_cards
	map_data["wiki"] = config["wiki"].replace("{}", wiki_name)
	for child_card in all_cards:
		card = next((x for x in cards if x["name"] == child_card), None)
		if card:
			map_cards.append(card["name"])
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


def main():
	config = load_config()
	config = config["data"]

	cards = get_card_data(config["google-api-key"], config["league"], config["cards"])
	with open("../site/src/data/cards.json", "w") as f:
		f.write(json.dumps(cards, indent=4, cls=DecimalEncoder))

	maps = get_maps(config["maps"])
	maps = list(map(lambda x: get_map_data(x, cards, config["maps"]), maps))

	with open("../site/src/data/maps.json", "w") as f:
		f.write(json.dumps(maps, indent=4, cls=DecimalEncoder))


if __name__ == "__main__":
	main()