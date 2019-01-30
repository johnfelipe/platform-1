import PropTypes from "prop-types";

// Selectors:
export const placesSelector = state => {
  return state.places;
};
export const dashboardPlacesSelector = state => {
  if (!state.places) {
    return state.places;
  }
  return state.places.filter(
    place => place.datasetId === state.dashboardConfig.datasetId,
  );
};

export const filteredPlacesSelector = state => {
  const filters = state.filters;
  if (!state.places || filters.length === 0) {
    return state.places;
  }
  // a formId and a location_type are currenty equivalent
  const filteredFormIds = filters.reduce((memo, filter) => {
    memo.push(filter.formId);
    return memo;
  }, []);
  return state.places.filter(
    place => filteredFormIds.includes(place.location_type) && !place.is_private,
  );
};

export const placePropType = PropTypes.shape({
  attachments: PropTypes.array.isRequired,
  updated_datetime: PropTypes.string.isRequired,
  created_datetime: PropTypes.string.isRequired,
  dataset: PropTypes.string.isRequired,
  visible: PropTypes.bool.isRequired,
  datasetSlug: PropTypes.string.isRequired,
  submitter_name: PropTypes.string,
  submission_sets: PropTypes.object.isRequired,
  id: PropTypes.number.isRequired,
  datasetId: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  title: PropTypes.string,
  location_type: PropTypes.string.isRequired,
  submitter: PropTypes.object,
  type: PropTypes.string.isRequired,
});

export const placesPropType = PropTypes.arrayOf(placePropType);

// Actions:
const LOAD_PLACES = "places/LOAD";
const UPDATE_PLACE = "places/UPDATE";
const CREATE_PLACE = "places/CREATE";

// Action creators:
export function loadPlaces(places) {
  return { type: LOAD_PLACES, payload: places };
}

export function updatePlace(place) {
  return { type: UPDATE_PLACE, payload: place };
}

export function createPlace(place) {
  return { type: CREATE_PLACE, payload: place };
}

// Reducers:
const INITIAL_STATE = null;

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case LOAD_PLACES:
      return action.payload;
    case UPDATE_PLACE:
      return action.payload.reduce((memo, newPlace) => {
        let oldPlace = memo.find(place => newPlace.id === place.id);
        return [
          ...memo,
          {
            // Override data from the old place with data from the new place:
            ...oldPlace,
            ...newPlace,
          },
        ];
      }, state);
    case CREATE_PLACE:
      return [...state, action.payload];
    default:
      return state;
  }
}
