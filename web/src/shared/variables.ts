// shared variables

export const capitalLetterRegex = /[A-Z]/;
export const lowercaseLetterRegex = /[a-z]/;
export const numberRegex = /[0-9]/;
export const specialCharacterRegex = /[!@#$%^&*(),.?":{}|<>]/;
export const passwordMinLen = 6;
export const minJWTLen = 30;
export const uninitializedKey = -1;
export const avatarWidth = 50;

export enum UserType {
  user = 'user',
  visitor = 'visitor',
  thirdParty = 'thirdParty',
  admin = 'admin',
}
