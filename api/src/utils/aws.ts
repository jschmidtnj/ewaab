import AWS, { AWSError } from 'aws-sdk';
import { configData } from './config';
import { isProduction } from './mode';
import { getLogger } from 'log4js';
import { checkText, streamToString } from './misc';
import internal from 'stream';
import { PromiseResult } from 'aws-sdk/lib/request';
import { HeadObjectOutput } from 'aws-sdk/clients/s3';

const logger = getLogger();

export let s3Client: AWS.S3;

export let fileBucket: string;
export let emailBucket: string;

export interface S3Data {
  file: internal.Readable;
  mime: string | undefined;
};

export const getS3Data = async (key: string, bucket: string, allowBinary: boolean): Promise<S3Data> => {
  let headerData: PromiseResult<HeadObjectOutput, AWSError>;
  try {
    headerData = await s3Client.headObject({
      Bucket: bucket,
      Key: key,
    }).promise();
  } catch (err) {
    throw new Error(`problem with reading key ${key} from ${bucket}: ${(err as AWSError).message}`);
  }
  if (!headerData.Metadata) {
    throw new Error(`cannot find meta data for s3 file ${key}`);
  }
  if (!allowBinary && headerData.ContentType && !checkText(headerData.ContentType)) {
    throw new Error(`file ${key} is binary, when binary files are not allowed`);
  }
  const fileStream = s3Client.getObject({
    Bucket: bucket,
    Key: key,
  }).createReadStream();
  return {
    file: fileStream,
    mime: headerData.ContentType,
  };
};

export const getMediaKey = (id: number, blur?: boolean): string => {
  const base = `media/${id}`;
  return blur ? base + '_blur' : base;
};

export const getS3FileData = async (fileKey: string, allowBinary: boolean): Promise<S3Data> => {
  return await getS3Data(fileKey, fileBucket, allowBinary);
};

export const getEmailKey = (templateName: string): string => {
  return `templates/${templateName}`;
};

export const getS3EmailData = async (emailKey: string, allowBinary: boolean): Promise<string> => {
  return await streamToString((await getS3Data(emailKey, emailBucket, allowBinary)).file);
};

export const initializeAWS = async (): Promise<void> => {
  if (configData.AWS_S3_BUCKET_FILES.length === 0) {
    throw new Error('s3 files bucket not provided');
  }
  fileBucket = configData.AWS_S3_BUCKET_FILES;
  if (configData.AWS_S3_BUCKET_EMAILS.length === 0) {
    throw new Error('s3 emails bucket not provided');
  }
  emailBucket = configData.AWS_S3_BUCKET_EMAILS;

  AWS.config = new AWS.Config();
  
  let setCredentials = false;
  if (configData.AWS_ACCESS_KEY_ID.length === 0 && !isProduction()) {
    throw new Error('no aws access key id provided');
  } else if (configData.AWS_ACCESS_KEY_ID.length > 0) {
    setCredentials = true;
  }
  if (configData.AWS_SECRET_ACCESS_KEY.length === 0 && !isProduction()) {
    throw new Error('no aws secret access key provided');
  } else if (configData.AWS_SECRET_ACCESS_KEY.length > 0) {
    setCredentials = true;
  }
  if (setCredentials) {
    AWS.config.credentials = new AWS.Credentials({
      accessKeyId: configData.AWS_ACCESS_KEY_ID,
      secretAccessKey: configData.AWS_SECRET_ACCESS_KEY
    });
  }

  if (configData.AWS_REGION.length === 0) {
    throw new Error('no aws region provided');
  }
  AWS.config.region = configData.AWS_REGION;

  s3Client = new AWS.S3();

  const locationConstraint = (await s3Client.getBucketLocation({
    Bucket: fileBucket
  }).promise()).LocationConstraint;
  const locationConstraintString = locationConstraint && locationConstraint.length > 0
    ? locationConstraint as string : 'none';
  logger.info(`s3 bucket ${fileBucket} location constraint: ${locationConstraintString}`);
};
