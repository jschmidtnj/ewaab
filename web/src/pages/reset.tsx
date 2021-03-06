import Layout from 'layouts/main';
import { useRouter } from 'next/dist/client/router';
import { FunctionComponent, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import SEO from 'components/SEO';
import { minJWTLen } from 'shared/variables';
import EmailForm from 'components/reset/emailForm';
import PasswordForm from 'components/reset/passwordForm';

const ResetPage: FunctionComponent = () => {
  const router = useRouter();
  const [resetToken, setResetToken] = useState<string>('');
  useEffect(() => {
    (async () => {
      const urlParams = new URLSearchParams(window.location.search);
      try {
        if (urlParams.has('t')) {
          const givenToken = urlParams.get('t') as string;
          if (givenToken.length < minJWTLen) {
            throw new Error('invalid reset token provided');
          }
          setResetToken(givenToken);
        }
      } catch (err) {
        const errObj = err as Error;
        toast(errObj.message, {
          type: 'error',
        });
        router.push('/reset');
      }
    })();
  }, []);
  return (
    <Layout>
      <SEO page="reset" />
      <div className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-8 flex justify-center pt-28">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-4xl font-medium text-gray-900">
              Reset Password
            </h2>
          </div>
          {resetToken.length === 0 ? (
            <EmailForm />
          ) : (
            <PasswordForm resetToken={resetToken} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ResetPage;
