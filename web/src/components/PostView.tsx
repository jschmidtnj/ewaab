import {
  DeletePostMutationVariables,
  PostSearchFieldsFragment,
} from 'lib/generated/datamodel';
import Avatar from 'components/Avatar';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import { formatDistanceToNow } from 'date-fns';
import { BsPencil } from 'react-icons/bs';
import { BiTrash } from 'react-icons/bi';
import { useRouter } from 'next/dist/client/router';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { RootState } from 'state';

interface PostViewArgs {
  data: PostSearchFieldsFragment;
  onDeletePost: (variables: DeletePostMutationVariables) => void;
}

const PostView = (args: PostViewArgs): JSX.Element => {
  const router = useRouter();

  const userID = useSelector<RootState, string | undefined>(
    (state) => state.authReducer.user?.id
  );

  return (
    <div className="bg-white rounded-lg text-left overflow-hidden shadow-sm p-4">
      {args.data.publisher !== userID ? null : (
        <div className="flex justify-end text-2xl text-gray-800">
          <button
            className="mr-10 absolute z-10 hover:text-gray-600"
            onClick={(evt) => {
              evt.preventDefault();
            }}
          >
            <BsPencil />
          </button>
          <button
            className="absolute z-10 hover:text-gray-600"
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
                <p className="text-xs">{args.data.publisherData.description}</p>
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
        <div className="mt-1">
          <ReactMarkdown plugins={[gfm]} className="mt-4">
            {args.data.content}
          </ReactMarkdown>
        </div>
      </div>
      {/* TODO - add media here */}
    </div>
  );
};

export default PostView;
