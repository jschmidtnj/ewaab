const isDebug = (): boolean => {
  return process.env.NEXT_PUBLIC_MODE === 'debug';
};

export default isDebug;
