
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4">About Dyslexia Support Hub</h1>
            <p className="text-lg text-muted-foreground">
              Empowering individuals with dyslexia through technology and accessible resources.
            </p>
          </div>
          
          <div className="space-y-12">
            <section className="glass-panel p-8 rounded-xl">
              <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
              <p className="text-muted-foreground mb-4">
                At Dyslexia Support Hub, we're dedicated to making reading and learning more accessible for individuals with dyslexia. We believe that dyslexia is not a limitation, but a different way of processing information that comes with unique strengths.
              </p>
              <p className="text-muted-foreground">
                Our mission is to provide tools and resources that work with your unique brain, not against it. We strive to create technology that adapts to your needs, rather than forcing you to adapt to technology.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">Understanding Dyslexia</h2>
              <p className="text-muted-foreground mb-4">
                Dyslexia is a learning difference that affects how the brain processes written and sometimes spoken language. It's not related to intelligence—in fact, many people with dyslexia are highly intelligent and creative.
              </p>
              <p className="text-muted-foreground mb-4">
                People with dyslexia often struggle with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>Decoding words and reading fluently</li>
                <li>Spelling and writing</li>
                <li>Processing and remembering information</li>
                <li>Time management and organization</li>
              </ul>
              <p className="text-muted-foreground">
                However, dyslexia also brings many strengths, including creativity, problem-solving skills, spatial reasoning, and big-picture thinking.
              </p>
            </section>
            
            <section className="glass-panel p-8 rounded-xl">
              <h2 className="text-2xl font-semibold mb-4">Our Approach</h2>
              <p className="text-muted-foreground mb-4">
                We believe that with the right tools and support, individuals with dyslexia can thrive. Our approach focuses on:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li><strong>Accessibility:</strong> Creating technology that adapts to different learning needs</li>
                <li><strong>Empowerment:</strong> Providing resources that help build confidence and independence</li>
                <li><strong>Education:</strong> Sharing knowledge about dyslexia with the wider community</li>
                <li><strong>Innovation:</strong> Continuously improving our tools based on research and feedback</li>
              </ul>
              <p className="text-muted-foreground">
                Our reader tool exemplifies this approach by offering customizable features that adapt to individual preferences and needs.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">Get Involved</h2>
              <p className="text-muted-foreground mb-4">
                We believe in the power of community and collaboration. There are several ways you can get involved with Dyslexia Support Hub:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>Use and share our tools with those who might benefit</li>
                <li>Provide feedback to help us improve</li>
                <li>Suggest resources to add to our collection</li>
                <li>Share your story to inspire others</li>
              </ul>
              <div className="flex justify-center mt-8">
                <Button asChild size="lg" className="rounded-full px-8">
                  <Link to="/reader">
                    Try Our Reader Tool <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
