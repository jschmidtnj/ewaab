// shared variables

export const capitalLetterRegex = /[A-Z]/;
export const lowercaseLetterRegex = /[a-z]/;
export const numberRegex = /[0-9]/;
export const specialCharacterRegex = /[!@#$%^&*(),.?":{}|<>]/;
export const strMinLen = 2;
export const passwordMinLen = 6;
export const validUsername = /^[A-z0-9-_]+$/;
export const minJWTLen = 30;
export const avatarWidth = 50;
export const locationRegex = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;

export enum UserType {
  user = 'user',
  visitor = 'visitor',
  thirdParty = 'thirdParty',
  admin = 'admin',
}

export enum PostType {
  studentNews = 'studentNews',
  mentorNews = 'mentorNews',
  encourageHer = 'encourageHer',
  studentCommunity = 'studentCommunity',
}
