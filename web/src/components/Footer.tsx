const Footer = (): JSX.Element => {
  return (
    <footer className="p-4 text-center bg-gray-900 text-gray-100 dark:bg-gray-300 dark:text-gray-900">
      <p>© {new Date().getFullYear()}, EWAAB</p>
    </footer>
  );
};

export default Footer;
