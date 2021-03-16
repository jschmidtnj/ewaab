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
      effect={'blur'}
      className={className + ' rounded-full'}
      alt="avatar"
      placeholderSrc={`${apiURL}/media/${args.avatar}?blur`}
      src={`${apiURL}/media/${args.avatar}`}
      width={args.avatarWidth}
    />
  ) : (
    <Image
      className={className + ' rounded-full'}
      width={args.avatarWidth}
      height={args.avatarWidth}
      src="/assets/img/default_avatar.png"
      alt="avatar"
    />
  );
};

export default Avatar;
