import { useState } from 'react';
import {
  Utensils,
  Wallet,
  Calendar,
  Sparkles,
  Users,
  Search,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Input,
  Select,
  ToggleSwitch,
  Modal,
  Tabs,
  StatCard,
  MealToggleCard,
  Alert,
  Skeleton,
  EmptyState,
} from '../../components/common';

export interface ComponentShowcaseProps {
  onBack?: () => void;
}

export const ComponentShowcase: React.FC<ComponentShowcaseProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('components');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [simpleToggle, setSimpleToggle] = useState(true);

  // Meal Toggle Card states
  const [breakfastOn, setBreakfastOn] = useState(true);
  const [breakfastGuests, setBreakfastGuests] = useState(0);
  const [breakfastNotes, setBreakfastNotes] = useState('');

  const [lunchOn, setLunchOn] = useState(true);
  const [lunchGuests, setLunchGuests] = useState(2);
  const [lunchNotes, setLunchNotes] = useState('Guest has peanut allergy');

  const [dinnerOn, setDinnerOn] = useState(false);
  const [dinnerGuests, setDinnerGuests] = useState(0);
  const [dinnerNotes, setDinnerNotes] = useState('');

  return (
    <div className="min-h-screen bg-canvas text-slate-deep pb-16">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-border px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-button bg-terracotta flex items-center justify-center text-white shadow-level1">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-lg sm:text-xl text-slate-deep tracking-tight">
                MessMate
              </h1>
              <Badge variant="dietary" size="sm">Design System</Badge>
            </div>
            <p className="text-[11px] text-slate-muted font-body">
              Warm Tactile Modernism • Google Stitch (Project 1270085416833071455)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {onBack && (
            <Button
              variant="primary"
              size="sm"
              onClick={onBack}
              className="mr-2"
            >
              ← Back to Student Portal
            </Button>
          )}
          <Badge variant="student" size="md" icon={<Sparkles className="w-3.5 h-3.5" />}>
            Student View
          </Badge>
          <Badge variant="chef" size="md" className="hidden sm:inline-flex">
            Chef View
          </Badge>
          <Badge variant="manager" size="md" className="hidden sm:inline-flex">
            Manager View
          </Badge>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 space-y-10">
        {/* Intro Hero Banner */}
        <section className="bg-white rounded-card p-6 sm:p-8 border border-slate-border shadow-level1 relative overflow-hidden">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-terracotta font-semibold text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Phase 5 Design System Complete</span>
            </div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-deep mb-3 leading-tight">
              Hospitality Warmth Meets Operational Precision
            </h2>
            <p className="text-sm text-slate-muted leading-relaxed font-body mb-6">
              MessMate’s tactile component language combines organic Terracotta accents (<code className="text-terracotta font-semibold">#F25C2A</code>), Sage Teal (<code className="text-sage font-semibold">#2A9D8F</code>), soft cream canvas (<code className="text-slate-muted font-semibold">#FDFBF7</code>), and 48px minimum touch targets optimized for busy student dining halls and quick kitchen scanning.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
                Open Dialog Modal
              </Button>
              <Button variant="secondary" size="md" onClick={() => alert('Exporting notice board...')}>
                Notice Board Export
              </Button>
            </div>
          </div>
        </section>

        {/* 1. Color Palette Tokens */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-xl text-slate-deep">
              1. Curated Color Palette Tokens
            </h3>
            <span className="text-xs text-slate-muted">Stitch Theme Tokens</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-4 rounded-button bg-terracotta text-white shadow-level1">
              <div className="text-xs font-semibold uppercase opacity-80">Primary</div>
              <div className="font-display font-bold text-sm mt-1">Terracotta</div>
              <div className="text-[11px] font-mono mt-1 opacity-90">#F25C2A</div>
            </div>

            <div className="p-4 rounded-button bg-sage text-white shadow-subtle">
              <div className="text-xs font-semibold uppercase opacity-80">Secondary</div>
              <div className="font-display font-bold text-sm mt-1">Sage Teal</div>
              <div className="text-[11px] font-mono mt-1 opacity-90">#2A9D8F</div>
            </div>

            <div className="p-4 rounded-button bg-coral text-white shadow-subtle">
              <div className="text-xs font-semibold uppercase opacity-80">Tertiary</div>
              <div className="font-display font-bold text-sm mt-1">Burnt Coral</div>
              <div className="text-[11px] font-mono mt-1 opacity-90">#E76F51</div>
            </div>

            <div className="p-4 rounded-button bg-slate-deep text-white shadow-subtle">
              <div className="text-xs font-semibold uppercase opacity-80">Text Primary</div>
              <div className="font-display font-bold text-sm mt-1">Deep Slate</div>
              <div className="text-[11px] font-mono mt-1 opacity-90">#1E293B</div>
            </div>

            <div className="p-4 rounded-button bg-canvas-tint text-slate-deep border border-slate-border">
              <div className="text-xs font-semibold uppercase text-slate-muted">Input Fill</div>
              <div className="font-display font-bold text-sm mt-1">Warm Tint</div>
              <div className="text-[11px] font-mono mt-1 text-slate-muted">#F4F0E8</div>
            </div>

            <div className="p-4 rounded-button bg-white text-slate-deep border border-slate-border shadow-level1">
              <div className="text-xs font-semibold uppercase text-slate-muted">Card Surface</div>
              <div className="font-display font-bold text-sm mt-1">Pure White</div>
              <div className="text-[11px] font-mono mt-1 text-slate-muted">#FFFFFF</div>
            </div>
          </div>
        </section>

        {/* 2. Interactive Core Component: Daily Meal Booking Cards */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-xl text-slate-deep">
                2. Core Meal Booking Cards (MealToggleCard)
              </h3>
              <p className="text-xs text-slate-muted mt-0.5">
                Session toggle, cutoff validation, guest steppers, and dietary notes
              </p>
            </div>
            <Badge variant="success" size="sm">Real-Time Responsive</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <MealToggleCard
              sessionName="Breakfast"
              unitValue={0.5}
              timeRange="07:30 AM – 09:30 AM"
              cutoffTime="07:00 AM"
              isMealOn={breakfastOn}
              onToggleMeal={setBreakfastOn}
              guestCount={breakfastGuests}
              onGuestCountChange={setBreakfastGuests}
              notes={breakfastNotes}
              onNotesChange={setBreakfastNotes}
              menuItemName="Vegetable Khichuri with Fried Egg"
              dietaryTags={['Halal', 'High Protein']}
            />

            <MealToggleCard
              sessionName="Lunch"
              unitValue={1.0}
              timeRange="01:00 PM – 03:00 PM"
              cutoffTime="11:30 AM"
              isMealOn={lunchOn}
              onToggleMeal={setLunchOn}
              guestCount={lunchGuests}
              onGuestCountChange={setLunchGuests}
              notes={lunchNotes}
              onNotesChange={setLunchNotes}
              menuItemName="Pabda Fish Curry with Steamed Rice"
              dietaryTags={['Halal', 'Local Catch']}
            />

            <MealToggleCard
              sessionName="Dinner"
              unitValue={1.0}
              timeRange="08:00 PM – 10:00 PM"
              cutoffTime="05:30 PM"
              isMealOn={dinnerOn}
              onToggleMeal={setDinnerOn}
              guestCount={dinnerGuests}
              onGuestCountChange={setDinnerGuests}
              notes={dinnerNotes}
              onNotesChange={setDinnerNotes}
              menuItemName="Beef Bhuna with Green Salad & Rice"
              dietaryTags={['Halal', 'Chef Special']}
            />
          </div>
        </section>

        {/* 3. Stat Cards with Kitchen Capacity Gauges */}
        <section className="space-y-4">
          <h3 className="font-display font-bold text-xl text-slate-deep">
            3. Metric Displays & Capacity Rush Gauges (StatCard)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Account Balance"
              value="৳ 1,589.25"
              subtitle="Cycle #1 (Day 14 of 30)"
              icon={<Wallet className="w-5 h-5" />}
              iconBg="terracotta"
              trend={{ value: '+৳1,800 deposit', isPositive: true }}
            />

            <StatCard
              label="Running Meal Rate"
              value="৳ 102.13"
              subtitle="258 total counted units"
              icon={<Utensils className="w-5 h-5" />}
              iconBg="coral"
            />

            <StatCard
              label="Active Cycle Progress"
              value="14 / 30"
              subtitle="2 Paused Days Adjusted"
              icon={<Calendar className="w-5 h-5" />}
              iconBg="sage"
            />

            <StatCard
              label="Lunch Hall Rush"
              value="78 Diners"
              subtitle="Peak seating window"
              icon={<Users className="w-5 h-5" />}
              iconBg="neutral"
              capacityPercentage={74}
            />
          </div>
        </section>

        {/* 4. Buttons, Badges, Tabs, and Inputs */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Buttons & Badges */}
          <Card>
            <CardHeader>
              <CardTitle>4. Buttons & Badges</CardTitle>
              <CardDescription>
                Tactile interactions, 48px hit targets, role indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Button Variants */}
              <div>
                <span className="text-xs font-semibold text-slate-muted block mb-3 uppercase tracking-wider">
                  Button Variants
                </span>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" size="md">
                    Primary Terracotta
                  </Button>
                  <Button variant="secondary" size="md">
                    Secondary Sage
                  </Button>
                  <Button variant="outline" size="md">
                    Outline
                  </Button>
                  <Button variant="ghost" size="md">
                    Ghost
                  </Button>
                  <Button variant="danger" size="md">
                    Danger
                  </Button>
                  <Button variant="primary" size="md" isLoading>
                    Loading
                  </Button>
                </div>
              </div>

              {/* Role Badges from Stitch */}
              <div>
                <span className="text-xs font-semibold text-slate-muted block mb-3 uppercase tracking-wider">
                  Stitch Role & Status Badges
                </span>
                <div className="flex flex-wrap gap-2.5">
                  <Badge variant="student" size="md">
                    Student: Active
                  </Badge>
                  <Badge variant="chef" size="md">
                    Chef Headcount
                  </Badge>
                  <Badge variant="manager" size="md">
                    Primary Manager
                  </Badge>
                  <Badge variant="success" size="md">
                    Approved
                  </Badge>
                  <Badge variant="warning" size="md">
                    Pending Review
                  </Badge>
                  <Badge variant="error" size="md">
                    Negative Balance
                  </Badge>
                </div>
              </div>

              {/* Toggle Switch */}
              <div>
                <span className="text-xs font-semibold text-slate-muted block mb-3 uppercase tracking-wider">
                  Standalone Toggle Switch
                </span>
                <ToggleSwitch
                  checked={simpleToggle}
                  onChange={setSimpleToggle}
                  label="Receive Daily Lunch Reminder (11:00 AM)"
                  sublabel="Sends notice before cutoff passes"
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Controls & Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>5. Form Inputs & Navigation Tabs</CardTitle>
              <CardDescription>
                Recessed well fills, warm focus rings, and segmented pill tabs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tabs */}
              <div>
                <span className="text-xs font-semibold text-slate-muted block mb-3 uppercase tracking-wider">
                  Pill Segmented Control
                </span>
                <Tabs
                  items={[
                    { id: 'components', label: 'All Components', count: 12 },
                    { id: 'meals', label: 'Meal Bookings' },
                    { id: 'governance', label: 'Governance Votes', count: 1 },
                  ]}
                  activeId={activeTab}
                  onChange={setActiveTab}
                  variant="pill"
                />
              </div>

              {/* Inputs */}
              <div className="space-y-3.5">
                <Input
                  label="Search Mess Members"
                  placeholder="Search by student name or room number..."
                  leftIcon={<Search className="w-4 h-4" />}
                />

                <Select
                  label="Payment Method"
                  options={[
                    { value: 'BKASH', label: 'bKash Mobile Wallet' },
                    { value: 'NAGAD', label: 'Nagad' },
                    { value: 'CASH', label: 'Cash to Manager' },
                    { value: 'BANK', label: 'Bank Transfer' },
                  ]}
                />

                <Input
                  label="Transaction Reference (With Validation Error Demo)"
                  defaultValue="BKASH_INVALID"
                  error="Transaction ID has already been recorded for this cycle"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 6. Alerts and Banners */}
        <section className="space-y-4">
          <h3 className="font-display font-bold text-xl text-slate-deep">
            6. Alerts & Operational Banners
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Alert type="warning" title="Negative Balance Notice">
              Student Sohel Rana’s balance is currently <strong>-৳2,055.43</strong>. Please submit a deposit to avoid automated meal suspension.
            </Alert>

            <Alert type="success" title="Deposit Approved">
              Your advance payment of <strong>৳1,800.00</strong> via bKash (Ref: BKASH_LIVE_001) has been approved by Rahim Chowdhury.
            </Alert>

            <Alert type="info" title="Dining Hall Sanitation Day (Paused Cycle)">
              Tuesday, September 8 is marked as a scheduled maintenance day. Cycle #1 scheduled end date has shifted forward to September 24.
            </Alert>

            <Alert type="error" title="Cutoff Time Reached">
              Lunch booking for today closed at 11:30 AM. Contact kitchen manager for urgent guest arrangements.
            </Alert>
          </div>
        </section>

        {/* 7. Loading States */}
        <section className="space-y-4">
          <h3 className="font-display font-bold text-xl text-slate-deep">
            7. Skeleton Loading Placeholders
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-card border border-slate-border shadow-level1 space-y-3">
              <Skeleton variant="rectangular" height={36} width="60%" />
              <Skeleton variant="text" />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="rectangular" height={48} className="mt-4" />
            </div>
            <div className="p-5 bg-white rounded-card border border-slate-border shadow-level1 space-y-3">
              <Skeleton variant="rectangular" height={36} width="60%" />
              <Skeleton variant="text" />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="rectangular" height={48} className="mt-4" />
            </div>
            <div className="p-5 bg-white rounded-card border border-slate-border shadow-level1 space-y-3">
              <Skeleton variant="rectangular" height={36} width="60%" />
              <Skeleton variant="text" />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="rectangular" height={48} className="mt-4" />
            </div>
          </div>
        </section>

        {/* 8. Empty State */}
        <section className="space-y-4">
          <h3 className="font-display font-bold text-xl text-slate-deep">
            8. Empty State Pattern
          </h3>
          <EmptyState
            title="No Active Meal Bookings for Sunday"
            description="You haven't activated any dining sessions for this weekend. Toggle sessions above before 07:00 AM cutoff to dine with your hall mates."
            actionLabel="Book Today's Meals"
            onAction={() => alert('Quick toggle opened')}
          />
        </section>
      </main>

      {/* Interactive Modal Preview */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit Advance Deposit"
        description="Deposit funds to your mess meal account via bKash, Nagad, or Cash"
      >
        <div className="space-y-4">
          <Input label="Deposit Amount (BDT)" type="number" defaultValue="2000" />
          <Select
            label="Payment Method"
            options={[
              { value: 'BKASH', label: 'bKash (017XXXXXXXX)' },
              { value: 'NAGAD', label: 'Nagad' },
              { value: 'CASH', label: 'Cash to Manager' },
            ]}
          />
          <Input label="Transaction ID / Receipt Reference" placeholder="e.g. 9BKS7821A" />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="md" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                alert('Deposit submitted for manager review!');
                setIsModalOpen(false);
              }}
            >
              Submit Deposit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
