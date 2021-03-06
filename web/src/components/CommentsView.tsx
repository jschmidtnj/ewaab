import { FunctionComponent, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'state';
import Avatar from 'components/Avatar';
import { toast } from 'react-toastify';
import * as yup from 'yup';
import { Formik } from 'formik';
import { strMinLen } from 'shared/variables';
import SimpleMDE from 'react-simplemde-editor';
import { RiSendPlaneFill } from 'react-icons/ri';
import { client } from 'utils/apollo';
import {
  AddComment,
  AddCommentMutation,
  AddCommentMutationVariables,
  AddReaction,
  AddReactionMutation,
  AddReactionMutationVariables,
  CommentFieldsFragment,
  Comments,
  CommentSortOption,
  CommentsQuery,
  CommentsQueryVariables,
  DeleteComment,
  DeleteCommentMutation,
  DeleteCommentMutationVariables,
  DeleteReaction,
  DeleteReactionMutation,
  DeleteReactionMutationVariables,
  ReactionParentType,
  UserType,
} from 'lib/generated/datamodel';
import { BsDot } from 'react-icons/bs';
import sleep from 'shared/sleep';
import { Emoji } from 'emoji-mart';
import { elasticWaitTime } from 'utils/variables';
import { ApolloError } from '@apollo/client';
import isDebug from 'utils/mode';
import Markdown from 'components/markdown/Markdown';
import { formatDistanceStrict } from 'date-fns';
import Link from 'next/link';
import EmojiPicker from 'components/EmojiPicker';
import { BiTrash } from 'react-icons/bi';

const numPerPage = 5;

interface CommentsViewArgs {
  post: string;
  commentCount: number;
  updateData: (useCache: boolean) => Promise<void>;
}

const CommentsView: FunctionComponent<CommentsViewArgs> = (args) => {
  const avatar = useSelector<RootState, string | undefined>(
    (state) => state.authReducer.user?.avatar
  );
  const userType = useSelector<RootState, UserType | undefined>(
    (state) => state.authReducer.user?.type as UserType | undefined
  );
  const userID = useSelector<RootState, string | undefined>(
    (state) => state.authReducer.user?.id
  );

  const [currentPage, setCurrentPage] = useState<number>(0);
  const [comments, setComments] = useState<CommentFieldsFragment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [emojiPickerVisible, setEmojiPickerVisible] = useState<boolean>(false);
  const toggleEmojiPicker = () => setEmojiPickerVisible(!emojiPickerVisible);

  const getComments = async (
    useCache = !isDebug(),
    currentComments = comments,
    pageNum = currentPage
  ): Promise<void> => {
    const res = await client.query<CommentsQuery, CommentsQueryVariables>({
      query: Comments,
      variables: {
        sortBy: CommentSortOption.Created,
        perpage: numPerPage,
        ascending: false,
        page: pageNum,
        post: args.post,
      },
      fetchPolicy: !useCache ? 'network-only' : 'cache-first', // disable cache
    });
    if (res.errors) {
      throw new Error(res.errors.join(', '));
    }
    setCurrentPage(pageNum);
    console.log(pageNum, currentComments, res.data.comments);
    if (currentComments.length > 0) {
      setComments([
        ...currentComments,
        ...res.data.comments.filter(
          (comment) => !currentComments.some((elem) => elem.id === comment.id)
        ),
      ]);
    } else {
      setComments(res.data.comments);
    }
    setLoading(res.loading);
  };

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

  useEffect(() => {
    (async () => {
      try {
        await getComments(true);
      } catch (err) {
        // console.log(JSON.stringify(err));
        toast((err as ApolloError).message, {
          type: 'error',
        });
      }
    })();
  }, []);

  return (
    <div className="mt-4">
      <div className="space-x-2 flex items-start justify-center pr-12">
        <Avatar className="inline-block" avatar={avatar} avatarWidth={45} />
        <Formik
          key={`post-${args.post}-new-comment`}
          initialValues={{
            comment: '',
          }}
          validationSchema={yup.object({
            comment: yup
              .string()
              .required('required')
              .min(
                strMinLen,
                `comment must be at least ${strMinLen} characters long`
              ),
          })}
          onSubmit={async (
            formData,
            { setSubmitting, setStatus, resetForm }
          ) => {
            const onError = () => {
              setStatus({ success: false });
              setSubmitting(false);
            };
            try {
              const addCommentRes = await client.mutate<
                AddCommentMutation,
                AddCommentMutationVariables
              >({
                mutation: AddComment,
                variables: {
                  content: formData.comment,
                  post: args.post,
                },
              });
              if (addCommentRes.errors) {
                throw new Error(addCommentRes.errors.join(', '));
              }

              setStatus({ success: true });
              setSubmitting(false);
              await sleep(elasticWaitTime);
              await getComments(false, [], 0);
              await args.updateData(false);
              resetForm();
            } catch (err) {
              const errObj: Error = err;
              toast(errObj.message, {
                type: 'error',
              });
              onError();
            }
          }}
        >
          {({ values, errors, handleSubmit, setFieldValue }) => (
            <form className="inline-block w-full">
              <div className="space-x-2 flex items-start justify-center">
                <label htmlFor="comment" className="sr-only">
                  Comment
                </label>
                <div className="inline-block w-full">
                  <SimpleMDE
                    id="comment"
                    className="editor-min w-full"
                    onChange={(val) => setFieldValue('comment', val)}
                    value={values.comment}
                    options={{
                      toolbar: false,
                      spellChecker: false,
                      status: false,
                      placeholder: 'Add a comment...',
                    }}
                  />
                </div>
                {errors.comment ? null : (
                  <button
                    onClick={(evt) => {
                      evt.preventDefault();
                      handleSubmit();
                    }}
                    type="submit"
                    className="inline-block text-2xl mt-2 text-blue-500 hover:text-blue-700"
                  >
                    <RiSendPlaneFill />
                  </button>
                )}
              </div>
            </form>
          )}
        </Formik>
      </div>
      <div className="space-y-4 mt-4 mb-2">
        {loading ? (
          <p className="text-sm sr-only">Loading...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm pr-8 pb-2 text-center pt-4">
            be the first to comment
          </p>
        ) : (
          comments.map((comment, i) => (
            <div
              className="flex items-start justify-center"
              key={`comment-${args.post}-${i}`}
            >
              <div className="inline-block">
                <Link
                  href={
                    !comment.publisherData
                      ? '/404'
                      : `/${comment.publisherData.username}`
                  }
                >
                  <a>
                    <Avatar
                      avatar={comment.publisherData?.avatar}
                      avatarWidth={45}
                    />
                  </a>
                </Link>
              </div>
              <div className="ml-4 w-full bg-gray-200 rounded-md p-2">
                <div className="flex z-10 space-x-2 justify-end text-gray-800">
                  <p className="absolute mr-6 text-xs">
                    {formatDistanceStrict(comment.created, new Date(), {
                      addSuffix: true,
                    })}
                  </p>
                  {userType !== UserType.Admin &&
                  comment.publisher !== userID ? null : (
                    <button
                      className="absolute text-md hover:text-gray-600"
                      onClick={async (evt) => {
                        evt.preventDefault();
                        try {
                          const deleteCommentRes = await client.mutate<
                            DeleteCommentMutation,
                            DeleteCommentMutationVariables
                          >({
                            mutation: DeleteComment,
                            variables: {
                              id: comment.id,
                            },
                          });
                          if (deleteCommentRes.errors) {
                            throw new Error(deleteCommentRes.errors.join(', '));
                          }
                          await sleep(elasticWaitTime);
                          await getComments(false, [], 0);
                          await args.updateData(false);
                        } catch (err) {
                          const errObj: Error = err;
                          toast(errObj.message, {
                            type: 'error',
                          });
                        }
                      }}
                    >
                      <BiTrash />
                    </button>
                  )}
                </div>
                <Link
                  href={
                    !comment.publisherData
                      ? '/404'
                      : `/${comment.publisherData.username}`
                  }
                >
                  <a>
                    {!comment.publisherData ? (
                      <p className="font-medium">Deleted</p>
                    ) : (
                      <>
                        <p className="font-bold text-xs">
                          {comment.publisherData.name}
                        </p>
                        <p className="text-xs">
                          {comment.publisherData.description}
                        </p>
                      </>
                    )}
                  </a>
                </Link>
                <Markdown content={comment.content} />
              </div>
              {/* TODO - move like button under comment somehow, fix reactions list */}
              <div>
                <EmojiPicker
                  isVisible={emojiPickerVisible}
                  toggleView={toggleEmojiPicker}
                  className="inline-block mr-2"
                  currentEmoji={
                    comment.userReactions.length > 0
                      ? comment.userReactions[0].type
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
                          parent: comment.id,
                          parentType: ReactionParentType.Comment,
                          reaction: emoji,
                        },
                      });
                      if (addReactionRes.errors) {
                        throw new Error(addReactionRes.errors.join(', '));
                      }

                      if (comment.userReactions.length > 0) {
                        const reactionID = comment.userReactions[0].id;
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
                          await getComments(false);
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
                      (comment.userReactions.length > 0
                        ? 'text-purple-700'
                        : 'text-gray-700') + ' text-sm'
                    }
                    onClick={(evt) => {
                      evt.preventDefault();
                      toggleEmojiPicker();
                    }}
                  >
                    Like
                  </button>
                </EmojiPicker>
                {comment.reactionCount === 0 ? null : (
                  <span className="px-1">
                    <BsDot />
                  </span>
                )}
                {comment.reactions.map((reaction, i) => (
                  <span
                    className="pr-2 pt-2"
                    key={`reaction-post-${args.post}-comment-${comment.id}-${i}`}
                  >
                    <Emoji emoji={reaction.type} size={16} />
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      {args.commentCount <= numPerPage * (currentPage + 1) ? null : (
        <button
          className="font-bold ml-14 mb-2 text-gray-700 hover:text-gray-500 text-xs"
          onClick={async (evt) => {
            evt.preventDefault();
            await getComments(true, comments, currentPage + 1);
          }}
        >
          Load More
        </button>
      )}
    </div>
  );
};

export default CommentsView;
