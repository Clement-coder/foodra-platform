import Link from "next/link";
import Image from "next/image";

const SOCIAL_LINKS = {
  linkedin: "https://www.linkedin.com/company/111768974",
  facebook: "https://web.facebook.com/profile.php?id=100063543806997",
  x: "https://x.com",
};

const LinkedInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452H17.21v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.985V9h3.102v1.561h.046c.432-.818 1.487-1.681 3.062-1.681 3.274 0 3.878 2.155 3.878 4.958v6.614zM5.337 7.433a1.8 1.8 0 1 1 0-3.601 1.8 1.8 0 0 1 0 3.601zm1.554 13.019H3.783V9h3.108v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border shadow-sm mt-10">
      <div className="container mx-auto px-4 py-6 text-muted-foreground text-sm">
        {/* Row 1: logo + copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/foodra_logo.jpeg" alt="Foodra Logo" width={44} height={34} className="rounded-bl-2xl rounded-tr-2xl" />
            <p className="text-center sm:text-left">&copy; {new Date().getFullYear()} Foodra Platform. All rights reserved.</p>
          </div>

          {/* Nav links + social */}
          <div className="flex flex-col items-center sm:items-end gap-3">
            {/* Nav links — wrap on small screens */}
            <div className="flex flex-wrap justify-center sm:justify-end gap-x-4 gap-y-1">
              <Link href="/about" className="hover:text-foreground transition-colors whitespace-nowrap">About</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors whitespace-nowrap">Contact</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors whitespace-nowrap">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors whitespace-nowrap">Terms of Service</Link>
            </div>
            {/* Social icons */}
            <div className="flex items-center gap-4">
              <Link href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-foreground transition-colors">
                <LinkedInIcon />
              </Link>
              <Link href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-foreground transition-colors">
                <FacebookIcon />
              </Link>
              <Link href={SOCIAL_LINKS.x} target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="hover:text-foreground transition-colors">
                <XIcon />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
