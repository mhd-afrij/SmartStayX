import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { Input, Select, Checkbox } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { FolderOpen, MapPin, Calendar, Users, Layout, Search, ArrowLeft, ChevronRight } from "lucide-react";

const STEPS = [
  { key: "destination", label: "Destination", current: false },
  { key: "dates", label: "Dates", current: false },
  { key: "guests", label: "Guests", current: false },
  { key: "results", label: "Results", current: false },
];

const StepIndicator = ({ step }) => {
  return (
    <div className="flex items-center justify-between gap-2 mb-6 overflow-x-auto scrollbar-hide">
      {STEPS.map((s, i) => {
        const isDone = i < step;
        const isActive = i === step;
        return (
          <div key={s.key} className="flex items-center flex-1 min-w-[76px]">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                isDone
                  ? "bg-[#31826B] border-[#31826B] text-white"
                  : isActive ? "border-[#31826B] text-[#31826B] dark:text-[#6ED39F] bg-[#31826B]/10"
                  : "border-[#E5E7EB] dark-border-[#303631] text-[#6B7280] dark:text-[#9CA3AF] bg-white dark:bg-[#111827]"
            }">
              {isDone ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 5v.01M12 12l4 4 4-4M5 12h5v5H5M19 12h-5v5h-5" />
                </svg>
              ) : (
                <MapPin className="w-4 h-4" />
              })}
            </div>
            <span className="text-[10px] uppercase tracking-wide text-center ${
              isActive ? "text-[#0F172A] font-semibold" : "text-[#6B7280]"
            }">
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 flex-1 -mt-5 ${
              isDone ? "bg-[#31826B]" : "bg-[#E5E7EB] dark:bg-[#303631]"
            }`} />
          )}
        );
      })}
    </div>
  );
};

const TripPlannerPage = () => {
  const { formatPrice } = useAppContext();
  const [step, setStep] = useState(0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      <div className="mx-auto max-w-[1600px] px-4 md:px-6 lg:px-8">

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="p-2 rounded-[10px] bg-white dark:bg-[#111827] hover:bg-[#F1F5F9] dark:hover:bg-[#111827] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" /> Back
            </button>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#0F172A]">Plan Your Trip</h1>
            <Button variant="ghost" size="sm">
              <FolderOpen className="mr-2 h-4 w-4" /> Saved Trips
            </Button>
          </div>
        </header>

        {/* Step Progress Indicator */}
        <StepIndicator step={step} />

        {/* Step Content */}
        <div className="rounded-2xl border border-[#E5E7EB] dark-border-[#303631] bg-white dark:bg-[#111827] shadow-sm p-6 md:p-8">

          {step === 0 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Step 1: Destination</h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Input
                    label="Search destination"
                    placeholder="Enter a city, landmark, or address"
                    disabled={step > 0}
                    className="border-green-500"
                  />
                </div>
                <div>
                  <Input
                    label="Location"
                    placeholder="Colombo, Sri Lanka"
                    disabled={step > 0}
                    className="border-green-500 bg-green-50 dark:bg-[#052E1F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="border rounded-xl p-4 dark:border-[#303631]">
                  <h3 className="font-medium text-[#0F172A] mb-2">Suggested Destinations</h3>
                  <ul className="space-y-2 text-sm text-[#6B7280]">
                    <li>Sri Lanka beach resorts</li>
                    <li>Colombo city tour</li>
                    <li>Kandy cultural site</li>
                  </ul>
                </div>
                <div className="border rounded-xl p-4 dark:border-[#303631]">
                  <h3 className="font-medium text-[#0F172A] mb-2">Recent</h3>
                  <ul className="space-y-2 text-sm text-[#6B7280]">
                    <li>Last minute getaway</li>
                    <li>Family vacation 2024</li>
                  </ul>
                </div>
                <div className="border rounded-xl p-4 dark:border-[#303631]">
                  <h3 className="font-medium text-[#0F172A] mb-2">Popular</h3>
                  <ul className="space-y-2 text-sm text-[#6B7280]">
                    <li>Weekend escapes</li>
                    <li>Romantic getaway</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Step 2: Dates</h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Input
                    type="date"
                    label="Check-in"
                    className="border-blue-500"
                  />
                </div>
                <div>
                  <Input
                    type="date"
                    label="Check-out"
                    className="border-blue-500"
                  />
                </div>
                <div>
                  <Select
                    label="Guests"
                    className="border-blue-500"
                  >
                    <option value={1}>1 adult</option>
                    <option value={2}>2 adults</option>
                    <option value={3}>3 adults</option>
                    <option value={4}>4 adults</option>
                  </Select>
                </div>
              </div>

              <p className="text-sm text-[#6B7280]">
                flexible dates: <span className="text-[#ED8936] font-medium cursor-pointer">toggle</span>
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Step 2.5: Guests & Room Type</h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    label="Adults"
                    value={2}
                    className="border-blue-500"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    min={0}
                    max={5}
                    label="Children"
                    value={0}
                    className="border-blue-500"
                  />
                </div>
                <div>
                  <Select
                    label="Room Type"
                    className="border-blue-500"
                  >
                    <option value="standard">Standard Room</option>
                    <option value="deluxe">Deluxe Room</option>
                    <option value="suite">Suite</option>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Step 3: Results Preview</h2>

              <div className="space-y-4">
                <PropertyCard
                  hotelName="Sunset Beach Resort"
                  location="Bentota, Sri Lanka"
                  price={formatPrice(15000)}
                  rating={4.5}
                  imageUrl="https://picsum.photos/400/300"
                />
                <PropertyCard
                  hotelName="Colombo City Hotel"
                  location="Colombo, Sri Lanka"
                  price={formatPrice(12000)}
                  rating={4.2}
                  imageUrl="https://picsum.photos/400/300"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <input type="radio" name="sort" className="w-4 h-4 rounded-border bg-[#31826B] dark:bg-[#6ED39F]" /> Price low to high
                </label>
                <label className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <input type="radio" name="sort" className="w-4 h-4 rounded-border bg-[#31826B] dark:bg-[#6ED39F]" /> Price high to low
                </label>
                <label className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <input type="radio" name="sort" className="w-4 h-4 rounded-border bg-[#31826B] dark:bg-[#6ED39F]" /> Rating
                </label>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <footer className="mt-8 pt-8 border-t border-[#E5E7EB] dark-border-[#303631]">
          <div className="mx-auto max-w-[1600px] px-4 md:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              {step < 3 && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={step === 0}
                >
                  {step === 0 ? "Continue to Dates" : step === 1 ? "Continue to Guests" : "Continue to Results"}
                </Button>
              )}
              {step === 3 && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => alert("Search trips initiated!")}
                  disabled={true}
                >
                  Search Trips <ChevronRight className="ml-2" />
                </Button>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

const PropertyCard = ({ hotelName, location, price, rating, imageUrl }) => {
  return (
    <div className="group border rounded-xl p-6 dark:border-[#303631] hover:shadow-lg transition-shadow">
      <img
        src={imageUrl}
        alt={hotelName}
        className="h-48 w-full object-cover rounded-lg mb-4"
      />
      <h3 className="font-medium text-[#0F172A] mb-1">{hotelName}</h3>
      <p className="text-sm text-[#6B7280] mb-3">{location}</p>
      <div className="flex items-center gap-2">
        <svg
          className="w-4 h-4 fill-[#ED8936]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm-2 4.586l-2-2L4 6l2-1 1,2-2 2L9 19l8 2-1-2L13 7.586l2 2L17 13l-2 1-1-2L13 3.586z" />
        </svg>
        <span className="text-[#0F172A]">{rating} ({rating >= 4 ? "review" : "reviews"})</span>
      </div>
      <p className="text-2xl font-bold text-[#ED8936] mt-3">{price}</p>
    </div>
  );
};

export default TripPlannerPage;