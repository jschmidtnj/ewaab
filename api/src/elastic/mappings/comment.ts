import timestampMappings from './timestamp';

const commentMappings = {
  ...timestampMappings,
  content: {
    type: 'text'
  },
  publisher: {
    type: 'keyword'
  },
  post: {
    type: 'keyword'
  },
  reactionCount: {
    type: 'integer'
  }
};

export default commentMappings;
