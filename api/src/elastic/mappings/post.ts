import timestampMappings from './timestamp';

const postMappings = {
  ...timestampMappings,
  title: {
    type: 'keyword',
    fields: {
      text: {
        type: 'text'
      }
    }
  },
  content: {
    type: 'text'
  },
  type: {
    type: 'keyword'
  },
  publisher: {
    type: 'keyword'
  },
  link: {
    type: 'keyword'
  },
  media: {
    type: 'keyword'
  }
};

export default postMappings;
