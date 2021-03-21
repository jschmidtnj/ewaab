import Layout from 'layouts/main';
import SEO from 'components/SEO';
import Link from 'next/link';
import {
  UserQueryVariables,
  Users,
  UserSortOption,
  UsersQuery,
  UsersQueryVariables,
  UserType,
} from 'lib/generated/datamodel';
import Select, { ValueType } from 'react-select';
import { FunctionComponent, useEffect, useRef, useState } from 'react';
import { ApolloError, ApolloQueryResult } from '@apollo/client';
import * as yup from 'yup';
import { Formik, FormikHandlers, FormikHelpers, FormikState } from 'formik';
import {
  defaultPerPage,
  perPageOptions,
  SelectNumberObject,
  SelectStringObject,
} from 'utils/variables';
import { toast } from 'react-toastify';
import { client } from 'utils/apollo';
import isDebug from 'utils/mode';
import majors from 'shared/majors';
import { AiFillCaretDown, AiFillCaretUp } from 'react-icons/ai';
import Avatar from 'components/Avatar';
import PrivateRoute from 'components/PrivateRoute';
import sleep from 'shared/sleep';
import { capitalizeFirstLetter } from 'utils/misc';

const avatarWidth = 40;

const minSelectSearchLen = 2;

const majorsOptions = majors.map(
  (major): SelectStringObject => ({
    label: capitalizeFirstLetter(major),
    value: major,
  })
);

const userTypeLabels: Record<UserType, string> = {
  [UserType.User]: 'EH Participant',
  [UserType.Mentor]: 'Recruiter',
  [UserType.Visitor]: '',
  [UserType.Admin]: 'EWAAB Staff',
};

interface SortableColumnArgs {
  text: string;
  sortBy?: UserSortOption;
  elemTarget: UserSortOption;
  ascending?: boolean;
  setFieldValue: FormikHelpers<UserQueryVariables>['setFieldValue'];
  handleSubmit: FormikHandlers['handleSubmit'];
}

const SortableColumn = (args: SortableColumnArgs): JSX.Element => {
  return (
    <th
      scope="col"
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
      onClick={(evt) => {
        evt.preventDefault();
        if (args.elemTarget === args.sortBy) {
          args.setFieldValue('ascending', !args.ascending);
        } else {
          args.setFieldValue('sortBy', args.elemTarget);
        }
        args.handleSubmit();
      }}
    >
      <div className="flex">
        <span>{args.text}</span>
        {args.elemTarget !== args.sortBy ? null : args.ascending ? (
          <AiFillCaretDown className="inline-block ml-2 text-md" />
        ) : (
          <AiFillCaretUp className="inline-block ml-2 text-md" />
        )}
      </div>
    </th>
  );
};

const UsersPage: FunctionComponent = () => {
  const [users, setUsers] = useState<ApolloQueryResult<UsersQuery> | undefined>(
    undefined
  );

  const [showMajorOptions, setShowMajorOptions] = useState<boolean>(false);

  const [defaultQuery, setDefaultQuery] = useState<string>('');

  const runQuery = async (
    variables: UsersQueryVariables,
    init = false
  ): Promise<void> => {
    const currentVariables = {
      ...variables,
    };
    if (currentVariables.majors?.length === 0) {
      currentVariables.majors = undefined;
    }
    if (currentVariables.query?.length === 0) {
      currentVariables.query = undefined;
    }
    currentVariables.types = [UserType.Mentor, UserType.User];
    const res = await client.query<UsersQuery, UsersQueryVariables>({
      query: Users,
      variables,
      fetchPolicy: isDebug() ? 'no-cache' : 'cache-first', // disable cache if in debug
    });
    if (res.errors) {
      throw new Error(res.errors.join(', '));
    }
    if (init) {
      await sleep(50);
    }
    setUsers(res);
  };

  const initialValues: UsersQueryVariables = {
    query: defaultQuery,
    majors: [],
    ascending: false,
    sortBy: UserSortOption.Name,
    page: 0,
    perpage: defaultPerPage,
  };

  const formRef = useRef<
    FormikHelpers<UsersQueryVariables> &
      FormikState<UsersQueryVariables> &
      FormikHandlers
  >();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('q')) {
      initialValues.query = decodeURIComponent(urlParams.get('q') as string);
      setDefaultQuery(initialValues.query);
    }
    (async () => {
      try {
        await runQuery(initialValues, true);
      } catch (err) {
        // console.log(JSON.stringify(err));
        toast((err as ApolloError).message, {
          type: 'error',
        });
      }
    })();
  }, []);

  return (
    <PrivateRoute>
      <Layout>
        <SEO page="users" />
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
              <form onSubmit={handleSubmit}>
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
                          onBlur={handleBlur}
                          value={values.query}
                          disabled={isSubmitting}
                          type="submit"
                          autoComplete="off"
                          name="query"
                          id="query"
                          placeholder="Search"
                          className="shadow-sm pl-8 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-none sm:rounded-l"
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
                    <button type="submit" className="sr-only">
                      search submit
                    </button>

                    <div>
                      <div className="mt-1 shadow-sm -space-y-px">
                        <Select
                          id="majors"
                          name="majors"
                          isMulti={true}
                          options={showMajorOptions ? majorsOptions : []}
                          noOptionsMessage={() =>
                            showMajorOptions
                              ? 'No majors found'
                              : `Enter at least ${minSelectSearchLen} characters`
                          }
                          onInputChange={(newVal) => {
                            setShowMajorOptions(
                              newVal.length >= minSelectSearchLen
                            );
                          }}
                          cacheOptions={true}
                          defaultValue={[]}
                          placeholder="Major"
                          onChange={(
                            selectedOptions: ValueType<
                              SelectStringObject[],
                              false
                            > | null
                          ) => {
                            setFieldValue(
                              'majors',
                              selectedOptions
                                ? selectedOptions.map((elem) => elem.value)
                                : undefined
                            );
                            handleSubmit();
                          }}
                          onBlur={(evt) => {
                            handleBlur(evt);
                            setFieldTouched('majors', true);
                          }}
                          className={
                            (touched.majors && errors.majors
                              ? 'is-invalid'
                              : '') + ' w-52 select-dropdown'
                          }
                          styles={{
                            control: (styles) => ({
                              ...styles,
                              borderColor:
                                touched.majors && errors.majors
                                  ? 'red'
                                  : styles.borderColor,
                              borderTopLeftRadius: 2,
                              borderBottomLeftRadius: 2,
                            }),
                          }}
                          invalid={!!(touched.majors && errors.majors)}
                          disabled={isSubmitting}
                        />
                      </div>
                      <p
                        className={`${
                          touched.majors && errors.majors ? '' : 'hidden'
                        } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                      >
                        {errors.majors}
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </Formik>
          {!users ||
          users.loading ||
          !users.data ||
          !formRef?.current ||
          users.data.users.results.length === 0 ? (
            <p className="text-md pt-4">No users found</p>
          ) : (
            <div className="flex flex-col mt-4">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="w-0 relative">
                            <span className="sr-only">Avatar</span>
                          </th>
                          <th scope="col" className="w-0 relative">
                            <span className="sr-only">Open</span>
                          </th>
                          <SortableColumn
                            text="Name"
                            elemTarget={UserSortOption.Name}
                            ascending={formRef.current.values.ascending}
                            setFieldValue={formRef.current.setFieldValue}
                            sortBy={formRef.current.values.sortBy}
                            handleSubmit={formRef.current.handleSubmit}
                          />
                          <SortableColumn
                            text="Major"
                            elemTarget={UserSortOption.Major}
                            ascending={formRef.current.values.ascending}
                            setFieldValue={formRef.current.setFieldValue}
                            sortBy={formRef.current.values.sortBy}
                            handleSubmit={formRef.current.handleSubmit}
                          />
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Type
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-gray-200">
                        {users.data.users.results.map((user, i) => (
                          <tr key={`user-${i}-${user.username}`}>
                            <td className="flex w-16 pl-4 py-4 whitespace-nowrap">
                              <Avatar
                                avatar={user.avatar}
                                avatarWidth={avatarWidth}
                              />
                            </td>
                            <td className="w-0 px-4 py-4 whitespace-nowrap text-sm font-medium">
                              <Link href={`/${user.username}`}>
                                <a className="text-indigo-600 hover:text-indigo-900">
                                  @ {user.username}
                                </a>
                              </Link>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {user.name}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {capitalizeFirstLetter(user.major)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {userTypeLabels[user.type]}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mb-8">
                      <div className="sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <span className="text-sm text-gray-700 mr-4">
                          Showing {users.data.users.results.length} /{' '}
                          {users.data.users.count}
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
                                users.data.users.results.length ===
                              users.data.users.count
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

export default UsersPage;
