import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Star, Quote, Zap, Users } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';

const TestimonialsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [carouselApi, setCarouselApi] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('testimonials-section');
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => {
      setSelectedIndex(carouselApi.selectedScrollSnap());
    };
    carouselApi.on('select', onSelect);
    setSelectedIndex(carouselApi.selectedScrollSnap());
    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Coffee Shop Owner",
      company: "Bean & Brew",
      content: "CrypPal transformed how we accept payments. Zero fees means more profit, and customers love the instant transactions. Setup took less than 10 minutes!",
      rating: 5,
      delay: "delay-200"
    },
    {
      name: "Marcus Rodriguez",
      role: "Freelance Designer",
      company: "Independent",
      content: "Finally, I can spend my crypto earnings directly without converting to fiat. The mobile experience is seamless and the security gives me peace of mind.",
      rating: 5,
      delay: "delay-400"
    },
    {
      name: "Jennifer Walsh",
      role: "E-commerce Manager",
      company: "TechGear Inc",
      content: "Our online store saw a 40% increase in international sales after integrating CrypPal. Global customers can now pay instantly without currency conversion hassles.",
      rating: 5,
      delay: "delay-600"
    },
    {
      name: "David Kim",
      role: "Restaurant Owner",
      company: "Seoul Kitchen",
      content: "The QR code generation is brilliant. Customers scan and pay in seconds. Our average transaction time decreased by 70% compared to traditional payment methods.",
      rating: 5,
      delay: "delay-800"
    },
    {
      name: "Emily Foster",
      role: "Crypto Enthusiast",
      company: "Early Adopter",
      content: "I've been waiting for a solution like this. Non-custodial, secure, and actually usable in real stores. CrypPal makes crypto payments feel natural.",
      rating: 5,
      delay: "delay-1000"
    },
    {
      name: "Alex Thompson",
      role: "Tech Startup Founder",
      company: "InnovateCorp",
      content: "We integrated CrypPal's API for our B2B payments. The developer experience is excellent, and our clients love the transparency of blockchain transactions.",
      rating: 5,
      delay: "delay-1200"
    }
  ];

  useEffect(() => {
    if (!carouselApi) return;
    const interval = setInterval(() => {
      const nextIdx = (carouselApi.selectedScrollSnap() + 1) % testimonials.length;
      carouselApi.scrollTo(nextIdx);
    }, 3000);
    return () => clearInterval(interval);
  }, [carouselApi, testimonials.length]);

  const stats = [
    { value: "10,000+", label: "Active Users" },
    { value: "500+", label: "Merchants" },
    { value: "$2M+", label: "Processed" },
    { value: "99.9%", label: "Uptime" }
  ];

  return (    <section 
      id="testimonials-section"
      className="relative w-full py-20 md:py-32 px-6 md:px-12 bg-background overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 cosmic-grid opacity-20"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className={`text-center mb-16 transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-[10px] font-medium rounded-full bg-muted text-white">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
              User Stories
              <Star className="h-2.5 w-2.5 text-primary" />
            </span>
          </div>
          
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tighter text-foreground mb-6">
            Loved by Users 
            <span className="text-primary block">Worldwide</span>
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
            Discover how CrypPal is transforming businesses and empowering individuals 
            to embrace the future of digital payments.
          </p>
        </div>

        {/* Stats Row */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 transition-all duration-700 delay-300 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials Carousel (Mobile Only) */}
        <div className="block md:hidden relative px-8 mb-12">
          <Carousel className="w-full" setApi={setCarouselApi}>
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index}>
                  <Card
                    className={`cosmic-glow relative p-6 bg-card/50 backdrop-blur-sm border-border hover:shadow-lg transition-all duration-700 group w-full h-80 sm:h-96 ${
                      isVisible ? `opacity-100 translate-y-0 ${testimonial.delay}` : 'opacity-0 translate-y-10'
                    }`}
                  >
                    <div className="flex flex-col h-full justify-between">
                      {/* Top: Quote, Content */}
                      <div>
                        {/* Quote Icon */}
                        <div className="flex justify-between items-start">
                          <Quote className="h-6 w-6 text-primary/60" />
                          {/* Star Rating */}
                          <div className="flex gap-1">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                            ))}
                          </div>
                        </div>
                        {/* Content */}
                        <div className="flex-1">
                          <p className="text-foreground leading-relaxed mb-6 text-sm">
                            "{testimonial.content}"
                          </p>
                        </div>
                      </div>
                      {/* Bottom: Author */}
                      <div className="flex items-center gap-3 pt-4 border-t border-border mt-auto">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">
                            {testimonial.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-sm">
                            {testimonial.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {testimonial.role} • {testimonial.company}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-5 top-1/2 -translate-y-1/2" />
            <CarouselNext className="-right-5 top-1/2 -translate-y-1/2" />
          </Carousel>
          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 mt-4">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  selectedIndex === idx
                    ? 'bg-primary'
                    : 'bg-muted-foreground/30'
                }`}
                onClick={() => carouselApi && carouselApi.scrollTo(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                type="button"
              />
            ))}
          </div>
        </div>

        {/* Testimonials Grid (Desktop/Tablet Only) */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className={`cosmic-glow relative p-6 bg-card/50 backdrop-blur-sm border-border hover:shadow-lg transition-all duration-700 group w-full h-80 sm:h-96 ${
                isVisible ? `opacity-100 translate-y-0 ${testimonial.delay}` : 'opacity-0 translate-y-10'
              }`}
            >
              {/* Quote Icon */}
              <div className="flex justify-between items-start">
                <Quote className="h-6 w-6 text-primary/60" />
                {/* Star Rating */}
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
              </div>
              {/* Content */}
              <div className="flex-1">
                <p className="text-foreground leading-relaxed mb-6 text-sm">
                  "{testimonial.content}"
                </p>
              </div>
              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.role} • {testimonial.company}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom Section */}
        <div className={`text-center transition-all duration-700 delay-1400 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Card className="cosmic-glow relative p-8 bg-primary/5 backdrop-blur-sm border-primary/20 max-w-4xl mx-auto">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold text-foreground">
                Join Our Growing Community
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Be part of the payment revolution. Every day, more businesses and individuals 
                choose CrypPal for their digital payment needs.
              </p>
              
              <div className="flex items-center justify-center gap-2 pt-4">
                <div className="flex -space-x-2">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="h-8 w-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center">
                      <span className="text-xs text-primary font-medium">U</span>
                    </div>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground ml-3">
                  +1,000 new users this week
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
