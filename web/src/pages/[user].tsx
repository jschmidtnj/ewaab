import PrivateRoute from 'components/PrivateRoute';
import Layout from 'layouts/main';
import SEO from 'components/SEO';
import React, { useEffect, useState } from 'react';
import { ApolloError } from 'apollo-client';
import { capitalizeFirstLetter, getErrorCode } from 'utils/misc';
import statusCodes from 'http-status-codes';
import {
  PublicUser,
  PublicUserFieldsFragment,
  PublicUserQuery,
  PublicUserQueryVariables,
  UserFieldsFragment,
} from 'lib/generated/datamodel';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { RootState } from 'state';
import { client } from 'utils/apollo';
import { isSSR } from 'utils/checkSSR';
import { useRouter } from 'next/dist/client/router';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import Image from 'next/image';
import { getAPIURL } from 'utils/axios';
import { FaFacebook, FaTwitter, FaGithub, FaEnvelope } from 'react-icons/fa';
import { FiFileText } from 'react-icons/fi';
import { IoMdSchool } from 'react-icons/io';
import { GrLocation } from 'react-icons/gr';
import { BsLink45Deg } from 'react-icons/bs';
import { baseFacebook, baseGitHub, baseTwitter } from 'shared/variables';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { defaultMajor } from 'shared/majors';

const avatarWidth = 40;

const UserPage = (): JSX.Element => {
  const currentUser = isSSR
    ? undefined
    : useSelector<RootState, UserFieldsFragment | undefined>(
        (state) => state.authReducer.user
      );
  const [user, setUser] = useState<PublicUserFieldsFragment | undefined>(
    undefined
  );

  const router = useRouter();
  const apiURL = getAPIURL();

  useEffect(() => {
    const splitPath = window.location.pathname.split('/');
    let username: string | undefined = undefined;
    if (splitPath.length === 2) {
      username = splitPath[1];
    } else if (splitPath.length === 3) {
      username = splitPath[2];
    }
    if (currentUser && username === currentUser.username) {
      setUser((currentUser as unknown) as PublicUserFieldsFragment);
    } else if (!isSSR) {
      client
        .query<PublicUserQuery | undefined, PublicUserQueryVariables>({
          query: PublicUser,
          variables: {
            username: username as string,
          },
          fetchPolicy: 'no-cache', // disable cache
        })
        .then((res) => setUser(res.data?.publicUser))
        .catch((err: ApolloError) => {
          const errorCode = getErrorCode(err);
          if (errorCode === statusCodes.NOT_FOUND) {
            router.push('/404');
          } else {
            toast(err.message, {
              type: 'error',
            });
          }
        });
    }
  }, []);
  return (
    <PrivateRoute>
      <Layout>
        <SEO page="user page" />
        <div className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-8 pt-12">
          {!user || !currentUser ? (
            <p className="text-sm">loading...</p>
          ) : (
            <>
              <div className="lg:flex lg:items-center lg:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    {user && user.avatar ? (
                      <LazyLoadImage
                        className="h-5 w-5 rounded-full"
                        alt={`${apiURL}/media/${user.avatar}/blur?auth=${currentUser.mediaAuth}`}
                        height={avatarWidth}
                        src={`${apiURL}/media/${user.avatar}?auth=${currentUser.mediaAuth}`}
                        width={avatarWidth}
                      />
                    ) : (
                      <Image
                        className="h-5 w-5 rounded-full"
                        width={avatarWidth}
                        height={avatarWidth}
                        src="/assets/img/default_avatar.png"
                        alt="avatar"
                      />
                    )}
                    <h2 className="ml-3 inline-block text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                      {user.name}
                    </h2>
                  </div>
                  <div className="mt-2 ml-2 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-3">
                    <div className="mt-1 flex items-center text-gray-500">
                      <a href={`mailto:${user.email}`}>
                        <FaEnvelope className="inline-block mr-2 text-md" />
                        <span className="text-sm">{user.email}</span>
                      </a>
                    </div>
                    {!user.url ? null : (
                      <div className="mt-1 flex items-center text-md text-gray-500">
                        <a href={user.url} target="_blank" rel="noreferrer">
                          <BsLink45Deg className="inline-block mr-1 text-md" />
                          <span className="text-sm">{user.url}</span>
                        </a>
                      </div>
                    )}
                    {!user.resume ? null : (
                      <div className="mt-1 flex items-center text-md text-gray-500">
                        <a
                          href={`${apiURL}/media/${user.resume}?auth=${currentUser.mediaAuth}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FiFileText className="inline-block mr-1 text-md" />
                          <span className="text-sm">resume</span>
                        </a>
                      </div>
                    )}
                    {user.major === defaultMajor ? null : (
                      <div className="mt-1 flex items-center text-md text-gray-500">
                        <IoMdSchool className="inline-block mr-1 text-md" />
                        <span className="text-sm">
                          {capitalizeFirstLetter(user.major)}
                        </span>
                      </div>
                    )}
                    {!user.locationName ? null : (
                      <div className="mt-1 flex items-center text-md text-gray-500">
                        <GrLocation className="inline-block mr-1 text-md" />
                        <span className="text-sm">{user.locationName}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 ml-2 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-2">
                    {!user.github ? null : (
                      <div className="mt-1 flex items-center text-md text-gray-500">
                        <a
                          href={`${baseGitHub}/${user.github}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FaGithub />
                        </a>
                      </div>
                    )}
                    {!user.facebook ? null : (
                      <div className="mt-1 flex items-center text-md text-gray-500">
                        <a
                          href={`${baseFacebook}/${user.facebook}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FaFacebook />
                        </a>
                      </div>
                    )}
                    {!user.twitter ? null : (
                      <div className="mt-1 flex items-center text-md text-gray-500">
                        <a
                          href={`${baseTwitter}/${user.twitter}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FaTwitter />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                {!currentUser ||
                user.username !== currentUser.username ? null : (
                  <div className="mt-5 flex lg:mt-0 lg:ml-4">
                    <span className="sm:ml-3">
                      <button
                        type="button"
                        onClick={(evt) => {
                          evt.preventDefault();
                          router.push('/profile');
                        }}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <svg
                          className="-ml-1 mr-2 h-5 w-5 text-gray-500"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Edit
                      </button>
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-2 ml-2">
                <p>{user.description}</p>
              </div>
              <div className="mt-1 ml-1">
                <hr className="mt-2" />
                <ReactMarkdown plugins={[gfm]} className="mt-4">
                  {user.bio}
                </ReactMarkdown>
              </div>
            </>
          )}
        </div>
      </Layout>
    </PrivateRoute>
  );
};

export default UserPage;
