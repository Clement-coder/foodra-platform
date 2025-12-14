import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border shadow-sm mt-10">
      <div className="container mx-auto px-4 py-6 text-muted-foreground text-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} Foodra Platform. All rights reserved.</p>
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