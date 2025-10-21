import { FOOTER_HEIGHT } from '@/constants';
import Link from 'next/link';

const Footer = () => (
  <footer className="footer items-center p-10 bg-neutral text-neutral-content" style={{ height: FOOTER_HEIGHT }}>
    <div className="items-center grid-flow-col">
      <Link href="/" className="font-bold text-xl">
        CollabBoard
      </Link>
      <p>Built with FastAPI & Next</p>
    </div>
  </footer>
);

export default Footer;
