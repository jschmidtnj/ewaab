const userMappings = {
  name: {
    type: 'keyword',
    fields: {
      text: {
        type: 'text'
      }
    }
  },
  email: {
    type: 'keyword',
    fields: {
      text: {
        type: 'text'
      }
    }
  },
  username: {
    type: 'keyword',
    fields: {
      text: {
        type: 'text'
      }
    }
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
    type: 'keyword',
    fields: {
      text: {
        type: 'text'
      }
    }
  },
  avatar: {
    type: 'keyword'
  }
};

export default userMappings;
