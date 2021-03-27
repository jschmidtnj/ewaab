import Layout from 'layouts/main';
import {
  RegisterMutationVariables,
  RegisterMutation,
  Register,
} from 'lib/generated/datamodel';
import { useRouter } from 'next/dist/client/router';
import { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import * as yup from 'yup';
import { Formik } from 'formik';
import { isLoggedIn } from 'state/auth/getters';
import { thunkLogout } from 'state/auth/thunks';
import { AuthActionTypes } from 'state/auth/types';
import { AppThunkDispatch } from 'state/thunk';
import { client } from 'utils/apollo';
import SEO from 'components/SEO';
import {
  passwordMinLen,
  lowercaseLetterRegex,
  capitalLetterRegex,
  numberRegex,
  specialCharacterRegex,
  minJWTLen,
  validUsername,
} from 'shared/variables';
import { isSSR } from 'utils/checkSSR';
import { defaultLoggedInPage } from 'utils/variables';

const RegisterPage: FunctionComponent = () => {
  const router = useRouter();
  const [registrationToken, setRegistrationToken] = useState<
    string | undefined
  >(undefined);
  const [providedName, setProvidedName] = useState<string>('');
  const [providedEmail, setProvidedEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  let dispatchAuthThunk: AppThunkDispatch<AuthActionTypes>;
  if (!isSSR) {
    dispatchAuthThunk = useDispatch<AppThunkDispatch<AuthActionTypes>>();
  }
  useEffect(() => {
    (async () => {
      try {
        const loggedIn = await isLoggedIn();
        if (loggedIn) {
          router.push(defaultLoggedInPage);
        }
      } catch (err) {
        dispatchAuthThunk(thunkLogout());
      }
      const urlParams = new URLSearchParams(window.location.search);
      try {
        if (!urlParams.has('t')) {
          throw new Error('no registration token found!');
        }
        const givenToken = urlParams.get('t') as string;
        if (givenToken.length < minJWTLen) {
          throw new Error('invalid registration token provided');
        }
        setRegistrationToken(givenToken);
        if (urlParams.has('name')) {
          setProvidedName(decodeURIComponent(urlParams.get('name') as string));
        }
        if (urlParams.has('email')) {
          setProvidedEmail(
            decodeURIComponent(urlParams.get('email') as string)
          );
        }
        setLoading(false);
      } catch (err) {
        const errObj = err as Error;
        toast(errObj.message, {
          type: 'error',
        });
        router.push('/login');
      }
    })();
  }, []);
  return (
    <Layout>
      <SEO page="register" />
      <div className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-8 flex justify-center pt-28">
        {loading ? (
          <p className="text-sm">loading...</p>
        ) : (
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="mt-6 text-center text-4xl font-medium text-gray-900">
                Sign Up
              </h2>
            </div>
            <Formik
              initialValues={{
                email: providedEmail,
                name: providedName,
                username: '',
                pronouns: '',
                password: '',
                confirmedPassword: '',
              }}
              validationSchema={yup.object({
                email: yup
                  .string()
                  .required('required')
                  .email('invalid email address'),
                username: yup
                  .string()
                  .matches(validUsername, 'username can only contain A-z_-.')
                  .required('required'),
                name: yup.string().required('required'),
                pronouns: yup.string(),
                password: yup
                  .string()
                  .required('required')
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
                confirmedPassword: yup.string().when('password', {
                  is: (val: string) => val && val.length > 0,
                  then: yup
                    .string()
                    .oneOf(
                      [yup.ref('password')],
                      'Both passwords need to be the same'
                    )
                    .required(),
                }), // https://github.com/jaredpalmer/formik/issues/90
              })}
              onSubmit={(formData, { setSubmitting, setStatus }) => {
                if (!window || !window.grecaptcha) {
                  toast('cannot find recaptcha', {
                    type: 'error',
                  });
                  return;
                }
                window.grecaptcha.ready(() => {
                  const onError = () => {
                    setStatus({ success: false });
                    setSubmitting(false);
                  };
                  try {
                    if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
                      throw new Error('cannot find recaptcha token');
                    }
                    window.grecaptcha
                      .execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, {
                        action: 'register',
                      })
                      .then(async (recaptchaToken: string) => {
                        try {
                          const registerRes = await client.mutate<
                            RegisterMutation,
                            RegisterMutationVariables
                          >({
                            mutation: Register,
                            variables: {
                              ...formData,
                              recaptchaToken,
                              registrationToken,
                            },
                          });
                          if (registerRes.errors) {
                            throw new Error(registerRes.errors.join(', '));
                          }
                          setStatus({ success: true });
                          setSubmitting(false);
                          toast('Check email for verification', {
                            type: 'success',
                          });
                          router.push('/login');
                        } catch (err) {
                          toast(err.message, {
                            type: 'error',
                          });
                          onError();
                        }
                      })
                      .catch((err: Error) => {
                        toast(err.message, {
                          type: 'error',
                        });
                        onError();
                      });
                  } catch (err) {
                    toast(err.message, {
                      type: 'error',
                    });
                    onError();
                  }
                });
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
                        id="name"
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
                      <label htmlFor="name" className="sr-only">
                        Pronouns
                      </label>
                      <input
                        id="pronouns"
                        name="pronouns"
                        type="text"
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Pronouns"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.pronouns}
                        disabled={isSubmitting}
                      />
                      <p
                        className={`${
                          touched.pronouns && errors.pronouns ? '' : 'hidden'
                        } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                      >
                        {errors.pronouns}
                      </p>
                    </div>

                    <div>
                      <label htmlFor="username" className="sr-only">
                        Username
                      </label>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Username"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.username}
                        disabled={isSubmitting}
                      />
                      <p
                        className={`${
                          touched.username && errors.username ? '' : 'hidden'
                        } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                      >
                        {errors.username}
                      </p>
                    </div>

                    <div>
                      <label htmlFor="password" className="sr-only">
                        Password
                      </label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Password"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.password}
                        disabled={isSubmitting}
                      />
                      <p
                        className={`${
                          touched.password && errors.password ? '' : 'hidden'
                        } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                      >
                        {errors.password}
                      </p>
                    </div>

                    <div>
                      <label htmlFor="confirmedPassword" className="sr-only">
                        Confirm Password
                      </label>
                      <input
                        id="confirmedPassword"
                        name="confirmedPassword"
                        type="password"
                        required
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Confirm"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.confirmedPassword}
                        disabled={isSubmitting}
                      />
                      <p
                        className={`${
                          touched.confirmedPassword && errors.confirmedPassword
                            ? ''
                            : 'hidden'
                        } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                      >
                        {errors.confirmedPassword}
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
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RegisterPage;
