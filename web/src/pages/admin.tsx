import PrivateRoute from 'components/PrivateRoute';
import SEO from 'components/SEO';
import Layout from 'layouts/main';
import {
  AddUserCode,
  AddUserCodeMutation,
  AddUserCodeMutationVariables,
  DeleteUserCode,
  DeleteUserCodeMutation,
  DeleteUserCodeMutationVariables,
  InviteUser,
  InviteUserMutation,
  InviteUserMutationVariables,
  UserCodes,
  UserCodesQuery,
  UserCodesQueryVariables,
  UserType,
} from 'lib/generated/datamodel';
import { FunctionComponent, useEffect, useState } from 'react';
import * as yup from 'yup';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import { ewaabFounded } from 'shared/variables';
import Select, { ValueType } from 'react-select';
import { SelectUserTypeObject, userTypeOptions } from 'utils/variables';
import { client } from 'utils/apollo';
import { ApolloError, ApolloQueryResult } from '@apollo/client';
import sleep from 'shared/sleep';
import { BiTrash } from 'react-icons/bi';

const currentYear = new Date().getFullYear();

const Admin: FunctionComponent = () => {
  const [userCode, setUserCode] = useState<string>('');

  const [userCodes, setUserCodes] = useState<
    ApolloQueryResult<UserCodesQuery> | undefined
  >(undefined);

  const initialValues: InviteUserMutationVariables = {
    name: '',
    email: '',
    alumniYear: currentYear,
    type: UserType.User,
  };

  const runUserCodesQuery = async (
    variables: UserCodesQueryVariables
  ): Promise<void> => {
    const res = await client.query<UserCodesQuery, UserCodesQueryVariables>({
      query: UserCodes,
      variables,
      fetchPolicy: 'no-cache',
    });
    if (res.errors) {
      throw new Error(res.errors.join(', '));
    }
    setUserCodes(res);
  };

  useEffect(() => {
    (async () => {
      try {
        await runUserCodesQuery({});
      } catch (err) {
        toast((err as ApolloError).message, {
          type: 'error',
        });
      }
    })();
  }, []);

  return (
    <PrivateRoute>
      <Layout>
        <SEO page="admin" />
        <div className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-8 flex justify-center pt-16">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="text-center text-3xl font-medium text-gray-900">
                Invite User
              </h2>
            </div>
            <Formik
              key="inviteUser"
              initialValues={initialValues}
              validationSchema={yup.object({
                email: yup
                  .string()
                  .required('required')
                  .email('invalid email address'),
                name: yup.string().required('required'),
                alumniYear: yup.number().min(ewaabFounded).max(currentYear),
                type: yup.string().required('required'),
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
                  const inviteRes = await client.mutate<
                    InviteUserMutation,
                    InviteUserMutationVariables
                  >({
                    mutation: InviteUser,
                    variables: {
                      ...formData,
                      alumniYear: formData.alumniYear
                        ? formData.alumniYear
                        : undefined,
                    },
                  });
                  if (inviteRes.errors) {
                    throw new Error(inviteRes.errors.join(', '));
                  }
                  toast(`invited user with email ${formData.email}`, {
                    type: 'success',
                  });
                  resetForm();
                  setStatus({ success: true });
                  setSubmitting(false);
                } catch (err) {
                  const errObj: Error = err;
                  toast(errObj.message, {
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
                handleChange,
                handleBlur,
                handleSubmit,
                isSubmitting,
                setFieldValue,
                setFieldTouched,
              }) => (
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                  <div className="rounded-md shadow-sm -space-y-px">
                    <div>
                      <label htmlFor="email" className="sr-only">
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Email"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.email}
                        disabled={isSubmitting}
                      />
                      <p
                        className={`${
                          touched.email && errors.email ? '' : 'hidden'
                        } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                      >
                        {errors.email}
                      </p>
                    </div>

                    <div>
                      <label htmlFor="name" className="sr-only">
                        Name
                      </label>
                      <input
                        id="user-name"
                        name="name"
                        type="text"
                        required
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Name"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.name}
                        disabled={isSubmitting}
                      />
                      <p
                        className={`${
                          touched.name && errors.name ? '' : 'hidden'
                        } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                      >
                        {errors.name}
                      </p>
                    </div>

                    <div>
                      <label htmlFor="alumniYear" className="sr-only">
                        Alumni Year
                      </label>
                      <input
                        id="alumniYear"
                        name="alumniYear"
                        type="number"
                        required
                        className="appearance-none rounded-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Year"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.alumniYear}
                        disabled={isSubmitting}
                      />
                      <p
                        className={`${
                          touched.alumniYear && errors.alumniYear
                            ? ''
                            : 'hidden'
                        } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                      >
                        {errors.alumniYear}
                      </p>
                    </div>

                    <div>
                      <div className="mt-1 rounded-md shadow-sm -space-y-px">
                        <label htmlFor="type" className="sr-only">
                          User Type
                        </label>
                        <Select
                          id="type"
                          name="type"
                          isMulti={false}
                          options={userTypeOptions}
                          cacheOptions={true}
                          placeholder="User Type"
                          defaultValue={
                            userTypeOptions.find(
                              (elem) => elem.value === initialValues.type
                            ) as SelectUserTypeObject
                          }
                          onChange={(
                            selectedOption: ValueType<
                              SelectUserTypeObject,
                              false
                            >
                          ) => {
                            console.log(selectedOption);
                            setFieldValue('type', selectedOption.value);
                          }}
                          onBlur={(evt) => {
                            handleBlur(evt);
                            setFieldTouched('type', true);
                          }}
                          className={
                            (touched.type && errors.type ? 'is-invalid' : '') +
                            ' select-dropdown'
                          }
                          styles={{
                            control: (styles) => ({
                              ...styles,
                              borderColor:
                                touched.type && errors.type
                                  ? 'red'
                                  : styles.borderColor,
                            }),
                          }}
                          invalid={!!(touched.type && errors.type)}
                          disabled={isSubmitting}
                        />
                      </div>
                      <p
                        className={`${
                          touched.type && errors.type ? '' : 'hidden'
                        } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                      >
                        {errors.type}
                      </p>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={(evt) => {
                        evt.preventDefault();
                        handleSubmit();
                      }}
                      disabled={isSubmitting}
                      type="submit"
                      className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              )}
            </Formik>
            <div>
              <h2 className="text-center text-3xl font-medium text-gray-900">
                Add User Code
              </h2>
            </div>
            <Formik
              key="addUserCode"
              initialValues={{
                name: '',
              }}
              validationSchema={yup.object({
                name: yup.string().required('required'),
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
                  const addUserCodeRes = await client.mutate<
                    AddUserCodeMutation,
                    AddUserCodeMutationVariables
                  >({
                    mutation: AddUserCode,
                    variables: {
                      ...formData,
                    },
                  });
                  if (addUserCodeRes.errors) {
                    throw new Error(addUserCodeRes.errors.join(', '));
                  }
                  if (!addUserCodeRes.data) {
                    throw new Error('no user code data found');
                  }
                  setUserCode(addUserCodeRes.data.addUserCode);
                  toast(`created user with name ${formData.name}`, {
                    type: 'success',
                  });
                  await sleep(100);
                  await runUserCodesQuery({});
                  resetForm();
                  setStatus({ success: true });
                  setSubmitting(false);
                } catch (err) {
                  const errObj: Error = err;
                  toast(errObj.message, {
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
                handleChange,
                handleBlur,
                handleSubmit,
                isSubmitting,
              }) => (
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                  <div className="rounded-md shadow-sm -space-y-px">
                    <div>
                      <label htmlFor="name" className="sr-only">
                        Name
                      </label>
                      <input
                        id="code-name"
                        name="name"
                        type="text"
                        required
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Name"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.name}
                        disabled={isSubmitting}
                      />
                      <p
                        className={`${
                          touched.name && errors.name ? '' : 'hidden'
                        } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                      >
                        {errors.name}
                      </p>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={(evt) => {
                        evt.preventDefault();
                        handleSubmit();
                      }}
                      disabled={isSubmitting}
                      type="submit"
                      className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              )}
            </Formik>
            <div className="my-4">
              {!userCode ? null : (
                <div>
                  <label
                    htmlFor="auth"
                    className="block text-sm font-medium text-gray-700"
                  >
                    User Code
                  </label>
                  <div className="mt-2 flex rounded-md shadow-sm">
                    <input
                      value={userCode}
                      onChange={(evt) => evt.preventDefault()}
                      disabled={false}
                      id="auth"
                      onClick={(evt) => {
                        evt.currentTarget.select();
                      }}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 p-2 rounded-md"
                    />
                  </div>
                </div>
              )}
            </div>
            {!userCodes ||
            userCodes.loading ||
            !userCodes.data ||
            userCodes.data.userCodes.length === 0 ? (
              <p className="text-md pt-4 ml-2">No user codes found</p>
            ) : (
              <div className="flex flex-col my-4">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                      <table className="min-w-full divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Name
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Delete
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-gray-200">
                          {userCodes.data.userCodes.map((userCode, i) => (
                            <tr key={`user-code-${i}-${userCode.id}`}>
                              <td className="p-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {userCode.name}
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <button
                                  type="button"
                                  className="text-md hover:text-gray-600"
                                  onClick={async (evt) => {
                                    evt.preventDefault();
                                    try {
                                      const deleteUserCodeRes = await client.mutate<
                                        DeleteUserCodeMutation,
                                        DeleteUserCodeMutationVariables
                                      >({
                                        mutation: DeleteUserCode,
                                        variables: {
                                          id: userCode.id,
                                        },
                                      });
                                      if (deleteUserCodeRes.errors) {
                                        throw new Error(
                                          deleteUserCodeRes.errors.join(', ')
                                        );
                                      }
                                      await sleep(100);
                                      await runUserCodesQuery({});
                                      setUserCode('');
                                      toast(
                                        `deleted user code with name ${userCode.name}`,
                                        {
                                          type: 'success',
                                        }
                                      );
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
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </PrivateRoute>
  );
};

export default Admin;
