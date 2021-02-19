import Layout from 'layouts/main';
import {
  VerifyEmailMutation,
  VerifyEmailMutationVariables,
  VerifyEmail,
} from 'lib/generated/datamodel';
import { useRouter } from 'next/dist/client/router';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import * as yup from 'yup';
import { Formik } from 'formik';
import { isLoggedIn } from 'state/auth/getters';
import { thunkGetUser, thunkLogin, thunkLogout } from 'state/auth/thunks';
import { AuthActionTypes } from 'state/auth/types';
import { AppThunkDispatch } from 'state/thunk';
import { client, initializeApolloClient } from 'utils/apollo';
import SEO from 'components/SEO';
import {
  passwordMinLen,
  lowercaseLetterRegex,
  capitalLetterRegex,
  numberRegex,
  specialCharacterRegex,
} from 'shared/variables';
import Link from 'next/link';
import { defaultLoggedInPage } from 'utils/variables';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare global {
  interface Window {
    grecaptcha: any;
  }
}

const Login = (): JSX.Element => {
  const dispatchAuthThunk = useDispatch<AppThunkDispatch<AuthActionTypes>>();

  const [redirect, setRedirect] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      let verifyEmail = false;
      let localToken: string | undefined = undefined;
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('token')) {
        localToken = urlParams.get('token') as string;
      }
      if (urlParams.has('redirect')) {
        setRedirect(decodeURIComponent(urlParams.get('redirect') as string));
      }
      if (urlParams.has('verify_email')) {
        verifyEmail = true;
      }
      if (verifyEmail && localToken !== undefined) {
        try {
          const res = await client.mutate<
            VerifyEmailMutation,
            VerifyEmailMutationVariables
          >({
            mutation: VerifyEmail,
            variables: {
              token: localToken,
            },
          });
          let message = res.data?.verifyEmail;
          if (!message) {
            message = 'email successfully verified';
          }
          toast(message, {
            type: 'success',
          });
          router.push(defaultLoggedInPage);
        } catch (err) {
          toast(err.message, {
            type: 'error',
          });
          return;
        }
      }
      try {
        const loggedIn = await isLoggedIn();
        if (localToken === undefined && loggedIn) {
          router.push(redirect !== null ? redirect : defaultLoggedInPage);
        }
      } catch (err) {
        dispatchAuthThunk(thunkLogout());
      }
    })();
  }, []);

  return (
    <Layout>
      <SEO page="login" />
      <div className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-8 flex justify-center pt-28">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-4xl font-medium text-gray-900">
              Account Login
            </h2>
          </div>
          <Formik
            initialValues={{
              usernameEmail: '',
              password: '',
            }}
            validationSchema={yup.object({
              usernameEmail: yup.string().required('required'),
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
            })}
            onSubmit={(formData, { setSubmitting, setStatus }) => {
              const onError = () => {
                setStatus({ success: false });
                setSubmitting(false);
              };
              if (!window || !window.grecaptcha) {
                toast('cannot find recaptcha', {
                  type: 'error',
                });
                onError();
                return;
              }
              window.grecaptcha.ready(async () => {
                try {
                  if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
                    throw new Error('cannot find recaptcha token');
                  }
                  const recaptchaToken = await window.grecaptcha.execute(
                    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
                    {
                      action: 'login',
                    }
                  );
                  await dispatchAuthThunk(
                    thunkLogin({
                      ...formData,
                      recaptchaToken,
                    })
                  );
                  await initializeApolloClient();
                  await dispatchAuthThunk(thunkGetUser());
                  router.push(
                    redirect !== null ? redirect : defaultLoggedInPage
                  );
                } catch (err) {
                  const errObj: Error = err;
                  toast(errObj.message, {
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
              <form className="mt-8 space-y-6">
                <input type="hidden" name="remember" value="true" />
                <div className="rounded-md shadow-sm -space-y-px">
                  <div>
                    <label htmlFor="email-address" className="sr-only">
                      Email / Username
                    </label>
                    <input
                      id="usernameEmail"
                      name="usernameEmail"
                      type="text"
                      autoComplete="email"
                      required
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="Email / Username"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={values.usernameEmail}
                      disabled={isSubmitting}
                    />
                    <p
                      className={`${
                        touched.usernameEmail && errors.usernameEmail
                          ? ''
                          : 'hidden'
                      } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                    >
                      {errors.usernameEmail}
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
                      autoComplete="current-password"
                      required
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember_me"
                      name="remember_me"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="remember_me"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link href="reset">
                      <a className="font-medium text-indigo-600 hover:text-indigo-500">
                        Forgot your password?
                      </a>
                    </Link>
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
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                      <svg
                        className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    Sign in
                  </button>
                </div>
              </form>
            )}
          </Formik>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
