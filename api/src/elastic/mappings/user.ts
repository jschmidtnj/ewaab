const userMappings = {
  name: {
    type: 'text'
  },
  email: {
    type: 'text'
  },
  username: {
    type: 'text'
  },
  type: {
    type: 'keyword'
  },
  major: {
    type: 'keyword'
  },
  location: {
    type: 'geo_point'
  },
  locationName: {
    type: 'text'
  }
};

export default userMappings;
