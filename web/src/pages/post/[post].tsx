import { ApolloError } from '@apollo/client';
import DeletePostModal from 'components/modals/DeletePostModal';
import WritePostModal from 'components/modals/WritePostModal';
import PostView from 'components/PostView';
import PrivateRoute from 'components/PrivateRoute';
import SEO from 'components/SEO';
import Layout from 'layouts/main';
import {
  PostFieldsFragment,
  DeletePostMutationVariables,
  Post,
  PostQuery,
  PostQueryVariables,
  PostSearchFieldsFragment,
  PostType,
} from 'lib/generated/datamodel';
import { useRouter } from 'next/dist/client/router';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import sleep from 'shared/sleep';
import { isLoggedIn } from 'state/auth/getters';
import { client } from 'utils/apollo';
import { getErrorCode } from 'utils/misc';
import isDebug from 'utils/mode';
import { elasticWaitTime, linkMap } from 'utils/variables';
import statusCodes from 'http-status-codes';

const PostPage: FunctionComponent = () => {
  const [post, setPostData] = useState<PostFieldsFragment | undefined>(
    undefined
  );

  const [writePostModalIsOpen, setWritePostIsOpen] = useState<boolean>(false);
  const [updatePostID, setUpdatePostID] = useState<string | undefined>(
    undefined
  );
  const toggleWritePost = () => {
    if (writePostModalIsOpen) {
      setUpdatePostID(undefined);
    }
    setWritePostIsOpen(!writePostModalIsOpen);
  };

  const [deletePostModalIsOpen, setDeletePostModalIsOpen] = useState<boolean>(
    false
  );
  const toggleDeletePostModal = () =>
    setDeletePostModalIsOpen(!deletePostModalIsOpen);
  const [deletePostVariables, setDeletePostVariables] = useState<
    DeletePostMutationVariables | undefined
  >(undefined);

  const router = useRouter();

  const runQuery = async (
    postID: string | undefined = undefined,
    useCache = !isDebug(),
    init = false
  ): Promise<void> => {
    try {
      if (!postID) {
        if (!post) {
          throw new Error('post not initialized');
        }
        postID = post.id;
      }
      const postDataRes = await client.query<PostQuery, PostQueryVariables>({
        query: Post,
        variables: {
          id: postID,
        },
        fetchPolicy: !useCache ? 'network-only' : 'cache-first',
      });
      if (postDataRes.errors) {
        throw new Error(postDataRes.errors.join(', '));
      }
      if (init) {
        await sleep(50);
      }
      setPostData(postDataRes.data.post);
    } catch (err) {
      const errObj = err as ApolloError;
      const errorCode = getErrorCode(errObj);
      if (errorCode === statusCodes.NOT_FOUND) {
        router.replace('/404');
      } else {
        toast(errObj.message, {
          type: 'error',
        });
      }
    }
  };

  useEffect(() => {
    (async () => {
      let postID: string;
      try {
        if (!(await isLoggedIn())) {
          return;
        }
        postID = window.location.pathname.split('/')[2];
        if (postID.length === 0) {
          throw new Error('no post id provided');
        }
      } catch (err) {
        toast((err as Error).message, {
          type: 'error',
        });
        return;
      }
      await runQuery(postID, false, true);
    })();
  }, []);

  return (
    <PrivateRoute>
      <Layout>
        <SEO page={post ? post.title : 'post'} />
        <div className="max-w-2xl mx-auto px-2 sm:px-6 lg:px-8 pt-2 pb-56">
          <div className="flex items-center justify-center">
            {!post ? (
              <p className="text-md pt-4">Loading...</p>
            ) : (
              <>
                {!writePostModalIsOpen ? null : (
                  <WritePostModal
                    toggleModal={toggleWritePost}
                    postType={post.type as PostType}
                    onSubmit={async () => {
                      // wait for elasticsearch to update
                      await sleep(elasticWaitTime);
                      await runQuery(undefined, false);
                    }}
                    updateID={updatePostID}
                  />
                )}
                {!deletePostModalIsOpen || !deletePostVariables ? null : (
                  <DeletePostModal
                    toggleModal={toggleDeletePostModal}
                    onSubmit={async () => {
                      await sleep(elasticWaitTime);
                      router.push(linkMap[post.type as PostType].href);
                    }}
                    variables={deletePostVariables}
                  />
                )}
                <div className="min-w-full mt-20">
                  <PostView
                    data={(post as unknown) as PostSearchFieldsFragment}
                    onDeletePost={(vars) => {
                      setDeletePostVariables(vars);
                      toggleDeletePostModal();
                    }}
                    updateSinglePost={async () => {
                      await runQuery(undefined, false);
                    }}
                    onUpdatePost={(postID) => {
                      setUpdatePostID(postID);
                      toggleWritePost();
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </Layout>
    </PrivateRoute>
  );
};

export default PostPage;
