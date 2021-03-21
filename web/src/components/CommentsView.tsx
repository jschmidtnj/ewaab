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
  CommentFieldsFragment,
  Comments,
  CommentSortOption,
  CommentsQuery,
  CommentsQueryVariables,
  CommentUpdates,
  CommentUpdatesQuery,
  CommentUpdatesQueryVariables,
  DeleteComment,
  DeleteCommentMutation,
  DeleteCommentMutationVariables,
} from 'lib/generated/datamodel';
import sleep from 'shared/sleep';
import { elasticWaitTime } from 'utils/variables';
import { ApolloError } from '@apollo/client';
import isDebug from 'utils/mode';
import { cloneDeep } from '@apollo/client/utilities';
import type { Editor as SimpleMDEEditor } from 'codemirror';
import type { KeyboardEvent } from 'react';
import CommentView from './CommentView';

const numPerPage = 5;

interface CommentsViewArgs {
  post: string;
  commentCount: number;
  updateSinglePost: (postID: string, useCache: boolean) => Promise<void>;
}

const CommentsView: FunctionComponent<CommentsViewArgs> = (args) => {
  const avatar = useSelector<RootState, string | undefined>(
    (state) => state.authReducer.user?.avatar
  );

  const [currentPage, setCurrentPage] = useState<number>(0);
  const [comments, setComments] = useState<CommentFieldsFragment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  useEffect(() => {
    (async () => {
      try {
        await getComments(false);
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
              if (!addCommentRes.data) {
                throw new Error('no comment data found');
              }

              setComments([
                (addCommentRes.data
                  .addComment as unknown) as CommentFieldsFragment,
                ...comments,
              ]);
              resetForm();
              setStatus({ success: true });
              setSubmitting(false);
              await sleep(elasticWaitTime);
              await args.updateSinglePost(args.post, false);
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
            <form onSubmit={handleSubmit} className="inline-block w-full">
              <div className="space-x-2 flex items-start justify-center">
                <label
                  htmlFor={`comment-editor-${args.post}`}
                  className="sr-only"
                >
                  Comment
                </label>
                <div className="inline-block w-full">
                  <SimpleMDE
                    id={`comment-editor-${args.post}`}
                    className="editor-min w-full"
                    onChange={(val) => setFieldValue('comment', val)}
                    value={values.comment}
                    events={{
                      // @ts-ignore
                      keydown: (
                        _instance: SimpleMDEEditor,
                        evt: KeyboardEvent<HTMLDivElement>
                      ) => {
                        if (evt.key === 'Enter' && evt.ctrlKey) {
                          setTimeout(() => {
                            handleSubmit();
                          }, 0);
                        }
                      },
                    }}
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
            <div key={`comment-${args.post}-${i}`}>
              <CommentView
                comment={comment}
                post={args.post}
                updateSingleComment={async (
                  commentID: string,
                  useCache = !isDebug()
                ) => {
                  try {
                    const currentCommentIndex = comments.findIndex(
                      (elem) => elem.id === commentID
                    );
                    if (currentCommentIndex < 0) {
                      throw new Error(`comment with id ${commentID} not found`);
                    }
                    const res = await client.query<
                      CommentUpdatesQuery,
                      CommentUpdatesQueryVariables
                    >({
                      query: CommentUpdates,
                      variables: {
                        id: commentID,
                      },
                      fetchPolicy: !useCache ? 'network-only' : 'cache-first',
                    });
                    if (res.errors) {
                      throw new Error(res.errors.join(', '));
                    }
                    const commentCopy = cloneDeep(
                      comments[currentCommentIndex]
                    );
                    for (const key in res.data.comment) {
                      commentCopy[key] = res.data.comment[key];
                    }
                    const newComments = [...comments];
                    newComments[currentCommentIndex] = commentCopy;
                    setComments(newComments);
                  } catch (err) {
                    // console.log(JSON.stringify(err));
                    toast((err as ApolloError).message, {
                      type: 'error',
                    });
                  }
                }}
                onDelete={async () => {
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
                    const currentCommentIndex = comments.findIndex(
                      (elem) => elem.id === comment.id
                    );
                    if (currentCommentIndex < 0) {
                      throw new Error(
                        `cannot find comment with id ${comment.id}`
                      );
                    }
                    const newComments = [...comments];
                    newComments.splice(currentCommentIndex, 1);
                    setComments(newComments);
                    await sleep(elasticWaitTime);
                    await args.updateSinglePost(args.post, false);
                  } catch (err) {
                    const errObj: Error = err;
                    toast(errObj.message, {
                      type: 'error',
                    });
                  }
                }}
              />
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
