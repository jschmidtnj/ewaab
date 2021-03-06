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
  UserType,
  EmailNotificationFrequency,
} from 'lib/generated/datamodel';
import { toast } from 'react-toastify';
import {
  passwordMinLen,
  lowercaseLetterRegex,
  capitalLetterRegex,
  numberRegex,
  specialCharacterRegex,
  validUsername,
  baseFacebook,
  baseTwitter,
  supportedImageMimes,
  baseLinkedIn,
} from 'shared/variables';
import { client } from 'utils/apollo';
import { useDispatch, useSelector } from 'react-redux';
import { thunkGetUser, thunkLogout } from 'state/auth/thunks';
import { AuthActionTypes } from 'state/auth/types';
import { AppThunkDispatch } from 'state/thunk';
import { isSSR } from 'utils/checkSSR';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { RootState } from 'state';
import Image from 'next/image';
import Avatar from 'components/Avatar';
import { getAPIURL } from 'utils/axios';
import DeleteModal from 'components/modals/DeleteModal';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import majors from 'shared/majors';
import { FiFileText } from 'react-icons/fi';
import Select, { ValueType } from 'react-select';
import { capitalizeFirstLetter } from 'utils/misc';
import universities from 'shared/universities';
import Editor from 'components/markdown/Editor';
import { SelectStringObject } from 'utils/variables';

const minSelectSearchLen = 3;

const universityOptions = universities.map(
  (university): SelectStringObject => ({
    label: university,
    value: university,
  })
);

const majorOptions = majors.map(
  (major): SelectStringObject => ({
    label: capitalizeFirstLetter(major),
    value: major,
  })
);

interface SelectEmailNotificationFrequencyObject {
  label: string;
  value: EmailNotificationFrequency;
}

const emailNotificationFrequencyOptions: SelectEmailNotificationFrequencyObject[] = [
  {
    label: 'Daily',
    value: EmailNotificationFrequency.Daily,
  },
  {
    label: 'Weekly',
    value: EmailNotificationFrequency.Weekly,
  },
  {
    label: 'Biweekly',
    value: EmailNotificationFrequency.BiWeekly,
  },
  {
    label: 'Monthly',
    value: EmailNotificationFrequency.Monthly,
  },
  {
    label: 'None',
    value: EmailNotificationFrequency.None,
  },
];

const LocationSelect = dynamic(() => import('components/LocationSelect'), {
  ssr: false,
});

interface LinkSpanArgs {
  link: string;
}
const LinkSpan = ({ link }: LinkSpanArgs): JSX.Element => {
  if (link.length > 0) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm"
      >
        @
      </a>
    );
  }
  return (
    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
      @
    </span>
  );
};

const AccountPage: FunctionComponent = () => {
  let dispatchAuthThunk: AppThunkDispatch<AuthActionTypes>;
  if (!isSSR) {
    dispatchAuthThunk = useDispatch<AppThunkDispatch<AuthActionTypes>>();
  }
  const [avatarInputElem, setAvatarInputElem] = useState<
    HTMLInputElement | undefined
  >(undefined);
  const [previewImage, setPreviewImage] = useState<string>('');

  const [resumeInputElem, setResumeInputElem] = useState<
    HTMLInputElement | undefined
  >(undefined);
  const [previewResume, setPreviewResume] = useState<string>('');

  const user = useSelector<RootState, UserFieldsFragment | undefined>(
    (state) => state.authReducer.user
  );
  const authToken = useSelector<RootState, string | undefined>(
    (state) => state.authReducer.authToken
  );
  const [showAuthToken, setShowAuthToken] = useState<boolean>(false);

  const [locationName, setLocationName] = useState<string>('');
  const [location, setLocation] = useState<string>('');

  const [
    deleteAccountModalIsOpen,
    setDeleteAccountModalIsOpen,
  ] = useState<boolean>(false);
  const toggleDeleteAccountModal = () =>
    setDeleteAccountModalIsOpen(!deleteAccountModalIsOpen);

  useEffect(() => {
    const avatarInputElement = document.createElement('input');
    avatarInputElement.setAttribute('type', 'file');
    avatarInputElement.setAttribute('accept', supportedImageMimes.join(','));
    avatarInputElement.onchange = (_change_evt) => {
      if (avatarInputElement.files.length === 0) {
        setPreviewImage('');
        return;
      }
      const reader = new FileReader();
      reader.onload = (read_event) => {
        setPreviewImage(read_event.target.result as string);
      };
      reader.readAsDataURL(avatarInputElement.files[0]);
    };
    setAvatarInputElem(avatarInputElement);

    const resumeInputElement = document.createElement('input');
    resumeInputElement.setAttribute('type', 'file');
    resumeInputElement.setAttribute(
      'accept',
      'application/pdf,application/msword,text/*'
    );
    resumeInputElement.onchange = (_change_evt) => {
      if (resumeInputElement.files.length === 0) {
        setPreviewResume('');
        return;
      }
      const reader = new FileReader();
      reader.onload = (read_event) => {
        setPreviewResume(read_event.target.result as string);
      };
      reader.readAsDataURL(resumeInputElement.files[0]);
    };
    setResumeInputElem(resumeInputElement);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('dev')) {
      setShowAuthToken(true);
    }
  }, []);

  const [showUniversityOptions, setShowUniversityOptions] = useState<boolean>(
    false
  );
  const [showMajorOptions, setShowMajorOptions] = useState<boolean>(false);

  const apiURL = getAPIURL();

  return (
    <PrivateRoute>
      <Layout>
        <SEO page="profile" />
        <div className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-8 flex justify-center py-12">
          {user === undefined ? (
            <p className="text-sm">loading...</p>
          ) : (
            <div className="md:grid md:grid-cols-4 w-full sm:w-auto md:gap-6">
              <div className="md:col-span-1">
                <h3 className="sm:w-48 text-lg font-medium leading-6 text-gray-900">
                  {user.name}
                  {"'"}s Profile
                </h3>
                <div className="mt-2 mr-3 float-left md:float-right">
                  <Link href={`/${user.username}`}>
                    <a className="font-medium text-indigo-600 hover:text-indigo-500">
                      @ {user.username}
                    </a>
                  </Link>
                </div>
              </div>
              <div className="mt-12 md:mt-5 md:col-span-2">
                <Formik
                  initialValues={{
                    email: user.email,
                    name: user.name,
                    jobTitle: user.jobTitle,
                    url: user.url,
                    facebook: user.facebook,
                    github: user.github,
                    twitter: user.twitter,
                    linkedIn: user.linkedIn,
                    emailNotificationFrequency: user.emailNotificationFrequency,
                    description: user.description,
                    bio: user.bio,
                    major: user.major,
                    university: user.university,
                    pronouns: user.pronouns,
                    mentor:
                      user.type === UserType.User ? user.mentor : undefined,
                    password: '',
                  }}
                  validationSchema={yup.object({
                    email: yup.string().email('invalid email address'),
                    name: yup.string(),
                    jobTitle: yup.string(),
                    url: yup.string().url(),
                    facebook: yup
                      .string()
                      .matches(validUsername, 'invalid facebook account'),
                    github: yup
                      .string()
                      .matches(validUsername, 'invalid github account'),
                    twitter: yup
                      .string()
                      .matches(validUsername, 'invalid twitter account'),
                    linkedIn: yup
                      .string()
                      .matches(validUsername, 'invalid linked-in account'),
                    emailNotificationFrequency: yup.string(),
                    description: yup.string(),
                    bio: yup.string(),
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
                      if (formData.jobTitle !== user.jobTitle) {
                        updates.jobTitle = formData.jobTitle;
                        foundUpdate = true;
                      }
                      if (
                        location.length > 0 &&
                        (location !== user.location ||
                          locationName !== user.locationName)
                      ) {
                        updates.locationName = locationName;
                        updates.location = location;
                        foundUpdate = true;
                      }
                      if (formData.major !== user.major) {
                        updates.major = formData.major;
                        foundUpdate = true;
                      }
                      if (formData.url !== user.url) {
                        updates.url = formData.url;
                        foundUpdate = true;
                      }
                      if (formData.facebook !== user.facebook) {
                        updates.facebook = formData.facebook;
                        foundUpdate = true;
                      }
                      if (formData.github !== user.github) {
                        updates.github = formData.github;
                        foundUpdate = true;
                      }
                      if (formData.twitter !== user.twitter) {
                        updates.twitter = formData.twitter;
                        foundUpdate = true;
                      }
                      if (formData.linkedIn !== user.linkedIn) {
                        updates.linkedIn = formData.linkedIn;
                        foundUpdate = true;
                      }
                      if (
                        formData.emailNotificationFrequency !==
                        user.emailNotificationFrequency
                      ) {
                        updates.emailNotificationFrequency =
                          formData.emailNotificationFrequency;
                        foundUpdate = true;
                      }
                      if (formData.description !== user.description) {
                        updates.description = formData.description;
                        foundUpdate = true;
                      }
                      if (formData.bio !== user.bio) {
                        updates.bio = formData.bio;
                        foundUpdate = true;
                      }
                      if (formData.university !== user.university) {
                        updates.university = formData.university;
                        foundUpdate = true;
                      }
                      if (formData.pronouns !== user.pronouns) {
                        updates.pronouns = formData.pronouns;
                        foundUpdate = true;
                      }
                      if (
                        formData.mentor !== undefined &&
                        formData.mentor !== user.mentor
                      ) {
                        updates.mentor = formData.mentor;
                        foundUpdate = true;
                      }
                      if (resumeInputElem.files.length > 0) {
                        updates.resume = resumeInputElem.files[0];
                        foundUpdate = true;
                      }
                      if (avatarInputElem.files.length > 0) {
                        updates.avatar = avatarInputElem.files[0];
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
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    isSubmitting,
                    setFieldValue,
                    setFieldTouched,
                  }) => (
                    <form onSubmit={handleSubmit}>
                      <div className="shadow sm:rounded-md sm:overflow-hidden">
                        <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                          <div>
                            <label
                              htmlFor="email"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Email
                            </label>
                            <div className="mt-2">
                              <input
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.email}
                                disabled={isSubmitting}
                                type="email"
                                name="email"
                                id="email"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
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
                            <div className="mt-2 flex rounded-md shadow-sm">
                              <input
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.name}
                                disabled={isSubmitting}
                                type="text"
                                name="name"
                                id="name"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
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
                            <label
                              htmlFor="pronouns"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Pronouns
                            </label>
                            <div className="mt-2 flex rounded-md shadow-sm">
                              <input
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.pronouns}
                                disabled={isSubmitting}
                                type="text"
                                name="pronouns"
                                id="pronouns"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                            <p
                              className={`${
                                touched.pronouns && errors.pronouns
                                  ? ''
                                  : 'hidden'
                              } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                            >
                              {errors.pronouns}
                            </p>
                          </div>

                          <div>
                            <label
                              htmlFor="jobTitle"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Job Title
                            </label>
                            <div className="mt-2 flex rounded-md shadow-sm">
                              <input
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.jobTitle}
                                disabled={isSubmitting}
                                type="text"
                                name="jobTitle"
                                id="jobTitle"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                            <p
                              className={`${
                                touched.jobTitle && errors.jobTitle
                                  ? ''
                                  : 'hidden'
                              } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                            >
                              {errors.jobTitle}
                            </p>
                          </div>

                          <div>
                            <label
                              htmlFor="mentor"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Mentor
                            </label>
                            <div className="mt-2 flex rounded-md shadow-sm">
                              <input
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.mentor}
                                disabled={isSubmitting}
                                type="text"
                                name="mentor"
                                id="mentor"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                            <p
                              className={`${
                                touched.mentor && errors.mentor ? '' : 'hidden'
                              } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                            >
                              {errors.mentor}
                            </p>
                          </div>

                          <LocationSelect
                            disabled={isSubmitting}
                            defaultLocation={user.locationName}
                            onChange={(newLocationName, newLocation) => {
                              setLocationName(newLocationName);
                              if (newLocation) {
                                setLocation(newLocation);
                              }
                            }}
                          />

                          <div>
                            <div className="mt-1 rounded-md shadow-sm -space-y-px">
                              <label
                                htmlFor="university"
                                className="mb-2 block text-sm font-medium text-gray-700"
                              >
                                University
                              </label>
                              <Select
                                id="university"
                                name="university"
                                isMulti={false}
                                options={
                                  showUniversityOptions ? universityOptions : []
                                }
                                cacheOptions={true}
                                defaultValue={universityOptions.find(
                                  (elem) => elem.value === user.university
                                )}
                                onInputChange={(newVal) => {
                                  setShowUniversityOptions(
                                    newVal.length >= minSelectSearchLen
                                  );
                                }}
                                noOptionsMessage={() =>
                                  showUniversityOptions
                                    ? 'No universities found'
                                    : `Enter at least ${minSelectSearchLen} characters`
                                }
                                onChange={(
                                  selectedOption: ValueType<
                                    SelectStringObject,
                                    false
                                  >
                                ) => {
                                  setFieldValue(
                                    'university',
                                    selectedOption.value
                                  );
                                }}
                                onBlur={(evt) => {
                                  handleBlur(evt);
                                  setFieldTouched('university', true);
                                }}
                                className={
                                  (touched.university && errors.university
                                    ? 'is-invalid'
                                    : '') + ' select-dropdown'
                                }
                                styles={{
                                  control: (styles) => ({
                                    ...styles,
                                    borderColor:
                                      touched.university && errors.university
                                        ? 'red'
                                        : styles.borderColor,
                                  }),
                                }}
                                invalid={
                                  !!(touched.university && errors.university)
                                }
                                disabled={isSubmitting}
                              />
                            </div>
                            <p
                              className={`${
                                touched.university && errors.university
                                  ? ''
                                  : 'hidden'
                              } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                            >
                              {errors.university}
                            </p>
                          </div>

                          <div>
                            <div className="mt-1 rounded-md shadow-sm -space-y-px">
                              <label
                                htmlFor="major"
                                className="mb-2 block text-sm font-medium text-gray-700"
                              >
                                Major
                              </label>
                              <Select
                                id="major"
                                name="major"
                                isMulti={false}
                                options={showMajorOptions ? majorOptions : []}
                                cacheOptions={true}
                                defaultValue={majorOptions.find(
                                  (elem) => elem.value === user.major
                                )}
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
                                onChange={(
                                  selectedOption: ValueType<
                                    SelectStringObject,
                                    false
                                  >
                                ) => {
                                  setFieldValue('major', selectedOption.value);
                                }}
                                onBlur={(evt) => {
                                  handleBlur(evt);
                                  setFieldTouched('major', true);
                                }}
                                className={
                                  (touched.major && errors.major
                                    ? 'is-invalid'
                                    : '') + ' select-dropdown'
                                }
                                styles={{
                                  control: (styles) => ({
                                    ...styles,
                                    borderColor:
                                      touched.major && errors.major
                                        ? 'red'
                                        : styles.borderColor,
                                  }),
                                }}
                                invalid={!!(touched.major && errors.major)}
                                disabled={isSubmitting}
                              />
                            </div>
                            <p
                              className={`${
                                touched.major && errors.major ? '' : 'hidden'
                              } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                            >
                              {errors.major}
                            </p>
                          </div>

                          <div>
                            <label
                              htmlFor="url"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Website
                            </label>
                            <div className="mt-2 flex rounded-md shadow-sm">
                              <input
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.url}
                                disabled={isSubmitting}
                                type="url"
                                name="url"
                                id="url"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                            <p
                              className={`${
                                touched.url && errors.url ? '' : 'hidden'
                              } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                            >
                              {errors.url}
                            </p>
                          </div>

                          <div>
                            <label
                              htmlFor="facebook"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Facebook
                            </label>
                            <div className="mt-2 flex rounded-md shadow-sm">
                              <LinkSpan
                                link={
                                  values.facebook.length === 0 ||
                                  errors.facebook
                                    ? ''
                                    : `${baseFacebook}/${values.facebook}`
                                }
                              />
                              <input
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.facebook}
                                disabled={isSubmitting}
                                type="text"
                                name="facebook"
                                id="facebook"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-none rounded-r-md"
                              />
                            </div>
                            <p
                              className={`${
                                touched.facebook && errors.facebook
                                  ? ''
                                  : 'hidden'
                              } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                            >
                              {errors.facebook}
                            </p>
                          </div>

                          <div>
                            <label
                              htmlFor="github"
                              className="block text-sm font-medium text-gray-700"
                            >
                              GitHub
                            </label>
                            <div className="mt-2 flex rounded-md shadow-sm">
                              <LinkSpan
                                link={
                                  values.github.length === 0 || errors.github
                                    ? ''
                                    : `https://github.com/${values.github}`
                                }
                              />
                              <input
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.github}
                                disabled={isSubmitting}
                                type="text"
                                name="github"
                                id="github"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-none rounded-r-md"
                              />
                            </div>
                            <p
                              className={`${
                                touched.github && errors.github ? '' : 'hidden'
                              } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                            >
                              {errors.github}
                            </p>
                          </div>

                          <div>
                            <label
                              htmlFor="twitter"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Twitter
                            </label>
                            <div className="mt-2 flex rounded-md shadow-sm">
                              <LinkSpan
                                link={
                                  values.twitter.length === 0 || errors.twitter
                                    ? ''
                                    : `${baseTwitter}/${values.twitter}`
                                }
                              />
                              <input
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.twitter}
                                disabled={isSubmitting}
                                type="text"
                                name="twitter"
                                id="twitter"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-none rounded-r-md"
                              />
                            </div>
                            <p
                              className={`${
                                touched.twitter && errors.twitter
                                  ? ''
                                  : 'hidden'
                              } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                            >
                              {errors.twitter}
                            </p>
                          </div>

                          <div>
                            <label
                              htmlFor="linkedIn"
                              className="block text-sm font-medium text-gray-700"
                            >
                              LinkedIn
                            </label>
                            <div className="mt-2 flex rounded-md shadow-sm">
                              <LinkSpan
                                link={
                                  values.linkedIn.length === 0 ||
                                  errors.linkedIn
                                    ? ''
                                    : `${baseLinkedIn}/${values.linkedIn}`
                                }
                              />
                              <input
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.linkedIn}
                                disabled={isSubmitting}
                                type="text"
                                name="linkedIn"
                                id="linkedIn"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-none rounded-r-md"
                              />
                            </div>
                            <p
                              className={`${
                                touched.linkedIn && errors.linkedIn
                                  ? ''
                                  : 'hidden'
                              } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                            >
                              {errors.linkedIn}
                            </p>
                          </div>

                          <div>
                            <div className="mt-1 rounded-md shadow-sm -space-y-px">
                              <label
                                htmlFor="emailNotificationFrequency"
                                className="mb-2 block text-sm font-medium text-gray-700"
                              >
                                Email Notification Frequency
                              </label>
                              <Select
                                id="emailNotificationFrequency"
                                name="emailNotificationFrequency"
                                isMulti={false}
                                options={emailNotificationFrequencyOptions}
                                cacheOptions={true}
                                defaultValue={emailNotificationFrequencyOptions.find(
                                  (elem) =>
                                    elem.value ===
                                    user.emailNotificationFrequency
                                )}
                                onChange={(
                                  selectedOption: ValueType<
                                    SelectEmailNotificationFrequencyObject,
                                    false
                                  >
                                ) => {
                                  setFieldValue(
                                    'emailNotificationFrequency',
                                    selectedOption.value
                                  );
                                }}
                                onBlur={(evt) => {
                                  handleBlur(evt);
                                  setFieldTouched(
                                    'emailNotificationFrequency',
                                    true
                                  );
                                }}
                                className={
                                  (touched.emailNotificationFrequency &&
                                  errors.emailNotificationFrequency
                                    ? 'is-invalid'
                                    : '') + ' select-dropdown'
                                }
                                styles={{
                                  control: (styles) => ({
                                    ...styles,
                                    borderColor:
                                      touched.emailNotificationFrequency &&
                                      errors.emailNotificationFrequency
                                        ? 'red'
                                        : styles.borderColor,
                                  }),
                                }}
                                invalid={
                                  !!(
                                    touched.emailNotificationFrequency &&
                                    errors.emailNotificationFrequency
                                  )
                                }
                                disabled={isSubmitting}
                              />
                            </div>
                            <p
                              className={`${
                                touched.emailNotificationFrequency &&
                                errors.emailNotificationFrequency
                                  ? ''
                                  : 'hidden'
                              } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                            >
                              {errors.emailNotificationFrequency}
                            </p>
                          </div>

                          <div>
                            <label
                              htmlFor="description"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Description
                            </label>
                            <div className="mt-2 flex rounded-md shadow-sm">
                              <input
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.description}
                                disabled={isSubmitting}
                                type="text"
                                name="description"
                                id="description"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                            <p
                              className={`${
                                touched.description && errors.description
                                  ? ''
                                  : 'hidden'
                              } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                            >
                              {errors.description}
                            </p>
                          </div>

                          <div>
                            <label
                              htmlFor="bio"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Bio
                            </label>
                            <div className="mt-2 flex rounded-md shadow-sm">
                              <Editor
                                value={values.bio}
                                onChange={(newVal) =>
                                  setFieldValue('bio', newVal)
                                }
                              />
                            </div>
                            <p
                              className={`${
                                touched.bio && errors.bio ? '' : 'hidden'
                              } text-red-700 pl-3 pt-1 pb-2 text-sm`}
                            >
                              {errors.bio}
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Resume
                            </label>
                            <div className="mt-2 flex items-center">
                              {!user.resume &&
                              previewResume.length === 0 ? null : (
                                <a
                                  href={
                                    previewResume
                                      ? previewResume
                                      : `${apiURL}/media/${user.resume}`
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <FiFileText className="inline-block text-4xl ml-1" />
                                </a>
                              )}
                              <button
                                onClick={(evt) => {
                                  evt.preventDefault();
                                  resumeInputElem.click();
                                }}
                                type="button"
                                className="ml-7 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                {user.resume ? 'Change' : 'Upload'}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Avatar
                            </label>
                            <div className="mt-2 ml-1 flex items-center">
                              {previewImage.length > 0 ? (
                                <Image
                                  className="rounded-full"
                                  src={previewImage}
                                  width={40}
                                  height={40}
                                />
                              ) : (
                                <Avatar
                                  avatar={user?.avatar}
                                  avatarWidth={40}
                                  className="w-10 h-10"
                                />
                              )}
                              <button
                                onClick={(evt) => {
                                  evt.preventDefault();
                                  avatarInputElem.click();
                                }}
                                type="button"
                                className="ml-6 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                            <div className="mt-2 flex rounded-md shadow-sm">
                              <input
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.password}
                                disabled={isSubmitting}
                                type="password"
                                name="password"
                                id="password"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
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
                              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                                <div className="mt-2 flex rounded-md shadow-sm">
                                  <input
                                    value={authToken}
                                    onChange={(evt) => evt.preventDefault()}
                                    disabled={false}
                                    id="auth"
                                    onClick={(evt) => {
                                      evt.currentTarget.select();
                                    }}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                  />
                                </div>
                              </div>
                            )}

                            <div className="text-center sm:px-6">
                              {!deleteAccountModalIsOpen ? null : (
                                <DeleteModal
                                  title="Delete account"
                                  infoMessage="Are you sure you want to delete your account? All of your
                                    data will be permanently removed. This action cannot be
                                    undone."
                                  toggleModal={toggleDeleteAccountModal}
                                  onSubmit={async () => {
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
                                  }}
                                />
                              )}
                              <button
                                onClick={(evt) => {
                                  evt.preventDefault();
                                  toggleDeleteAccountModal();
                                }}
                                disabled={isSubmitting}
                                className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-700 hover:bg-red-700 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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

export default AccountPage;
