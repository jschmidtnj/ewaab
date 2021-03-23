import { FunctionComponent, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'state';
import Avatar from 'components/Avatar';
import { toast } from 'react-toastify';
import { client } from 'utils/apollo';
import {
  AddReaction,
  AddReactionMutation,
  AddReactionMutationVariables,
  CommentFieldsFragment,
  DeleteReaction,
  DeleteReactionMutation,
  DeleteReactionMutationVariables,
  ReactionParentType,
  UserType,
} from 'lib/generated/datamodel';
import { BsDot } from 'react-icons/bs';
import { Emoji } from 'emoji-mart';
import { elasticWaitTime } from 'utils/variables';
import Markdown from 'components/markdown/Markdown';
import { formatDistanceStrict } from 'date-fns';
import Link from 'next/link';
import EmojiPicker from 'components/EmojiPicker';
import { BiTrash } from 'react-icons/bi';
import { useRouter } from 'next/dist/client/router';

interface CommentsViewArgs {
  post: string;
  updateSingleComment: (commentID: string, useCache: boolean) => Promise<void>;
  onDelete: () => Promise<void>;
  comment: CommentFieldsFragment;
}

const CommentView: FunctionComponent<CommentsViewArgs> = (args) => {
  const userType = useSelector<RootState, UserType | undefined>(
    (state) => state.authReducer.user?.type
  );
  const userID = useSelector<RootState, string | undefined>(
    (state) => state.authReducer.user?.id
  );

  const [emojiPickerVisible, setEmojiPickerVisible] = useState<boolean>(false);
  const toggleEmojiPicker = () => setEmojiPickerVisible(!emojiPickerVisible);

  const router = useRouter();

  const numberFormat = new Intl.NumberFormat(router.locale);

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

  return (
    <div className="flex items-start justify-center">
      <div className="inline-block">
        <Link
          href={
            !args.comment.publisherData
              ? '/404'
              : `/${args.comment.publisherData.username}`
          }
        >
          <a>
            <Avatar
              avatar={args.comment.publisherData?.avatar}
              avatarWidth={45}
            />
          </a>
        </Link>
      </div>
      <div className="inline-block w-full ml-4">
        <div className="bg-gray-200 rounded-md p-2">
          <div className="flex z-10 space-x-2 justify-end text-gray-800">
            <p className="absolute mr-6 text-xs">
              {formatDistanceStrict(args.comment.created, new Date(), {
                addSuffix: true,
              })}
            </p>
            {userType !== UserType.Admin &&
            args.comment.publisher !== userID ? null : (
              <button
                className="absolute text-md hover:text-gray-600"
                onClick={async (evt) => {
                  evt.preventDefault();
                  await args.onDelete();
                }}
              >
                <BiTrash />
              </button>
            )}
          </div>
          <Link
            href={
              !args.comment.publisherData
                ? '/404'
                : `/${args.comment.publisherData.username}`
            }
          >
            <a>
              <div className="pb-2">
                {!args.comment.publisherData ? (
                  <p className="font-medium">Deleted</p>
                ) : (
                  <>
                    <p className="font-bold text-xs">
                      {args.comment.publisherData.name}
                    </p>
                    <p className="text-xs">
                      {args.comment.publisherData.description}
                    </p>
                  </>
                )}
              </div>
            </a>
          </Link>
          <Markdown
            className="markdown-small pt-1"
            content={args.comment.content}
          />
        </div>

        <div className="flex flex-row items-center justify-start">
          <EmojiPicker
            isVisible={emojiPickerVisible}
            toggleView={toggleEmojiPicker}
            className="ml-2 inline-block"
            currentEmoji={
              args.comment.userReactions.length > 0
                ? args.comment.userReactions[0].type
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
                    parent: args.comment.id,
                    parentType: ReactionParentType.Comment,
                    reaction: emoji,
                  },
                });
                if (addReactionRes.errors) {
                  throw new Error(addReactionRes.errors.join(', '));
                }

                if (args.comment.userReactions.length > 0) {
                  const reactionID = args.comment.userReactions[0].id;
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
                    await args.updateSingleComment(args.comment.id, false);
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
                (args.comment.userReactions.length > 0
                  ? 'text-blue-500 hover:text-blue-400'
                  : 'text-gray-700 hover:text-gray-600') + ' text-sm font-bold'
              }
              onClick={(evt) => {
                evt.preventDefault();
                toggleEmojiPicker();
              }}
            >
              Like
            </button>
          </EmojiPicker>
          {args.comment.reactionCount === 0 ? null : (
            <>
              <span>
                <BsDot />
              </span>
              {args.comment.reactions.map((reaction, i) => (
                <span
                  className="pr-1 pt-1"
                  key={`reaction-post-${args.post}-comment-${args.comment.id}-${i}`}
                >
                  <Emoji emoji={reaction.type} size={16} />
                </span>
              ))}
              <span className="text-sm">
                {numberFormat.format(args.comment.reactionCount)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentView;
