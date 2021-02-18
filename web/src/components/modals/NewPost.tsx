import { Formik, FormikHandlers, FormikHelpers, FormikState } from 'formik';
import {
  AddPost,
  AddPostMutation,
  AddPostMutationVariables,
  PostType,
  UserFieldsFragment,
} from 'lib/generated/datamodel';
import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { client } from 'utils/apollo';
import * as yup from 'yup';
import Avatar from 'components/avatar';
import { useSelector } from 'react-redux';
import { RootState } from 'state';

interface ModalArgs {
  defaultPostType: PostType;
  toggleModal: () => void;
}

const NewPost = (args: ModalArgs): JSX.Element => {
  const user = useSelector<RootState, UserFieldsFragment | undefined>(
    (state) => state.authReducer.user
  );

  const formRef = useRef<
    FormikHelpers<AddPostMutationVariables> &
      FormikState<AddPostMutationVariables> &
      FormikHandlers
  >();
  useEffect(() => {
    formRef.current.setFieldValue('type', args.defaultPostType);
  }, [args.defaultPostType]);

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <div
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-headline"
        >
          <div className="bg-white">
            <div className="sm:items-start">
              <div>
                <div>
                  <h3
                    className="text-lg leading-6 font-medium text-gray-900 p-4"
                    id="modal-headline"
                  >
                    Create a Post
                  </h3>
                  <hr className="mb-2" />
                  <div className="ml-6 flex items-center text-left">
                    <Avatar avatar={user?.avatar} avatarWidth={40} />
                    <p className="inline-block ml-2 font-bold">{user.name}</p>
                  </div>
                </div>
                <div className="px-6 py-2 mb-2 text-center sm:mt-0 sm:text-left">
                  <Formik
                    innerRef={(formRef as unknown) as (instance: any) => void}
                    initialValues={{
                      title: '',
                      content: '',
                      type: args.defaultPostType,
                      link: '',
                    }}
                    validationSchema={yup.object({
                      title: yup.string().required('required'),
                      content: yup.string().required('required'),
                      type: yup.string().required('required'),
                      link: yup.string().url(),
                    })}
                    onSubmit={async (
                      formData,
                      { setSubmitting, setStatus }
                    ) => {
                      const onError = () => {
                        setStatus({ success: false });
                        setSubmitting(false);
                      };
                      try {
                        const variables = {
                          ...formData,
                          link:
                            formData.link.length === 0
                              ? undefined
                              : formData.link,
                        };
                        const addPostRes = await client.mutate<
                          AddPostMutation,
                          AddPostMutationVariables
                        >({
                          mutation: AddPost,
                          variables,
                        });
                        if (addPostRes.errors) {
                          throw new Error(addPostRes.errors.join(', '));
                        }
                        setStatus({ success: true });
                        setSubmitting(false);
                        toast('Added Post', {
                          type: 'success',
                        });
                        args.toggleModal();
                      } catch (err) {
                        console.log(JSON.stringify(err, null, 2));
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
                      handleChange,
                      isSubmitting,
                    }) => (
                      <form>
                        <div className="rounded-md">
                          <div>
                            <label htmlFor="title" className="sr-only">
                              Title
                            </label>
                            <div className="mt-2">
                              <input
                                id="title"
                                name="title"
                                type="text"
                                required
                                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-white font-semibold rounded-md"
                                placeholder="Title"
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.title}
                                disabled={isSubmitting}
                              />
                            </div>
                            <p
                              className={`${
                                touched.title && errors.title ? '' : 'hidden'
                              } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                            >
                              {errors.title}
                            </p>
                          </div>

                          <div>
                            <label htmlFor="content" className="sr-only">
                              Content
                            </label>
                            <div className="mt-2">
                              <textarea
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.content}
                                disabled={isSubmitting}
                                rows={3}
                                name="content"
                                id="content"
                                placeholder="What do you want to talk about?"
                                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-white rounded-md"
                              />
                            </div>
                            <p
                              className={`${
                                touched.content && errors.content
                                  ? ''
                                  : 'hidden'
                              } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                            >
                              {errors.content}
                            </p>
                          </div>

                          <div>
                            <label htmlFor="link" className="sr-only">
                              Link
                            </label>
                            <div className="mt-2">
                              <input
                                id="link"
                                name="link"
                                type="url"
                                required
                                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-white rounded-md"
                                placeholder="Link"
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.link}
                                disabled={isSubmitting}
                              />
                            </div>
                            <p
                              className={`${
                                touched.link && errors.link ? '' : 'hidden'
                              } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                            >
                              {errors.link}
                            </p>
                          </div>
                        </div>
                      </form>
                    )}
                  </Formik>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                onClick={(evt) => {
                  evt.preventDefault();
                  formRef.current.handleSubmit();
                }}
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-700 text-base font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Post
              </button>
              <button
                type="button"
                onClick={(evt) => {
                  evt.preventDefault();
                  args.toggleModal();
                }}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPost;
