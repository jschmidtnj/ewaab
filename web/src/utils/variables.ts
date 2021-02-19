export interface SelectNumberObject {
  label: number;
  value: number;
}

export const defaultLoggedInPage = '/users';

export const defaultPerPage = 10;

const perPageValues = [5, defaultPerPage, 15];

export const perPageOptions: SelectNumberObject[] = perPageValues.map(
  (val) => ({
    label: val,
    value: val,
  })
);

export interface SelectStringObject {
  label: string;
  value: string;
}
