/**
 * Travel Planning & Management page
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
  Plane, 
  Hotel, 
  Car,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Plus,
  Trash2,
  Building2
} from "lucide-react";

export default function TravelPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // State management
  const [trips, setTrips] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Provider search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minRating, setMinRating] = useState("");
  
  // Form states
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [newTrip, setNewTrip] = useState({
    tripName: "",
    description: "",
    destination: "",
    destinationCity: "",
    destinationCountry: "",
    startDate: "",
    endDate: "",
    tripType: "LEISURE",
    status: "PLANNING",
    numberOfTravelers: "1",
    estimatedBudget: "",
    accommodationType: "",
    transportationMode: "",
    notes: ""
  });

  const [showAddBooking, setShowAddBooking] = useState(false);
  const [newBooking, setNewBooking] = useState({
    tripId: "",
    bookingType: "FLIGHT",
    confirmationNumber: "",
    providerName: "",
    cost: "",
    bookingDate: "",
    // Flight fields
    flightNumber: "",
    airline: "",
    departureAirport: "",
    arrivalAirport: "",
    departureTime: "",
    arrivalTime: "",
    // Hotel fields
    hotelName: "",
    checkInDate: "",
    checkOutDate: "",
    roomType: "",
    // Car rental fields
    carRentalCompany: "",
    vehicleType: "",
    pickupLocation: "",
    dropoffLocation: "",
    pickupDate: "",
    dropoffDate: "",
    notes: ""
  });

  // Itinerary form state
  const [showAddItinerary, setShowAddItinerary] = useState(false);
  const [newItinerary, setNewItinerary] = useState({
    tripId: "",
    dayNumber: "1",
    date: "",
    title: "",
    description: "",
    activityTitle: "",
    activityTime: "",
    activityLocation: "",
    activityDescription: "",
    activityCost: "",
    notes: ""
  });

  // Load data on component mount
  useEffect(() => {
    loadTrips();
    loadBookings();
    loadItineraries();
    loadProviders();
  }, []);

  // Reload providers when search/filter parameters change
  useEffect(() => {
    loadProviders();
  }, [searchTerm, selectedCategory, minRating]);


  const loadTrips = async () => {
    try {
      const response = await fetch('/api/travel/trips');
      if (response.ok) {
        const data = await response.json();
        setTrips(data.trips || []);
      }
    } catch (error) {
      console.error('Failed to load trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const response = await fetch('/api/travel/bookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Failed to load bookings:', error);
    }
  };

  const addTrip = async () => {
    if (!newTrip.tripName || !newTrip.destination || !newTrip.destinationCountry || !newTrip.startDate || !newTrip.endDate) {
      alert('Please fill in Trip Name, Destination, Country, Start Date, and End Date');
      return;
    }

    try {
      const tripData = {
        ...newTrip,
        estimatedBudget: newTrip.estimatedBudget || 0,
        numberOfTravelers: parseInt(newTrip.numberOfTravelers) || 1,
        accommodationType: newTrip.accommodationType || undefined,
        transportationMode: newTrip.transportationMode || undefined,
        description: newTrip.description || undefined,
        destinationCity: newTrip.destinationCity || undefined,
        notes: newTrip.notes || undefined
      };
      
      const response = await fetch('/api/travel/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Trip created successfully!');
        await loadTrips();
        setShowAddTrip(false);
        setNewTrip({
          tripName: "",
          description: "",
          destination: "",
          destinationCity: "",
          destinationCountry: "",
          startDate: "",
          endDate: "",
          tripType: "LEISURE",
          status: "PLANNING",
          numberOfTravelers: "1",
          estimatedBudget: "",
          accommodationType: "",
          transportationMode: "",
          notes: ""
        });
      } else {
        alert(`Error: ${data.error || 'Failed to create trip'}`);
      }
    } catch (error) {
      console.error('Failed to create trip:', error);
      alert('Network error. Please try again.');
    }
  };

  const deleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) {
      return;
    }

    try {
      const response = await fetch(`/api/travel/trips?id=${tripId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Trip deleted successfully!');
        await loadTrips();
      } else {
        alert('Failed to delete trip');
      }
    } catch (error) {
      console.error('Failed to delete trip:', error);
      alert('Network error. Please try again.');
    }
  };

  const addBooking = async () => {
    if (!newBooking.tripId || !newBooking.confirmationNumber || !newBooking.providerName || !newBooking.cost) {
      alert('Please fill in Trip, Confirmation Number, Provider, and Cost');
      return;
    }

    try {
      const bookingData = {
        ...newBooking,
        cost: parseFloat(newBooking.cost),
        bookingDate: newBooking.bookingDate || new Date().toISOString().split('T')[0],
        status: 'CONFIRMED',
        // Clean up optional fields
        flightNumber: newBooking.flightNumber || undefined,
        airline: newBooking.airline || undefined,
        departureAirport: newBooking.departureAirport || undefined,
        arrivalAirport: newBooking.arrivalAirport || undefined,
        departureTime: newBooking.departureTime ? new Date(newBooking.departureTime) : undefined,
        arrivalTime: newBooking.arrivalTime ? new Date(newBooking.arrivalTime) : undefined,
        hotelName: newBooking.hotelName || undefined,
        checkInDate: newBooking.checkInDate ? new Date(newBooking.checkInDate) : undefined,
        checkOutDate: newBooking.checkOutDate ? new Date(newBooking.checkOutDate) : undefined,
        roomType: newBooking.roomType || undefined,
        carRentalCompany: newBooking.carRentalCompany || undefined,
        vehicleType: newBooking.vehicleType || undefined,
        pickupLocation: newBooking.pickupLocation || undefined,
        dropoffLocation: newBooking.dropoffLocation || undefined,
        pickupDate: newBooking.pickupDate ? new Date(newBooking.pickupDate) : undefined,
        dropoffDate: newBooking.dropoffDate ? new Date(newBooking.dropoffDate) : undefined,
        notes: newBooking.notes || undefined
      };
      
      const response = await fetch('/api/travel/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Booking added successfully!');
        await loadBookings();
        setShowAddBooking(false);
        setNewBooking({
          tripId: "",
          bookingType: "FLIGHT",
          confirmationNumber: "",
          providerName: "",
          cost: "",
          bookingDate: "",
          flightNumber: "",
          airline: "",
          departureAirport: "",
          arrivalAirport: "",
          departureTime: "",
          arrivalTime: "",
          hotelName: "",
          checkInDate: "",
          checkOutDate: "",
          roomType: "",
          carRentalCompany: "",
          vehicleType: "",
          pickupLocation: "",
          dropoffLocation: "",
          pickupDate: "",
          dropoffDate: "",
          notes: ""
        });
      } else {
        alert(`Error: ${data.error || 'Failed to add booking'}`);
      }
    } catch (error) {
      console.error('Failed to add booking:', error);
      alert('Network error. Please try again.');
    }
  };

  const deleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) {
      return;
    }

    try {
      const response = await fetch(`/api/travel/bookings?id=${bookingId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Booking deleted successfully!');
        await loadBookings();
      } else {
        alert('Failed to delete booking');
      }
    } catch (error) {
      console.error('Failed to delete booking:', error);
      alert('Network error. Please try again.');
    }
  };

  const loadItineraries = async () => {
    try {
      const response = await fetch('/api/travel/itinerary');
      if (response.ok) {
        const data = await response.json();
        setItineraries(data.itineraries || []);
      }
    } catch (error) {
      console.error('Failed to load itineraries:', error);
    }
  };

  const addItinerary = async () => {
    if (!newItinerary.tripId || !newItinerary.date || !newItinerary.title) {
      alert('Please fill in Trip, Date, and Title');
      return;
    }

    try {
      const activities = [];
      if (newItinerary.activityTitle && newItinerary.activityTime && newItinerary.activityLocation) {
        activities.push({
          time: newItinerary.activityTime,
          title: newItinerary.activityTitle,
          description: newItinerary.activityDescription || '',
          location: newItinerary.activityLocation,
          duration: 60,
          cost: parseFloat(newItinerary.activityCost) || 0,
          category: 'ACTIVITY',
          completed: false
        });
      }

      const itineraryData = {
        tripId: newItinerary.tripId,
        dayNumber: parseInt(newItinerary.dayNumber),
        date: newItinerary.date,
        title: newItinerary.title,
        description: newItinerary.description || undefined,
        activities,
        estimatedCost: parseFloat(newItinerary.activityCost) || 0,
        notes: newItinerary.notes || undefined
      };
      
      const response = await fetch('/api/travel/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itineraryData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Itinerary day added successfully!');
        await loadItineraries();
        setShowAddItinerary(false);
        setNewItinerary({
          tripId: "",
          dayNumber: "1",
          date: "",
          title: "",
          description: "",
          activityTitle: "",
          activityTime: "",
          activityLocation: "",
          activityDescription: "",
          activityCost: "",
          notes: ""
        });
      } else {
        alert(`Error: ${data.error || 'Failed to add itinerary'}`);
      }
    } catch (error) {
      console.error('Failed to add itinerary:', error);
      alert('Network error. Please try again.');
    }
  };

  const deleteItinerary = async (itineraryId: string) => {
    if (!confirm('Are you sure you want to delete this itinerary day?')) {
      return;
    }

    try {
      const response = await fetch(`/api/travel/itinerary?id=${itineraryId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Itinerary day deleted successfully!');
        await loadItineraries();
      } else {
        alert('Failed to delete itinerary');
      }
    } catch (error) {
      console.error('Failed to delete itinerary:', error);
      alert('Network error. Please try again.');
    }
  };

  const loadProviders = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (minRating) params.append('minRating', minRating);
      
      const response = await fetch(`/api/travel/providers?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const getTripTypeIcon = (type: string) => {
    switch (type) {
      case 'LEISURE': return '🏖️';
      case 'BUSINESS': return '💼';
      case 'FAMILY': return '👨‍👩‍👧‍👦';
      case 'ADVENTURE': return '🏔️';
      case 'ROMANTIC': return '💑';
      case 'SOLO': return '🎒';
      case 'GROUP': return '👥';
      default: return '✈️';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'bg-gray-100 text-gray-800';
      case 'BOOKED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-purple-100 text-purple-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBookingTypeIcon = (type: string) => {
    switch (type) {
      case 'FLIGHT': return '✈️';
      case 'HOTEL': return '🏨';
      case 'CAR_RENTAL': return '🚗';
      case 'ACTIVITY': return '🎭';
      case 'RESTAURANT': return '🍽️';
      case 'TRAIN': return '🚆';
      case 'BUS': return '🚌';
      case 'CRUISE': return '🚢';
      default: return '📋';
    }
  };

  // Calculate summary statistics
  const now = new Date();
  const upcomingTrips = trips.filter(t => 
    new Date(t.startDate) > now && t.status !== 'CANCELLED'
  );
  const activeTrips = trips.filter(t => 
    new Date(t.startDate) <= now && new Date(t.endDate) >= now && t.status === 'IN_PROGRESS'
  );
  const totalBudget = trips.reduce((sum, t) => sum + (t.estimatedBudget || 0), 0);
  const totalSpent = trips.reduce((sum, t) => sum + (t.actualCost || 0), 0);

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
            <Button variant="ghost" size="sm" onClick={() => router.push("/tax")} className="whitespace-nowrap text-xs px-3 py-2">
              📊 Tax
            </Button>
            <Button variant="ghost" size="sm" className="bg-blue-100 text-blue-800 whitespace-nowrap text-xs px-3 py-2">
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
            ✈️ Travel Planning & Management
          </h1>
          <p className="text-gray-600">
            Plan trips, manage bookings, and track your travel adventures
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Plane className="h-5 w-5 mr-2" />
                Total Trips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {trips.length}
              </div>
              <p className="text-sm text-gray-500">{upcomingTrips.length} upcoming</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Active Trips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {activeTrips.length}
              </div>
              <p className="text-sm text-gray-500">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Total Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                ${totalBudget.toLocaleString()}
              </div>
              <p className="text-sm text-gray-500">Estimated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Hotel className="h-5 w-5 mr-2" />
                Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {bookings.length}
              </div>
              <p className="text-sm text-gray-500">Total bookings</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="trips" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trips" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Trips
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Hotel className="h-4 w-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="itinerary" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Itinerary
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Providers
            </TabsTrigger>
          </TabsList>

          {/* Trips Tab */}
          <TabsContent value="trips" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">My Trips</h2>
                <p className="text-gray-600">Plan and manage your travel adventures</p>
              </div>
              <Button onClick={() => setShowAddTrip(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Plan Trip
              </Button>
            </div>

            {trips.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Plane className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips yet</h3>
                  <p className="text-gray-500 mb-4">Start planning your next adventure!</p>
                  <Button onClick={() => setShowAddTrip(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Plan First Trip
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {trips.map((trip) => (
                  <Card key={trip._id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center">
                            <span className="mr-2">{getTripTypeIcon(trip.tripType)}</span>
                            {trip.tripName}
                          </CardTitle>
                          <CardDescription>
                            {trip.destination}, {trip.destinationCountry}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(trip.status)}>
                          {trip.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {trip.description && (
                          <p className="text-sm text-gray-600">{trip.description}</p>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Dates:</span>
                          <span className="font-medium">
                            {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Duration:</span>
                          <span className="font-medium">{trip.duration} days</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Travelers:</span>
                          <span className="font-medium">{trip.numberOfTravelers}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Budget:</span>
                          <span className="font-medium">${trip.estimatedBudget?.toLocaleString()}</span>
                        </div>
                        
                        {trip.actualCost > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Actual Cost:</span>
                            <span className="font-medium text-orange-600">
                              ${trip.actualCost.toLocaleString()}
                            </span>
                          </div>
                        )}
                        
                        <div className="pt-2 border-t">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full"
                            onClick={() => deleteTrip(trip._id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                            Delete Trip
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Travel Bookings</h2>
                <p className="text-gray-600">Manage flights, hotels, and activities</p>
              </div>
              <Button onClick={() => setShowAddBooking(true)} disabled={trips.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Add Booking
              </Button>
            </div>

            {trips.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Hotel className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Create a trip first</h3>
                  <p className="text-gray-500 text-center">
                    You need to create a trip before adding bookings.
                  </p>
                </CardContent>
              </Card>
            ) : bookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Hotel className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
                  <p className="text-gray-500 mb-4">Add your first booking to get started.</p>
                  <Button onClick={() => setShowAddBooking(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Booking
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {bookings.map((booking) => (
                  <Card key={booking._id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center">
                            <span className="mr-2">{getBookingTypeIcon(booking.bookingType)}</span>
                            {booking.providerName}
                          </CardTitle>
                          <CardDescription>
                            Confirmation: {booking.confirmationNumber}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">
                          {booking.bookingType.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {booking.tripId && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Trip:</span>
                            <span className="font-medium">{booking.tripId.tripName}</span>
                          </div>
                        )}
                        
                        {booking.flightNumber && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Flight:</span>
                              <span className="font-medium">{booking.flightNumber}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Route:</span>
                              <span className="font-medium">{booking.departureAirport} → {booking.arrivalAirport}</span>
                            </div>
                          </>
                        )}
                        
                        {booking.hotelName && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Hotel:</span>
                              <span className="font-medium">{booking.hotelName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Check-in:</span>
                              <span className="font-medium">{new Date(booking.checkInDate).toLocaleDateString()}</span>
                            </div>
                          </>
                        )}
                        
                        {booking.carRentalCompany && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Company:</span>
                              <span className="font-medium">{booking.carRentalCompany}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Vehicle:</span>
                              <span className="font-medium">{booking.vehicleType}</span>
                            </div>
                          </>
                        )}
                        
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-sm text-gray-600">Cost:</span>
                          <span className="font-medium text-green-600">${booking.cost.toLocaleString()}</span>
                        </div>
                        
                        <div className="pt-2 border-t">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full"
                            onClick={() => deleteBooking(booking._id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                            Delete Booking
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Itinerary Tab */}
          <TabsContent value="itinerary" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Trip Itinerary</h2>
                <p className="text-gray-600">Day-by-day schedule and activities</p>
              </div>
              <Button onClick={() => setShowAddItinerary(true)} disabled={trips.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Add Day
              </Button>
            </div>

            {trips.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Create a trip first</h3>
                  <p className="text-gray-500 text-center">
                    You need to create a trip before building an itinerary.
                  </p>
                </CardContent>
              </Card>
            ) : itineraries.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No itinerary yet</h3>
                  <p className="text-gray-500 mb-4">Build a day-by-day schedule for your trip.</p>
                  <Button onClick={() => setShowAddItinerary(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Day
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {itineraries.map((day) => (
                  <Card key={day._id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center">
                            <Calendar className="h-5 w-5 mr-2" />
                            Day {day.dayNumber}: {day.title}
                          </CardTitle>
                          <CardDescription>
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </CardDescription>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteItinerary(day._id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {day.description && (
                          <p className="text-sm text-gray-600">{day.description}</p>
                        )}
                        
                        {day.activities && day.activities.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm">Activities:</h4>
                            {day.activities.map((activity: any, idx: number) => (
                              <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-medium">{activity.time} - {activity.title}</p>
                                    <p className="text-sm text-gray-600">{activity.location}</p>
                                  </div>
                                  {activity.cost > 0 && (
                                    <Badge variant="outline">${activity.cost}</Badge>
                                  )}
                                </div>
                                {activity.description && (
                                  <p className="text-sm text-gray-600">{activity.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {day.estimatedCost > 0 && (
                          <div className="flex justify-between pt-3 border-t">
                            <span className="text-sm text-gray-600">Estimated Cost:</span>
                            <span className="font-medium">${day.estimatedCost.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Providers Tab */}
          <TabsContent value="providers" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Travel Provider Directory</h2>
                <p className="text-gray-600">Airlines, hotels, and car rental companies</p>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search providers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="p-2 border rounded-md"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="AIRLINE">Airlines</option>
                <option value="HOTEL">Hotels</option>
                <option value="CAR_RENTAL">Car Rentals</option>
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

            {/* Provider Cards */}
            {providers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building2 className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No providers found</h3>
                  <p className="text-gray-500 text-center">
                    Try adjusting your search criteria or filters.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers.map((provider, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{provider.logo}</div>
                          <div>
                            <CardTitle className="text-lg">{provider.name}</CardTitle>
                            <CardDescription>
                              {provider.category.replace(/_/g, ' ')}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">⭐</span>
                            <span className="font-semibold">{provider.rating}</span>
                          </div>
                          <p className="text-xs text-gray-500">{provider.totalReviews?.toLocaleString()} reviews</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{provider.description}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Founded:</span>
                          <span>{provider.founded}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Coverage:</span>
                          <span>{provider.destinations}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Phone:</span>
                          <span>{provider.phone}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Services:</p>
                        <div className="flex flex-wrap gap-1">
                          {provider.services?.slice(0, 3).map((service: string) => (
                            <Badge key={service} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                          {provider.services?.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{provider.services.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => window.open(provider.website, '_blank')}
                        >
                          Visit Website
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`tel:${provider.phone}`, '_self')}
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
            {providers.length > 0 && (
              <div className="text-center text-sm text-gray-600">
                Showing {providers.length} provider{providers.length !== 1 ? 's' : ''}
                {(searchTerm || selectedCategory || minRating) && (
                  <span> (filtered results)</span>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Add Trip Modal */}
        {showAddTrip && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Plan New Trip</CardTitle>
                <CardDescription>Create a new travel plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Trip Name *</label>
                  <Input
                    placeholder="e.g., Summer Vacation to Paris"
                    value={newTrip.tripName}
                    onChange={(e) => setNewTrip({ ...newTrip, tripName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className="w-full mt-1 p-2 border rounded-md h-20"
                    placeholder="Describe your trip..."
                    value={newTrip.description}
                    onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Destination *</label>
                    <Input
                      placeholder="e.g., Paris"
                      value={newTrip.destination}
                      onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Country *</label>
                    <Input
                      placeholder="e.g., France"
                      value={newTrip.destinationCountry}
                      onChange={(e) => setNewTrip({ ...newTrip, destinationCountry: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Start Date *</label>
                    <Input
                      type="date"
                      value={newTrip.startDate}
                      onChange={(e) => setNewTrip({ ...newTrip, startDate: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">End Date *</label>
                    <Input
                      type="date"
                      value={newTrip.endDate}
                      onChange={(e) => setNewTrip({ ...newTrip, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Trip Type</label>
                    <select
                      className="w-full mt-1 p-2 border rounded-md"
                      value={newTrip.tripType}
                      onChange={(e) => setNewTrip({ ...newTrip, tripType: e.target.value })}
                    >
                      <option value="LEISURE">Leisure</option>
                      <option value="BUSINESS">Business</option>
                      <option value="FAMILY">Family</option>
                      <option value="ADVENTURE">Adventure</option>
                      <option value="ROMANTIC">Romantic</option>
                      <option value="SOLO">Solo</option>
                      <option value="GROUP">Group</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Number of Travelers</label>
                    <Input
                      type="number"
                      placeholder="1"
                      value={newTrip.numberOfTravelers}
                      onChange={(e) => setNewTrip({ ...newTrip, numberOfTravelers: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Estimated Budget</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newTrip.estimatedBudget}
                    onChange={(e) => setNewTrip({ ...newTrip, estimatedBudget: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <textarea
                    className="w-full mt-1 p-2 border rounded-md h-16"
                    placeholder="Additional notes..."
                    value={newTrip.notes}
                    onChange={(e) => setNewTrip({ ...newTrip, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={addTrip} className="flex-1">
                    Create Trip
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddTrip(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Booking Modal */}
        {showAddBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Add Booking</CardTitle>
                <CardDescription>Add a flight, hotel, or activity booking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Trip *</label>
                    <select
                      className="w-full mt-1 p-2 border rounded-md"
                      value={newBooking.tripId}
                      onChange={(e) => setNewBooking({ ...newBooking, tripId: e.target.value })}
                    >
                      <option value="">Select a trip</option>
                      {trips.map((trip) => (
                        <option key={trip._id} value={trip._id}>
                          {trip.tripName} - {trip.destination}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Booking Type *</label>
                    <select
                      className="w-full mt-1 p-2 border rounded-md"
                      value={newBooking.bookingType}
                      onChange={(e) => setNewBooking({ ...newBooking, bookingType: e.target.value })}
                    >
                      <option value="FLIGHT">Flight</option>
                      <option value="HOTEL">Hotel</option>
                      <option value="CAR_RENTAL">Car Rental</option>
                      <option value="ACTIVITY">Activity</option>
                      <option value="RESTAURANT">Restaurant</option>
                      <option value="TRAIN">Train</option>
                      <option value="BUS">Bus</option>
                      <option value="CRUISE">Cruise</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Confirmation Number *</label>
                    <Input
                      placeholder="ABC123"
                      value={newBooking.confirmationNumber}
                      onChange={(e) => setNewBooking({ ...newBooking, confirmationNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Provider Name *</label>
                    <Input
                      placeholder="e.g., United Airlines"
                      value={newBooking.providerName}
                      onChange={(e) => setNewBooking({ ...newBooking, providerName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Cost *</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newBooking.cost}
                      onChange={(e) => setNewBooking({ ...newBooking, cost: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Booking Date</label>
                    <Input
                      type="date"
                      value={newBooking.bookingDate}
                      onChange={(e) => setNewBooking({ ...newBooking, bookingDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* Flight-specific fields */}
                {newBooking.bookingType === 'FLIGHT' && (
                  <div className="border-t pt-4 space-y-4">
                    <h3 className="font-medium">Flight Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Flight Number (e.g., UA123)"
                        value={newBooking.flightNumber}
                        onChange={(e) => setNewBooking({ ...newBooking, flightNumber: e.target.value })}
                      />
                      <Input
                        placeholder="Airline"
                        value={newBooking.airline}
                        onChange={(e) => setNewBooking({ ...newBooking, airline: e.target.value })}
                      />
                      <Input
                        placeholder="Departure Airport (e.g., LAX)"
                        value={newBooking.departureAirport}
                        onChange={(e) => setNewBooking({ ...newBooking, departureAirport: e.target.value })}
                      />
                      <Input
                        placeholder="Arrival Airport (e.g., CDG)"
                        value={newBooking.arrivalAirport}
                        onChange={(e) => setNewBooking({ ...newBooking, arrivalAirport: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Hotel-specific fields */}
                {newBooking.bookingType === 'HOTEL' && (
                  <div className="border-t pt-4 space-y-4">
                    <h3 className="font-medium">Hotel Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Hotel Name"
                        value={newBooking.hotelName}
                        onChange={(e) => setNewBooking({ ...newBooking, hotelName: e.target.value })}
                      />
                      <Input
                        placeholder="Room Type"
                        value={newBooking.roomType}
                        onChange={(e) => setNewBooking({ ...newBooking, roomType: e.target.value })}
                      />
                      <div>
                        <label className="text-sm font-medium">Check-in Date</label>
                        <Input
                          type="date"
                          value={newBooking.checkInDate}
                          onChange={(e) => setNewBooking({ ...newBooking, checkInDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Check-out Date</label>
                        <Input
                          type="date"
                          value={newBooking.checkOutDate}
                          onChange={(e) => setNewBooking({ ...newBooking, checkOutDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Car Rental-specific fields */}
                {newBooking.bookingType === 'CAR_RENTAL' && (
                  <div className="border-t pt-4 space-y-4">
                    <h3 className="font-medium">Car Rental Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Rental Company"
                        value={newBooking.carRentalCompany}
                        onChange={(e) => setNewBooking({ ...newBooking, carRentalCompany: e.target.value })}
                      />
                      <Input
                        placeholder="Vehicle Type"
                        value={newBooking.vehicleType}
                        onChange={(e) => setNewBooking({ ...newBooking, vehicleType: e.target.value })}
                      />
                      <Input
                        placeholder="Pickup Location"
                        value={newBooking.pickupLocation}
                        onChange={(e) => setNewBooking({ ...newBooking, pickupLocation: e.target.value })}
                      />
                      <Input
                        placeholder="Dropoff Location"
                        value={newBooking.dropoffLocation}
                        onChange={(e) => setNewBooking({ ...newBooking, dropoffLocation: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <textarea
                    className="w-full mt-1 p-2 border rounded-md h-16"
                    placeholder="Additional notes..."
                    value={newBooking.notes}
                    onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={addBooking} className="flex-1">
                    Add Booking
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddBooking(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Itinerary Modal */}
        {showAddItinerary && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Add Itinerary Day</CardTitle>
                <CardDescription>Plan activities for a day of your trip</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Trip *</label>
                    <select
                      className="w-full mt-1 p-2 border rounded-md"
                      value={newItinerary.tripId}
                      onChange={(e) => setNewItinerary({ ...newItinerary, tripId: e.target.value })}
                    >
                      <option value="">Select a trip</option>
                      {trips.map((trip) => (
                        <option key={trip._id} value={trip._id}>
                          {trip.tripName} - {trip.destination}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Day Number *</label>
                    <Input
                      type="number"
                      placeholder="1"
                      value={newItinerary.dayNumber}
                      onChange={(e) => setNewItinerary({ ...newItinerary, dayNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Date *</label>
                    <Input
                      type="date"
                      value={newItinerary.date}
                      onChange={(e) => setNewItinerary({ ...newItinerary, date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Day Title *</label>
                    <Input
                      placeholder="e.g., Explore the Louvre"
                      value={newItinerary.title}
                      onChange={(e) => setNewItinerary({ ...newItinerary, title: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className="w-full mt-1 p-2 border rounded-md h-20"
                    placeholder="Describe the day's plan..."
                    value={newItinerary.description}
                    onChange={(e) => setNewItinerary({ ...newItinerary, description: e.target.value })}
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Add Activity (optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Activity Title"
                      value={newItinerary.activityTitle}
                      onChange={(e) => setNewItinerary({ ...newItinerary, activityTitle: e.target.value })}
                    />
                    <Input
                      type="time"
                      placeholder="Time"
                      value={newItinerary.activityTime}
                      onChange={(e) => setNewItinerary({ ...newItinerary, activityTime: e.target.value })}
                    />
                    <Input
                      placeholder="Location"
                      value={newItinerary.activityLocation}
                      onChange={(e) => setNewItinerary({ ...newItinerary, activityLocation: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Cost"
                      value={newItinerary.activityCost}
                      onChange={(e) => setNewItinerary({ ...newItinerary, activityCost: e.target.value })}
                    />
                  </div>
                  <div className="mt-3">
                    <Input
                      placeholder="Activity Description"
                      value={newItinerary.activityDescription}
                      onChange={(e) => setNewItinerary({ ...newItinerary, activityDescription: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <textarea
                    className="w-full mt-1 p-2 border rounded-md h-16"
                    placeholder="Additional notes..."
                    value={newItinerary.notes}
                    onChange={(e) => setNewItinerary({ ...newItinerary, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={addItinerary} className="flex-1">
                    Add Itinerary Day
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddItinerary(false)}>
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