import Link from "next/link";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border shadow-sm mt-10">
      <div className="container mx-auto px-4 py-6 text-muted-foreground text-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/foodra_logo.jpeg" alt="Foodra Logo" width={44} height={34} className="rounded-bl-2xl rounded-tr-2xl" />
            <p>&copy; {new Date().getFullYear()} Foodra Platform. All rights reserved.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;