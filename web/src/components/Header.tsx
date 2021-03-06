import { useRouter } from 'next/dist/client/router';
import Link from 'next/link';
import { FunctionComponent, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import Image from 'next/image';
import { capitalizeFirstLetter } from 'utils/misc';
import useOnClickOutside from 'react-cool-onclickoutside';
import sleep from 'shared/sleep';
import { useDispatch, useSelector } from 'react-redux';
import { thunkGetUser, thunkLogout } from 'state/auth/thunks';
import { AuthActionTypes } from 'state/auth/types';
import { AppThunkDispatch } from 'state/thunk';
import Avatar from 'components/Avatar';
import { RootState } from 'state';
import { UserFieldsFragment, UserType } from 'lib/generated/datamodel';
import { toast } from 'react-toastify';
import { getType, getUsername } from 'state/auth/getters';
import {
  allowedVisitorPaths,
  LinkData,
  linkMap,
  loginLink,
  postViewMap,
  accountLink,
  searchLink,
  profilesLink,
  adminLink,
} from 'utils/variables';
import VisibilitySensor from 'react-visibility-sensor';
import { AiOutlineMenu, AiOutlineClose } from 'react-icons/ai';

const avatarWidth = 48;

const Header: FunctionComponent = () => {
  const dispatchAuthThunk = useDispatch<AppThunkDispatch<AuthActionTypes>>();
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const userMenuRef = useOnClickOutside(async (_evt) => {
    await sleep(200);
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

  const [hamburgerIsVisible, setHamburgerVisible] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const router = useRouter();

  const [paths, setPaths] = useState<LinkData[]>([]);
  const [userPaths, setUserPaths] = useState<LinkData[]>([]);
  useEffect(() => {
    (async () => {
      if (!loggedIn) {
        setPaths([loginLink]);
      } else {
        const userType = getType();
        if (userType === UserType.Visitor) {
          setPaths(allowedVisitorPaths);
          return;
        }
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
        const feedPaths = postViewMap[userType].map(
          (postType) => linkMap[postType]
        );
        setPaths([...feedPaths, profilesLink, searchLink]);
        const username = getUsername();
        const userPaths = [
          {
            name: 'profile',
            href: `/${username}`,
          },
          accountLink,
        ];
        if (userType === UserType.Admin) {
          userPaths.push(adminLink);
        }
        setUserPaths(userPaths);
      }
    })();
  }, [loggedIn]);

  const allUserPaths: JSX.Element[] = userPaths.map((pathData, i) => {
    return (
      <Link href={pathData.href} key={`user-path-${i}`}>
        <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          <FormattedMessage id={pathData.name}>
            {(messages: string[]) => capitalizeFirstLetter(messages[0])}
          </FormattedMessage>
        </a>
      </Link>
    );
  });

  const allPathElements: JSX.Element[] = paths.map((pathData, i) => {
    const selected = pathData.href === router.pathname;
    return (
      <Link href={pathData.href} key={`path-${i}`}>
        <a
          className={`px-1 mx-2 py-0.5 rounded-t-md font-medium text-gray-700 ${
            selected ? 'border-b-2 border-blue-500' : 'border-none'
          } ${
            !(mobileMenuOpen && hamburgerIsVisible)
              ? 'text-md inline-block'
              : 'text-base block'
          }`}
        >
          <FormattedMessage id={pathData.name}>
            {(messages: string[]) => capitalizeFirstLetter(messages[0])}
          </FormattedMessage>
        </a>
      </Link>
    );
  });

  return (
    <nav className="bg-white dark:bg-gray-800">
      <div className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          <div className="sm:hidden absolute inset-y-0 left-0 flex items-center">
            <VisibilitySensor
              onChange={setHamburgerVisible}
              partialVisibility={true}
            >
              <button
                onClick={(evt) => {
                  evt.preventDefault();
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
                className="inline-flex items-center justify-center p-2 rounded-md hover:bg-blue-100 focus:ring-2 focus:ring-inset focus:ring-white"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {!mobileMenuOpen ? (
                  <AiOutlineMenu className="block h-6 w-6" />
                ) : (
                  <AiOutlineClose className="block h-6 w-6" />
                )}
              </button>
            </VisibilitySensor>
          </div>
          <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
            <Link href="/">
              <a className="flex-shrink-0 w-28 flex items-center sm:ml-2">
                <Image
                  src="/assets/img/ewaab/logo.png"
                  width={1372}
                  height={345}
                  layout="intrinsic"
                  alt="ewaab"
                />
                <h1 className="hidden ml-4 text-2xl">EWAAB</h1>
              </a>
            </Link>
            <div className="hidden sm:flex ml-8">
              <div className="my-auto">{allPathElements}</div>
            </div>
          </div>
          {loggedIn ? (
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
              <span className="sr-only">Open user menu</span>
              <div className="relative">
                <div>
                  <button
                    onClick={(evt) => {
                      evt.preventDefault();
                      setUserMenuOpen(!userMenuOpen);
                    }}
                    className="focus:bg-gray-800 flex text-sm rounded-full focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                    id="user-menu"
                    aria-haspopup="true"
                  >
                    <Avatar
                      avatar={user ? user.avatar : undefined}
                      avatarWidth={avatarWidth}
                      className="w-12 h-12"
                    />
                  </button>
                </div>
                <div
                  className={`${
                    !userMenuOpen ? 'hidden' : ''
                  } z-40 origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5`}
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu"
                  ref={userMenuRef}
                >
                  {allUserPaths}
                  <button
                    onClick={(evt) => {
                      evt.preventDefault();
                      dispatchAuthThunk(thunkLogout());
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    <FormattedMessage id="sign out">
                      {(messages: string[]) =>
                        capitalizeFirstLetter(messages[0])
                      }
                    </FormattedMessage>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={`${
          !(mobileMenuOpen && hamburgerIsVisible) ? 'hidden' : ''
        } sm:hidden z-30 relative bg-white`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1">{allPathElements}</div>
      </div>
    </nav>
  );
};

export default Header;
