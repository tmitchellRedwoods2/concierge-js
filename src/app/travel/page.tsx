/**
 * Travel page
 */
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TravelPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [trips, setTrips] = useState([
    { id: 1, destination: "Paris, France", dates: "2024-03-15 to 2024-03-22", status: "Booked", cost: 2500, type: "Leisure" },
    { id: 2, destination: "New York, NY", dates: "2024-02-10 to 2024-02-12", status: "Confirmed", cost: 800, type: "Business" },
    { id: 3, destination: "Tokyo, Japan", dates: "2024-05-01 to 2024-05-10", status: "Planning", cost: 0, type: "Leisure" },
  ]);
  const [bookings, setBookings] = useState([
    { id: 1, type: "Flight", details: "LAX → CDG", date: "2024-03-15", cost: 1200, status: "Confirmed" },
    { id: 2, type: "Hotel", details: "Hotel Plaza Athénée", date: "2024-03-15", cost: 800, status: "Confirmed" },
    { id: 3, type: "Rental Car", details: "Hertz - Paris", date: "2024-03-16", cost: 300, status: "Pending" },
  ]);
  const [newTrip, setNewTrip] = useState({ destination: "", startDate: "", endDate: "", type: "", budget: "" });

  const addTrip = () => {
    if (newTrip.destination && newTrip.startDate && newTrip.endDate && newTrip.type) {
      const trip = {
        id: trips.length + 1,
        destination: newTrip.destination,
        dates: `${newTrip.startDate} to ${newTrip.endDate}`,
        status: "Planning",
        cost: parseFloat(newTrip.budget) || 0,
        type: newTrip.type
      };
      setTrips([...trips, trip]);
      setNewTrip({ destination: "", startDate: "", endDate: "", type: "", budget: "" });
    }
  };

  const totalCost = trips.reduce((sum, trip) => sum + trip.cost, 0);
  const upcomingTrips = trips.filter(trip => new Date(trip.dates.split(' to ')[0]) > new Date()).length;

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
                onClick={() => router.push("/")}
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
              💬 Messages
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/ai-agents")} className="whitespace-nowrap text-xs px-3 py-2">
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
            ✈️ Travel Planning
          </h1>
          <p className="text-gray-600">
            Plan and manage your travel itineraries
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Trips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {upcomingTrips}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Travel Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${totalCost.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {bookings.filter(b => b.status === 'Confirmed').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Trip Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Plan New Trip</CardTitle>
            <CardDescription>Add a new travel itinerary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <Input
                placeholder="Destination"
                value={newTrip.destination}
                onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })}
              />
              <Input
                type="date"
                placeholder="Start Date"
                value={newTrip.startDate}
                onChange={(e) => setNewTrip({ ...newTrip, startDate: e.target.value })}
              />
              <Input
                type="date"
                placeholder="End Date"
                value={newTrip.endDate}
                onChange={(e) => setNewTrip({ ...newTrip, endDate: e.target.value })}
              />
              <select
                value={newTrip.type}
                onChange={(e) => setNewTrip({ ...newTrip, type: e.target.value })}
                className="p-2 border rounded-md"
              >
                <option value="">Trip Type</option>
                <option value="Leisure">Leisure</option>
                <option value="Business">Business</option>
                <option value="Family">Family</option>
              </select>
              <Input
                placeholder="Budget"
                type="number"
                value={newTrip.budget}
                onChange={(e) => setNewTrip({ ...newTrip, budget: e.target.value })}
              />
              <Button onClick={addTrip} className="w-full md:col-span-1">
                Add Trip
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trips List */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Travel Itineraries</CardTitle>
            <CardDescription>Your planned and completed trips</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trips.map((trip) => (
                <div key={trip.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{trip.destination}</h3>
                    <p className="text-sm text-gray-600">{trip.dates}</p>
                    <p className="text-sm text-gray-500">{trip.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">${trip.cost.toLocaleString()}</p>
                    <p className={`text-sm ${trip.status === 'Confirmed' ? 'text-green-600' : trip.status === 'Booked' ? 'text-blue-600' : 'text-orange-600'}`}>
                      {trip.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <Card>
          <CardHeader>
            <CardTitle>Travel Bookings</CardTitle>
            <CardDescription>Your flight, hotel, and rental bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{booking.type}</h3>
                    <p className="text-sm text-gray-600">{booking.details}</p>
                    <p className="text-sm text-gray-500">{booking.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${booking.cost.toLocaleString()}</p>
                    <p className={`text-sm ${booking.status === 'Confirmed' ? 'text-green-600' : 'text-orange-600'}`}>
                      {booking.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
