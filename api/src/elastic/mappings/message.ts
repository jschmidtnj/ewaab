import timestampMappings from './timestamp';

const messageMappings = {
  ...timestampMappings,
  content: {
    type: 'text'
  },
  publisher: {
    type: 'keyword'
  },
  receiver: {
    type: 'keyword'
  }
};

export default messageMappings;
