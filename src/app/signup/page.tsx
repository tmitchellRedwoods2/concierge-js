/**
 * Signup page with client intake
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form data
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    netWorth: 0,
    annualIncome: 0,
    goals: [] as string[],
    selectedServices: [] as string[],
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError("");
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/login?signup=success");
      } else {
        setError(data.error || "Failed to create account");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">Step 1 of 5: Account Information</div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium">Username</label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => handleInputChange("username", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">Email Address</label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => handleInputChange("password", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
          required
        />
      </div>

      <Button onClick={() => setStep(2)} className="w-full" type="button">
        Next →
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">Step 2 of 5: Financial Profile</div>
      
      <div className="space-y-2">
        <label htmlFor="netWorth" className="text-sm font-medium">Estimated Net Worth ($)</label>
        <Input
          id="netWorth"
          type="number"
          value={formData.netWorth || ""}
          onChange={(e) => handleInputChange("netWorth", parseInt(e.target.value) || 0)}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="annualIncome" className="text-sm font-medium">Annual Income ($)</label>
        <Input
          id="annualIncome"
          type="number"
          value={formData.annualIncome || ""}
          onChange={(e) => handleInputChange("annualIncome", parseInt(e.target.value) || 0)}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={() => setStep(1)} variant="outline" className="flex-1" type="button">
          ← Previous
        </Button>
        <Button onClick={() => setStep(3)} className="flex-1" type="button">
          Next →
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">Step 3 of 5: Goals & Objectives</div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium mb-2">Select your goals:</p>
        {['Wealth Growth', 'Tax Optimization', 'Health Management', 'Estate Planning', 'Travel Planning'].map((goal) => (
          <label key={goal} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.goals.includes(goal)}
              onChange={(e) => {
                if (e.target.checked) {
                  handleInputChange("goals", [...formData.goals, goal]);
                } else {
                  handleInputChange("goals", formData.goals.filter(g => g !== goal));
                }
              }}
              className="rounded"
            />
            <span className="text-sm">{goal}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        <Button onClick={() => setStep(2)} variant="outline" className="flex-1" type="button">
          ← Previous
        </Button>
        <Button onClick={() => setStep(4)} className="flex-1" type="button">
          Next →
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">Step 4 of 5: Service Selection</div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium mb-2">Select services you need:</p>
        {[
          'Expense Tracking',
          'Investment Management',
          'Health Management',
          'Insurance Management',
          'Legal Services',
          'Tax Planning',
          'Travel Planning',
          'AI Concierge'
        ].map((service) => (
          <label key={service} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.selectedServices.includes(service)}
              onChange={(e) => {
                if (e.target.checked) {
                  handleInputChange("selectedServices", [...formData.selectedServices, service]);
                } else {
                  handleInputChange("selectedServices", formData.selectedServices.filter(s => s !== service));
                }
              }}
              className="rounded"
            />
            <span className="text-sm">{service}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        <Button onClick={() => setStep(3)} variant="outline" className="flex-1" type="button">
          ← Previous
        </Button>
        <Button onClick={() => setStep(5)} className="flex-1" type="button">
          Review →
        </Button>
      </div>
    </div>
  );

  const renderStep5 = () => {
    // Calculate recommended plan
    let recommendedPlan = "Basic";
    let planPrice = 29;
    
    if (formData.netWorth > 1000000 || formData.selectedServices.length > 5) {
      recommendedPlan = "Elite";
      planPrice = 299;
    } else if (formData.netWorth > 500000 || formData.selectedServices.length > 3) {
      recommendedPlan = "Premium";
      planPrice = 99;
    }

    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">Step 5 of 5: Review & Complete</div>
        
        <div className="bg-blue-50 p-4 rounded-lg space-y-3">
          <h3 className="font-semibold text-lg">Your Personalized Plan</h3>
          <div className="space-y-1">
            <p className="text-sm"><strong>Recommended Plan:</strong> {recommendedPlan}</p>
            <p className="text-sm"><strong>Monthly Price:</strong> ${planPrice}</p>
            <p className="text-sm"><strong>Annual Price:</strong> ${Math.round(planPrice * 12 * 0.85)} (15% discount)</p>
          </div>
          
          <div className="pt-2 border-t">
            <p className="text-sm"><strong>Selected Services:</strong> {formData.selectedServices.length}</p>
            <p className="text-sm"><strong>Goals:</strong> {formData.goals.length}</p>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={() => setStep(4)} variant="outline" className="flex-1" type="button" disabled={loading}>
            ← Previous
          </Button>
          <Button onClick={handleSubmit} className="flex-1" type="button" disabled={loading}>
            {loading ? "Creating..." : "Complete Signup"}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            📝 Join Concierge.com
          </CardTitle>
          <CardDescription className="text-center">
            Create your account and get personalized recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

