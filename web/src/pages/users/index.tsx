import PrivateRoute from 'components/PrivateRoute';
import Layout from 'layouts/main';
import SEO from 'components/SEO';
import Link from 'next/link';

const UsersPage = (): JSX.Element => {
  const users = [];
  return (
    <PrivateRoute>
      <Layout>
        <SEO page="user page" />
        <div className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-8 pt-12">
          <p className="text-sm">
            stuff to go on this page name, major, link to user
          </p>
          {users.length === 0 ? (
            <p className="text-sm">No users found</p>
          ) : (
            <div className="flex flex-col">
              <div>
                <h2 className="mb-4 text-center text-4xl font-medium text-gray-900">
                  Users
                </h2>
              </div>
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Username
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Open</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user, i) => (
                          <tr key={`user-${i}-${user.username}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {user.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link href={`/${user.username}`}>
                                <a className="text-indigo-600 hover:text-indigo-900">
                                  @ {user.username}
                                </a>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </PrivateRoute>
  );
};

export default UsersPage;
