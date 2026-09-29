import React, { useState } from 'react';
import { UserCog, BookOpen, Building2, DoorOpen, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Props {
  onComplete: () => void | Promise<void>;
}

export const ProfileSetupScreen: React.FC<Props> = ({ onComplete }) => {
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [studentId, setStudentId] = useState(user?.studentId || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [university, setUniversity] = useState(user?.university || '');
  const [roomNumber, setRoomNumber] = useState(user?.roomNumber || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) {
      setError('Room number is required to complete your profile.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updateProfile({
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        studentId: studentId.trim() || undefined,
        department: department.trim() || undefined,
        university: university.trim() || undefined,
        roomNumber: roomNumber.trim(),
      });
      await onComplete();
    } catch (err: any) {
      setError(err?.message || 'Could not save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 font-body">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-terracotta/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-terracotta/6 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-terracotta text-white shadow-level2 mb-4">
            <UserCog className="w-8 h-8" />
          </div>
          <h1 className="font-display font-extrabold text-2xl text-slate-deep">Complete Your Profile</h1>
          <p className="text-sm text-slate-muted mt-2 max-w-xs mx-auto">
            A few quick details to personalise your MessMate experience.
            <span className="text-terracotta font-medium"> Room number is required.</span>
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-card shadow-level2 border border-slate-border p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-muted uppercase tracking-wide mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                id="profile-full-name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your display name"
                className="w-full h-11 px-4 rounded-input border border-slate-border bg-slate-50 text-sm text-slate-deep placeholder-slate-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta/60 transition-all"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-muted uppercase tracking-wide mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-muted" />
                <input
                  type="tel"
                  id="profile-phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full h-11 pl-9 pr-4 rounded-input border border-slate-border bg-slate-50 text-sm text-slate-deep placeholder-slate-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta/60 transition-all"
                />
              </div>
            </div>

            {/* Student ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-muted uppercase tracking-wide mb-1.5">
                Student ID
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-muted" />
                <input
                  type="text"
                  id="profile-student-id"
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  placeholder="e.g. 2020-3-60-XXX"
                  className="w-full h-11 pl-9 pr-4 rounded-input border border-slate-border bg-slate-50 text-sm text-slate-deep placeholder-slate-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta/60 transition-all"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-muted uppercase tracking-wide mb-1.5">
                Department
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-muted" />
                <input
                  type="text"
                  id="profile-department"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="e.g. CSE, EEE, BBA"
                  className="w-full h-11 pl-9 pr-4 rounded-input border border-slate-border bg-slate-50 text-sm text-slate-deep placeholder-slate-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta/60 transition-all"
                />
              </div>
            </div>

            {/* University */}
            <div>
              <label className="block text-xs font-semibold text-slate-muted uppercase tracking-wide mb-1.5">
                University
              </label>
              <input
                type="text"
                id="profile-university"
                value={university}
                onChange={e => setUniversity(e.target.value)}
                placeholder="e.g. AUST, DU, BUET"
                className="w-full h-11 px-4 rounded-input border border-slate-border bg-slate-50 text-sm text-slate-deep placeholder-slate-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta/60 transition-all"
              />
            </div>

            {/* Room Number — Required */}
            <div>
              <label className="block text-xs font-semibold text-slate-muted uppercase tracking-wide mb-1.5">
                Room Number <span className="text-terracotta">*</span>
              </label>
              <div className="relative">
                <DoorOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-muted" />
                <input
                  type="text"
                  id="profile-room-number"
                  value={roomNumber}
                  onChange={e => setRoomNumber(e.target.value)}
                  placeholder="e.g. Room 204, Block B"
                  required
                  className="w-full h-11 pl-9 pr-4 rounded-input border border-slate-border bg-slate-50 text-sm text-slate-deep placeholder-slate-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta/60 transition-all"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-xs text-status-error bg-red-50 border border-red-200 rounded-input px-3 py-2">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="profile-save-btn"
              disabled={loading}
              className="w-full h-12 bg-terracotta hover:bg-terracotta-hover text-white rounded-button text-sm font-bold shadow-level1 flex items-center justify-center gap-2 transition-all disabled:opacity-60 active:scale-98 mt-2"
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save Profile &amp; Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-muted mt-4">
          You can update this anytime from your account settings.
        </p>
      </div>
    </div>
  );
};
