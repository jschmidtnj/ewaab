import { FunctionComponent } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { getAPIURL } from 'utils/axios';
import Image from 'next/image';

interface AvatarArgs {
  avatar?: string;
  avatarWidth: number;
  className?: string;
}

const Avatar: FunctionComponent<AvatarArgs> = (args) => {
  const apiURL = getAPIURL();
  const className = args.className ? args.className + ' ' : '';
  return args.avatar ? (
    <LazyLoadImage
      className={className + 'h-10 w-10 rounded-full'}
      alt={`${apiURL}/media/${args.avatar}/blur`}
      src={`${apiURL}/media/${args.avatar}`}
      width={args.avatarWidth}
    />
  ) : (
    <Image
      className={className + 'h-5 w-5 rounded-full'}
      width={args.avatarWidth}
      height={args.avatarWidth}
      src="/assets/img/default_avatar.png"
      alt="avatar"
    />
  );
};

export default Avatar;
