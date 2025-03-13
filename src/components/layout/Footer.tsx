
import { Link } from 'react-router-dom';
import { BookOpenText } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="py-8 border-t border-border/40 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-primary hover:opacity-90 transition-opacity"
              aria-label="Dyslexia Support Hub - Home"
            >
              <BookOpenText className="h-5 w-5" />
              <span className="font-semibold tracking-tight">Dyslexia Support Hub</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Empowering individuals with dyslexia through accessible tools and resources.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-4 text-sm uppercase tracking-wider text-muted-foreground">Site</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm hover:text-primary transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/reader" className="text-sm hover:text-primary transition-colors">Reader</Link>
              </li>
              <li>
                <Link to="/resources" className="text-sm hover:text-primary transition-colors">Resources</Link>
              </li>
              <li>
                <Link to="/about" className="text-sm hover:text-primary transition-colors">About</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-4 text-sm uppercase tracking-wider text-muted-foreground">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm hover:text-primary transition-colors">Dyslexia Research</a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-primary transition-colors">Reading Strategies</a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-primary transition-colors">Support Groups</a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-primary transition-colors">Educational Tools</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-6 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Dyslexia Support Hub. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
