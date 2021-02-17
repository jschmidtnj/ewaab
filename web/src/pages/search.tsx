import PrivateRoute from 'components/PrivateRoute';
import Layout from 'layouts/main';
import SEO from 'components/SEO';
import {
  Posts,
  PostsQuery,
  PostsQueryVariables,
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

const SearchPage = (): JSX.Element => {
  // const mediaAuth = isSSR
  //   ? undefined
  //   : useSelector<RootState, string>((state) => {
  //       const mediaAuth = state.authReducer.user?.mediaAuth;
  //       return mediaAuth ? mediaAuth : '';
  //     });

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

  // const apiURL = getAPIURL();

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
                          className="shadow-sm pl-8 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-none rounded-l"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row mb-1 sm:mb-0">
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
                  </div>

                  {!newPostModalIsOpen ? null : (
                    <NewPostModal
                      toggleModal={toggleNewPostModal}
                      onSubmit={() => {
                        // console.log('created new post');
                      }}
                    />
                  )}
                  <button
                    className="mt-1 text-sm bg-blue-700 hover:bg-blue-400 text-white font-semibold py-2 px-4 rounded-none md:rounded-r w-20"
                    onClick={(evt) => {
                      evt.preventDefault();
                      toggleNewPostModal();
                    }}
                  >
                    <span>New</span>
                    <AiOutlinePlus className="inline-block ml-1 text-md text-white mb-0.5" />
                  </button>
                </div>
              </form>
            )}
          </Formik>
          {!posts ||
          posts.loading ||
          !posts.data ||
          posts.data.posts.results.length === 0 ? (
            <p className="text-md pt-4">No posts found</p>
          ) : (
            <div className="flex flex-col mt-4">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <div className="max-w-sm bg-white border-2 border-gray-300 p-6 rounded-md tracking-wide shadow-lg">
                      <div id="header" className="flex items-center mb-4">
                        <img
                          alt="avatar"
                          className="w-20 rounded-full border-2 border-gray-300"
                          src="https://picsum.photos/seed/picsum/200"
                        />
                        <div id="header-text" className="leading-5 ml-6 sm">
                          <h4 id="name" className="text-xl font-semibold">
                            John Doe
                          </h4>
                          <h5 id="job" className="font-semibold text-blue-600">
                            Designer
                          </h5>
                        </div>
                      </div>
                      <div id="quote">
                        <q className="italic text-gray-600">
                          Lorem ipsum dolor sit amet, consectetur adipiscing
                          elit, sed do eiusmod tempor incididunt ut labore et
                          dolore magna aliqua.
                        </q>
                      </div>
                    </div>
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
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                      <div className="sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <span className="text-sm text-gray-700 mr-4">
                          Showing {posts.data.posts.results.length} /{' '}
                          {posts.data.posts.count}
                        </span>
                        <div
                          className="relative inline-flex shadow-sm -space-x-px"
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
                            disabled={formRef.current.values.page === 0}
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
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </PrivateRoute>
  );
};

export default SearchPage;
