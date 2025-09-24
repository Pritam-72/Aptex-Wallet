import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  Shield, 
  CreditCard, 
  Globe,
  Users,
  Zap
} from 'lucide-react';

const FAQSection = () => {
  const faqs = [
    {
      category: "Getting Started",
      icon: Users,
      questions: [
        {
          question: "How do I create a CrypPal wallet?",
          answer: "Creating a CrypPal wallet is simple and takes less than 2 minutes. Click 'Get Started', follow our secure setup process, and safely store your seed phrase. Your wallet is immediately ready for use with full self-custody."
        },
        {
          question: "Is CrypPal safe to use?",
          answer: "Yes, CrypPal is built with enterprise-grade security. We use non-custodial wallets, meaning you control your private keys. All transactions are secured by the Ethereum blockchain, and we never have access to your funds."
        },
        {
          question: "What cryptocurrencies does CrypPal support?",
          answer: "Currently, CrypPal supports Ethereum (ETH) and ERC-20 tokens. We're actively working on expanding support for Bitcoin, Polygon, and other major cryptocurrencies based on community demand."
        }
      ]
    },
    {
      category: "Payments & Fees",
      icon: CreditCard,
      questions: [
        {
          question: "Are there any fees for using CrypPal?",
          answer: "CrypPal charges zero platform fees. You only pay the standard Ethereum network gas fees for blockchain transactions. There are no monthly fees, setup costs, or hidden charges."
        },
        {
          question: "How fast are payments processed?",
          answer: "Payments are processed instantly on the Ethereum network, typically confirming within 15 seconds to 2 minutes depending on network congestion. You'll see immediate confirmation in the CrypPal interface."
        },
        {
          question: "Can I receive payments from any wallet?",
          answer: "Yes, merchants can receive payments from any Ethereum-compatible wallet including MetaMask, Trust Wallet, Coinbase Wallet, and hardware wallets like Ledger. CrypPal is completely interoperable."
        }
      ]
    },
    {
      category: "For Merchants",
      icon: Globe,
      questions: [
        {
          question: "How do I integrate CrypPal into my business?",
          answer: "Integration is simple: create a merchant account, generate QR codes for your products/services, or use our API for online stores. We provide comprehensive documentation and support throughout the process."
        },
        {
          question: "Do I need technical knowledge to use CrypPal?",
          answer: "No technical knowledge required! Our interface is designed for everyone. Simply create an account, generate QR codes, and start accepting payments. For advanced integrations, our API documentation is developer-friendly."
        },
        {
          question: "Can I convert received crypto to fiat currency?",
          answer: "While CrypPal doesn't provide fiat conversion directly, you maintain full control of your received crypto and can use any exchange or service of your choice to convert to traditional currency if needed."
        }
      ]
    },
    {
      category: "Security & Support",
      icon: Shield,
      questions: [
        {
          question: "What happens if I lose my seed phrase?",
          answer: "Your seed phrase is the only way to recover your wallet. CrypPal cannot recover lost seed phrases as we don't store them. We strongly recommend backing up your seed phrase in multiple secure locations during setup."
        },
        {
          question: "Is customer support available?",
          answer: "Yes, we offer 24/7 customer support through multiple channels including live chat, email, and our comprehensive help center. Our team is always ready to assist with any questions or issues."
        },
        {
          question: "How does CrypPal protect my privacy?",
          answer: "CrypPal is built with privacy-first principles. We use minimal data collection, all transactions are pseudonymous on the blockchain, and we never track your spending patterns or personal financial information."
        }
      ]
    }
  ];

  const [isVisible, setIsVisible] = useState(false);
  const [openItems, setOpenItems] = useState<number[]>([0]); // First item open by default
  const [minimized, setMinimized] = useState<{ [key: number]: boolean }>(() => {
    // All minimized by default
    const state: { [key: number]: boolean } = {};
    for (let i = 0; i < faqs.length; i++) {
      state[i] = true;
    }
    return state;
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('faq-section');
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const toggleMinimize = (categoryIndex: number) => {
    setMinimized(prev => ({ ...prev, [categoryIndex]: !prev[categoryIndex] }));
  };

  return (    <section 
      id="faq-section"
      className="relative w-full py-20 md:py-32 px-6 md:px-12 bg-background overflow-hidden"
    >
      {/* Rounded Container with Black Edges */}
      <div className="absolute inset-x-6 md:inset-x-12 inset-y-8 md:inset-y-12 bg-muted/30 rounded-3xl"></div>
      
      {/* Background Effects */}
      <div className="absolute inset-0 cosmic-grid opacity-10"></div>
      
      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className={`text-center mb-16 transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-[10px] font-medium rounded-full bg-background/80 backdrop-blur text-white border border-border">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
              Support Center
              <HelpCircle className="h-2.5 w-2.5 text-primary" />
            </span>
          </div>
          
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tighter text-foreground mb-6">
            Frequently Asked
            <span className="text-primary block">Questions</span>
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
            Get instant answers to common questions about CrypPal. 
            Can't find what you're looking for? Our support team is here to help.
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => {
            const IconComponent = category.icon;
            const isMinimized = minimized[categoryIndex];
            return (
              <Card
                key={categoryIndex}
                className={`cosmic-glow relative bg-background/80 backdrop-blur-sm border-border transition-all duration-700 delay-${(categoryIndex + 1) * 200} transform ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              >
                {/* Category Header */}
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <IconComponent className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {category.category}
                    </h3>
                  </div>
                  {/* Minimize button: mobile only */}
                  <button
                    className="block md:hidden ml-2 p-1 rounded hover:bg-muted/20 transition-colors"
                    onClick={() => toggleMinimize(categoryIndex)}
                    aria-label={isMinimized ? 'Expand FAQ' : 'Minimize FAQ'}
                  >
                    {isMinimized ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {/* Questions: show if not minimized on mobile, always show on md+ */}
                <div className={`${isMinimized ? 'hidden' : ''} md:block`}> 
                  {category.questions.map((faq, questionIndex) => {
                    const globalIndex = categoryIndex * 10 + questionIndex;
                    const isOpen = openItems.includes(globalIndex);
                    return (
                      <div key={questionIndex}>
                        <button
                          onClick={() => toggleItem(globalIndex)}
                          className="w-full p-6 text-left hover:bg-muted/50 transition-colors duration-200 flex items-center justify-between group"
                        >
                          <span className="text-foreground font-medium group-hover:text-primary transition-colors">
                            {faq.question}
                          </span>
                          <div className="ml-4 flex-shrink-0">
                            {isOpen ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            )}
                          </div>
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-200">
                            <p className="text-muted-foreground leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Contact Support CTA */}
        <div className={`text-center mt-16 transition-all duration-700 delay-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Card className="cosmic-glow relative p-8 bg-primary/5 backdrop-blur-sm border-primary/20 max-w-2xl mx-auto">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-foreground">
                Still Have Questions?
              </h3>
              <p className="text-muted-foreground">
                Our support team is available 24/7 to help you with any questions or concerns. 
                Get personalized assistance from crypto payment experts.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <a 
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=Cryppal9@gmail.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
                >
                  Email Support
                </a>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
