
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Hero from '@/components/home/Hero';
import FeatureCard from '@/components/home/FeatureCard';
import { 
  BookOpenText, 
  Brain, 
  GanttChartSquare, 
  Lightbulb,
  ArrowRight
} from 'lucide-react';

const Index = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen">
      <Hero />
      
      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Tools to Empower Your Reading</h2>
            <p className="text-muted-foreground text-lg">
              Our specialized features are designed to make reading more accessible and enjoyable for people with dyslexia.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title="Customized Text Display"
              description="Adjust fonts, spacing, and colors to create your ideal reading environment."
              icon={<BookOpenText className="h-6 w-6" />}
            />
            <FeatureCard
              title="Text-to-Speech"
              description="Listen to text being read aloud with natural-sounding voices and adjustable speed."
              icon={<Lightbulb className="h-6 w-6" />}
            />
            <FeatureCard
              title="Learning Resources"
              description="Access guides, strategies, and tools specifically designed for dyslexic readers."
              icon={<Brain className="h-6 w-6" />}
            />
            <FeatureCard
              title="Reading Guides"
              description="Use digital rulers and focus tools to help maintain your place while reading."
              icon={<GanttChartSquare className="h-6 w-6" />}
              className="md:col-span-2 lg:col-span-1"
            />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Reading Experience?</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Our specialized reading tool helps you customize text to your unique needs, making reading more accessible and enjoyable.
            </p>
            <Button asChild size="lg" className="rounded-full px-8">
              <Link to="/reader">
                Try Our Reader Tool <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* About Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">About Dyslexia Support Hub</h2>
                <p className="text-muted-foreground mb-4">
                  We're dedicated to making reading more accessible through technology and education. Our tools are designed specifically for the unique needs of people with dyslexia.
                </p>
                <p className="text-muted-foreground mb-6">
                  Whether you're looking for reading assistance, educational resources, or community support, we're here to help you thrive.
                </p>
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/about">
                    Learn More About Us <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="glass-panel rounded-2xl p-8 h-full">
                <blockquote className="text-lg italic">
                  "Dyslexia is not a disability—it's a different way of thinking. Our mission is to provide tools that work with your unique brain, not against it."
                </blockquote>
                <div className="mt-4 font-medium">— Dyslexia Support Hub Team</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
