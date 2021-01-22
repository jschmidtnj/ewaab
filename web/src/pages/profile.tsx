import PrivateRoute from 'components/PrivateRoute';
import Layout from 'layouts/main';
import SEO from 'components/SEO';
import * as yup from 'yup';
import { Formik } from 'formik';
import {
  UpdateAccountMutationVariables,
  UpdateAccountMutation,
  UpdateAccount,
  UserFieldsFragment,
  DeleteAccount,
  DeleteAccountMutation,
  DeleteAccountMutationVariables,
} from 'lib/generated/datamodel';
import { toast } from 'react-toastify';
import {
  passwordMinLen,
  lowercaseLetterRegex,
  capitalLetterRegex,
  numberRegex,
  specialCharacterRegex,
  uninitializedKey,
} from 'shared/variables';
import { client } from 'utils/apollo';
import { useDispatch, useSelector } from 'react-redux';
import { thunkGetUser, thunkLogout } from 'state/auth/thunks';
import { AuthActionTypes } from 'state/auth/types';
import { AppThunkDispatch } from 'state/thunk';
import { isSSR } from 'utils/checkSSR';
import React, { useEffect, useState } from 'react';
import { RootState } from 'state';
import Image from 'next/image';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { getAPIURL } from 'utils/axios';
import DeleteAccountModal from 'components/modals/DeleteAccount';
import Link from 'next/link';

const ProfilePage = (): JSX.Element => {
  let dispatchAuthThunk: AppThunkDispatch<AuthActionTypes>;
  if (!isSSR) {
    dispatchAuthThunk = useDispatch<AppThunkDispatch<AuthActionTypes>>();
  }
  const [inputElem, setInputElem] = useState<HTMLInputElement | undefined>(
    undefined
  );
  const [previewImage, setPreviewImage] = useState<string>('');
  const user = useSelector<RootState, UserFieldsFragment | undefined>(
    (state) => state.authReducer.user
  );
  const authToken = useSelector<RootState, string | undefined>(
    (state) => state.authReducer.authToken
  );
  const [showAuthToken, setShowAuthToken] = useState<boolean>(false);

  const [
    deleteAccountModalIsOpen,
    setDeleteAccountModalIsOpen,
  ] = useState<boolean>(false);
  const toggleDeleteAccountModal = () =>
    setDeleteAccountModalIsOpen(!deleteAccountModalIsOpen);

  useEffect(() => {
    const fileInputElement = document.createElement('input');
    fileInputElement.setAttribute('type', 'file');
    fileInputElement.setAttribute('accept', 'image/x-png,image/jpeg');
    fileInputElement.onchange = (_change_evt) => {
      if (fileInputElement.files.length === 0) {
        setPreviewImage('');
        return;
      }
      const reader = new FileReader();
      reader.onload = (read_event) => {
        setPreviewImage(read_event.target.result as string);
      };
      reader.readAsDataURL(fileInputElement.files[0]);
    };
    setInputElem(fileInputElement);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('dev')) {
      setShowAuthToken(true);
    }
  }, []);

  const apiURL = getAPIURL();

  return (
    <PrivateRoute>
      <Layout>
        <SEO page="profile" />
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          {user === undefined ? (
            <p className="text-sm">loading...</p>
          ) : (
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <div className="px-4 sm:px-0">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {user.name}
                    {"'"}s Profile
                  </h3>
                </div>
                <div className="mt-2 float-right">
                  <Link href={`/${user.username}`}>
                    <a className="font-medium text-indigo-600 hover:text-indigo-500">
                      @ {user.username}
                    </a>
                  </Link>
                </div>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <Formik
                  initialValues={{
                    email: user.email,
                    name: user.name,
                    password: '',
                  }}
                  validationSchema={yup.object({
                    email: yup.string().email('invalid email address'),
                    name: yup.string(),
                    password: yup
                      .string()
                      .min(
                        passwordMinLen,
                        `password must be at least ${passwordMinLen} characters long`
                      )
                      .matches(
                        lowercaseLetterRegex,
                        'password must contain at least one lowercase letter'
                      )
                      .matches(
                        capitalLetterRegex,
                        'password must contain at least one uppercase letter'
                      )
                      .matches(
                        numberRegex,
                        'password must contain at least one number'
                      )
                      .matches(
                        specialCharacterRegex,
                        'password must contain at least one special character'
                      ),
                  })}
                  onSubmit={async (formData, { setSubmitting, setStatus }) => {
                    const onError = () => {
                      setStatus({ success: false });
                      setSubmitting(false);
                    };
                    try {
                      const updates: UpdateAccountMutationVariables = {};
                      let foundUpdate = false;
                      if (formData.email && formData.email !== user.email) {
                        updates.email = formData.email;
                        foundUpdate = true;
                      }
                      if (formData.name && formData.name !== user.name) {
                        updates.name = formData.name;
                        foundUpdate = true;
                      }
                      if (inputElem.files.length > 0) {
                        updates.avatar = inputElem.files[0];
                        foundUpdate = true;
                      }
                      if (formData.password) {
                        updates.password = formData.password;
                        foundUpdate = true;
                      }
                      if (!foundUpdate) {
                        throw new Error('nothing changed');
                      }
                      const updateRes = await client.mutate<
                        UpdateAccountMutation,
                        UpdateAccountMutationVariables
                      >({
                        mutation: UpdateAccount,
                        variables: updates,
                      });
                      if (updateRes.errors) {
                        throw new Error(updateRes.errors.join(', '));
                      }
                      setStatus({ success: true });
                      setSubmitting(false);
                      if (updates.email) {
                        toast('Check email for verification', {
                          type: 'success',
                        });
                        dispatchAuthThunk(thunkLogout());
                      } else {
                        await dispatchAuthThunk(thunkGetUser());
                        toast('Update success!', {
                          type: 'success',
                        });
                      }
                    } catch (err) {
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
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    isSubmitting,
                  }) => (
                    <form>
                      <div className="shadow sm:rounded-md sm:overflow-hidden">
                        <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                          <div>
                            <label
                              htmlFor="email"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Email
                            </label>
                            <div className="mt-1">
                              <input
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.email}
                                disabled={isSubmitting}
                                type="email"
                                name="email"
                                id="email"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                            <p
                              className={`${
                                touched.email && errors.email ? '' : 'hidden'
                              } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                            >
                              {errors.email}
                            </p>
                          </div>

                          <div>
                            <label
                              htmlFor="name"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Name
                            </label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                              <input
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.name}
                                disabled={isSubmitting}
                                type="text"
                                name="name"
                                id="name"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                            <p
                              className={`${
                                touched.name && errors.name ? '' : 'hidden'
                              } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                            >
                              {errors.name}
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Avatar
                            </label>
                            <div className="mt-2 flex items-center">
                              {previewImage.length > 0 ? (
                                <Image
                                  className="rounded-full"
                                  src={previewImage}
                                  width={40}
                                  height={40}
                                />
                              ) : user.avatar === uninitializedKey ? (
                                <span className="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                                  <svg
                                    className="h-full w-full text-gray-300"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                  </svg>
                                </span>
                              ) : (
                                <LazyLoadImage
                                  className="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100"
                                  alt={`${apiURL}/media/${user.avatar}/blur?auth=${user.mediaAuth}`}
                                  height={40}
                                  src={`${apiURL}/media/${user.avatar}?auth=${user.mediaAuth}`}
                                  width={40}
                                />
                              )}
                              <button
                                onClick={(evt) => {
                                  evt.preventDefault();
                                  inputElem.click();
                                }}
                                type="button"
                                className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                Change
                              </button>
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="password"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Password
                            </label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                              <input
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.password}
                                disabled={isSubmitting}
                                type="password"
                                name="password"
                                id="password"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                            <p
                              className={`${
                                touched.password && errors.password
                                  ? ''
                                  : 'hidden'
                              } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                            >
                              {errors.password}
                            </p>
                          </div>

                          <div className="text-center sm:px-6">
                            <button
                              type="submit"
                              onClick={(evt) => {
                                evt.preventDefault();
                                handleSubmit();
                              }}
                              disabled={isSubmitting}
                              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Update
                            </button>
                          </div>

                          <hr />

                          <div className="mt-4">
                            {!showAuthToken ? null : (
                              <div>
                                <label
                                  htmlFor="auth"
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  Development Auth Token
                                </label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                  <input
                                    value={authToken}
                                    onChange={(evt) => evt.preventDefault()}
                                    disabled={false}
                                    id="auth"
                                    onClick={(evt) => {
                                      evt.currentTarget.select();
                                    }}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
                                  />
                                </div>
                              </div>
                            )}

                            <div className="text-center sm:px-6">
                              {!deleteAccountModalIsOpen ? null : (
                                <DeleteAccountModal
                                  toggleModal={toggleDeleteAccountModal}
                                  onSubmit={async () => {
                                    try {
                                      const deleteAccountRes = await client.mutate<
                                        DeleteAccountMutation,
                                        DeleteAccountMutationVariables
                                      >({
                                        mutation: DeleteAccount,
                                        variables: {},
                                      });
                                      if (deleteAccountRes.errors) {
                                        throw new Error(
                                          deleteAccountRes.errors.join(', ')
                                        );
                                      }
                                      toast('Deleted Account', {
                                        type: 'error',
                                      });
                                      dispatchAuthThunk(thunkLogout());
                                    } catch (err) {
                                      toast(err.message, {
                                        type: 'error',
                                      });
                                    }
                                  }}
                                />
                              )}
                              <button
                                onClick={(evt) => {
                                  evt.preventDefault();
                                  toggleDeleteAccountModal();
                                }}
                                disabled={isSubmitting}
                                className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-700 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                Delete Account
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </form>
                  )}
                </Formik>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </PrivateRoute>
  );
};

export default ProfilePage;
