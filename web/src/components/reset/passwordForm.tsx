import {
  PasswordResetMutationVariables,
  PasswordResetMutation,
  PasswordReset,
} from 'lib/generated/datamodel';
import { useRouter } from 'next/dist/client/router';
import { toast } from 'react-toastify';
import * as yup from 'yup';
import { Formik } from 'formik';
import { client } from 'utils/apollo';
import {
  passwordMinLen,
  lowercaseLetterRegex,
  capitalLetterRegex,
  numberRegex,
  specialCharacterRegex,
} from 'shared/variables';
import { FunctionComponent } from 'react';

interface PasswordFormArgs {
  resetToken: string;
}

const PasswordForm: FunctionComponent<PasswordFormArgs> = (args) => {
  const router = useRouter();
  return (
    <Formik
      initialValues={{
        password: '',
        confirmedPassword: '',
      }}
      validationSchema={yup.object({
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
          .matches(numberRegex, 'password must contain at least one number')
          .matches(
            specialCharacterRegex,
            'password must contain at least one special character'
          ),
        confirmedPassword: yup.string().when('password', {
          is: (val: string) => val && val.length > 0,
          then: yup
            .string()
            .oneOf([yup.ref('password')], 'Both passwords need to be the same')
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
                action: 'resetConfirm',
              })
              .then(async (recaptchaToken: string) => {
                try {
                  const passwordResetRes = await client.mutate<
                    PasswordResetMutation,
                    PasswordResetMutationVariables
                  >({
                    mutation: PasswordReset,
                    variables: {
                      recaptchaToken,
                      resetToken: args.resetToken,
                      password: formData.password,
                    },
                  });
                  if (passwordResetRes.errors) {
                    throw new Error(passwordResetRes.errors.join(', '));
                  }
                  setStatus({ success: true });
                  setSubmitting(false);
                  toast('Password changed', {
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
        <form className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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

          <div className="pt-5">
            <button
              onClick={(evt) => {
                evt.preventDefault();
                handleSubmit();
              }}
              disabled={isSubmitting}
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Submit
            </button>
          </div>
        </form>
      )}
    </Formik>
  );
};

export default PasswordForm;
