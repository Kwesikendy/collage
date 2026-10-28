import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import {
  UsersRound,
  Contact,
  Bell,
  CalendarCheck,
  Check,
  X,
  Plus,
  Filter,
  Search,
  Pin,
  ShieldAlert,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Briefcase,
  UserCheck,
  UserX,
  FileText,
  Calendar,
  Send,
  Layers,
  Sparkles,
  Phone,
  Mail,
  UserPlus,
} from 'lucide-react';
import { customFetch } from '@/lib/api-client/custom-fetch';
import type {
  StaffMember,
  InternalNotice,
  AttendanceRecord,
  LeaveRequest,
  StaffDepartment,
  StaffStatus,
  NoticePriority,
  NoticeCategory,
  AttendanceStatus,
  LeaveType,
} from '@/types/workflows';
import { sortInternalNotices } from '@/types/workflows';

const DEPARTMENTS: StaffDepartment[] = [
  'Production',
  'Field & Rigging',
  'Creative',
  'Marketing',
  'Finance',
  'HR',
  'Executive',
];

const STAFF_STATUSES: StaffStatus[] = ['active', 'on_leave', 'remote', 'probation'];

const NOTICE_CATEGORIES: NoticeCategory[] = ['general', 'safety', 'operations', 'event', 'policy'];
const NOTICE_PRIORITIES: NoticePriority[] = ['urgent', 'high', 'medium', 'low'];

// ============================================================================
// HR DASHBOARD HUB (Canonical /dashboard for HR Role)
// ============================================================================
export function HrDashboardHub() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [notices, setNotices] = useState<InternalNotice[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [staffData, noticesData, attData, leaveData] = await Promise.all([
        customFetch<StaffMember[]>('/api/hr/staff').catch(() => []),
        customFetch<InternalNotice[]>('/api/hr/notices').catch(() => []),
        customFetch<AttendanceRecord[]>('/api/hr/attendance').catch(() => []),
        customFetch<LeaveRequest[]>('/api/hr/leave').catch(() => []),
      ]);
      setStaff(staffData || []);
      setNotices(noticesData || []);
      setAttendance(attData || []);
      setLeaveRequests(leaveData || []);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  async function handleApproveLeave(id: string) {
    try {
      await customFetch(`/api/hr/leave/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
      });
      showToast('Leave request approved successfully!');
      loadData();
    } catch {
      showToast('Failed to approve leave request.');
    }
  }

  async function handleRejectLeave(id: string) {
    try {
      await customFetch(`/api/hr/leave/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'rejected' }),
      });
      showToast('Leave request declined.');
      loadData();
    } catch {
      showToast('Failed to reject leave request.');
    }
  }

  const activeStaffCount = staff.filter((s) => s.status === 'active').length;
  const onFieldCount = attendance.filter((a) => a.status === 'on_field').length;
  const pendingLeaves = leaveRequests.filter((l) => l.status === 'pending');
  const attendanceRate =
    staff.length > 0 ? (((attendance.length) / staff.length) * 100).toFixed(1) : '100.0';

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-[#111110] px-4 py-3 text-xs font-medium text-white shadow-xl border border-neutral-700 animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#C61C2E]">
            People & Culture Desk : Operations Hub
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
            People Hub & Workplace Administration
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Workforce records, workshop & field rigging attendance, safety protocols, and leave queue.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/staff"
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors no-underline cursor-pointer"
          >
            <Contact size={13} /> Staff Directory ({staff.length})
          </Link>
          <Link
            href="/attendance"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#111110] px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors no-underline cursor-pointer"
          >
            <CalendarCheck size={13} /> Daily Attendance
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel p-4 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Total Staff Headcount</span>
            <UsersRound size={15} className="text-[#C61C2E]" />
          </div>
          <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">
            {staff.length} Personnel
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {activeStaffCount} active across 7 operational departments
          </div>
        </div>

        <div className="panel p-4 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Today Attendance</span>
            <CalendarCheck size={15} className="text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">
            {attendanceRate}% Logged
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {attendance.length} check-ins recorded for today
          </div>
        </div>

        <div className="panel p-4 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>On-Field Rigging Crew</span>
            <Layers size={15} className="text-blue-600" />
          </div>
          <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">
            {onFieldCount} Deployed
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Active at AICC, Ridge, and Motorway gantry sites
          </div>
        </div>

        <div className="panel p-4 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Pending Leave Requests</span>
            <Clock size={15} className="text-amber-600" />
          </div>
          <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">
            {pendingLeaves.length} Pending
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Awaiting People & Culture sign-off
          </div>
        </div>
      </div>

      {/* Main Grid: Attendance & Leave Queue / Notice Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Today Attendance Log */}
          <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Today Field & Workshop Presence Log
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Daily timestamps for workshop fabricators and on-site rigging specialists.
                </p>
              </div>
              <Link
                href="/attendance"
                className="text-xs text-[#C61C2E] hover:underline font-medium no-underline"
              >
                Full Attendance Log →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 font-medium">
                    <th className="pb-2">Staff Member</th>
                    <th className="pb-2">Department</th>
                    <th className="pb-2">Check-In Time</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Operational Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {attendance.slice(0, 6).map((rec) => (
                    <tr key={rec.id} className="hover:bg-neutral-50/50">
                      <td className="py-2.5 font-medium text-neutral-900">
                        {rec.staffName}
                        <div className="text-[10px] text-neutral-400 font-mono">ID: {rec.staffId}</div>
                      </td>
                      <td className="py-2.5 text-neutral-600">{rec.department}</td>
                      <td className="py-2.5 font-mono text-neutral-700">{rec.checkInTime}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase font-mono ${
                            rec.status === 'on_field'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : rec.status === 'present'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : rec.status === 'late'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {rec.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 text-neutral-500 text-[11px] max-w-xs truncate">
                        {rec.notes || 'Normal workshop roster'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Leave Requests */}
          <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Leave Requests Queue</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Review and approve employee statutory and casual leaves.
                </p>
              </div>
              <Link
                href="/attendance"
                className="text-xs text-[#C61C2E] hover:underline font-medium no-underline"
              >
                Manage All Leaves →
              </Link>
            </div>

            {leaveRequests.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-500">
                No leave requests in queue.
              </div>
            ) : (
              <div className="space-y-3">
                {leaveRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-neutral-100 bg-neutral-50/60 p-3.5"
                  >
                    <div>
                      <div className="text-xs font-bold text-neutral-900">
                        {req.staffName} · <span className="font-normal text-neutral-500">{req.department}</span>
                      </div>
                      <div className="text-xs text-neutral-600 mt-0.5 font-medium">
                        <span className="capitalize">{req.leaveType}</span> Leave · {req.days} Days ({req.startDate} to {req.endDate})
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-1">
                        Reason: {req.reason}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {req.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRejectLeave(req.id)}
                            className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveLeave(req.id)}
                            className="inline-flex items-center gap-1 rounded bg-[#111110] px-3 py-1 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            <Check size={12} /> Approve Leave
                          </button>
                        </>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
                            req.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-neutral-200 text-neutral-700'
                          }`}
                        >
                          {req.status === 'approved' ? <Check size={12} /> : <X size={12} />}
                          <span className="capitalize">{req.status}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Internal Notices Board */}
        <div className="space-y-6">
          <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-neutral-900">
                Company Bulletin & Safety Notices
              </h3>
              <Link
                href="/notices"
                className="text-xs text-[#C61C2E] hover:underline font-medium no-underline"
              >
                All Notices →
              </Link>
            </div>
            <div className="space-y-3">
              {notices.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-lg border p-3.5 ${
                    n.pinned
                      ? 'border-amber-200 bg-amber-50/40'
                      : 'border-neutral-100 bg-neutral-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    <span
                      className={`flex items-center gap-1 ${
                        n.priority === 'urgent'
                          ? 'text-[#C61C2E]'
                          : n.priority === 'high'
                            ? 'text-amber-700'
                            : 'text-neutral-500'
                      }`}
                    >
                      {n.pinned && <Pin size={10} className="text-[#C61C2E]" />}
                      {n.priority} · {n.category}
                    </span>
                    <span className="text-neutral-400 font-mono">{n.datePosted}</span>
                  </div>
                  <div className="text-xs font-semibold text-neutral-900 leading-snug">
                    {n.title}
                  </div>
                  <p className="text-[11px] text-neutral-600 mt-1 line-clamp-2 leading-relaxed">
                    {n.content}
                  </p>
                  <div className="mt-2 text-[10px] text-neutral-400 font-mono">
                    Posted by: {n.author}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Ghanaian Statutory Compliance Links */}
          <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 mb-2">
              Statutory Ghana Workplace Standards
            </h3>
            <div className="space-y-2 text-xs text-neutral-600">
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                <span>Ghana Labour Act, 2003 (Act 651)</span>
                <span className="font-mono text-emerald-600 font-medium">Compliant</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                <span>SSNIT Tier 1 & 2 Contribution Filings</span>
                <span className="font-mono text-emerald-600 font-medium">Up to Date</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                <span>Outdoor Rigging Height Safety Certifications</span>
                <span className="font-mono text-emerald-600 font-medium">Enforced</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span>Ridge Hospital Annual Health Checks</span>
                <span className="font-mono text-blue-600 font-medium">Scheduled</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FULL HR WORKSPACE PAGE (/staff, /notices, /attendance)
// ============================================================================
export function HrWorkspacePage() {
  const [location] = useLocation();

  const initialTab = location.includes('/notices')
    ? 'notices'
    : location.includes('/attendance')
      ? 'attendance'
      : 'staff';

  const [activeTab, setActiveTab] = useState<'staff' | 'notices' | 'attendance'>(initialTab);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [notices, setNotices] = useState<InternalNotice[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isPostNoticeOpen, setIsPostNoticeOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // New Staff Form State
  const [newStaffFullName, setNewStaffFullName] = useState('');
  const [newStaffEmployeeId, setNewStaffEmployeeId] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Rigging Specialist');
  const [newStaffDepartment, setNewStaffDepartment] = useState<StaffDepartment>('Field & Rigging');
  const [newStaffStatus, setNewStaffStatus] = useState<StaffStatus>('active');
  const [newStaffLocation, setNewStaffLocation] = useState('Accra HQ');

  // New Notice Form State
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticePriority, setNewNoticePriority] = useState<NoticePriority>('medium');
  const [newNoticeCategory, setNewNoticeCategory] = useState<NoticeCategory>('general');
  const [newNoticeAuthor, setNewNoticeAuthor] = useState('People & Culture Desk');
  const [newNoticePinned, setNewNoticePinned] = useState(false);

  // Attendance Check-In Form State
  const [checkInStaffId, setCheckInStaffId] = useState('');
  const [checkInStatus, setCheckInStatus] = useState<AttendanceStatus>('present');
  const [checkInNotes, setCheckInNotes] = useState('');

  // Leave Form State
  const [leaveStaffId, setLeaveStaffId] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveType>('annual');
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [leaveEndDate, setLeaveEndDate] = useState(new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10));
  const [leaveDays, setLeaveDays] = useState('5');
  const [leaveReason, setLeaveReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [staffData, noticesData, attData, leaveData] = await Promise.all([
        customFetch<StaffMember[]>('/api/hr/staff').catch(() => []),
        customFetch<InternalNotice[]>('/api/hr/notices').catch(() => []),
        customFetch<AttendanceRecord[]>('/api/hr/attendance').catch(() => []),
        customFetch<LeaveRequest[]>('/api/hr/leave').catch(() => []),
      ]);
      setStaff(staffData || []);
      setNotices(noticesData || []);
      setAttendance(attData || []);
      setLeaveRequests(leaveData || []);
    } catch {
      // Handle gracefully
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!newStaffFullName.trim()) return;

    try {
      await customFetch('/api/hr/staff', {
        method: 'POST',
        body: JSON.stringify({
          fullName: newStaffFullName.trim(),
          employeeId: newStaffEmployeeId.trim() || undefined,
          email: newStaffEmail.trim() || undefined,
          phone: newStaffPhone.trim() || undefined,
          role: newStaffRole.trim(),
          department: newStaffDepartment,
          status: newStaffStatus,
          location: newStaffLocation.trim(),
        }),
      });
      showToast(`Employee "${newStaffFullName}" added to staff directory.`);
      setIsAddStaffOpen(false);
      setNewStaffFullName('');
      setNewStaffEmployeeId('');
      setNewStaffEmail('');
      setNewStaffPhone('');
      loadData();
    } catch {
      showToast('Failed to add staff member.');
    }
  }

  async function handlePostNotice(e: React.FormEvent) {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) return;

    try {
      await customFetch('/api/hr/notices', {
        method: 'POST',
        body: JSON.stringify({
          title: newNoticeTitle.trim(),
          content: newNoticeContent.trim(),
          priority: newNoticePriority,
          category: newNoticeCategory,
          author: newNoticeAuthor.trim(),
          pinned: newNoticePinned,
        }),
      });
      showToast('Company bulletin notice posted.');
      setIsPostNoticeOpen(false);
      setNewNoticeTitle('');
      setNewNoticeContent('');
      loadData();
    } catch {
      showToast('Failed to post notice.');
    }
  }

  async function handleDeleteNotice(id: string) {
    try {
      await customFetch(`/api/hr/notices/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      showToast('Notice removed.');
      loadData();
    } catch {
      showToast('Failed to delete notice.');
    }
  }

  async function handleCheckInSubmit(e: React.FormEvent) {
    e.preventDefault();
    const targetStaff = staff.find((s) => s.id === checkInStaffId) || staff[0];
    if (!targetStaff) return;

    try {
      await customFetch('/api/hr/attendance', {
        method: 'POST',
        body: JSON.stringify({
          staffId: targetStaff.id,
          staffName: targetStaff.fullName,
          department: targetStaff.department,
          status: checkInStatus,
          notes: checkInNotes.trim() || null,
          checkInTime: new Date().toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' }) + ' GMT',
        }),
      });
      showToast(`Attendance checked in for ${targetStaff.fullName}.`);
      setIsCheckInOpen(false);
      setCheckInNotes('');
      loadData();
    } catch {
      showToast('Failed to record check-in.');
    }
  }

  async function handleLeaveSubmit(e: React.FormEvent) {
    e.preventDefault();
    const targetStaff = staff.find((s) => s.id === leaveStaffId) || staff[0];
    if (!targetStaff) return;

    try {
      await customFetch('/api/hr/leave', {
        method: 'POST',
        body: JSON.stringify({
          staffId: targetStaff.id,
          staffName: targetStaff.fullName,
          department: targetStaff.department,
          leaveType,
          startDate: leaveStartDate,
          endDate: leaveEndDate,
          days: Number(leaveDays),
          reason: leaveReason.trim() || 'Annual leave request',
        }),
      });
      showToast(`Leave request registered for ${targetStaff.fullName}.`);
      setIsLeaveModalOpen(false);
      setLeaveReason('');
      loadData();
    } catch {
      showToast('Failed to submit leave request.');
    }
  }

  async function handleApproveLeave(id: string) {
    try {
      await customFetch(`/api/hr/leave/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
      });
      showToast('Leave request approved.');
      loadData();
    } catch {
      showToast('Failed to approve leave request.');
    }
  }

  async function handleRejectLeave(id: string) {
    try {
      await customFetch(`/api/hr/leave/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'rejected' }),
      });
      showToast('Leave request rejected.');
      loadData();
    } catch {
      showToast('Failed to reject leave request.');
    }
  }

  // Filtered staff list
  const filteredStaff = staff.filter((s) => {
    if (departmentFilter !== 'all' && s.department !== departmentFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const hay = `${s.fullName} ${s.employeeId} ${s.role} ${s.email} ${s.phone} ${s.location}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-[#111110] px-4 py-3 text-xs font-medium text-white shadow-xl border border-neutral-700 animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#C61C2E]">
            People & Culture Desk : Enterprise Directory
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
            Workforce & People Management
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Full personnel directory, company announcement bulletins, daily attendance tracking, and leave approvals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'staff' && (
            <button
              type="button"
              onClick={() => setIsAddStaffOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#111110] px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Plus size={13} /> Add Employee
            </button>
          )}
          {activeTab === 'notices' && (
            <button
              type="button"
              onClick={() => setIsPostNoticeOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#111110] px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Plus size={13} /> Post Notice
            </button>
          )}
          {activeTab === 'attendance' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCheckInOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#111110] px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <CalendarCheck size={13} /> Check In Staff
              </button>
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                <Plus size={13} /> Request Leave
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'staff'
              ? 'border-[#C61C2E] text-[#C61C2E] font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Contact size={14} /> Staff Directory ({staff.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('notices')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'notices'
              ? 'border-[#C61C2E] text-[#C61C2E] font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Bell size={14} /> Internal Notices & Safety ({notices.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'attendance'
              ? 'border-[#C61C2E] text-[#C61C2E] font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <CalendarCheck size={14} /> Attendance & Leave Queue ({attendance.length} Logs)
        </button>
      </div>

      {/* TAB 1: STAFF DIRECTORY */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search staff by name, role, email, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-neutral-300 pl-9 pr-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-[#C61C2E] focus:outline-hidden"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
              >
                <option value="all">All Departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
              >
                <option value="all">All Statuses</option>
                {STAFF_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 font-medium">
                    <th className="pb-2.5">Employee Name & ID</th>
                    <th className="pb-2.5">Designation & Department</th>
                    <th className="pb-2.5">Contact Details</th>
                    <th className="pb-2.5">Work Location</th>
                    <th className="pb-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredStaff.map((member) => (
                    <tr key={member.id} className="hover:bg-neutral-50/50">
                      <td className="py-3 font-medium text-neutral-900">
                        {member.fullName}
                        <div className="text-[10.5px] text-neutral-400 font-mono">
                          {member.employeeId} · Joined {member.joinDate}
                        </div>
                      </td>
                      <td className="py-3 text-neutral-800">
                        {member.role}
                        <div className="text-[10.5px] text-neutral-400 font-mono">
                          {member.department}
                        </div>
                      </td>
                      <td className="py-3 text-neutral-600">
                        <div className="font-mono text-[11px]">{member.email}</div>
                        <div className="text-[10.5px] text-neutral-400 font-mono">{member.phone}</div>
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] text-neutral-700">
                          <MapPin size={11} className="text-[#C61C2E]" /> {member.location}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase font-mono ${
                            member.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : member.status === 'on_leave'
                                ? 'bg-amber-50 text-amber-700'
                                : member.status === 'remote'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {member.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERNAL NOTICES */}
      {activeTab === 'notices' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-neutral-500">
              Company bulletins communicate safety policies, operational surges, and clinic renewals.
            </p>
            <button
              type="button"
              onClick={() => setIsPostNoticeOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#111110] px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            >
              <Plus size={13} /> Post New Announcement
            </button>
          </div>

          <div className="space-y-3.5">
            {sortInternalNotices(notices).map((notice) => (
              <div
                key={notice.id}
                className={`panel rounded-xl p-5 border transition-all ${
                  notice.pinned
                    ? 'border-amber-200 bg-amber-50/30'
                    : 'border-neutral-200/80 bg-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    {notice.pinned && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800 font-mono">
                        <Pin size={10} /> Pinned
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
                        notice.priority === 'urgent'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : notice.priority === 'high'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : notice.priority === 'medium'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {notice.priority} Priority
                    </span>
                    <span className="text-[11px] font-mono text-neutral-500 uppercase">
                      Category: {notice.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-mono">
                    <span>Posted {notice.datePosted}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteNotice(notice.id)}
                      className="text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-neutral-900 mt-3">{notice.title}</h3>
                <p className="text-xs text-neutral-700 mt-1.5 leading-relaxed whitespace-pre-wrap">
                  {notice.content}
                </p>
                <div className="mt-3 pt-2 border-t border-neutral-100 text-[10.5px] text-neutral-400 font-mono">
                  Official Author : {notice.author}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE & LEAVE QUEUE */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Presence Log Table */}
          <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Daily Attendance Log (Workshop & Field Rigging)
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Real-time clock-in records for workshop staff and outdoor rigging crews.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckInOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#111110] px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <CalendarCheck size={13} /> Clock-In Staff
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 font-medium">
                    <th className="pb-2">Staff Member</th>
                    <th className="pb-2">Department</th>
                    <th className="pb-2">Log Date</th>
                    <th className="pb-2">Check-In</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Assignment / Operational Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {attendance.map((rec) => (
                    <tr key={rec.id} className="hover:bg-neutral-50/50">
                      <td className="py-2.5 font-medium text-neutral-900">
                        {rec.staffName}
                      </td>
                      <td className="py-2.5 text-neutral-600">{rec.department}</td>
                      <td className="py-2.5 font-mono text-neutral-500">{rec.date}</td>
                      <td className="py-2.5 font-mono text-neutral-700">{rec.checkInTime}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase font-mono ${
                            rec.status === 'on_field'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : rec.status === 'present'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : rec.status === 'late'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {rec.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 text-neutral-500 text-[11px] max-w-sm truncate">
                        {rec.notes || 'Normal workshop attendance'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leave Requests Management */}
          <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Leave Requests Queue</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Approve or reject statutory, casual, or medical leaves for Collage Ghana personnel.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                <Plus size={13} /> Submit Leave Request
              </button>
            </div>

            <div className="space-y-3">
              {leaveRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-neutral-100 bg-neutral-50/60 p-4"
                >
                  <div>
                    <div className="text-xs font-bold text-neutral-900">
                      {req.staffName} · <span className="font-normal text-neutral-500">{req.department}</span>
                    </div>
                    <div className="text-xs text-neutral-600 mt-1">
                      <span className="capitalize font-semibold">{req.leaveType}</span> Leave · {req.days} Working Days ({req.startDate} to {req.endDate})
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-1">
                      Reason: {req.reason}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {req.status === 'pending' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRejectLeave(req.id)}
                          className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveLeave(req.id)}
                          className="inline-flex items-center gap-1 rounded bg-[#111110] px-3 py-1 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                          <Check size={12} /> Approve Leave
                        </button>
                      </>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
                          req.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        {req.status === 'approved' ? <Check size={12} /> : <X size={12} />}
                        <span className="capitalize">{req.status}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD EMPLOYEE */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="panel w-full max-w-md bg-white border border-neutral-200 rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-sm font-bold text-neutral-900">Add Staff Member</h2>
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-neutral-700 font-medium mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwadwo Mensah"
                  value={newStaffFullName}
                  onChange={(e) => setNewStaffFullName(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Employee ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. COL-048"
                    value={newStaffEmployeeId}
                    onChange={(e) => setNewStaffEmployeeId(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Role Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rigging Master"
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Department</label>
                  <select
                    value={newStaffDepartment}
                    onChange={(e) => setNewStaffDepartment(e.target.value as StaffDepartment)}
                    className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Work Location</label>
                  <input
                    type="text"
                    value={newStaffLocation}
                    onChange={(e) => setNewStaffLocation(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Work Email</label>
                  <input
                    type="email"
                    placeholder="k.mensah@collage.com.gh"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+233 24 000 0000"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#111110] px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: POST NOTICE */}
      {isPostNoticeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="panel w-full max-w-md bg-white border border-neutral-200 rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-sm font-bold text-neutral-900">Publish Internal Bulletin Notice</h2>
              <button
                type="button"
                onClick={() => setIsPostNoticeOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePostNotice} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-neutral-700 font-medium mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ridge Unipole Rigging Safety Mandate"
                  value={newNoticeTitle}
                  onChange={(e) => setNewNoticeTitle(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Priority Level</label>
                  <select
                    value={newNoticePriority}
                    onChange={(e) => setNewNoticePriority(e.target.value as NoticePriority)}
                    className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  >
                    {NOTICE_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Category</label>
                  <select
                    value={newNoticeCategory}
                    onChange={(e) => setNewNoticeCategory(e.target.value as NoticeCategory)}
                    className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  >
                    {NOTICE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-medium mb-1">Notice Content *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail operational guidelines, safety requirements, or event schedule..."
                  value={newNoticeContent}
                  onChange={(e) => setNewNoticeContent(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={newNoticePinned}
                  onChange={(e) => setNewNoticePinned(e.target.checked)}
                  className="rounded border-neutral-300 text-[#C61C2E] focus:ring-[#C61C2E]"
                />
                <label htmlFor="pinCheck" className="text-xs text-neutral-700 font-medium cursor-pointer">
                  Pin to top of internal bulletin board
                </label>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPostNoticeOpen(false)}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#111110] px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Post Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ATTENDANCE CHECK-IN */}
      {isCheckInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="panel w-full max-w-md bg-white border border-neutral-200 rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-sm font-bold text-neutral-900">Record Staff Check-In</h2>
              <button
                type="button"
                onClick={() => setIsCheckInOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCheckInSubmit} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-neutral-700 font-medium mb-1">Select Staff Member</label>
                <select
                  value={checkInStaffId}
                  onChange={(e) => setCheckInStaffId(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.department} · {s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-700 font-medium mb-1">Presence Status</label>
                <select
                  value={checkInStatus}
                  onChange={(e) => setCheckInStatus(e.target.value as AttendanceStatus)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                >
                  <option value="present">Present (Accra HQ / Spintex Workshop)</option>
                  <option value="on_field">On Field (Site Rigging / Billboard Installation)</option>
                  <option value="late">Late Arrival</option>
                  <option value="excused">Excused Absence</option>
                  <option value="absent">Unexcused Absence</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-700 font-medium mb-1">Notes / Deployment Site</label>
                <input
                  type="text"
                  placeholder="e.g. On-site rigging at Independence Avenue gantry"
                  value={checkInNotes}
                  onChange={(e) => setCheckInNotes(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckInOpen(false)}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#111110] px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Submit Clock-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: REQUEST LEAVE */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="panel w-full max-w-md bg-white border border-neutral-200 rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-sm font-bold text-neutral-900">Submit Employee Leave Request</h2>
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleLeaveSubmit} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-neutral-700 font-medium mb-1">Staff Member</label>
                <select
                  value={leaveStaffId}
                  onChange={(e) => setLeaveStaffId(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                    className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  >
                    <option value="annual">Annual Leave</option>
                    <option value="sick">Medical / Sick Leave</option>
                    <option value="casual">Casual Leave</option>
                    <option value="maternity">Maternity Leave</option>
                    <option value="study">Study Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Number of Days</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={leaveDays}
                    onChange={(e) => setLeaveDays(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 font-mono focus:border-[#C61C2E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-medium mb-1">Reason / Handover Note</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Annual leave break. Handover to Kwame Mensah."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#111110] px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
