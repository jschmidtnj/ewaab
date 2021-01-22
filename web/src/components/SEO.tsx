import Head from 'next/head';
import PWATags from './PWA';

interface SEOArgs {
  page: string;
}

const SEO = (args: SEOArgs): JSX.Element => {
  return (
    <Head>
      <title>EWAAB | {args.page}</title>
      <meta name="description" content="Encouraging Women Across All Borders" />
      <meta name="keywords" content="lamp" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta
        name="viewport"
        content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"
      />
      <link rel="manifest" href="/manifest.json" />
      <link href="/favicon.ico" rel="icon" type="image/png" sizes="16x16" />
      <link
        href="/favicon-16x16.png"
        rel="icon"
        type="image/png"
        sizes="16x16"
      />
      <link
        href="/favicon-32x32.png"
        rel="icon"
        type="image/png"
        sizes="32x32"
      />
      <meta name="theme-color" content="#317EFB" />
      <PWATags />
      <script
        src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
        defer
      ></script>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}');
            `,
        }}
      />
    </Head>
  );
};

export default SEO;
