import {
  AddReaction,
  AddReactionMutation,
  AddReactionMutationVariables,
  DeletePostMutationVariables,
  DeleteReaction,
  DeleteReactionMutation,
  DeleteReactionMutationVariables,
  MediaType,
  PostSearchFieldsFragment,
  ReactionParentType,
  UserType,
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
import Markdown from 'components/markdown/Markdown';
import { FunctionComponent, useEffect, useState } from 'react';
import { Emoji } from 'emoji-mart';
import { BsDot } from 'react-icons/bs';
import EmojiPicker from 'components/EmojiPicker';
import {
  AiFillLike,
  AiFillMessage,
  AiOutlineLike,
  AiOutlineMessage,
} from 'react-icons/ai';
import { client } from 'utils/apollo';
import CommentsView from 'components/CommentsView';
import { elasticWaitTime } from 'utils/variables';
import Link from 'next/link';

interface MediaViewArgs {
  id: string;
  name: string;
  type: MediaType;
}

const MediaView: FunctionComponent<MediaViewArgs> = (args) => {
  const apiURL = getAPIURL();

  if (args.type === MediaType.Image) {
    return (
      <div className="flex text-center justify-center mt-4">
        <LazyLoadImage
          alt={`${apiURL}/media/${args.id}/blur`}
          src={`${apiURL}/media/${args.id}`}
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
  updateSinglePost: (postID: string, useCache: boolean) => Promise<void>;
}

const PostView: FunctionComponent<PostViewArgs> = (args) => {
  const router = useRouter();

  const userID = useSelector<RootState, string | undefined>(
    (state) => state.authReducer.user?.id
  );
  const userType = useSelector<RootState, UserType | undefined>(
    (state) => state.authReducer.user?.type as UserType | undefined
  );

  const [emojiPickerVisible, setEmojiPickerVisible] = useState<boolean>(false);
  const toggleEmojiPicker = () => setEmojiPickerVisible(!emojiPickerVisible);

  const [commentsVisible, setCommentsVisible] = useState<boolean>(false);
  const toggleComments = () => setCommentsVisible(!commentsVisible);

  const [updateTimeout, setUpdateTimeout] = useState<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);

  useEffect(() => {
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, []);

  const numberFormat = new Intl.NumberFormat(router.locale);

  return (
    <div className="bg-white rounded-lg text-left overflow-hidden shadow-sm mb-4">
      <div className="sm:px-4 pt-4 px-2">
        {userType !== UserType.Admin &&
        args.data.publisher !== userID ? null : (
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
          <Link
            href={
              !args.data.publisherData
                ? '/404'
                : `/${args.data.publisherData.username}`
            }
          >
            <a className="mx-4 flex items-center text-left w-full">
              <Avatar
                avatar={args.data.publisherData?.avatar}
                avatarWidth={40}
              />
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
                  </>
                )}
                <p className="text-xs">
                  {formatDistanceToNow(args.data.created, {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </a>
          </Link>
        </div>
        <div className="mx-4 mt-4">
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
      <div className="pt-2 pb-2 sm:px-4 px-2">
        <div className="mx-4 mt-1">
          <div className="flex items-center justify-start text-sm mb-1 mt-2">
            {args.data.reactionCount === 0 ? null : (
              <div className="flex items-center justify-center">
                {args.data.reactions.map((reaction, i) => (
                  <span
                    className="pr-2 pt-2"
                    key={`reaction-post-${args.data.id}-${i}`}
                  >
                    <Emoji emoji={reaction.type} size={16} />
                  </span>
                ))}
                <span className="pl-1">
                  {numberFormat.format(args.data.reactionCount)}
                </span>
              </div>
            )}
            {args.data.commentCount === 0 ? null : (
              <div className="flex items-center justify-center">
                {args.data.reactionCount === 0 ? null : (
                  <span className="px-1">
                    <BsDot />
                  </span>
                )}
                <span>
                  {numberFormat.format(args.data.commentCount)} comment
                  {args.data.commentCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          <hr className="mb-2" />

          <div className="mt-2 space-x-4">
            <EmojiPicker
              isVisible={emojiPickerVisible}
              toggleView={toggleEmojiPicker}
              className="inline-block mr-2"
              currentEmoji={
                args.data.userReactions.length > 0
                  ? args.data.userReactions[0].type
                  : undefined
              }
              setEmoji={async (emoji) => {
                try {
                  const addReactionRes = await client.mutate<
                    AddReactionMutation,
                    AddReactionMutationVariables
                  >({
                    mutation: AddReaction,
                    variables: {
                      parent: args.data.id,
                      parentType: ReactionParentType.Post,
                      reaction: emoji,
                    },
                  });
                  if (addReactionRes.errors) {
                    throw new Error(addReactionRes.errors.join(', '));
                  }

                  if (args.data.userReactions.length > 0) {
                    const reactionID = args.data.userReactions[0].id;
                    const deleteReactionRes = await client.mutate<
                      DeleteReactionMutation,
                      DeleteReactionMutationVariables
                    >({
                      mutation: DeleteReaction,
                      variables: {
                        id: reactionID,
                      },
                    });
                    if (deleteReactionRes.errors) {
                      throw new Error(deleteReactionRes.errors.join(', '));
                    }
                  }
                  if (updateTimeout) {
                    clearTimeout(updateTimeout);
                  }
                  setUpdateTimeout(
                    setTimeout(async () => {
                      await args.updateSinglePost(args.data.id, false);
                    }, elasticWaitTime)
                  );
                  setEmojiPickerVisible(false);
                } catch (err) {
                  toast(err.message, {
                    type: 'error',
                  });
                }
              }}
            >
              <button
                className={
                  (args.data.userReactions.length > 0
                    ? 'text-purple-700'
                    : 'text-gray-700') + ' text-2xl'
                }
                onClick={(evt) => {
                  evt.preventDefault();
                  toggleEmojiPicker();
                }}
              >
                {args.data.userReactions.length > 0 ? (
                  <AiFillLike />
                ) : (
                  <AiOutlineLike />
                )}
              </button>
            </EmojiPicker>
            <button
              className={
                (commentsVisible ? 'text-blue-700' : 'text-gray-700') +
                ' text-2xl inline-block'
              }
              onClick={(evt) => {
                evt.preventDefault();
                toggleComments();
              }}
            >
              {commentsVisible ? <AiFillMessage /> : <AiOutlineMessage />}
            </button>
          </div>

          {!commentsVisible ? null : (
            <CommentsView
              post={args.data.id}
              commentCount={args.data.commentCount}
              updateSinglePost={args.updateSinglePost}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PostView;
