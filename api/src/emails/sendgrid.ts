import sendgridClient from '@sendgrid/client';
import { configData } from '../utils/config';

export const sendgridAPIVersion = '/v3';

export const initializeSendgrid = async (): Promise<void> => {
  if (configData.SENDGRID_API_KEY.length === 0) {
    throw new Error('no private key supplied');
  }
  sendgridClient.setApiKey(configData.SENDGRID_API_KEY);
  await sendgridClient.request({
    url: `${sendgridAPIVersion}/ips`,
    method: 'GET',
  });
};
