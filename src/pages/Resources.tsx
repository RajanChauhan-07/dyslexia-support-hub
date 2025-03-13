
import { useEffect } from 'react';
import ResourceCard from '@/components/resources/ResourceCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Resources = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const resources = [
    {
      title: "International Dyslexia Association",
      description: "Research, resources, and support for individuals with dyslexia and their families.",
      link: "https://dyslexiaida.org/",
      category: "Organization"
    },
    {
      title: "Yale Center for Dyslexia & Creativity",
      description: "Information and resources on dyslexia, with a focus on the strengths of dyslexic thinking.",
      link: "https://dyslexia.yale.edu/",
      category: "Research"
    },
    {
      title: "Dyslexia Reading Well",
      description: "A collection of evidence-based strategies and information about dyslexia.",
      link: "https://www.dyslexia-reading-well.com/",
      category: "Educational"
    },
    {
      title: "Understood.org",
      description: "Resources for learning and attention issues, including dyslexia and ADHD.",
      link: "https://www.understood.org/",
      category: "Support"
    },
    {
      title: "Made By Dyslexia",
      description: "Changing the narrative around dyslexia and showcasing its strengths.",
      link: "https://www.madebydyslexia.org/",
      category: "Advocacy"
    },
    {
      title: "Dyslexia Advantage",
      description: "Focuses on the strengths that come with dyslexic processing and thinking.",
      link: "https://www.dyslexicadvantage.org/",
      category: "Strengths"
    },
    {
      title: "Reading Rockets",
      description: "Research-based strategies, lessons, and activities designed to help kids learn to read.",
      link: "https://www.readingrockets.org/",
      category: "Educational"
    },
    {
      title: "Learning Ally",
      description: "Audiobook solution for struggling readers and students with reading deficits.",
      link: "https://learningally.org/",
      category: "Tools"
    },
    {
      title: "Bookshare",
      description: "Accessible online library for people with reading barriers.",
      link: "https://www.bookshare.org/",
      category: "Library"
    },
    {
      title: "Dyslexic Books",
      description: "Books with specialized fonts and formatting for dyslexic readers.",
      link: "https://dyslexicbooks.org/",
      category: "Reading"
    },
    {
      title: "National Center for Learning Disabilities",
      description: "Information and resources on learning disabilities, including dyslexia.",
      link: "https://www.ncld.org/",
      category: "Organization"
    },
    {
      title: "Headstrong Nation",
      description: "Information, resources, and community for adults with dyslexia.",
      link: "https://headstrongnation.org/",
      category: "Community"
    }
  ];

  const categories = Array.from(new Set(resources.map(r => r.category)));
  
  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container px-4 mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-4">Resources & Support</h1>
            <p className="text-lg text-muted-foreground">
              Discover helpful tools, organizations, and information to support your dyslexia journey.
            </p>
          </div>
          
          <Tabs defaultValue="all" className="mb-8">
            <div className="overflow-x-auto pb-2">
              <TabsList className="h-auto p-1">
                <TabsTrigger value="all" className="px-3 py-1.5">All Resources</TabsTrigger>
                {categories.map(category => (
                  <TabsTrigger 
                    key={category} 
                    value={category.toLowerCase()}
                    className="px-3 py-1.5"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            <TabsContent value="all" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resources.map((resource, index) => (
                  <ResourceCard
                    key={index}
                    title={resource.title}
                    description={resource.description}
                    link={resource.link}
                    category={resource.category}
                  />
                ))}
              </div>
            </TabsContent>
            
            {categories.map(category => (
              <TabsContent key={category} value={category.toLowerCase()} className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {resources
                    .filter(r => r.category === category)
                    .map((resource, index) => (
                      <ResourceCard
                        key={index}
                        title={resource.title}
                        description={resource.description}
                        link={resource.link}
                        category={resource.category}
                      />
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
          
          <div className="mt-12 glass-panel p-6 rounded-xl">
            <h2 className="text-xl font-medium mb-4">Submit a Resource</h2>
            <p className="text-muted-foreground mb-4">
              Know of a great resource that should be included here? We're always looking to expand our collection of helpful tools and information.
            </p>
            <p className="text-muted-foreground">
              Please contact us with your suggestions and we'll review them for inclusion in our resource library.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;
