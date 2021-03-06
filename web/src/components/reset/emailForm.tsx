import {
  SendPasswordResetMutationVariables,
  SendPasswordResetMutation,
  SendPasswordReset,
} from 'lib/generated/datamodel';
import { useRouter } from 'next/dist/client/router';
import { toast } from 'react-toastify';
import * as yup from 'yup';
import { Formik } from 'formik';
import { client } from 'utils/apollo';
import { FunctionComponent } from 'react';

const EmailForm: FunctionComponent = () => {
  const router = useRouter();
  return (
    <Formik
      initialValues={{
        email: '',
      }}
      validationSchema={yup.object({
        email: yup.string().required('required').email('invalid email address'),
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
                action: 'reset',
              })
              .then(async (recaptchaToken: string) => {
                try {
                  const sendPasswordResetRes = await client.mutate<
                    SendPasswordResetMutation,
                    SendPasswordResetMutationVariables
                  >({
                    mutation: SendPasswordReset,
                    variables: {
                      recaptchaToken,
                      email: formData.email,
                    },
                  });
                  if (sendPasswordResetRes.errors) {
                    throw new Error(sendPasswordResetRes.errors.join(', '));
                  }
                  setStatus({ success: true });
                  setSubmitting(false);
                  toast('Check email for reset link', {
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
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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

            <div className="pt-5">
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
          </div>
        </form>
      )}
    </Formik>
  );
};

export default EmailForm;
