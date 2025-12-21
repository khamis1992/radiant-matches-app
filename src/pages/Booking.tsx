import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, MapPin, CreditCard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import artist1 from "@/assets/artist-1.jpg";

const timeSlots = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
];

const locations = [
  { id: "client", label: "At My Location", description: "Artist comes to you (+$25)" },
  { id: "studio", label: "Artist's Studio", description: "Visit the artist's workspace" },
];

const Booking = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const serviceName = searchParams.get("service") || "Bridal Makeup";
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>("studio");
  const [step, setStep] = useState(1);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Generate dates for next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return date;
  });

  const handleConfirmBooking = () => {
    setIsConfirmed(true);
    toast.success("Booking confirmed! Check your email for details.");
    setTimeout(() => navigate("/bookings"), 2000);
  };

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="animate-scale-in text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Booking Confirmed!</h1>
          <p className="text-muted-foreground mt-2">
            Your appointment has been scheduled successfully.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Redirecting to your bookings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center gap-3 px-5 py-4">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="font-semibold text-foreground">Book Appointment</h1>
            <p className="text-sm text-muted-foreground">Step {step} of 3</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </header>

      {/* Artist & Service Summary */}
      <div className="px-5 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <img
            src={artist1}
            alt="Artist"
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-medium text-foreground">Sofia Chen</h3>
            <p className="text-sm text-primary">{serviceName}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="font-bold text-foreground">$350</p>
            <p className="text-xs text-muted-foreground">3 hours</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Step 1: Select Date */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Select Date</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
              {dates.map((date) => {
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 w-16 py-3 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <p className="text-xs text-muted-foreground">
                      {date.toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <p className={`text-lg font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {date.getDate()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {date.toLocaleDateString("en-US", { month: "short" })}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mt-8 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Select Time</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((time) => {
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground hover:border-primary/50"
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Select Location */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Select Location</h2>
            </div>
            <div className="space-y-3">
              {locations.map((location) => {
                const isSelected = selectedLocation === location.id;
                return (
                  <button
                    key={location.id}
                    onClick={() => setSelectedLocation(location.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <p className={`font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {location.label}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {location.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium text-foreground">
                Additional Notes (optional)
              </label>
              <textarea
                placeholder="Any special requests or preferences..."
                className="w-full mt-2 p-4 bg-card border border-border rounded-xl resize-none h-24 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        )}

        {/* Step 3: Confirm & Pay */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-semibold text-foreground mb-4">Booking Summary</h2>
            
            <div className="bg-card rounded-xl border border-border p-4 space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium text-foreground">{serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium text-foreground">
                  {selectedDate?.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium text-foreground">{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium text-foreground">
                  {selectedLocation === "client" ? "Your Location" : "Artist's Studio"}
                </span>
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Fee</span>
                  <span className="font-medium text-foreground">$350</span>
                </div>
                {selectedLocation === "client" && (
                  <div className="flex justify-between mt-2">
                    <span className="text-muted-foreground">Travel Fee</span>
                    <span className="font-medium text-foreground">$25</span>
                  </div>
                )}
                <div className="flex justify-between mt-4 text-lg">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-primary">
                    ${selectedLocation === "client" ? 375 : 350}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Payment Method</h3>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                <div className="w-12 h-8 bg-gradient-to-r from-[hsl(220,60%,50%)] to-[hsl(220,60%,40%)] rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">VISA</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">•••• •••• •••• 4242</p>
                  <p className="text-xs text-muted-foreground">Expires 12/25</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  defaultChecked
                />
                <span className="text-sm text-muted-foreground">
                  I agree to the cancellation policy and terms of service
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-5">
        {step < 3 ? (
          <Button
            size="lg"
            className="w-full"
            disabled={step === 1 && (!selectedDate || !selectedTime)}
            onClick={() => setStep(step + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button
            size="lg"
            variant="gold"
            className="w-full"
            onClick={handleConfirmBooking}
          >
            Pay ${selectedLocation === "client" ? 375 : 350}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Booking;
