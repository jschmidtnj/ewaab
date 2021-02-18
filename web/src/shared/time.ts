export const getTime = (): number => {
  return Math.trunc(new Date().getTime() / 1000);
};
