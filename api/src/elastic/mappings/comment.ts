import timestampMappings from './timestamp';

const commentMappings = {
  ...timestampMappings,
  content: {
    type: 'text'
  },
  publisher: {
    type: 'keyword'
  }
};

export default commentMappings;
