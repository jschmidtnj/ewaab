import Layout from 'layouts/main';
import { useRouter } from 'next/dist/client/router';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import SEO from 'components/SEO';
import { minJWTLen } from 'shared/variables';
import EmailForm from 'components/reset/emailForm';
import PasswordForm from 'components/reset/passwordForm';

const ResetPage = (): JSX.Element => {
  const router = useRouter();
  const [resetToken, setResetToken] = useState<string>('');
  useEffect(() => {
    (async () => {
      const urlParams = new URLSearchParams(window.location.search);
      try {
        if (urlParams.has('token')) {
          const givenToken = urlParams.get('token') as string;
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
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="text-center">
              <Image
                src="/assets/img/logo.png"
                width={60}
                height={60}
                alt="ewaab"
              />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
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
