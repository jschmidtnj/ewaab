import PrivateRoute from 'components/PrivateRoute';
import Layout from 'layouts/main';
import SEO from 'components/SEO';
import {
  Posts,
  PostsQuery,
  PostsQueryVariables,
  PostType,
} from 'lib/generated/datamodel';
import Select, { ValueType } from 'react-select';
import { useEffect, useRef, useState } from 'react';
import { ApolloError, ApolloQueryResult } from 'apollo-client';
import * as yup from 'yup';
import { Formik, FormikHandlers, FormikHelpers, FormikState } from 'formik';
import {
  defaultPerPage,
  perPageOptions,
  SelectNumberObject,
} from 'utils/variables';
import { toast } from 'react-toastify';
import { client } from 'utils/apollo';
import isDebug from 'utils/mode';
import { AiOutlinePlus } from 'react-icons/ai';
import NewPostModal from 'components/modals/NewPost';

const typeLabelMap: Record<PostType, string> = {
  [PostType.Community]: 'Community',
  [PostType.EncourageHer]: 'Encourage Her',
  [PostType.MentorNews]: 'Mentor News',
  [PostType.StudentNews]: 'Student News',
};

const SearchPage = (): JSX.Element => {
  const [posts, setPosts] = useState<ApolloQueryResult<PostsQuery> | undefined>(
    undefined
  );

  const [defaultQuery, setDefaultQuery] = useState<string>('');

  const runQuery = async (variables: PostsQueryVariables): Promise<void> => {
    if (variables.query?.length === 0) {
      variables.query = undefined;
    }
    const res = await client.query<PostsQuery, PostsQueryVariables>({
      query: Posts,
      variables,
      fetchPolicy: isDebug() ? 'no-cache' : 'cache-first', // disable cache if in debug
    });
    if (res.errors) {
      throw new Error(res.errors.join(', '));
    }
    setPosts(res);
  };

  const initialValues: PostsQueryVariables = {
    query: defaultQuery,
    ascending: false,
    page: 0,
    perpage: defaultPerPage,
    type: PostType.Community,
  };

  const formRef = useRef<
    FormikHelpers<PostsQueryVariables> &
      FormikState<PostsQueryVariables> &
      FormikHandlers
  >();

  const [newPostModalIsOpen, setNewPostModalIsOpen] = useState<boolean>(false);
  const toggleNewPostModal = () => setNewPostModalIsOpen(!newPostModalIsOpen);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('q')) {
      initialValues.query = decodeURIComponent(urlParams.get('q') as string);
      setDefaultQuery(initialValues.query);
    }
    (async () => {
      try {
        await runQuery(initialValues);
      } catch (err) {
        console.log(JSON.stringify(err));
        toast((err as ApolloError).message, {
          type: 'error',
        });
      }
    })();
  }, []);

  return (
    <PrivateRoute>
      <Layout>
        <SEO page="user page" />
        <div className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-8 pt-12">
          <Formik
            innerRef={(formRef as unknown) as (instance: any) => void}
            initialValues={initialValues}
            validationSchema={yup.object({
              query: yup.string(),
              majors: yup.array(),
              ascending: yup.bool(),
              page: yup.number().integer(),
              perpage: yup.number().integer(),
              type: yup.string(),
            })}
            onSubmit={async (formData, { setSubmitting, setStatus }) => {
              const onError = () => {
                setStatus({ success: false });
                setSubmitting(false);
              };
              try {
                await runQuery(formData);
              } catch (err) {
                console.error(JSON.stringify(err, null, 2));
                toast(err.message, {
                  type: 'error',
                });
                onError();
              }
            }}
          >
            {({
              values,
              errors,
              touched,
              handleBlur,
              handleSubmit,
              handleChange,
              isSubmitting,
              setFieldValue,
              setFieldTouched,
            }) => (
              <form>
                <div className="my-2 flex sm:flex-row flex-col">
                  <div className="block relative">
                    <div>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="h-full absolute inset-y-0 left-0 pl-2">
                          <svg
                            viewBox="0 0 24 24"
                            className="mt-4 h-4 w-4 fill-current text-gray-500"
                          >
                            <path d="M10 4a6 6 0 100 12 6 6 0 000-12zm-8 6a8 8 0 1114.32 4.906l5.387 5.387a1 1 0 01-1.414 1.414l-5.387-5.387A8 8 0 012 10z"></path>
                          </svg>
                        </span>
                        <input
                          onChange={handleChange}
                          onKeyDown={(evt) => {
                            if (evt.key === 'Enter') {
                              handleSubmit();
                            }
                          }}
                          onBlur={handleBlur}
                          value={values.query}
                          disabled={isSubmitting}
                          type="text"
                          name="query"
                          id="query"
                          placeholder="Search"
                          className="shadow-sm pl-8 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-none sm:rounded-l"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row sm:mb-0">
                    <div>
                      <div className="mt-1 shadow-sm -space-y-px">
                        <Select
                          id="perpage"
                          name="perpage"
                          isMulti={false}
                          options={perPageOptions}
                          cacheOptions={true}
                          defaultValue={perPageOptions.find(
                            (elem) => elem.value === defaultPerPage
                          )}
                          onChange={(
                            selectedOption: ValueType<SelectNumberObject, false>
                          ) => {
                            setFieldValue('perpage', selectedOption.value);
                            handleSubmit();
                          }}
                          onBlur={(evt) => {
                            handleBlur(evt);
                            setFieldTouched('perpage', true);
                          }}
                          className={
                            (touched.perpage && errors.perpage
                              ? 'is-invalid'
                              : '') + ' w-24 select-dropdown'
                          }
                          styles={{
                            control: (styles) => ({
                              ...styles,
                              borderColor:
                                touched.perpage && errors.perpage
                                  ? 'red'
                                  : styles.borderColor,
                              borderRadius: 0,
                            }),
                          }}
                          invalid={!!(touched.perpage && errors.perpage)}
                          disabled={isSubmitting}
                        />
                      </div>
                      <p
                        className={`${
                          touched.perpage && errors.perpage ? '' : 'hidden'
                        } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                      >
                        {errors.perpage}
                      </p>
                    </div>

                    <button
                      className="mt-1 text-sm bg-blue-700 hover:bg-blue-400 text-white font-semibold py-2 px-4 rounded-none sm:rounded-r w-20"
                      onClick={(evt) => {
                        evt.preventDefault();
                        toggleNewPostModal();
                      }}
                    >
                      <span>New</span>
                      <AiOutlinePlus className="inline-block ml-1 text-md text-white mb-0.5" />
                    </button>
                  </div>
                </div>
              </form>
            )}
          </Formik>
          {!newPostModalIsOpen ? null : (
            <NewPostModal
              toggleModal={toggleNewPostModal}
              defaultPostType={formRef.current.values.type}
            />
          )}

          <div className="flex flex-col mt-4">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-4">
                  <div className="col-start-1 col-auto mb-4 rounded-lg">
                    <ul className="flex flex-col bg-gray-50 border-gray-300 rounded-md shadow-md max-w-xs">
                      {!posts || posts.loading || !posts.data
                        ? null
                        : posts.data.posts.postCounts.map((countData, i) => (
                            <li
                              key={`post-type-${i}-${countData.type}`}
                              className={
                                countData.type === formRef.current.values.type
                                  ? 'bg-gray-200'
                                  : 'bg-white'
                              }
                            >
                              <button
                                className="w-full flex flex-row p-3 border-b first:rounded-md last:rounded-md"
                                onClick={(evt) => {
                                  evt.preventDefault();
                                  let newType: PostType | undefined;
                                  if (
                                    formRef.current.values.type ===
                                    countData.type
                                  ) {
                                    newType = undefined;
                                  } else {
                                    newType = countData.type;
                                  }
                                  formRef.current.setFieldValue(
                                    'type',
                                    newType
                                  );
                                  formRef.current.handleSubmit();
                                }}
                              >
                                <span className="inline-block text-left text-base w-full">
                                  {typeLabelMap[countData.type]}
                                </span>
                                <span className="inline-block w-full pr-2">
                                  <div className="float-right flex items-center justify-center rounded-full h-0.5 w-0.5 bg-purple-500 text-white p-3 text-sm">
                                    {countData.count}
                                  </div>
                                </span>
                              </button>
                            </li>
                          ))}
                    </ul>
                  </div>

                  <div className="col-span-3 lg:mx-4">
                    {!posts ||
                    posts.loading ||
                    !posts.data ||
                    posts.data.posts.results.length === 0 ? (
                      <p className="text-md pt-4">No posts found</p>
                    ) : (
                      <>
                        <table className="min-w-full">
                          <tbody className="bg-white">
                            {posts.data.posts.results.map((post, i) => (
                              <tr key={`post-${i}-${post.title}`}>
                                <td className="w-16 pl-4 py-4 whitespace-nowrap">
                                  {post.title}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div className="overflow-hidden border-b border-gray-200">
                          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                            <div className="sm:flex-1 sm:flex sm:items-center sm:justify-between">
                              <span className="text-sm text-gray-700 mr-4">
                                Showing {posts.data.posts.results.length} /{' '}
                                {posts.data.posts.count}
                              </span>
                              <div
                                className="relative inline-flex -space-x-px"
                                aria-label="Pagination"
                              >
                                <button
                                  className="disabled:bg-gray-300 text-sm bg-gray-200 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-l"
                                  onClick={(evt) => {
                                    evt.preventDefault();
                                    formRef.current.setFieldValue(
                                      'page',
                                      formRef.current.values.page - 1
                                    );
                                  }}
                                  disabled={formRef?.current.values.page === 0}
                                >
                                  Prev
                                </button>
                                <button
                                  className="disabled:bg-gray-300 text-sm bg-gray-200 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-r"
                                  onClick={(evt) => {
                                    evt.preventDefault();
                                    formRef.current.setFieldValue(
                                      'page',
                                      formRef.current.values.page + 1
                                    );
                                  }}
                                  disabled={
                                    formRef?.current &&
                                    formRef.current.values.page *
                                      formRef.current.values.perpage +
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
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </PrivateRoute>
  );
};

export default SearchPage;
