/**
 * Health page with full functionality
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Heart, 
  Calendar, 
  Pill, 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  Phone, 
  MapPin, 
  Star,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function HealthPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // State for different sections
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [healthMetrics, setHealthMetrics] = useState([
    { id: 1, type: "Weight", value: "175 lbs", date: "2024-01-15", trend: "down" },
    { id: 2, type: "Blood Pressure", value: "120/80", date: "2024-01-14", trend: "stable" },
    { id: 3, type: "Steps", value: "8,500", date: "2024-01-15", trend: "up" },
  ]);

  // Modal states
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  
  // Form states
  const [newPrescription, setNewPrescription] = useState({
    medicationName: "",
    dosage: "",
    frequency: "",
    startDate: "",
    endDate: "",
    prescribingDoctor: "",
    pharmacy: "",
    refillsRemaining: 0,
    notes: ""
  });

  const [newAppointment, setNewAppointment] = useState({
    doctorName: "",
    specialty: "",
    appointmentType: "",
    appointmentDate: "",
    appointmentTime: "",
    location: "",
    address: "",
    phoneNumber: "",
    notes: ""
  });

  const [newMetric, setNewMetric] = useState({ type: "", value: "", date: "" });

  // Filters
  const [providerFilter, setProviderFilter] = useState({
    specialty: "all",
    type: "all",
    city: ""
  });

  // Load data on component mount
  useEffect(() => {
    loadPrescriptions();
    loadAppointments();
    loadProviders();
  }, []);

  // Reload providers when filter changes
  useEffect(() => {
    const loadProvidersWithFilters = async () => {
      try {
        const params = new URLSearchParams();
        if (providerFilter.specialty && providerFilter.specialty !== 'all') params.append('specialty', providerFilter.specialty);
        if (providerFilter.type && providerFilter.type !== 'all') params.append('type', providerFilter.type);
        if (providerFilter.city) params.append('city', providerFilter.city);
        
        const response = await fetch(`/api/health/providers?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setProviders(data.providers || []);
        }
      } catch (error) {
        console.error('Failed to load providers:', error);
      }
    };
    
    loadProvidersWithFilters();
  }, [providerFilter]);

  const loadPrescriptions = async () => {
    try {
      const response = await fetch('/api/health/prescriptions');
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data.prescriptions || []);
      }
    } catch (error) {
      console.error('Failed to load prescriptions:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      const response = await fetch('/api/health/appointments');
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
    }
  };

  const loadProviders = async () => {
    try {
      const params = new URLSearchParams();
      if (providerFilter.specialty) params.append('specialty', providerFilter.specialty);
      if (providerFilter.type) params.append('type', providerFilter.type);
      if (providerFilter.city) params.append('city', providerFilter.city);
      
      const url = `/api/health/providers?${params.toString()}`;
      console.log('Loading providers from:', url);
      console.log('Provider filter:', providerFilter);
      
      const response = await fetch(url);
      console.log('Providers response:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Providers data:', data);
        setProviders(data.providers || []);
        console.log('Set providers state:', data.providers?.length || 0, 'providers');
      } else {
        console.error('Providers API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const addPrescription = async () => {
    try {
      const response = await fetch('/api/health/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrescription)
      });

      if (response.ok) {
        await loadPrescriptions();
        setNewPrescription({
          medicationName: "",
          dosage: "",
          frequency: "",
          startDate: "",
          endDate: "",
          prescribingDoctor: "",
          pharmacy: "",
          refillsRemaining: 0,
          notes: ""
        });
        setShowPrescriptionModal(false);
      }
    } catch (error) {
      console.error('Failed to add prescription:', error);
    }
  };

  const addAppointment = async () => {
    try {
      const response = await fetch('/api/health/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppointment)
      });

      if (response.ok) {
        await loadAppointments();
        setNewAppointment({
          doctorName: "",
          specialty: "",
          appointmentType: "",
          appointmentDate: "",
          appointmentTime: "",
          location: "",
          address: "",
          phoneNumber: "",
          notes: ""
        });
        setShowAppointmentModal(false);
      }
    } catch (error) {
      console.error('Failed to add appointment:', error);
    }
  };

  const addMetric = () => {
    if (newMetric.type && newMetric.value && newMetric.date) {
      const metric = {
        id: healthMetrics.length + 1,
        type: newMetric.type,
        value: newMetric.value,
        date: newMetric.date,
        trend: "stable"
      };
      setHealthMetrics([...healthMetrics, metric]);
      setNewMetric({ type: "", value: "", date: "" });
    }
  };

  const deletePrescription = async (id: string) => {
    try {
      const response = await fetch(`/api/health/prescriptions/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await loadPrescriptions();
      }
    } catch (error) {
      console.error('Failed to delete prescription:', error);
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      const response = await fetch(`/api/health/appointments/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await loadAppointments();
      }
    } catch (error) {
      console.error('Failed to delete appointment:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { color: "bg-blue-100 text-blue-800", icon: <Calendar className="w-3 h-3" /> },
      completed: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" /> },
      cancelled: { color: "bg-red-100 text-red-800", icon: <AlertCircle className="w-3 h-3" /> },
      rescheduled: { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-3 h-3" /> }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="w-full px-4 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">🏆 Concierge.com</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {session?.user?.name}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-xs"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Navigation Tabs */}
      <div className="bg-gray-50 border-b">
        <div className="w-full px-4">
          <div className="flex overflow-x-auto gap-1 py-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs px-3 py-2"
              onClick={() => router.push('/dashboard')}
            >
              🏠 Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs px-3 py-2"
              onClick={() => router.push('/expenses')}
            >
              💰 Expenses
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs px-3 py-2"
              onClick={() => router.push('/investments')}
            >
              📈 Investments
            </Button>
            <Button
              variant="default"
              size="sm"
              className="text-xs px-3 py-2"
            >
              🏥 Health
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs px-3 py-2"
              onClick={() => router.push('/insurance')}
            >
              🛡️ Insurance
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs px-3 py-2"
              onClick={() => router.push('/legal')}
            >
              ⚖️ Legal
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs px-3 py-2"
              onClick={() => router.push('/tax')}
            >
              📊 Tax
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs px-3 py-2"
              onClick={() => router.push('/travel')}
            >
              ✈️ Travel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs px-3 py-2"
              onClick={() => router.push('/messages')}
            >
              🤖 AI Agents
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs px-3 py-2"
              onClick={() => router.push('/workflows')}
            >
              🤖 Workflows
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs px-3 py-2"
              onClick={() => router.push('/settings')}
            >
              ⚙️ Settings
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500" />
              Health Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your prescriptions, appointments, and healthcare providers
            </p>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="providers">Providers</TabsTrigger>
              <TabsTrigger value="metrics">Health Metrics</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Quick Stats */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
                    <Pill className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{prescriptions.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {prescriptions.filter(p => p.isActive).length} currently active
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {appointments.filter(a => a.status === 'scheduled' && new Date(a.appointmentDate) > new Date()).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Next: {appointments.filter(a => a.status === 'scheduled').sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())[0]?.appointmentDate ? new Date(appointments.filter(a => a.status === 'scheduled').sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())[0].appointmentDate).toLocaleDateString() : 'None scheduled'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Healthcare Providers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{providers.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Available in your area
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Health Activity</CardTitle>
                  <CardDescription>Your latest health-related activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...prescriptions.slice(0, 3), ...appointments.slice(0, 2)].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {item.medicationName ? (
                            <>
                              <Pill className="w-5 h-5 text-blue-500" />
                              <div>
                                <p className="font-medium">{item.medicationName}</p>
                                <p className="text-sm text-gray-500">Prescription added</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <Calendar className="w-5 h-5 text-green-500" />
                              <div>
                                <p className="font-medium">{item.doctorName} - {item.specialty}</p>
                                <p className="text-sm text-gray-500">Appointment scheduled</p>
                              </div>
                            </>
                          )}
                        </div>
                        <Badge variant="outline">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Today'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Prescriptions Tab */}
            <TabsContent value="prescriptions" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Prescriptions</CardTitle>
                    <CardDescription>Manage your medications and prescriptions</CardDescription>
                  </div>
                  <Button onClick={() => setShowPrescriptionModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Prescription
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {prescriptions.map((prescription) => (
                      <div key={prescription._id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{prescription.medicationName}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                              <div>
                                <span className="text-gray-500">Dosage:</span>
                                <p className="font-medium">{prescription.dosage}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Frequency:</span>
                                <p className="font-medium">{prescription.frequency}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Doctor:</span>
                                <p className="font-medium">{prescription.prescribingDoctor}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Refills:</span>
                                <p className="font-medium">{prescription.refillsRemaining}</p>
                              </div>
                            </div>
                            {prescription.notes && (
                              <p className="text-sm text-gray-600 mt-2">{prescription.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deletePrescription(prescription._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {prescriptions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No prescriptions found. Add your first prescription to get started.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appointments Tab */}
            <TabsContent value="appointments" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Appointments</CardTitle>
                    <CardDescription>Schedule and manage your doctor appointments</CardDescription>
                  </div>
                  <Button onClick={() => setShowAppointmentModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Appointment
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div key={appointment._id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{appointment.doctorName}</h3>
                              {getStatusBadge(appointment.status)}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                              <div>
                                <span className="text-gray-500">Specialty:</span>
                                <p className="font-medium">{appointment.specialty}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Date:</span>
                                <p className="font-medium">{new Date(appointment.appointmentDate).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Time:</span>
                                <p className="font-medium">{appointment.appointmentTime}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Location:</span>
                                <p className="font-medium">{appointment.location}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span>{appointment.address}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{appointment.phoneNumber}</span>
                              </div>
                            </div>
                            {appointment.notes && (
                              <p className="text-sm text-gray-600 mt-2">{appointment.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteAppointment(appointment._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {appointments.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No appointments found. Schedule your first appointment to get started.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Providers Tab */}
            <TabsContent value="providers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Healthcare Providers</CardTitle>
                  <CardDescription>Find and connect with healthcare providers in your area</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <Label htmlFor="specialty">Specialty</Label>
                      <Select value={providerFilter.specialty} onValueChange={(value) => {
                        setProviderFilter({...providerFilter, specialty: value});
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Specialties" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Specialties</SelectItem>
                          <SelectItem value="Internal Medicine">Internal Medicine</SelectItem>
                          <SelectItem value="Cardiology">Cardiology</SelectItem>
                          <SelectItem value="Dermatology">Dermatology</SelectItem>
                          <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                          <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="type">Provider Type</Label>
                      <Select value={providerFilter.type} onValueChange={(value) => {
                        setProviderFilter({...providerFilter, type: value});
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="doctor">Doctor</SelectItem>
                          <SelectItem value="specialist">Specialist</SelectItem>
                          <SelectItem value="clinic">Clinic</SelectItem>
                          <SelectItem value="hospital">Hospital</SelectItem>
                          <SelectItem value="pharmacy">Pharmacy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        placeholder="Enter city"
                        value={providerFilter.city}
                        onChange={(e) => {
                          setProviderFilter({...providerFilter, city: e.target.value});
                        }}
                      />
                    </div>
                  </div>

                  {/* Providers List */}
                  <div className="space-y-4">
                    {providers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No healthcare providers found. Try adjusting your filters.
                      </div>
                    ) : (
                      providers.map((provider) => (
                      <div key={provider._id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{provider.name}</h3>
                              <Badge variant="outline">{provider.type}</Badge>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-medium">{provider.rating}</span>
                                <span className="text-sm text-gray-500">({provider.reviewCount} reviews)</span>
                              </div>
                            </div>
                            <p className="text-gray-600 mb-2">{provider.specialty}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span>{provider.address}, {provider.city}, {provider.state} {provider.zipCode}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{provider.phoneNumber}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="text-gray-500">Languages: {provider.languages.join(', ')}</span>
                              <span className="text-gray-500">Availability: {provider.availability}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Phone className="w-4 h-4 mr-2" />
                              Call
                            </Button>
                            <Button variant="outline" size="sm">
                              <Calendar className="w-4 h-4 mr-2" />
                              Schedule
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Health Metrics Tab */}
            <TabsContent value="metrics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Health Metrics</CardTitle>
                  <CardDescription>Track your health measurements and goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {healthMetrics.map((metric) => (
                      <div key={metric.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold">{metric.type}</h3>
                            <p className="text-gray-500">Recorded on {metric.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{metric.value}</p>
                            <Badge variant={metric.trend === 'up' ? 'default' : metric.trend === 'down' ? 'destructive' : 'secondary'}>
                              {metric.trend}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Metric */}
                  <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                    <h3 className="font-semibold mb-4">Add New Health Metric</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="metric-type">Type</Label>
                        <Input
                          id="metric-type"
                          placeholder="e.g., Weight, Blood Pressure"
                          value={newMetric.type}
                          onChange={(e) => setNewMetric({...newMetric, type: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="metric-value">Value</Label>
                        <Input
                          id="metric-value"
                          placeholder="e.g., 175 lbs, 120/80"
                          value={newMetric.value}
                          onChange={(e) => setNewMetric({...newMetric, value: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="metric-date">Date</Label>
                        <Input
                          id="metric-date"
                          type="date"
                          value={newMetric.date}
                          onChange={(e) => setNewMetric({...newMetric, date: e.target.value})}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={addMetric} className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Metric
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Health Goals */}
              <Card>
                <CardHeader>
                  <CardTitle>Health Goals</CardTitle>
                  <CardDescription>Your wellness objectives</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Weight Goal</h3>
                      <p className="text-sm text-gray-600">Target: 170 lbs</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '70%' }}></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">5 lbs to go</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Exercise Goal</h3>
                      <p className="text-sm text-gray-600">Target: 10,000 steps/day</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">1,500 steps to go</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Prescription Modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Prescription</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="medication">Medication Name *</Label>
                <Input
                  id="medication"
                  value={newPrescription.medicationName}
                  onChange={(e) => setNewPrescription({...newPrescription, medicationName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="dosage">Dosage *</Label>
                <Input
                  id="dosage"
                  value={newPrescription.dosage}
                  onChange={(e) => setNewPrescription({...newPrescription, dosage: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="frequency">Frequency *</Label>
                <Input
                  id="frequency"
                  value={newPrescription.frequency}
                  onChange={(e) => setNewPrescription({...newPrescription, frequency: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="refills">Refills Remaining</Label>
                <Input
                  id="refills"
                  type="number"
                  value={newPrescription.refillsRemaining}
                  onChange={(e) => setNewPrescription({...newPrescription, refillsRemaining: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label htmlFor="start-date">Start Date *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={newPrescription.startDate}
                  onChange={(e) => setNewPrescription({...newPrescription, startDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={newPrescription.endDate}
                  onChange={(e) => setNewPrescription({...newPrescription, endDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="doctor">Prescribing Doctor *</Label>
                <Input
                  id="doctor"
                  value={newPrescription.prescribingDoctor}
                  onChange={(e) => setNewPrescription({...newPrescription, prescribingDoctor: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="pharmacy">Pharmacy *</Label>
                <Input
                  id="pharmacy"
                  value={newPrescription.pharmacy}
                  onChange={(e) => setNewPrescription({...newPrescription, pharmacy: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newPrescription.notes}
                  onChange={(e) => setNewPrescription({...newPrescription, notes: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={addPrescription}>Add Prescription</Button>
              <Button variant="outline" onClick={() => setShowPrescriptionModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Schedule New Appointment</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="doctor-name">Doctor Name *</Label>
                <Input
                  id="doctor-name"
                  value={newAppointment.doctorName}
                  onChange={(e) => setNewAppointment({...newAppointment, doctorName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="specialty">Specialty *</Label>
                <Input
                  id="specialty"
                  value={newAppointment.specialty}
                  onChange={(e) => setNewAppointment({...newAppointment, specialty: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="appointment-type">Appointment Type *</Label>
                <Input
                  id="appointment-type"
                  value={newAppointment.appointmentType}
                  onChange={(e) => setNewAppointment({...newAppointment, appointmentType: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="appointment-date">Date *</Label>
                <Input
                  id="appointment-date"
                  type="date"
                  value={newAppointment.appointmentDate}
                  onChange={(e) => setNewAppointment({...newAppointment, appointmentDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="appointment-time">Time *</Label>
                <Input
                  id="appointment-time"
                  type="time"
                  value={newAppointment.appointmentTime}
                  onChange={(e) => setNewAppointment({...newAppointment, appointmentTime: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={newAppointment.phoneNumber}
                  onChange={(e) => setNewAppointment({...newAppointment, phoneNumber: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={newAppointment.location}
                  onChange={(e) => setNewAppointment({...newAppointment, location: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={newAppointment.address}
                  onChange={(e) => setNewAppointment({...newAppointment, address: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="appointment-notes">Notes</Label>
                <Textarea
                  id="appointment-notes"
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={addAppointment}>Schedule Appointment</Button>
              <Button variant="outline" onClick={() => setShowAppointmentModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}