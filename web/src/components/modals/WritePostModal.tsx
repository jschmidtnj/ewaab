import { Formik, FormikHandlers, FormikHelpers, FormikState } from 'formik';
import {
  AddPost,
  AddPostMutation,
  AddPostMutationVariables,
  PostType,
  PostUpdateData,
  PostUpdateDataQuery,
  PostUpdateDataQueryVariables,
  UserFieldsFragment,
} from 'lib/generated/datamodel';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { client } from 'utils/apollo';
import * as yup from 'yup';
import Avatar from 'components/Avatar';
import { useSelector } from 'react-redux';
import { RootState } from 'state';
import NextImage from 'next/image';
import { BsFillImageFill, BsPencil } from 'react-icons/bs';
import { FaTimes } from 'react-icons/fa';
import { FiFileText } from 'react-icons/fi';
import { postMediaWidth } from 'shared/variables';
import isDebug from 'utils/mode';

interface ModalArgs {
  defaultPostType: PostType;
  toggleModal: () => void;
  onSubmit: () => Promise<void>;
  updateID?: string;
}

interface PreviewImageData {
  preview: string;
  width: number;
  height: number;
}

const WritePostModal = (args: ModalArgs): JSX.Element => {
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

  const [imageInputElem, setImageInputElem] = useState<
    HTMLInputElement | undefined
  >(undefined);
  const [previewImage, setPreviewImage] = useState<
    PreviewImageData | undefined
  >(undefined);

  const [fileInputElem, setFileInputElem] = useState<
    HTMLInputElement | undefined
  >(undefined);
  const [fileName, setFileName] = useState<string>('');
  const [previewFile, setPreviewFile] = useState<string>('');

  useEffect(() => {
    const imageElem = document.createElement('input');
    imageElem.setAttribute('type', 'file');
    imageElem.setAttribute('accept', 'image/jpeg,image/png');
    imageElem.onchange = (_change_evt) => {
      if (imageElem.files.length === 0) {
        setPreviewImage(undefined);
        imageElem.value = '';
        return;
      }
      if (fileElem && fileElem.files.length > 0) {
        setFileName('');
        setPreviewFile('');
        fileElem.value = '';
      }
      const reader = new FileReader();
      reader.onload = (readEvt) => {
        const image = new Image();
        const imagePreview = readEvt.target.result as string;
        image.onload = () => {
          const scaleFactor = postMediaWidth / image.width;
          setPreviewImage({
            preview: imagePreview,
            height: image.height * scaleFactor,
            width: image.width * scaleFactor,
          });
        };
        image.src = imagePreview;
      };
      reader.readAsDataURL(imageElem.files[0]);
    };
    setImageInputElem(imageElem);

    const fileElem = document.createElement('input');
    fileElem.setAttribute('type', 'file');
    fileElem.setAttribute('accept', '*');
    fileElem.onchange = (_change_evt) => {
      console.log('found file');
      if (imageElem && imageElem.files.length > 0) {
        console.log('delete image');
        setPreviewImage(undefined);
        imageElem.value = '';
      }
      const reader = new FileReader();
      reader.onload = (read_event) => {
        setPreviewFile(read_event.target.result as string);
        setFileName(fileElem.value.split(/[\\/]/).pop());
      };
      reader.readAsDataURL(fileElem.files[0]);
    };
    setFileInputElem(fileElem);

    // handle update data
    if (args.updateID) {
      (async () => {
        try {
          const updateDataRes = await client.query<
            PostUpdateDataQuery,
            PostUpdateDataQueryVariables
          >({
            query: PostUpdateData,
            fetchPolicy: isDebug() ? 'no-cache' : 'cache-first', // disable cache if in debug
          });
          if (updateDataRes.errors) {
            throw new Error(updateDataRes.errors.join(', '));
          }
          // TODO - set update data, set preview image / file download. height of image?
        } catch (err) {
          toast(err.message, {
            type: 'error',
          });
        }
      })();
    }
  }, []);

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-2 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
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
                        args.onSubmit();
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
            {!previewImage ? null : (
              <>
                <hr />
                <div className="my-4">
                  <div className="flex justify-center text-2xl ml-36 text-gray-300">
                    <button
                      className="absolute z-10 mt-2 rounded-full bg-gray-700 p-1"
                      onClick={(evt) => {
                        evt.preventDefault();
                        setPreviewImage(undefined);
                        imageInputElem.value = '';
                      }}
                    >
                      <FaTimes />
                    </button>
                    <button
                      className="ml-20 absolute z-10 mt-2 rounded-full bg-gray-700 p-1"
                      onClick={(evt) => {
                        evt.preventDefault();
                        imageInputElem.click();
                      }}
                    >
                      <BsPencil />
                    </button>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="bg-gray-200 p-4 rounded-xl">
                      <NextImage
                        src={previewImage.preview}
                        width={previewImage.width}
                        height={previewImage.height}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
            {fileName.length === 0 ? null : (
              <>
                <hr />
                <div className="my-4 flex items-center justify-center">
                  <div className="bg-gray-100 p-4 rounded-md">
                    <div className="flex justify-end text-2xl text-gray-300">
                      <button
                        className="absolute z-10 rounded-full bg-gray-700 p-1"
                        onClick={(evt) => {
                          evt.preventDefault();
                          fileInputElem.click();
                        }}
                      >
                        <BsPencil />
                      </button>
                      <button
                        className="mr-10 absolute z-10 rounded-full bg-gray-700 p-1"
                        onClick={(evt) => {
                          evt.preventDefault();
                          setFileName('');
                          setPreviewFile('');
                          fileInputElem.value = '';
                        }}
                      >
                        <FaTimes />
                      </button>
                    </div>
                    <a
                      href={previewFile}
                      target="_blank"
                      rel="noreferrer"
                      className="mr-36"
                    >
                      <FiFileText className="inline-block text-4xl mr-1" />
                      <span className="text-sm">{fileName}</span>
                    </a>
                  </div>
                </div>
              </>
            )}
            <div className="bg-gray-50 px-4 py-3 grid grid-cols-2 items-center">
              <div className="col-start-1 col-auto text-left">
                <button
                  onClick={(evt) => {
                    evt.preventDefault();
                    imageInputElem.click();
                  }}
                  type="button"
                  className="text-2xl mr-2 sm:ml-2 text-gray-500"
                >
                  <BsFillImageFill />
                </button>
                <button
                  onClick={(evt) => {
                    evt.preventDefault();
                    fileInputElem.click();
                  }}
                  type="button"
                  className="text-2xl ml-2 text-gray-500"
                >
                  <FiFileText />
                </button>
              </div>
              <div className="col-start-2 col-auto text-right">
                <button
                  type="button"
                  onClick={(evt) => {
                    evt.preventDefault();
                    args.toggleModal();
                  }}
                  className="mt-2 text-sm rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={(evt) => {
                    evt.preventDefault();
                    formRef.current.handleSubmit();
                  }}
                  type="submit"
                  className="mt-2 ml-2 text-sm rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-700 font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritePostModal;
