import {
  DeletePostMutationVariables,
  MediaType,
  PostSearchFieldsFragment,
} from 'lib/generated/datamodel';
import Avatar from 'components/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { BsPencil } from 'react-icons/bs';
import { BiTrash } from 'react-icons/bi';
import { useRouter } from 'next/dist/client/router';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { RootState } from 'state';
import { BsLink45Deg } from 'react-icons/bs';
import { getAPIURL } from 'utils/axios';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { postMediaWidth } from 'shared/variables';
import { FiFileText } from 'react-icons/fi';
import Markdown from './markdown/Markdown';

interface MediaViewArgs {
  id: string;
  name: string;
  type: MediaType;
}

const MediaView = (args: MediaViewArgs): JSX.Element => {
  const apiURL = getAPIURL();
  const mediaAuth = useSelector<RootState, string | undefined>(
    (state) => state.authReducer.user?.mediaAuth
  );

  if (args.type === MediaType.Image) {
    return (
      <div className="flex text-center justify-center mt-4">
        <LazyLoadImage
          alt={`${apiURL}/media/${args.id}/blur?auth=${mediaAuth}`}
          src={`${apiURL}/media/${args.id}?auth=${mediaAuth}`}
          width={postMediaWidth}
        />
      </div>
    );
  } else if (args.type === MediaType.File) {
    return (
      <a href={`${apiURL}/media/${args.id}`} target="_blank" rel="noreferrer">
        <FiFileText className="inline-block mr-1 text-lg" />
        <span className="text-sm">{args.name}</span>
      </a>
    );
  } else {
    throw new Error(`unsupported media type ${args.type} provided`);
  }
};

interface PostViewArgs {
  data: PostSearchFieldsFragment;
  onDeletePost: (variables: DeletePostMutationVariables) => void;
  onUpdatePost: (id: string) => void;
}

const PostView = (args: PostViewArgs): JSX.Element => {
  const router = useRouter();

  const userID = useSelector<RootState, string | undefined>(
    (state) => state.authReducer.user?.id
  );

  return (
    <div className="bg-white rounded-lg text-left overflow-hidden shadow-sm">
      <div className="sm:p-4 p-2">
        {args.data.publisher !== userID ? null : (
          <div className="flex justify-end text-2xl text-gray-800">
            <button
              className="mr-8 p-2 absolute z-10 hover:text-gray-600"
              onClick={(evt) => {
                evt.preventDefault();
                args.onUpdatePost(args.data.id);
              }}
            >
              <BsPencil />
            </button>
            <button
              className="p-2 absolute z-10 hover:text-gray-600"
              onClick={(evt) => {
                evt.preventDefault();
                args.onDeletePost({
                  id: args.data.id,
                });
              }}
            >
              <BiTrash />
            </button>
          </div>
        )}

        <div className="mb-2">
          <button
            onClick={(evt) => {
              evt.preventDefault();
              if (!args.data.publisherData) {
                toast('user does not exist', {
                  type: 'warning',
                });
                return;
              }
              router.push(`/${args.data.publisherData.username}`);
            }}
            className="mx-4 flex items-center text-left w-full"
          >
            <Avatar avatar={args.data.publisherData?.avatar} avatarWidth={40} />
            <div className="inline-block ml-2">
              {!args.data.publisherData ? (
                <p className="font-medium">Deleted</p>
              ) : (
                <>
                  <p className="font-medium text-sm">
                    {args.data.publisherData.name}
                  </p>
                  <p className="text-xs">
                    {args.data.publisherData.description}
                  </p>
                  <p className="text-xs">
                    {formatDistanceToNow(args.data.created * 1000, {
                      addSuffix: true,
                    })}
                  </p>
                </>
              )}
            </div>
          </button>
        </div>
        <div className="ml-4 mt-4">
          <h2
            className="text-lg leading-5 font-semibold text-gray-900"
            id="modal-headline"
          >
            {args.data.title}
          </h2>
          <div className="mt-4">
            <Markdown content={args.data.content} />
          </div>
        </div>
      </div>
      {!args.data.link && !args.data.mediaData ? null : (
        <>
          <hr className="my-2" />
          {!args.data.link ? null : (
            <div className="mt-2 p-2">
              <a href={args.data.link} target="_blank" rel="noreferrer">
                <BsLink45Deg className="inline-block mr-1 text-md" />
                <span className="text-sm">{args.data.link}</span>
              </a>
            </div>
          )}
          {!args.data.mediaData ? null : (
            <div className="mt-2 sm:p-4">
              <MediaView
                id={args.data.mediaData.id}
                name={args.data.mediaData.name}
                type={args.data.mediaData.type}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostView;
