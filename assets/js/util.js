var prependWith = str =>
  el => `${str}${el}`;

var appendWith = str =>
  el => `${el}${str}`

// speciesInfo  = joinWithURL(speciesInfo, { people: peopleInfo }, { films: filmsInfo });
var joinWithURL = (obj, ...prop) =>
  // for each property to join...
  prop.reduce((accum, currentProp) =>
    // return the object joined with the currentProp
    accum.map(item =>
      // an item is an element of the original obj array
      // we return the item, with the currentProp replaced by one with the
      // joined object
      Object.assign(item, {
        // the currentProp (e.g., people) will receive an array or a single
        // element, depending on what its value holds
        [Object.keys(currentProp)[0]]:
          Array.isArray(item[Object.keys(currentProp)[0]]) ?
            // if an array, filters only the values we need
            Object.values(currentProp)[0].filter(
              propValue => item[Object.keys(currentProp)[0]]
                .indexOf(propValue.url) !== -1) :
            // if a single value, finds it on the currentProp by the url field
            Object.values(currentProp)[0].find(
              propValue => item[Object.keys(currentProp)[0]] === propValue.url)
        }
      )
    )
  , obj)

var numberOr = (n, otherwise) =>
  Number.isNaN(+n) ? otherwise : +n
