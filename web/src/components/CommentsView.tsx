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
} from 'lib/generated/datamodel';
import sleep from 'shared/sleep';
import { elasticWaitTime } from 'utils/variables';
import { ApolloError } from '@apollo/client';
import isDebug from 'utils/mode';
import Markdown from 'components/markdown/Markdown';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

const numPerPage = 10;

interface CommentsViewArgs {
  post: string;
}

const CommentsView: FunctionComponent<CommentsViewArgs> = (args) => {
  const avatar = useSelector<RootState, string | undefined>(
    (state) => state.authReducer.user.avatar
  );

  const [currentPage, setCurrentPage] = useState<number>(0);
  const [comments, setComments] = useState<CommentFieldsFragment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const getComments = async (useCache = !isDebug()): Promise<void> => {
    setLoading(true);
    const res = await client.query<CommentsQuery, CommentsQueryVariables>({
      query: Comments,
      variables: {
        sortBy: CommentSortOption.Created,
        perpage: numPerPage,
        ascending: false,
        page: currentPage,
        post: args.post,
      },
      fetchPolicy: !useCache ? 'network-only' : 'cache-first', // disable cache
    });
    if (res.errors) {
      throw new Error(res.errors.join(', '));
    }
    if (comments && comments.length > 0) {
      setComments([...comments, ...res.data.comments]);
    } else {
      setComments(res.data.comments);
    }
    setLoading(res.loading);
  };

  useEffect(() => {
    (async () => {
      try {
        await getComments();
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
          onSubmit={async (formData, { setSubmitting, setStatus }) => {
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
              setComments([]);
              setCurrentPage(0);
              await getComments(false);
            } catch (err) {
              const errObj: Error = err;
              console.error(JSON.stringify(errObj));
              toast('invalid code provided', {
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
      <div>
        {loading ? (
          <p className="text-sm">loading...</p>
        ) : (
          comments.map((comment, i) => (
            <div key={`comment-${args.post}-${i}`}>
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
                    avatarWidth={40}
                  />
                </a>
              </Link>
              <div>
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
                        <p className="font-medium text-sm">
                          {comment.publisherData.name}
                        </p>
                        <p className="text-xs">
                          {comment.publisherData.description}
                        </p>
                        <p className="text-xs">
                          {formatDistanceToNow(comment.created, {
                            addSuffix: true,
                          })}
                        </p>
                      </>
                    )}
                  </a>
                </Link>
                <Markdown content={comment.content} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentsView;
