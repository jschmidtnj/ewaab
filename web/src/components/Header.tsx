import { useRouter } from 'next/dist/client/router';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import Image from 'next/image';
import { capitalizeFirstLetter } from 'utils/misc';
import useOnClickOutside from 'react-cool-onclickoutside';
import sleep from 'shared/sleep';
import { useDispatch, useSelector } from 'react-redux';
import { thunkGetUser, thunkLogout } from 'state/auth/thunks';
import { AuthActionTypes } from 'state/auth/types';
import { AppThunkDispatch } from 'state/thunk';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { RootState } from 'state';
import { uninitializedKey, avatarWidth } from 'shared/variables';
import { getAPIURL } from 'utils/axios';
import { UserFieldsFragment } from 'lib/generated/datamodel';
import { toast } from 'react-toastify';

interface LinkData {
  name: string;
  href: string;
}

const Header = (): JSX.Element => {
  const dispatchAuthThunk = useDispatch<AppThunkDispatch<AuthActionTypes>>();
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const userMenuRef = useOnClickOutside(async (_evt) => {
    await sleep(50);
    if (userMenuOpen) {
      setUserMenuOpen(false);
    }
  });
  const loggedIn = useSelector<RootState, boolean>(
    (state) => state.authReducer.loggedIn
  );
  const user = useSelector<RootState, UserFieldsFragment | undefined>(
    (state) => state.authReducer.user
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const router = useRouter();

  const apiURL = getAPIURL();

  const [paths, setPaths] = useState<LinkData[]>([]);
  useEffect(() => {
    (async () => {
      if (!loggedIn) {
        setPaths([
          {
            name: 'login',
            href: '/login',
          },
        ]);
      } else {
        setPaths([]);
        if (!user) {
          try {
            await dispatchAuthThunk(thunkGetUser());
          } catch (err) {
            const errObj = err as Error;
            toast(errObj.message, {
              type: 'error',
            });
          }
        }
      }
    })();
  }, [loggedIn]);

  const allPathElements: JSX.Element[] = paths.map((pathData, i) => {
    const highlighted = pathData.href === router.pathname;
    return (
      <Link href={pathData.href} key={`path-${i}`}>
        <a
          className={`px-3 py-2 rounded-md font-medium ${
            highlighted
              ? 'bg-gray-900 text-white'
              : 'text-gray-300 hover:bg-gray-700'
          } ${!mobileMenuOpen ? 'text-sm' : 'text-base block'}`}
        >
          <FormattedMessage id={pathData.name}>
            {(messages: string[]) => capitalizeFirstLetter(messages[0])}
          </FormattedMessage>
        </a>
      </Link>
    );
  });

  return (
    <nav className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <button
              onClick={(evt) => {
                evt.preventDefault();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className="hidden h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
            <Link href="/">
              <a className="flex-shrink-0 flex items-center">
                <Image
                  src="/assets/img/logo.svg"
                  width={35}
                  height={35}
                  alt="ewaab"
                />
                <h1 className="hidden lg:block ml-4 text-2xl text-white">
                  EWAAB
                </h1>
              </a>
            </Link>
            <div className="hidden sm:block sm:ml-6">
              <div className="flex space-x-4">{allPathElements}</div>
            </div>
          </div>
          {loggedIn ? (
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
              <span className="sr-only">Open user menu</span>
              <div className="ml-3 relative">
                <div>
                  <button
                    onClick={(evt) => {
                      evt.preventDefault();
                      setUserMenuOpen(!userMenuOpen);
                    }}
                    className="bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                    id="user-menu"
                    aria-haspopup="true"
                  >
                    {!user || user.avatar === uninitializedKey ? (
                      <Image
                        className="h-8 w-8 rounded-full"
                        width={avatarWidth}
                        height={avatarWidth}
                        src="/assets/img/default_avatar.png"
                        alt="avatar"
                      />
                    ) : (
                      <LazyLoadImage
                        className="h-8 w-8 rounded-full"
                        alt={`${apiURL}/media/${user.avatar}/blur?auth=${user.mediaAuth}`}
                        height={avatarWidth}
                        src={`${apiURL}/media/${user.avatar}?auth=${user.mediaAuth}`}
                        width={avatarWidth}
                      />
                    )}
                  </button>
                </div>
                <div
                  className={`${
                    !userMenuOpen ? 'hidden' : ''
                  } origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5`}
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu"
                  ref={userMenuRef}
                >
                  <Link href="/profile">
                    <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <FormattedMessage id="profile">
                        {(messages: string[]) =>
                          capitalizeFirstLetter(messages[0])
                        }
                      </FormattedMessage>
                    </a>
                  </Link>
                  <a
                    href="#"
                    onClick={(evt) => {
                      evt.preventDefault();
                      dispatchAuthThunk(thunkLogout());
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    <FormattedMessage id="sign out">
                      {(messages: string[]) =>
                        capitalizeFirstLetter(messages[0])
                      }
                    </FormattedMessage>
                  </a>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className={`${!mobileMenuOpen ? 'hidden' : ''} sm:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1">{allPathElements}</div>
      </div>
    </nav>
  );
};

export default Header;
