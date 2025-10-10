/**
 * Tax Management page
 */
"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  FileText, 
  DollarSign,
  Users,
  Plus,
  Calendar,
  TrendingUp,
  AlertCircle,
  Trash2
} from "lucide-react";

export default function TaxPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // State management
  const [taxReturns, setTaxReturns] = useState<any[]>([]);
  const [deductions, setDeductions] = useState<any[]>([]);
  const [taxProfessionals, setTaxProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [showAddReturn, setShowAddReturn] = useState(false);
  const [newReturn, setNewReturn] = useState({
    taxYear: new Date().getFullYear().toString(),
    filingStatus: "SINGLE",
    status: "NOT_STARTED",
    filingMethod: "E_FILE",
    dueDate: `${new Date().getFullYear()}-04-15`,
    wages: "",
    selfEmploymentIncome: "",
    investmentIncome: "",
    rentalIncome: "",
    retirementIncome: "",
    otherIncome: "",
    federalTaxWithheld: "",
    estimatedTaxPaid: "",
    notes: ""
  });

  // Deduction form state
  const [showAddDeduction, setShowAddDeduction] = useState(false);
  const [newDeduction, setNewDeduction] = useState({
    taxYear: new Date().getFullYear().toString(),
    category: "BUSINESS_EXPENSE",
    description: "",
    amount: "",
    date: "",
    vendor: "",
    paymentMethod: "",
    businessPurpose: "",
    mileage: "",
    notes: ""
  });

  // Calculator state
  const [calculator, setCalculator] = useState({
    taxYear: new Date().getFullYear().toString(),
    filingStatus: "SINGLE",
    income: "",
    deductions: "",
    credits: "",
    withheld: "",
    estimatedPayments: ""
  });
  const [calculatorResult, setCalculatorResult] = useState<any>(null);

  // Tax professional search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [minRating, setMinRating] = useState("");

  // Load data on component mount
  useEffect(() => {
    loadTaxReturns();
    loadDeductions();
    loadTaxProfessionals();
  }, []);

  // Reload tax professionals when search/filter parameters change
  useEffect(() => {
    loadTaxProfessionals();
  }, [searchTerm, selectedSpecialty, minRating]);

  const loadTaxReturns = async () => {
    try {
      const response = await fetch('/api/tax/returns');
      if (response.ok) {
        const data = await response.json();
        setTaxReturns(data.returns || []);
      }
    } catch (error) {
      console.error('Failed to load tax returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTaxReturn = async () => {
    if (!newReturn.taxYear || !newReturn.filingStatus || !newReturn.dueDate) {
      alert('Please fill in Tax Year, Filing Status, and Due Date');
      return;
    }

    try {
      const returnData = {
        ...newReturn,
        wages: newReturn.wages || 0,
        selfEmploymentIncome: newReturn.selfEmploymentIncome || 0,
        investmentIncome: newReturn.investmentIncome || 0,
        rentalIncome: newReturn.rentalIncome || 0,
        retirementIncome: newReturn.retirementIncome || 0,
        otherIncome: newReturn.otherIncome || 0,
        federalTaxWithheld: newReturn.federalTaxWithheld || 0,
        estimatedTaxPaid: newReturn.estimatedTaxPaid || 0,
        notes: newReturn.notes || undefined
      };
      
      const response = await fetch('/api/tax/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Tax return created successfully!');
        await loadTaxReturns();
        setShowAddReturn(false);
        setNewReturn({
          taxYear: new Date().getFullYear().toString(),
          filingStatus: "SINGLE",
          status: "NOT_STARTED",
          filingMethod: "E_FILE",
          dueDate: `${new Date().getFullYear()}-04-15`,
          wages: "",
          selfEmploymentIncome: "",
          investmentIncome: "",
          rentalIncome: "",
          retirementIncome: "",
          otherIncome: "",
          federalTaxWithheld: "",
          estimatedTaxPaid: "",
          notes: ""
        });
      } else {
        alert(`Error: ${data.error || 'Failed to create tax return'}`);
      }
    } catch (error) {
      console.error('Failed to create tax return:', error);
      alert('Network error. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_STARTED': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'READY_TO_FILE': return 'bg-yellow-100 text-yellow-800';
      case 'FILED': return 'bg-green-100 text-green-800';
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'AMENDED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFilingStatusLabel = (status: string) => {
    switch (status) {
      case 'SINGLE': return 'Single';
      case 'MARRIED_FILING_JOINTLY': return 'Married Filing Jointly';
      case 'MARRIED_FILING_SEPARATELY': return 'Married Filing Separately';
      case 'HEAD_OF_HOUSEHOLD': return 'Head of Household';
      case 'QUALIFYING_WIDOW': return 'Qualifying Widow(er)';
      default: return status;
    }
  };

  const loadDeductions = async () => {
    try {
      const response = await fetch('/api/tax/deductions');
      if (response.ok) {
        const data = await response.json();
        setDeductions(data.deductions || []);
      }
    } catch (error) {
      console.error('Failed to load deductions:', error);
    }
  };

  const addDeduction = async () => {
    if (!newDeduction.description || !newDeduction.amount || !newDeduction.date) {
      alert('Please fill in Description, Amount, and Date');
      return;
    }

    try {
      const deductionData = {
        ...newDeduction,
        amount: parseFloat(newDeduction.amount),
        mileage: newDeduction.mileage ? parseFloat(newDeduction.mileage) : undefined,
        vendor: newDeduction.vendor || undefined,
        paymentMethod: newDeduction.paymentMethod || undefined,
        businessPurpose: newDeduction.businessPurpose || undefined,
        notes: newDeduction.notes || undefined
      };
      
      const response = await fetch('/api/tax/deductions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deductionData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Deduction added successfully!');
        await loadDeductions();
        setShowAddDeduction(false);
        setNewDeduction({
          taxYear: new Date().getFullYear().toString(),
          category: "BUSINESS_EXPENSE",
          description: "",
          amount: "",
          date: "",
          vendor: "",
          paymentMethod: "",
          businessPurpose: "",
          mileage: "",
          notes: ""
        });
      } else {
        alert(`Error: ${data.error || 'Failed to add deduction'}`);
      }
    } catch (error) {
      console.error('Failed to add deduction:', error);
      alert('Network error. Please try again.');
    }
  };

  const deleteDeduction = async (deductionId: string) => {
    if (!confirm('Are you sure you want to delete this deduction?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tax/deductions?id=${deductionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Deduction deleted successfully!');
        await loadDeductions();
      } else {
        alert('Failed to delete deduction');
      }
    } catch (error) {
      console.error('Failed to delete deduction:', error);
      alert('Network error. Please try again.');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'MORTGAGE_INTEREST': return '🏠';
      case 'PROPERTY_TAX': return '🏛️';
      case 'CHARITABLE': return '❤️';
      case 'MEDICAL': return '🏥';
      case 'STATE_LOCAL_TAX': return '📊';
      case 'BUSINESS_EXPENSE': return '💼';
      case 'HOME_OFFICE': return '🖥️';
      case 'VEHICLE': return '🚗';
      case 'EDUCATION': return '📚';
      case 'RETIREMENT': return '💰';
      default: return '📝';
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const loadTaxProfessionals = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedSpecialty) params.append('specialty', selectedSpecialty);
      if (minRating) params.append('minRating', minRating);
      
      const response = await fetch(`/api/tax/professionals?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTaxProfessionals(data.professionals || []);
      }
    } catch (error) {
      console.error('Failed to load tax professionals:', error);
    }
  };

  const saveEstimateAsReturn = async () => {
    if (!calculatorResult) {
      alert('Please calculate your tax estimate first');
      return;
    }

    try {
      const returnData = {
        taxYear: parseInt(calculator.taxYear),
        filingStatus: calculator.filingStatus,
        status: 'IN_PROGRESS',
        filingMethod: 'E_FILE',
        dueDate: `${calculator.taxYear}-04-15`,
        wages: calculatorResult.income,
        selfEmploymentIncome: 0,
        investmentIncome: 0,
        rentalIncome: 0,
        retirementIncome: 0,
        otherIncome: 0,
        federalTaxWithheld: calculatorResult.withheld,
        estimatedTaxPaid: calculatorResult.estimatedPayments,
        notes: `Estimate created from calculator on ${new Date().toLocaleDateString()}`
      };
      
      const response = await fetch('/api/tax/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Tax estimate saved as a return!');
        await loadTaxReturns();
      } else {
        alert(`Error: ${data.error || 'Failed to save estimate'}`);
      }
    } catch (error) {
      console.error('Failed to save estimate:', error);
      alert('Network error. Please try again.');
    }
  };

  const calculateTax = () => {
    const income = parseFloat(calculator.income) || 0;
    const deductions = parseFloat(calculator.deductions) || 0;
    const credits = parseFloat(calculator.credits) || 0;
    const withheld = parseFloat(calculator.withheld) || 0;
    const estimatedPayments = parseFloat(calculator.estimatedPayments) || 0;

    // 2024 Standard Deductions
    const standardDeductions: any = {
      'SINGLE': 14600,
      'MARRIED_FILING_JOINTLY': 29200,
      'MARRIED_FILING_SEPARATELY': 14600,
      'HEAD_OF_HOUSEHOLD': 21900,
      'QUALIFYING_WIDOW': 29200
    };

    const standardDeduction = standardDeductions[calculator.filingStatus] || 14600;
    const totalDeductions = deductions > 0 ? deductions : standardDeduction;
    const taxableIncome = Math.max(0, income - totalDeductions);

    // 2024 Tax Brackets (simplified)
    let taxLiability = 0;
    
    if (calculator.filingStatus === 'SINGLE') {
      if (taxableIncome <= 11600) {
        taxLiability = taxableIncome * 0.10;
      } else if (taxableIncome <= 47150) {
        taxLiability = 1160 + (taxableIncome - 11600) * 0.12;
      } else if (taxableIncome <= 100525) {
        taxLiability = 5426 + (taxableIncome - 47150) * 0.22;
      } else if (taxableIncome <= 191950) {
        taxLiability = 17168.50 + (taxableIncome - 100525) * 0.24;
      } else if (taxableIncome <= 243725) {
        taxLiability = 39110.50 + (taxableIncome - 191950) * 0.32;
      } else if (taxableIncome <= 609350) {
        taxLiability = 55678.50 + (taxableIncome - 243725) * 0.35;
      } else {
        taxLiability = 183647.25 + (taxableIncome - 609350) * 0.37;
      }
    } else if (calculator.filingStatus === 'MARRIED_FILING_JOINTLY' || calculator.filingStatus === 'QUALIFYING_WIDOW') {
      if (taxableIncome <= 23200) {
        taxLiability = taxableIncome * 0.10;
      } else if (taxableIncome <= 94300) {
        taxLiability = 2320 + (taxableIncome - 23200) * 0.12;
      } else if (taxableIncome <= 201050) {
        taxLiability = 10852 + (taxableIncome - 94300) * 0.22;
      } else if (taxableIncome <= 383900) {
        taxLiability = 34337 + (taxableIncome - 201050) * 0.24;
      } else if (taxableIncome <= 487450) {
        taxLiability = 78221 + (taxableIncome - 383900) * 0.32;
      } else if (taxableIncome <= 731200) {
        taxLiability = 111357 + (taxableIncome - 487450) * 0.35;
      } else {
        taxLiability = 196669.50 + (taxableIncome - 731200) * 0.37;
      }
    } else {
      // HEAD_OF_HOUSEHOLD or MARRIED_FILING_SEPARATELY (simplified)
      if (taxableIncome <= 16550) {
        taxLiability = taxableIncome * 0.10;
      } else if (taxableIncome <= 63100) {
        taxLiability = 1655 + (taxableIncome - 16550) * 0.12;
      } else if (taxableIncome <= 100500) {
        taxLiability = 7241 + (taxableIncome - 63100) * 0.22;
      } else if (taxableIncome <= 191950) {
        taxLiability = 15469 + (taxableIncome - 100500) * 0.24;
      } else if (taxableIncome <= 243700) {
        taxLiability = 37417 + (taxableIncome - 191950) * 0.32;
      } else if (taxableIncome <= 609350) {
        taxLiability = 53977 + (taxableIncome - 243700) * 0.35;
      } else {
        taxLiability = 181954.50 + (taxableIncome - 609350) * 0.37;
      }
    }

    // Apply credits
    const taxAfterCredits = Math.max(0, taxLiability - credits);
    
    // Calculate refund or amount owed
    const totalPayments = withheld + estimatedPayments;
    const refundOrOwed = totalPayments - taxAfterCredits;

    setCalculatorResult({
      income,
      standardDeduction,
      totalDeductions,
      taxableIncome,
      taxLiability,
      credits,
      taxAfterCredits,
      withheld,
      estimatedPayments,
      totalPayments,
      refundOrOwed,
      effectiveTaxRate: income > 0 ? (taxAfterCredits / income * 100).toFixed(2) : 0
    });
  };

  // Calculate summary statistics
  const currentYear = new Date().getFullYear();
  const currentYearReturn = taxReturns.find(r => r.taxYear === currentYear);
  const totalRefunds = taxReturns.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
  const totalOwed = taxReturns.reduce((sum, r) => sum + (r.amountOwed || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">🏆 Concierge.com</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {session?.user?.name}
              </span>
              <Button
                onClick={() => signOut({ callbackUrl: '/' })}
                variant="outline"
                size="sm"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Navigation Tabs */}
      <div className="bg-gray-50 border-b">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-1 py-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="whitespace-nowrap text-xs px-3 py-2">
              🏠 Dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/expenses")} className="whitespace-nowrap text-xs px-3 py-2">
              💰 Expenses
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/investments")} className="whitespace-nowrap text-xs px-3 py-2">
              📈 Investments
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/health")} className="whitespace-nowrap text-xs px-3 py-2">
              🏥 Health
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/insurance")} className="whitespace-nowrap text-xs px-3 py-2">
              🛡️ Insurance
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/legal")} className="whitespace-nowrap text-xs px-3 py-2">
              ⚖️ Legal
            </Button>
            <Button variant="ghost" size="sm" className="bg-blue-100 text-blue-800 whitespace-nowrap text-xs px-3 py-2">
              📊 Tax
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/travel")} className="whitespace-nowrap text-xs px-3 py-2">
              ✈️ Travel
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/messages")} className="whitespace-nowrap text-xs px-3 py-2">
              🤖 AI Agents
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/settings")} className="whitespace-nowrap text-xs px-3 py-2">
              ⚙️ Settings
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Tax Management
          </h1>
          <p className="text-gray-600">
            Manage your tax returns, deductions, and tax professional relationships
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Tax Returns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {taxReturns.length}
              </div>
              <p className="text-sm text-gray-500">Total filed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Current Year
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {currentYear}
              </div>
              <p className="text-sm text-gray-500">
                {currentYearReturn ? getStatusColor(currentYearReturn.status).split(' ')[1] : 'Not started'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Total Refunds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${totalRefunds.toLocaleString()}
              </div>
              <p className="text-sm text-gray-500">All years</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Total Owed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${totalOwed.toLocaleString()}
              </div>
              <p className="text-sm text-gray-500">All years</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="returns" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="returns" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Returns
            </TabsTrigger>
            <TabsTrigger value="deductions" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Deductions
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="professionals" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Tax Pros
            </TabsTrigger>
          </TabsList>

          {/* Tax Returns Tab */}
          <TabsContent value="returns" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Tax Returns</h2>
                <p className="text-gray-600">Manage your tax returns by year</p>
              </div>
              <Button onClick={() => setShowAddReturn(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tax Return
              </Button>
            </div>

            {taxReturns.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No tax returns yet</h3>
                  <p className="text-gray-500 mb-4">Add your first tax return to get started.</p>
                  <Button onClick={() => setShowAddReturn(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Tax Return
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {taxReturns.map((taxReturn) => (
                  <Card key={taxReturn._id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center">
                            <span className="mr-2">📋</span>
                            Tax Year {taxReturn.taxYear}
                          </CardTitle>
                          <CardDescription>
                            {getFilingStatusLabel(taxReturn.filingStatus)}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(taxReturn.status)}>
                          {taxReturn.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Income:</span>
                          <span className="font-medium">${taxReturn.totalIncome?.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Due Date:</span>
                          <span className="font-medium">
                            {new Date(taxReturn.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {taxReturn.filedDate && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Filed Date:</span>
                            <span className="font-medium">
                              {new Date(taxReturn.filedDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        
                        {taxReturn.refundAmount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Refund:</span>
                            <span className="font-medium text-green-600">
                              ${taxReturn.refundAmount.toLocaleString()}
                            </span>
                          </div>
                        )}
                        
                        {taxReturn.amountOwed > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Amount Owed:</span>
                            <span className="font-medium text-red-600">
                              ${taxReturn.amountOwed.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Deductions Tab */}
          <TabsContent value="deductions" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Tax Deductions</h2>
                <p className="text-gray-600">Track deductible expenses throughout the year</p>
              </div>
              <Button onClick={() => setShowAddDeduction(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Deduction
              </Button>
            </div>

            {deductions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No deductions yet</h3>
                  <p className="text-gray-500 mb-4">Start tracking your tax-deductible expenses.</p>
                  <Button onClick={() => setShowAddDeduction(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Deduction
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Summary Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Deduction Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Deductions</p>
                        <p className="text-2xl font-bold">{deductions.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${deductions.reduce((sum, d) => sum + (d.amount || 0), 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Current Year</p>
                        <p className="text-2xl font-bold">
                          {deductions.filter(d => d.taxYear === currentYear).length}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Categories</p>
                        <p className="text-2xl font-bold">
                          {new Set(deductions.map(d => d.category)).size}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Deduction Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {deductions.map((deduction) => (
                    <Card key={deduction._id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="flex items-center">
                              <span className="mr-2">{getCategoryIcon(deduction.category)}</span>
                              {deduction.description}
                            </CardTitle>
                            <CardDescription>
                              {getCategoryLabel(deduction.category)} • Tax Year {deduction.taxYear}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              ${deduction.amount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Date:</span>
                            <span>{new Date(deduction.date).toLocaleDateString()}</span>
                          </div>
                          
                          {deduction.vendor && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Vendor:</span>
                              <span>{deduction.vendor}</span>
                            </div>
                          )}
                          
                          {deduction.paymentMethod && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Payment Method:</span>
                              <span>{deduction.paymentMethod}</span>
                            </div>
                          )}
                          
                          {deduction.mileage && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Mileage:</span>
                              <span>{deduction.mileage} miles</span>
                            </div>
                          )}
                          
                          {deduction.businessPurpose && (
                            <div className="pt-2 border-t">
                              <p className="text-sm text-gray-600">Business Purpose:</p>
                              <p className="text-sm">{deduction.businessPurpose}</p>
                            </div>
                          )}
                          
                          {deduction.notes && (
                            <div className="pt-2 border-t">
                              <p className="text-sm text-gray-600">Notes:</p>
                              <p className="text-sm">{deduction.notes}</p>
                            </div>
                          )}
                          
                          <div className="pt-2 border-t">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full"
                              onClick={() => deleteDeduction(deduction._id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                              Delete Deduction
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Tax Calculator</h2>
                <p className="text-gray-600">Estimate your tax liability and refund for 2024</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Tax Information</CardTitle>
                  <CardDescription>Enter your income and deduction details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Tax Year</label>
                      <Input
                        type="number"
                        placeholder="2024"
                        value={calculator.taxYear}
                        onChange={(e) => setCalculator({ ...calculator, taxYear: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Filing Status</label>
                      <select
                        className="w-full mt-1 p-2 border rounded-md"
                        value={calculator.filingStatus}
                        onChange={(e) => setCalculator({ ...calculator, filingStatus: e.target.value })}
                      >
                        <option value="SINGLE">Single</option>
                        <option value="MARRIED_FILING_JOINTLY">Married Filing Jointly</option>
                        <option value="MARRIED_FILING_SEPARATELY">Married Filing Separately</option>
                        <option value="HEAD_OF_HOUSEHOLD">Head of Household</option>
                        <option value="QUALIFYING_WIDOW">Qualifying Widow(er)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Total Income</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={calculator.income}
                      onChange={(e) => setCalculator({ ...calculator, income: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Wages, self-employment, investments, etc.</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Itemized Deductions (optional)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={calculator.deductions}
                      onChange={(e) => setCalculator({ ...calculator, deductions: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave blank to use standard deduction</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Tax Credits</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={calculator.credits}
                      onChange={(e) => setCalculator({ ...calculator, credits: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Child tax credit, education credits, etc.</p>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Tax Payments</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Federal Tax Withheld</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={calculator.withheld}
                          onChange={(e) => setCalculator({ ...calculator, withheld: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Estimated Tax Payments</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={calculator.estimatedPayments}
                          onChange={(e) => setCalculator({ ...calculator, estimatedPayments: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={calculateTax} className="w-full">
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate Tax
                  </Button>
                </CardContent>
              </Card>

              {/* Results Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Tax Estimate</CardTitle>
                  <CardDescription>Based on 2024 tax brackets and standard deductions</CardDescription>
                </CardHeader>
                <CardContent>
                  {!calculatorResult ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Calculator className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 text-center">
                        Enter your information and click Calculate Tax to see your estimate
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Total Income</p>
                        <p className="text-2xl font-bold">${calculatorResult.income.toLocaleString()}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Standard/Itemized Deduction:</span>
                          <span className="font-medium">-${calculatorResult.totalDeductions.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm pt-2 border-t">
                          <span className="text-gray-600">Taxable Income:</span>
                          <span className="font-medium">${calculatorResult.taxableIncome.toLocaleString()}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax Liability:</span>
                          <span className="font-medium">${calculatorResult.taxLiability.toLocaleString()}</span>
                        </div>

                        {calculatorResult.credits > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tax Credits:</span>
                            <span className="font-medium text-green-600">-${calculatorResult.credits.toLocaleString()}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-sm pt-2 border-t">
                          <span className="text-gray-600">Tax After Credits:</span>
                          <span className="font-medium">${calculatorResult.taxAfterCredits.toLocaleString()}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Payments:</span>
                          <span className="font-medium">${calculatorResult.totalPayments.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className={`p-4 rounded-lg ${calculatorResult.refundOrOwed >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className="text-sm text-gray-600 mb-1">
                          {calculatorResult.refundOrOwed >= 0 ? 'Estimated Refund' : 'Estimated Amount Owed'}
                        </p>
                        <p className={`text-3xl font-bold ${calculatorResult.refundOrOwed >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${Math.abs(calculatorResult.refundOrOwed).toLocaleString()}
                        </p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Effective Tax Rate:</span>
                          <span className="text-lg font-bold">{calculatorResult.effectiveTaxRate}%</span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 pt-2 border-t">
                        <p>* This is an estimate based on 2024 federal tax brackets and standard deductions.</p>
                        <p>* Actual tax liability may vary. Consult a tax professional for accurate calculations.</p>
                      </div>

                      <Button onClick={saveEstimateAsReturn} className="w-full mt-4" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Save as Tax Return
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tax Professionals Tab */}
          <TabsContent value="professionals" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Tax Professional Directory</h2>
                <p className="text-gray-600">Find CPAs, Enrolled Agents, and tax preparation services</p>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search tax professionals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="p-2 border rounded-md"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
              >
                <option value="">All Specialties</option>
                <option value="Individual">Individual Tax Returns</option>
                <option value="Small Business">Small Business</option>
                <option value="Self-Employed">Self-Employed</option>
                <option value="Corporate">Corporate Tax</option>
                <option value="Estate">Estate Planning</option>
                <option value="International">International Tax</option>
                <option value="Audit">Audit Support</option>
              </select>
              <select
                className="p-2 border rounded-md"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
              >
                <option value="">Any Rating</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4.0">4.0+ Stars</option>
                <option value="3.5">3.5+ Stars</option>
                <option value="3.0">3.0+ Stars</option>
              </select>
            </div>

            {/* Tax Professional Cards */}
            {taxProfessionals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No tax professionals found</h3>
                  <p className="text-gray-500 text-center">
                    Try adjusting your search criteria or filters.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {taxProfessionals.map((prof, index) => (
                  <Card key={prof._id || index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{prof.logo}</div>
                          <div>
                            <CardTitle className="text-lg">{prof.name}</CardTitle>
                            <CardDescription>
                              {prof.address?.city}, {prof.address?.state}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">⭐</span>
                            <span className="font-semibold">{prof.rating}</span>
                          </div>
                          <p className="text-xs text-gray-500">{prof.totalReviews?.toLocaleString()} reviews</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{prof.description}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Experience:</span>
                          <span>{prof.yearsExperience} years</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Phone:</span>
                          <span>{prof.phone}</span>
                        </div>
                        {prof.consultationFee !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Consultation:</span>
                            <span className={prof.consultationFee === 0 ? 'text-green-600 font-medium' : ''}>
                              {prof.consultationFee === 0 ? 'Free' : `$${prof.consultationFee}`}
                            </span>
                          </div>
                        )}
                        {prof.hourlyRate > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Hourly Rate:</span>
                            <span>${prof.hourlyRate}/hr</span>
                          </div>
                        )}
                        {prof.virtualConsultations && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <span>🎥</span>
                            <span>Virtual consultations available</span>
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Credentials:</p>
                        <div className="flex flex-wrap gap-1">
                          {prof.credentials?.map((cred: string) => (
                            <Badge key={cred} variant="secondary" className="text-xs">
                              {cred}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Specialties:</p>
                        <div className="flex flex-wrap gap-1">
                          {prof.specialties?.slice(0, 3).map((specialty: string) => (
                            <Badge key={specialty} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                          {prof.specialties?.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{prof.specialties.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {prof.flatFeeServices && prof.flatFeeServices.length > 0 && (
                        <div className="mb-4 bg-gray-50 p-3 rounded">
                          <p className="text-sm font-medium text-gray-700 mb-2">Flat Fee Services:</p>
                          <div className="space-y-1">
                            {prof.flatFeeServices.slice(0, 3).map((service: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-xs">
                                <span>{service.service}</span>
                                <span className="font-medium">${service.price}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => window.open(prof.website, '_blank')}
                        >
                          Visit Website
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`tel:${prof.phone}`, '_self')}
                        >
                          Call
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Results Summary */}
            {taxProfessionals.length > 0 && (
              <div className="text-center text-sm text-gray-600">
                Showing {taxProfessionals.length} tax professional{taxProfessionals.length !== 1 ? 's' : ''}
                {(searchTerm || selectedSpecialty || minRating) && (
                  <span> (filtered results)</span>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Add Tax Return Modal */}
        {showAddReturn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Add Tax Return</CardTitle>
                <CardDescription>Create a new tax return for tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Tax Year *</label>
                    <Input
                      type="number"
                      placeholder="2024"
                      value={newReturn.taxYear}
                      onChange={(e) => setNewReturn({ ...newReturn, taxYear: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Filing Status *</label>
                    <select
                      className="w-full mt-1 p-2 border rounded-md"
                      value={newReturn.filingStatus}
                      onChange={(e) => setNewReturn({ ...newReturn, filingStatus: e.target.value })}
                    >
                      <option value="SINGLE">Single</option>
                      <option value="MARRIED_FILING_JOINTLY">Married Filing Jointly</option>
                      <option value="MARRIED_FILING_SEPARATELY">Married Filing Separately</option>
                      <option value="HEAD_OF_HOUSEHOLD">Head of Household</option>
                      <option value="QUALIFYING_WIDOW">Qualifying Widow(er)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <select
                      className="w-full mt-1 p-2 border rounded-md"
                      value={newReturn.status}
                      onChange={(e) => setNewReturn({ ...newReturn, status: e.target.value })}
                    >
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="READY_TO_FILE">Ready to File</option>
                      <option value="FILED">Filed</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Due Date *</label>
                    <Input
                      type="date"
                      value={newReturn.dueDate}
                      onChange={(e) => setNewReturn({ ...newReturn, dueDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Income Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="number"
                      placeholder="Wages (W-2)"
                      value={newReturn.wages}
                      onChange={(e) => setNewReturn({ ...newReturn, wages: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Self-Employment Income"
                      value={newReturn.selfEmploymentIncome}
                      onChange={(e) => setNewReturn({ ...newReturn, selfEmploymentIncome: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Investment Income"
                      value={newReturn.investmentIncome}
                      onChange={(e) => setNewReturn({ ...newReturn, investmentIncome: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Rental Income"
                      value={newReturn.rentalIncome}
                      onChange={(e) => setNewReturn({ ...newReturn, rentalIncome: e.target.value })}
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Tax Payments</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="number"
                      placeholder="Federal Tax Withheld"
                      value={newReturn.federalTaxWithheld}
                      onChange={(e) => setNewReturn({ ...newReturn, federalTaxWithheld: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Estimated Tax Paid"
                      value={newReturn.estimatedTaxPaid}
                      onChange={(e) => setNewReturn({ ...newReturn, estimatedTaxPaid: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <textarea
                    className="w-full mt-1 p-2 border rounded-md h-16"
                    placeholder="Additional notes..."
                    value={newReturn.notes}
                    onChange={(e) => setNewReturn({ ...newReturn, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={addTaxReturn} className="flex-1">
                    Create Tax Return
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddReturn(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Deduction Modal */}
        {showAddDeduction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Add Tax Deduction</CardTitle>
                <CardDescription>Track a tax-deductible expense</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Tax Year *</label>
                    <Input
                      type="number"
                      placeholder="2024"
                      value={newDeduction.taxYear}
                      onChange={(e) => setNewDeduction({ ...newDeduction, taxYear: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Category *</label>
                    <select
                      className="w-full mt-1 p-2 border rounded-md"
                      value={newDeduction.category}
                      onChange={(e) => setNewDeduction({ ...newDeduction, category: e.target.value })}
                    >
                      <option value="BUSINESS_EXPENSE">Business Expense</option>
                      <option value="HOME_OFFICE">Home Office</option>
                      <option value="VEHICLE">Vehicle Expense</option>
                      <option value="MORTGAGE_INTEREST">Mortgage Interest</option>
                      <option value="PROPERTY_TAX">Property Tax</option>
                      <option value="CHARITABLE">Charitable Donation</option>
                      <option value="MEDICAL">Medical Expense</option>
                      <option value="STATE_LOCAL_TAX">State/Local Tax</option>
                      <option value="EDUCATION">Education Expense</option>
                      <option value="RETIREMENT">Retirement Contribution</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description *</label>
                  <Input
                    placeholder="e.g., Office supplies for business"
                    value={newDeduction.description}
                    onChange={(e) => setNewDeduction({ ...newDeduction, description: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Amount *</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newDeduction.amount}
                      onChange={(e) => setNewDeduction({ ...newDeduction, amount: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Date *</label>
                    <Input
                      type="date"
                      value={newDeduction.date}
                      onChange={(e) => setNewDeduction({ ...newDeduction, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Vendor (optional)"
                    value={newDeduction.vendor}
                    onChange={(e) => setNewDeduction({ ...newDeduction, vendor: e.target.value })}
                  />

                  <Input
                    placeholder="Payment Method (optional)"
                    value={newDeduction.paymentMethod}
                    onChange={(e) => setNewDeduction({ ...newDeduction, paymentMethod: e.target.value })}
                  />
                </div>

                {(newDeduction.category === 'BUSINESS_EXPENSE' || newDeduction.category === 'VEHICLE') && (
                  <>
                    <div>
                      <label className="text-sm font-medium">Business Purpose</label>
                      <Input
                        placeholder="Explain the business purpose..."
                        value={newDeduction.businessPurpose}
                        onChange={(e) => setNewDeduction({ ...newDeduction, businessPurpose: e.target.value })}
                      />
                    </div>

                    {newDeduction.category === 'VEHICLE' && (
                      <div>
                        <label className="text-sm font-medium">Mileage</label>
                        <Input
                          type="number"
                          placeholder="Miles driven"
                          value={newDeduction.mileage}
                          onChange={(e) => setNewDeduction({ ...newDeduction, mileage: e.target.value })}
                        />
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <textarea
                    className="w-full mt-1 p-2 border rounded-md h-16"
                    placeholder="Additional notes..."
                    value={newDeduction.notes}
                    onChange={(e) => setNewDeduction({ ...newDeduction, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={addDeduction} className="flex-1">
                    Add Deduction
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddDeduction(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}