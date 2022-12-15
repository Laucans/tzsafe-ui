const Footer = (_: React.PropsWithChildren) => {
  return (
    <footer className=" border-gray border-t-4 bg-dark text-center bottom-0 w-full absolute lg:text-left">
      <div
        className="text-white text-center p-4"
      >
        © 2022 Copyright
        <a className="text-white" href="https://www.marigold.dev/">
           Marigold
        </a>
      </div>
    </footer>
  );
};
export default Footer;
