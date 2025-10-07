/**
 * Home page - Landing page for Concierge.com
 */
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-block animate-bounce">
              <span className="text-8xl">🏆</span>
            </div>
            <h1 className="text-7xl font-black text-white drop-shadow-2xl">
              Concierge.com
            </h1>
            <p className="text-3xl text-blue-100 font-semibold">
              Your Personal AI-Powered Concierge Service
            </p>
            <p className="text-xl text-blue-50 max-w-2xl mx-auto leading-relaxed">
              Manage your finances, health, legal matters, and more—all in one place.
              Get personalized recommendations and AI-powered insights tailored to your needs.
            </p>

            <div className="flex gap-4 justify-center pt-8">
              <Link href="/signup">
                <Button size="lg" className="text-xl px-12 py-8 bg-white text-blue-600 hover:bg-blue-50 shadow-2xl transform hover:scale-105 transition-all">
                  Get Started →
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="text-xl px-12 py-8 border-2 border-white text-white hover:bg-white hover:text-blue-600 shadow-2xl transform hover:scale-105 transition-all">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 py-20">

        {/* Features Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Comprehensive Services
          </h2>
          <p className="text-xl text-center text-gray-600 mb-12">
            Everything you need to manage your life, all in one place
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard 
            icon="💰"
            title="Expense Management"
            description="Track expenses, set budgets, and get AI-powered insights on your spending patterns."
          />
          <FeatureCard 
            icon="📈"
            title="Investment Tracking"
            description="Monitor your portfolio, connect with brokers, and make informed investment decisions."
          />
          <FeatureCard 
            icon="🏥"
            title="Health Services"
            description="Manage prescriptions, track refills, and integrate with major pharmacies."
          />
          <FeatureCard 
            icon="🛡️"
            title="Insurance Hub"
            description="Organize policies, track claims, and connect with insurance providers."
          />
          <FeatureCard 
            icon="⚖️"
            title="Legal Support"
            description="Manage cases, store documents, and connect with law firms."
          />
          <FeatureCard 
            icon="📊"
            title="Tax Planning"
            description="Organize documents, connect with tax providers, and optimize your tax strategy."
          />
          <FeatureCard 
            icon="✈️"
            title="Travel Planning"
            description="Plan trips, book services, and manage all your travel needs."
          />
          <FeatureCard 
            icon="🤖"
            title="AI Agents"
            description="Get personalized assistance from AI agents specialized in each service area."
          />
          <FeatureCard 
            icon="💬"
            title="Messaging"
            description="Communicate with your concierge team through multiple channels."
          />
        </div>
        </div>
      </div>

      {/* Plans Section */}
      <div className="bg-white py-20">
        <div className="mt-32 text-center">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Choose Your Plan
          </h2>
          <p className="text-xl text-gray-600 mb-12">Select the plan that fits your needs and budget</p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <PlanCard 
              name="Basic"
              price={29}
              features={[
                'Core service management',
                'Mobile app access',
                'Email support (24-48 hours)',
                'Basic reporting'
              ]}
            />
            <PlanCard 
              name="Premium"
              price={99}
              features={[
                'All Basic features',
                'Priority support (4-12 hours)',
                'Advanced analytics',
                'AI-powered insights',
                'Custom integrations'
              ]}
              highlighted
            />
            <PlanCard 
              name="Elite"
              price={299}
              features={[
                'All Premium features',
                'White-glove service',
                'Monthly strategy sessions',
                'Direct CPA & legal counsel',
                'Exclusive partner discounts'
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 border border-gray-100">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
      <p className="text-base text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function PlanCard({ name, price, features, highlighted = false }: { 
  name: string; 
  price: number; 
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div className={`bg-white p-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 border-2 ${highlighted ? 'border-blue-500 scale-105' : 'border-gray-200'}`}>
      {highlighted && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold px-4 py-2 rounded-full inline-block mb-6 shadow-lg">
          ⭐ RECOMMENDED
        </div>
      )}
      <h3 className="text-3xl font-black mb-3 text-gray-900">{name}</h3>
      <div className="mb-8">
        <span className="text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">${price}</span>
        <span className="text-xl text-gray-500 ml-2">/month</span>
      </div>
      <ul className="space-y-4 mb-8 text-left">
        {features.map((feature, index) => (
          <li key={index} className="text-base text-gray-700 flex items-start">
            <span className="mr-2 text-green-500 font-bold">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link href="/signup">
        <Button 
          className={`w-full text-lg py-6 font-bold ${highlighted ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl' : ''}`}
          variant={highlighted ? "default" : "outline"}
        >
          Get Started →
        </Button>
      </Link>
    </div>
  );
}
