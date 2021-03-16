import {
  DeletePostMutationVariables,
  Posts,
  PostSortOption,
  PostsQuery,
  PostsQueryVariables,
  PostType,
  PostUpdates,
  PostUpdatesQuery,
  PostUpdatesQueryVariables,
  UserType,
} from 'lib/generated/datamodel';
import {
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useEffect,
  useState,
} from 'react';
import { ApolloError, ApolloQueryResult } from '@apollo/client';
import { toast } from 'react-toastify';
import { client } from 'utils/apollo';
import isDebug from 'utils/mode';
import WritePostModal from 'components/modals/WritePostModal';
import PostView from 'components/PostView';
import DeletePostModal from 'components/modals/DeletePostModal';
import sleep from 'shared/sleep';
import { FiEdit } from 'react-icons/fi';
import { elasticWaitTime, postWriteMap } from 'utils/variables';
import { useSelector } from 'react-redux';
import { RootState } from 'state';
import { cloneDeep } from '@apollo/client/utilities';

const numPerPage = 10;

interface FeedArgs {
  postType: PostType;
}

export const updateSinglePost = async (
  posts: ApolloQueryResult<PostsQuery>,
  setPosts: Dispatch<SetStateAction<ApolloQueryResult<PostsQuery>>>,
  postID: string,
  useCache = !isDebug()
): Promise<void> => {
  try {
    const currentPostIndex = posts.data.posts.results.findIndex(
      (elem) => elem.id === postID
    );
    if (currentPostIndex < 0) {
      throw new Error(`post with id ${postID} not found`);
    }
    const res = await client.query<PostUpdatesQuery, PostUpdatesQueryVariables>(
      {
        query: PostUpdates,
        variables: {
          id: postID,
        },
        fetchPolicy: !useCache ? 'network-only' : 'cache-first',
      }
    );
    if (res.errors) {
      throw new Error(res.errors.join(', '));
    }
    const postCopy = cloneDeep(posts.data.posts.results[currentPostIndex]);
    for (const key in res.data.post) {
      postCopy[key] = res.data.post[key];
    }
    const newResults = [...posts.data.posts.results];
    newResults[currentPostIndex] = postCopy;
    setPosts({
      ...posts,
      data: {
        posts: {
          ...posts.data.posts,
          results: newResults,
        },
      },
    });
  } catch (err) {
    // console.log(JSON.stringify(err));
    toast((err as ApolloError).message, {
      type: 'error',
    });
  }
};

const Feed: FunctionComponent<FeedArgs> = (args) => {
  const [posts, setPosts] = useState<ApolloQueryResult<PostsQuery> | undefined>(
    undefined
  );
  const userType = useSelector<RootState, UserType | undefined>(
    (state) => state.authReducer.user?.type as UserType | undefined
  );
  const [currentPage, setCurrentPage] = useState<number>(0);

  const getVariables = (): PostsQueryVariables => {
    return {
      sortBy: PostSortOption.Created,
      perpage: numPerPage,
      ascending: false,
      page: currentPage,
      type: args.postType,
    };
  };

  const runQuery = async (
    useCache = !isDebug(),
    init = false
  ): Promise<void> => {
    try {
      const res = await client.query<PostsQuery, PostsQueryVariables>({
        query: Posts,
        variables: getVariables(),
        fetchPolicy: !useCache ? 'network-only' : 'cache-first',
      });
      if (res.errors) {
        throw new Error(res.errors.join(', '));
      }
      if (init) {
        await sleep(50);
      }
      setPosts(res);
    } catch (err) {
      // console.log(JSON.stringify(err));
      toast((err as ApolloError).message, {
        type: 'error',
      });
    }
  };

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

  useEffect(() => {
    (async () => {
      await runQuery(false, true);
    })();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-6 lg:px-8 pt-2 pb-56">
      {!writePostModalIsOpen ? null : (
        <WritePostModal
          toggleModal={toggleWritePost}
          postType={args.postType}
          onSubmit={async () => {
            // wait for elasticsearch to update
            await sleep(elasticWaitTime);
            await runQuery(false);
          }}
          updateID={updatePostID}
        />
      )}
      {!deletePostModalIsOpen || !deletePostVariables ? null : (
        <DeletePostModal
          toggleModal={toggleDeletePostModal}
          onSubmit={async () => {
            try {
              const currentPostIndex = posts.data.posts.results.findIndex(
                (elem) => elem.id === deletePostVariables.id
              );
              if (currentPostIndex < 0) {
                throw new Error(
                  `cannot find post with id ${deletePostVariables.id}`
                );
              }
              // delete current post
              const newResults = [...posts.data.posts.results];
              newResults.splice(currentPostIndex, 1);
              const newPostsData: PostsQuery = {
                posts: {
                  ...posts.data.posts,
                  results: newResults,
                },
              };
              // fix counts
              newPostsData.posts.count--;
              const postType = posts.data.posts.results[currentPostIndex].type;
              const postCount = newPostsData.posts.postCounts.find(
                (elem) => elem.type === postType
              );
              if (postCount) {
                postCount.count--;
              }
              setPosts({
                ...posts,
                data: newPostsData,
              });
              // update cache
              client.cache.writeQuery<PostsQuery, PostsQueryVariables>({
                query: Posts,
                variables: getVariables(),
                data: newPostsData,
              });
            } catch (err) {
              toast((err as Error).message, {
                type: 'error',
              });
            }
          }}
          variables={deletePostVariables}
        />
      )}

      <div className="flex flex-col mt-4">
        <div className="col-span-3 lg:mx-4">
          {!userType ||
          !postWriteMap[userType].includes(args.postType) ? null : (
            <div className="bg-white px-4 sm:px-16 py-4 flex items-center justify-center mt-4 mb-8 rounded-md">
              <button
                className="flex items-center justify-start text-left pl-4 text-gray-700 bg-white border-2 hover:bg-gray-200 font-semibold py-2 w-full rounded-full"
                onClick={(evt) => {
                  evt.preventDefault();
                  toggleWritePost();
                }}
              >
                <FiEdit className="inline-block mr-2 text-md" />
                <span className="text-sm">Start a post</span>
              </button>
            </div>
          )}

          <div className="flex items-center justify-center">
            {!posts || posts.loading ? (
              <p className="text-md pt-4">Loading...</p>
            ) : !posts.data || posts.data.posts.results.length === 0 ? (
              <p className="text-md pt-4">No posts found</p>
            ) : (
              <table className="min-w-full">
                <tbody>
                  {posts.data.posts.results.map((post, i) => (
                    <tr key={`post-${i}-${post.title}`}>
                      <td>
                        <PostView
                          data={post}
                          onDeletePost={(vars) => {
                            setDeletePostVariables(vars);
                            toggleDeletePostModal();
                          }}
                          updateSinglePost={(postID, useCache) =>
                            updateSinglePost(posts, setPosts, postID, useCache)
                          }
                          onUpdatePost={(postID) => {
                            setUpdatePostID(postID);
                            toggleWritePost();
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!posts ||
          posts.loading ||
          posts.data.posts.results.length === 0 ? null : (
            <div className="rounded-lg mt-4 mb-8">
              <div className="bg-white px-4 py-3 flex items-center justify-between sm:px-6">
                <div className="sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <span className="text-sm text-gray-700 mr-4">
                    Showing{' '}
                    {posts.data.posts.results.length + currentPage * numPerPage}{' '}
                    / {posts.data.posts.count}
                  </span>
                  <div
                    className="relative inline-flex -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      className="disabled:bg-gray-300 text-sm bg-gray-200 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-l"
                      onClick={(evt) => {
                        evt.preventDefault();
                        setCurrentPage(currentPage - 1);
                      }}
                      disabled={currentPage === 0}
                    >
                      Prev
                    </button>
                    <button
                      className="disabled:bg-gray-300 text-sm bg-gray-200 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-r"
                      onClick={(evt) => {
                        evt.preventDefault();
                        setCurrentPage(currentPage + 1);
                      }}
                      disabled={
                        currentPage * numPerPage +
                          posts.data.posts.results.length ===
                        posts.data.posts.count
                      }
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feed;
