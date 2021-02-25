import timestampMappings from './timestamp';

const messageMappings = {
  ...timestampMappings,
  content: {
    type: 'text'
  },
  publisher: {
    type: 'keyword'
  },
  group: {
    type: 'keyword'
  }
};

export default messageMappings;
