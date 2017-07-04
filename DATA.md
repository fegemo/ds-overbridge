# Data

The data used to create this visualization.

## Data about the movies (characters etc.)

The data regarding the movies info was grabbed from the [Star Wars API][swapi]
project. It does not provide full files for each entity, so I made a lot of
requests to fetch all of them and then assembled the responses in the files:

- `planets.json` (61 [planets][planets])
- `people.json` (87 [people][people])
- `species.json` (37 [species][species])
- `starships.json` (37 [starships][starships])

[planets]: http://swapi.co/api/planets/
[people]: http://swapi.co/api/people/
[species]: http://swapi.co/api/species/
[starships]: http://swapi.co/api/starships/
[swapi]: http://swapi.co/

The API has even more data, about the movies (7 so far) and vehicles (39), but
they were not used here.

## Data about the galaxy (its geography)

The geographic data was acquired from the [Star Wars Galaxy Map][swgm] and
comprises 5 sets of topography in the _geojson_ format, which became layers
on the map: grid, planets, ~~hyperspace~~ (not used), region, sector.

To reduce its size, the geographic data was simplified using
[mapshaper][mapshaper] using the Visvalingam method with weighted area. That
yielded 44% size reduction with only a small perceived loss.

Regarding planets, the [Star Wars Galaxy Map][swgm] has about 2,068 planets
with their coordinates, comprising all of canon and "extended universe"
locations. However, as the movies database had information about only 61
(canon) planets, only those were considered.

[swgm]: http://www.swgalaxymap.com/
[mapshaper]: http://mapshaper.org/


## Joining the data

Only planets that exist both on the geographic database and on the movies
database were considered. To join their data, two fields called `"name"`
and `"name_web"` from the _planets layer_ from the geography database were
tentatively matched with a field called `"name"` on the `planets.json` from
the movies database.
