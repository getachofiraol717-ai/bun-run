import React, { useState, useMemo } from 'react';
import {
  Users, Search, Filter, Shield, Crown, Clock, CheckCircle2,
  AlertCircle, ChevronRight, Mail, Phone, Calendar, RefreshCw,
  Download, Trash2, Edit3, KeyRound, ExternalLink, BookOpen,
  Award, Sparkles, Check, X, MoreHorizontal, UserCheck, UserX,
  CreditCard, ArrowUpDown, ChevronLeft, ChevronDown, Copy,
  GraduationCap, Building2, UserPlus, Info
} from 'lucide-react';
import {
  AdminUser,
  useUsersDirectory,
  useUpdateUserRole,
  useUpdateUserSubscription,
  useUpdateUserProfileDetails,
  useSendPasswordReset,
  useUserDetailActivity,
  useBulkUpdateUsers,
  useDeleteProfile,
  useCreateUser,
  useLoginHistoryLog,
} from '@/hooks/useAdminData';
import { LiveLoginTracker } from './LiveLoginTracker';
import { toast } from '@/hooks/use-toast';

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const ROLES: Array<'student' | 'teacher' | 'school' | 'admin'> = ['student', 'teacher', 'school', 'admin'];

export const UserDirectoryManagement: React.FC = () => {
  // Data queries
  const { data: users = [], isLoading, isRefetching, refetch } = useUsersDirectory();
  const { data: loginHistory = [], isLoading: loginsLoading, refetch: refetchLogins } = useLoginHistoryLog(100);
  const updateRole = useUpdateUserRole();
  const updateSubscription = useUpdateUserSubscription();
  const updateProfileDetails = useUpdateUserProfileDetails();
  const sendPasswordReset = useSendPasswordReset();
  const bulkUpdate = useBulkUpdateUsers();
  const deleteProfile = useDeleteProfile();
  const createUser = useCreateUser();

  // Active Main Sub-View
  const [activeView, setActiveView] = useState<'directory' | 'logins'>('directory');

  // Add User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'student' | 'teacher' | 'school' | 'admin'>('student');
  const [newUserGrade, setNewUserGrade] = useState<number | null>(null);
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserSub, setNewUserSub] = useState<'free' | 'premium'>('free');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) {
      toast({ title: 'Error', description: 'Email address is required.', variant: 'destructive' });
      return;
    }
    setIsCreatingUser(true);
    try {
      await createUser.mutateAsync({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword.trim() || undefined,
        role: newUserRole,
        grade: newUserGrade,
        phone: newUserPhone.trim() || null,
        subscription: newUserSub,
      });
      setIsAddUserOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('student');
      setNewUserGrade(null);
      setNewUserPhone('');
      setNewUserSub('free');
      refetch();
    } catch {
      // Notification handled in hook
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher' | 'school' | 'admin'>('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'free' | 'premium' | 'expired'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'active'>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'subscription' | 'revenue'>('newest');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Bulk Selection
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Active User Details Drawer
  const [inspectedUser, setInspectedUser] = useState<AdminUser | null>(null);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'subscription' | 'role' | 'activity'>('overview');

  // Edit State inside Drawer
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGrade, setEditGrade] = useState<number | null>(null);
  const [editStudyPlan, setEditStudyPlan] = useState('');
  const [editLanguage, setEditLanguage] = useState('');

  // Subscription Modal / Action State
  const [customExpDate, setCustomExpDate] = useState('');
  const [subReason, setSubReason] = useState('');

  // When opening inspector, initialize form fields
  const handleOpenInspector = (user: AdminUser, defaultTab: 'overview' | 'subscription' | 'role' | 'activity' = 'overview') => {
    setInspectedUser(user);
    setDrawerTab(defaultTab);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone || '');
    setEditGrade(user.grade);
    setEditStudyPlan(user.study_plan || '');
    setEditLanguage(user.language || 'English');
    setCustomExpDate(user.subscription_expires_at ? user.subscription_expires_at.split('T')[0] : '');
    setSubReason('');
  };

  const handleInspectUserId = (userId: string) => {
    const found = users.find((u) => u.user_id === userId);
    if (found) {
      handleOpenInspector(found);
    } else {
      toast({
        title: 'User profile not found in active directory',
        description: `No active profile found for Auth ID ${userId.slice(0, 8)}...`,
        variant: 'destructive',
      });
    }
  };

  // Activity query for selected user
  const { data: userActivity, isLoading: activityLoading } = useUserDetailActivity(inspectedUser?.user_id || null);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const premium = users.filter(u => u.subscription === 'premium' && u.status !== 'expired').length;
    const expired = users.filter(u => u.status === 'expired').length;
    const online = users.filter(u => u.is_online).length;
    const instructors = users.filter(u => u.role === 'teacher' || u.role === 'school').length;
    const admins = users.filter(u => u.role === 'admin').length;
    const totalRev = users.reduce((sum, u) => sum + (u.total_payments_amount || 0), 0);
    const convRate = total > 0 ? ((premium / total) * 100).toFixed(1) : '0';

    return { total, premium, expired, online, instructors, admins, totalRev, convRate };
  }, [users]);

  // Filter and Sort Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesPhone = u.phone?.toLowerCase().includes(q);
        const matchesId = u.user_id.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesId) return false;
      }

      // Role
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;

      // Subscription
      if (subscriptionFilter === 'free' && u.subscription !== 'free') return false;
      if (subscriptionFilter === 'premium' && (u.subscription !== 'premium' || u.status === 'expired')) return false;
      if (subscriptionFilter === 'expired' && u.status !== 'expired') return false;

      // Status
      if (statusFilter === 'online' && !u.is_online) return false;

      // Grade
      if (gradeFilter !== 'all') {
        if (gradeFilter === 'none' && u.grade !== null) return false;
        if (gradeFilter !== 'none' && u.grade !== Number(gradeFilter)) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'subscription') {
        const subWeight = (sub: string) => (sub === 'premium' ? 2 : 1);
        return subWeight(b.subscription) - subWeight(a.subscription);
      }
      if (sortBy === 'revenue') return (b.total_payments_amount || 0) - (a.total_payments_amount || 0);
      return 0;
    });
  }, [users, searchQuery, roleFilter, subscriptionFilter, statusFilter, gradeFilter, sortBy]);

  // Paginated View
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;

  // Toggle Single Selection
  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Select All on current view
  const toggleSelectAll = () => {
    if (selectedUserIds.length === paginatedUsers.length && paginatedUsers.length > 0) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(paginatedUsers.map((u) => u.user_id));
    }
  };

  // Bulk Actions
  const handleBulkGrantPremium = async (days: number) => {
    if (selectedUserIds.length === 0) return;
    const targetUsers = users.filter((u) => selectedUserIds.includes(u.user_id));
    const profileIds = targetUsers.map((u) => u.id);
    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + days);

    try {
      await bulkUpdate.mutateAsync({
        userIds: selectedUserIds,
        profileIds,
        action: 'set_subscription',
        subscription: 'premium',
        expiresAt: expiresDate.toISOString(),
      });
      setSelectedUserIds([]);
    } catch (e: any) {
      // handled in mutation
    }
  };

  const handleBulkSetRole = async (role: 'student' | 'teacher' | 'school' | 'admin') => {
    if (selectedUserIds.length === 0) return;
    const targetUsers = users.filter((u) => selectedUserIds.includes(u.user_id));
    const profileIds = targetUsers.map((u) => u.id);

    try {
      await bulkUpdate.mutateAsync({
        userIds: selectedUserIds,
        profileIds,
        action: 'set_role',
        role,
      });
      setSelectedUserIds([]);
    } catch (e: any) {
      // handled
    }
  };

  const handleBulkExportCSV = () => {
    const listToExport = selectedUserIds.length > 0
      ? users.filter((u) => selectedUserIds.includes(u.user_id))
      : filteredUsers;

    const headers = ['User ID', 'Name', 'Email', 'Phone', 'Role', 'Subscription', 'Expires At', 'Grade', 'Spend (ETB)', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...listToExport.map((u) =>
        [
          `"${u.user_id}"`,
          `"${u.name.replace(/"/g, '""')}"`,
          `"${u.email}"`,
          `"${u.phone || ''}"`,
          `"${u.role}"`,
          `"${u.subscription}"`,
          `"${u.subscription_expires_at || 'Lifetime'}"`,
          `"${u.grade || 'N/A'}"`,
          `"${u.total_payments_amount || 0}"`,
          `"${new Date(u.created_at).toISOString()}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ku_users_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: '📥 Export Complete', description: `Exported ${listToExport.length} user records to CSV.` });
  };

  // Quick Subscription Extension Helper
  const applySubscriptionExtension = async (days: number | null) => {
    if (!inspectedUser) return;
    let expiresAt: string | null = null;
    if (days !== null) {
      const targetDate = new Date();
      // If user currently has active premium expiring in future, extend from that date
      if (inspectedUser.subscription === 'premium' && inspectedUser.subscription_expires_at) {
        const currentExp = new Date(inspectedUser.subscription_expires_at);
        if (currentExp > targetDate) {
          targetDate.setTime(currentExp.getTime());
        }
      }
      targetDate.setDate(targetDate.getDate() + days);
      expiresAt = targetDate.toISOString();
    }

    await updateSubscription.mutateAsync({
      profileId: inspectedUser.id,
      userId: inspectedUser.user_id,
      subscription: 'premium',
      expiresAt,
      reason: subReason || `Admin extension (+${days ? days + ' days' : 'Lifetime'})`,
    });

    // Update local inspected user state
    setInspectedUser((prev) => prev ? {
      ...prev,
      subscription: 'premium',
      subscription_expires_at: expiresAt,
      status: 'active',
    } : null);
  };

  const handleRevokeSubscription = async () => {
    if (!inspectedUser) return;
    await updateSubscription.mutateAsync({
      profileId: inspectedUser.id,
      userId: inspectedUser.user_id,
      subscription: 'free',
      expiresAt: null,
      reason: subReason || 'Admin manual revoke to free tier',
    });

    setInspectedUser((prev) => prev ? {
      ...prev,
      subscription: 'free',
      subscription_expires_at: null,
      status: 'active',
    } : null);
  };

  const handleSaveProfileDetails = async () => {
    if (!inspectedUser) return;
    try {
      await updateProfileDetails.mutateAsync({
        id: inspectedUser.id,
        name: editName,
        email: editEmail,
        phone: editPhone || null,
        grade: editGrade,
        study_plan: editStudyPlan || null,
        language: editLanguage || 'English',
      });

      setInspectedUser((prev) => prev ? {
        ...prev,
        name: editName,
        email: editEmail,
        phone: editPhone || null,
        grade: editGrade,
        study_plan: editStudyPlan || null,
        language: editLanguage || 'English',
      } : null);
    } catch (err: any) {
      console.error('Error saving profile details:', err);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: '📋 Copied to clipboard', description: `${label}: ${text}` });
  };

  return (
    <div className="space-y-6">
      {/* 1. Production Metrics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-strong p-4 rounded-2xl border border-border/50 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Registered</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold font-orbitron">{metrics.total.toLocaleString()}</div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-semibold">{metrics.online} live</span> connected
            </div>
          </div>
        </div>

        <div className="glass-strong p-4 rounded-2xl border border-border/50 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Premium Subscribers</span>
            <Crown className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold font-orbitron text-amber-400">{metrics.premium.toLocaleString()}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {metrics.convRate}% conversion · {metrics.expired} expired
            </div>
          </div>
        </div>

        <div className="glass-strong p-4 rounded-2xl border border-border/50 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Faculty & Institutions</span>
            <GraduationCap className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold font-orbitron text-blue-400">{metrics.instructors}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {metrics.admins} Super-Admins active
            </div>
          </div>
        </div>

        <div className="glass-strong p-4 rounded-2xl border border-border/50 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Cumulative User Value</span>
            <CreditCard className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-2xl font-bold font-orbitron text-cyan-400">{metrics.totalRev.toLocaleString()} ETB</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Verified payment ledger sum</div>
          </div>
        </div>
      </div>

      {/* 2. Main Directory Container */}
      <div className="glass-strong p-6 rounded-2xl border border-border/50 space-y-5">
        {/* Sub-view switcher: Directory vs Live Login & Session Tracker */}
        <div className="flex items-center gap-2 border-b border-border/30 pb-3">
          <button
            onClick={() => setActiveView('directory')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeView === 'directory'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'glass text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>User Directory ({users.length})</span>
          </button>
          <button
            onClick={() => { setActiveView('logins'); refetchLogins(); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeView === 'logins'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'glass text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="h-4 w-4 text-emerald-400" />
            <span>Live Login & Session Tracker ({loginHistory.length})</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>

        {activeView === 'logins' ? (
          <LiveLoginTracker onInspectUser={handleInspectUserId} allUsers={users} />
        ) : (
          <>
            {/* Header & Controls Bar */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold font-orbitron flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> User Directory & Account Status
            </h2>
            <p className="text-xs text-muted-foreground">
              Real-time directory for subscriptions, RBAC permission roles, login activity, and security metadata
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 flex items-center gap-1.5 transition-all shadow-md shadow-primary/20 active:scale-95"
            >
              <UserPlus className="h-3.5 w-3.5" /> Add User
            </button>
            <button
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="p-2 rounded-xl glass border border-border/50 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              title="Refresh Directory"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin text-primary' : ''}`} />
            </button>
            <button
              onClick={handleBulkExportCSV}
              className="px-3 py-2 rounded-xl glass border border-border/50 text-xs font-semibold text-foreground hover:bg-white/5 flex items-center gap-1.5 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-primary" /> Export CSV ({filteredUsers.length})
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-border/30">
          {/* Search Box */}
          <div className="sm:col-span-2 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search name, email, phone, UUID..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl glass border border-border/50 focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value as any); setPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl glass border border-border/50 focus:outline-none focus:border-primary/50 text-foreground bg-background/80"
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="school">School / Institution</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {/* Subscription Filter */}
          <div>
            <select
              value={subscriptionFilter}
              onChange={(e) => { setSubscriptionFilter(e.target.value as any); setPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl glass border border-border/50 focus:outline-none focus:border-primary/50 text-foreground bg-background/80"
            >
              <option value="all">All Subscriptions</option>
              <option value="free">Free Tier</option>
              <option value="premium">Active Premium</option>
              <option value="expired">Expired Premium</option>
            </select>
          </div>

          {/* Grade Filter */}
          <div>
            <select
              value={gradeFilter}
              onChange={(e) => { setGradeFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl glass border border-border/50 focus:outline-none focus:border-primary/50 text-foreground bg-background/80"
            >
              <option value="all">All Grades</option>
              {GRADES.map((g) => (
                <option key={g} value={g.toString()}>Grade {g}</option>
              ))}
              <option value="none">No Grade Set</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl glass border border-border/50 focus:outline-none focus:border-primary/50 text-foreground bg-background/80"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="subscription">Subscription Tier</option>
              <option value="revenue">Highest Value</option>
            </select>
          </div>
        </div>

        {/* 3. Bulk Action Bar (Visible when rows are selected) */}
        {selectedUserIds.length > 0 && (
          <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <span className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground font-bold">
                {selectedUserIds.length}
              </span>
              <span>users selected</span>
              <button
                onClick={() => setSelectedUserIds([])}
                className="text-xs text-muted-foreground hover:text-foreground underline ml-2"
              >
                Clear Selection
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleBulkGrantPremium(30)}
                disabled={bulkUpdate.isPending}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Crown className="h-3.5 w-3.5" /> +30 Days Premium
              </button>
              <button
                onClick={() => handleBulkGrantPremium(365)}
                disabled={bulkUpdate.isPending}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Crown className="h-3.5 w-3.5" /> +1 Year Premium
              </button>
              <button
                onClick={() => handleBulkSetRole('teacher')}
                disabled={bulkUpdate.isPending}
                className="px-2.5 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-semibold hover:bg-blue-500/30 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <GraduationCap className="h-3.5 w-3.5" /> Set Teacher
              </button>
              <button
                onClick={handleBulkExportCSV}
                className="px-2.5 py-1.5 rounded-lg glass border border-border/50 text-foreground text-xs font-semibold hover:bg-white/5 flex items-center gap-1.5 transition-colors"
              >
                <Download className="h-3.5 w-3.5" /> Export Selected
              </button>
            </div>
          </div>
        )}

        {/* 4. Production Data Table */}
        <div className="overflow-x-auto rounded-xl border border-border/40">
          <table className="w-full text-xs text-left">
            <thead className="text-muted-foreground uppercase text-[10px] bg-white/[0.02] border-b border-border/40">
              <tr>
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.length === paginatedUsers.length && paginatedUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-border/50 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">User Profile</th>
                <th className="py-3.5 px-4">RBAC Role</th>
                <th className="py-3.5 px-4">Subscription Plan</th>
                <th className="py-3.5 px-4">Logins & Presence</th>
                <th className="py-3.5 px-4">Grade & Details</th>
                <th className="py-3.5 px-4">Spend & Activity</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                    <p>Loading authoritative user directory...</p>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground space-y-2">
                    <Users className="h-8 w-8 mx-auto opacity-40 text-muted-foreground" />
                    <p className="font-semibold text-foreground">No users match your criteria</p>
                    <p className="text-[11px]">Try adjusting your search queries or filter parameters.</p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(u.user_id);
                  const isExpired = u.status === 'expired';

                  // Calculate remaining days for active premium
                  let daysRemaining: number | null = null;
                  if (u.subscription === 'premium' && u.subscription_expires_at) {
                    const diff = new Date(u.subscription_expires_at).getTime() - Date.now();
                    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
                  }

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-white/[0.03] transition-colors ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectUser(u.user_id)}
                          className="rounded border-border/50 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                        />
                      </td>

                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-purple-600/30 border border-primary/40 flex items-center justify-center font-bold text-[11px] text-foreground uppercase">
                              {u.name.slice(0, 2) || 'KU'}
                            </div>
                            {u.is_online && (
                              <span
                                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background"
                                title="Online now"
                              />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-foreground hover:underline cursor-pointer" onClick={() => handleOpenInspector(u)}>
                                {u.name}
                              </p>
                            </div>
                            <p className="text-muted-foreground text-[11px] flex items-center gap-1">
                              {u.email}
                            </p>
                            {u.phone && (
                              <p className="text-[10px] text-muted-foreground/80 flex items-center gap-1">
                                <Phone className="h-2.5 w-2.5" /> {u.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              u.role === 'admin'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : u.role === 'teacher'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                : u.role === 'school'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-muted/40 text-muted-foreground border border-border/40'
                            }`}
                          >
                            {u.role}
                          </span>
                        </div>
                      </td>

                      {/* Subscription */}
                      <td className="py-3 px-4">
                        {u.subscription === 'premium' ? (
                          isExpired ? (
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1 w-fit">
                                <AlertCircle className="h-3 w-3" /> Expired Premium
                              </span>
                              <p className="text-[10px] text-muted-foreground">Ended on {u.subscription_expires_at ? new Date(u.subscription_expires_at).toLocaleDateString() : 'Past'}</p>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 w-fit">
                                <Crown className="h-3 w-3 text-amber-400" /> Premium VIP
                              </span>
                              <p className="text-[10px] text-amber-400/90 font-medium">
                                {daysRemaining !== null ? `${daysRemaining} days left` : 'Lifetime Access'}
                              </p>
                            </div>
                          )
                        ) : (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted/40 text-muted-foreground border border-border/40">
                              Free Tier
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Logins & Presence */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {u.is_online ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Online Now
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground/60" />
                              {u.last_login_at
                                ? new Date(u.last_login_at).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'No login'}
                            </span>
                          )}
                          <p className="text-[10px] text-muted-foreground/80 font-mono">
                            {u.login_count ? `${u.login_count} logins` : '0 logins'}
                            {u.last_login_method && ` · via ${u.last_login_method}`}
                          </p>
                        </div>
                      </td>

                      {/* Grade & Details */}
                      <td className="py-3 px-4 text-muted-foreground">
                        <div className="space-y-0.5">
                          <p className="text-foreground font-medium">
                            {u.grade ? `Grade ${u.grade}` : 'General'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {u.language || 'English'} {u.study_plan ? `· ${u.study_plan}` : ''}
                          </p>
                        </div>
                      </td>

                      {/* Spend & Activity */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground">
                            {u.total_payments_amount ? `${u.total_payments_amount.toLocaleString()} ETB` : '0 ETB'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {u.payments_count ? `${u.payments_count} transactions` : 'No purchases'}
                          </p>
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-muted-foreground text-[11px]">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenInspector(u)}
                            className="px-2.5 py-1 rounded-lg glass border border-border/50 text-xs font-semibold text-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center gap-1"
                            title="Inspect & Manage User"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Manage
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Send password reset email to ${u.email}?`)) {
                                sendPasswordReset.mutate(u.email);
                              }
                            }}
                            className="p-1.5 rounded-lg glass border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                            title="Send Password Reset Email"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Permanently remove user "${u.name}" (${u.email})?`)) {
                                deleteProfile.mutate(u.id);
                              }
                            }}
                            className="p-1.5 rounded-lg glass border border-border/50 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <span className="font-semibold text-foreground">
              {filteredUsers.length > 0 ? (page - 1) * pageSize + 1 : 0} -{' '}
              {Math.min(page * pageSize, filteredUsers.length)}
            </span>
            <span>of</span>
            <span className="font-semibold text-foreground">{filteredUsers.length}</span>
            <span>users</span>

            <span className="mx-2 text-border">|</span>

            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="px-2 py-1 rounded-lg glass border border-border/50 text-xs text-foreground bg-background/80"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg glass border border-border/50 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 rounded-lg glass border border-border/50 font-mono text-foreground font-semibold">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg glass border border-border/50 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </>
    )}
  </div>

      {/* 6. Production-Grade User Inspector & Editor Drawer / Modal */}
      {inspectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
          <div className="w-full sm:max-w-2xl h-full sm:h-[92vh] sm:rounded-2xl glass-strong border border-border/60 flex flex-col overflow-hidden shadow-2xl bg-background/95">
            {/* Drawer Header */}
            <div className="p-5 border-b border-border/40 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-purple-600/30 border border-primary/50 flex items-center justify-center font-bold text-sm text-foreground uppercase">
                  {inspectedUser.name.slice(0, 2) || 'KU'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base font-orbitron text-foreground">{inspectedUser.name}</h3>
                    {inspectedUser.is_online && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{inspectedUser.email}</p>
                </div>
              </div>

              <button
                onClick={() => setInspectedUser(null)}
                className="p-2 rounded-xl glass border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Navigation Tabs inside Drawer */}
            <div className="flex items-center border-b border-border/40 px-5 bg-white/[0.01]">
              {(['overview', 'subscription', 'role', 'activity'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDrawerTab(tab)}
                  className={`py-3 px-4 text-xs font-semibold capitalize border-b-2 transition-all ${
                    drawerTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'overview' && 'User Identity & Auth'}
                  {tab === 'subscription' && 'Subscription & Billing'}
                  {tab === 'role' && 'RBAC & Permissions'}
                  {tab === 'activity' && 'Learning Activity'}
                </button>
              ))}
            </div>

            {/* Drawer Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: User Identity & Auth */}
              {drawerTab === 'overview' && (
                <div className="space-y-6">
                  {/* System UUID & Quick Copy */}
                  <div className="p-3.5 rounded-xl glass border border-border/50 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Auth User ID (UUID)</p>
                      <p className="font-mono text-xs text-foreground mt-0.5">{inspectedUser.user_id}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(inspectedUser.user_id, 'Auth UUID')}
                      className="p-2 rounded-lg glass hover:text-primary transition-colors"
                      title="Copy UUID"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Live Session & Activity Recognition Card */}
                  <div className="p-4 rounded-xl glass border border-primary/20 bg-primary/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                        <Clock className="h-4 w-4" /> Live Session & Activity Status
                      </span>
                      {inspectedUser.is_online ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Online Now
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/40 text-muted-foreground border border-border/40">
                          Offline
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground text-[10px] uppercase font-bold">Total Logins</p>
                        <p className="font-bold text-foreground mt-0.5 text-sm">{inspectedUser.login_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-[10px] uppercase font-bold">Last Active</p>
                        <p className="font-semibold text-foreground mt-0.5 text-[11px]">
                          {inspectedUser.last_login_at
                            ? new Date(inspectedUser.last_login_at).toLocaleString()
                            : 'No login recorded'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-[10px] uppercase font-bold">Auth Method</p>
                        <p className="font-semibold text-foreground mt-0.5 text-[11px] capitalize">
                          {inspectedUser.last_login_method || 'Email Auth'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-[10px] uppercase font-bold">Signup Source</p>
                        <p className="font-semibold text-foreground mt-0.5 text-[11px] capitalize">
                          {inspectedUser.signup_source || 'Standard'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Edit Fields */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Profile Metadata
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl glass border border-border/50 text-foreground focus:outline-none focus:border-primary/50"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Email Address</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl glass border border-border/50 text-foreground focus:outline-none focus:border-primary/50"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Phone Number</label>
                        <input
                          type="text"
                          value={editPhone}
                          placeholder="+251 9..."
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl glass border border-border/50 text-foreground focus:outline-none focus:border-primary/50"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Target Grade</label>
                        <select
                          value={editGrade ?? ''}
                          onChange={(e) => setEditGrade(e.target.value ? Number(e.target.value) : null)}
                          className="w-full px-3 py-2 text-xs rounded-xl glass border border-border/50 text-foreground bg-background/80"
                        >
                          <option value="">General / None</option>
                          {GRADES.map((g) => (
                            <option key={g} value={g}>Grade {g}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Study Track / Plan</label>
                        <input
                          type="text"
                          value={editStudyPlan}
                          placeholder="e.g. National Exam Prep"
                          onChange={(e) => setEditStudyPlan(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl glass border border-border/50 text-foreground focus:outline-none focus:border-primary/50"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Interface Language</label>
                        <select
                          value={editLanguage}
                          onChange={(e) => setEditLanguage(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl glass border border-border/50 text-foreground bg-background/80"
                        >
                          <option value="English">English</option>
                          <option value="Amharic">Amharic</option>
                          <option value="Afan Oromo">Afan Oromo</option>
                          <option value="Tigrinya">Tigrinya</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveProfileDetails}
                      disabled={updateProfileDetails.isPending}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" /> Save Changes
                    </button>
                  </div>

                  {/* Auth & Security Actions */}
                  <div className="pt-4 border-t border-border/40 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Security & Password Operations
                    </h4>

                    <div className="p-4 rounded-xl glass border border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                          <KeyRound className="h-4 w-4 text-amber-400" /> Password Recovery Dispatch
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Sends a secure Supabase Auth password reset link to {inspectedUser.email}
                        </p>
                      </div>
                      <button
                        onClick={() => sendPasswordReset.mutate(inspectedUser.email)}
                        disabled={sendPasswordReset.isPending}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <Mail className="h-3.5 w-3.5" /> Send Reset Email
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Subscription & Billing */}
              {drawerTab === 'subscription' && (
                <div className="space-y-6">
                  {/* Current Status Card */}
                  <div className="p-5 rounded-2xl glass border border-amber-500/30 bg-amber-500/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Crown className="h-4 w-4" /> Current Active Tier
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        inspectedUser.subscription === 'premium'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-muted/40 text-muted-foreground border border-border/40'
                      }`}>
                        {inspectedUser.subscription}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground text-[11px]">Expiration Date</p>
                        <p className="font-semibold text-foreground mt-0.5">
                          {inspectedUser.subscription_expires_at
                            ? new Date(inspectedUser.subscription_expires_at).toLocaleDateString()
                            : inspectedUser.subscription === 'premium' ? 'Permanent / Lifetime' : 'None (Free)'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-[11px]">Total Payments Paid</p>
                        <p className="font-semibold text-cyan-400 mt-0.5">
                          {inspectedUser.total_payments_amount ? `${inspectedUser.total_payments_amount.toLocaleString()} ETB` : '0 ETB'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* One-Click Quick Presets */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      One-Click Subscription Extension
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => applySubscriptionExtension(30)}
                        disabled={updateSubscription.isPending}
                        className="p-3 rounded-xl glass border border-border/50 hover:border-amber-500/50 text-center space-y-1 hover:bg-white/5 transition-all"
                      >
                        <p className="text-xs font-bold text-amber-400">+30 Days</p>
                        <p className="text-[10px] text-muted-foreground">1 Month Access</p>
                      </button>

                      <button
                        onClick={() => applySubscriptionExtension(90)}
                        disabled={updateSubscription.isPending}
                        className="p-3 rounded-xl glass border border-border/50 hover:border-amber-500/50 text-center space-y-1 hover:bg-white/5 transition-all"
                      >
                        <p className="text-xs font-bold text-amber-400">+90 Days</p>
                        <p className="text-[10px] text-muted-foreground">1 Term Access</p>
                      </button>

                      <button
                        onClick={() => applySubscriptionExtension(365)}
                        disabled={updateSubscription.isPending}
                        className="p-3 rounded-xl glass border border-border/50 hover:border-amber-500/50 text-center space-y-1 hover:bg-white/5 transition-all"
                      >
                        <p className="text-xs font-bold text-amber-400">+1 Year</p>
                        <p className="text-[10px] text-muted-foreground">Annual Access</p>
                      </button>

                      <button
                        onClick={() => applySubscriptionExtension(null)}
                        disabled={updateSubscription.isPending}
                        className="p-3 rounded-xl glass border border-border/50 hover:border-amber-500/50 text-center space-y-1 hover:bg-white/5 transition-all"
                      >
                        <p className="text-xs font-bold text-amber-300">Lifetime</p>
                        <p className="text-[10px] text-muted-foreground">Permanent VIP</p>
                      </button>
                    </div>
                  </div>

                  {/* Custom Expiration Date & Revoke */}
                  <div className="p-4 rounded-xl glass border border-border/50 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Custom Date Override & Reason Log
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-muted-foreground block mb-1">Set Specific Expiry Date</label>
                        <input
                          type="date"
                          value={customExpDate}
                          onChange={(e) => setCustomExpDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl glass border border-border/50 text-foreground bg-background/80"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground block mb-1">Reason / Note for Audit</label>
                        <input
                          type="text"
                          placeholder="e.g. Scholarship award / Offline cash payment"
                          value={subReason}
                          onChange={(e) => setSubReason(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl glass border border-border/50 text-foreground"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={handleRevokeSubscription}
                        disabled={updateSubscription.isPending}
                        className="px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold hover:bg-red-500/30 transition-colors"
                      >
                        Revoke to Free Tier
                      </button>

                      <button
                        onClick={async () => {
                          if (!customExpDate) {
                            toast({ title: 'Please select a date', variant: 'destructive' });
                            return;
                          }
                          await updateSubscription.mutateAsync({
                            profileId: inspectedUser.id,
                            userId: inspectedUser.user_id,
                            subscription: 'premium',
                            expiresAt: new Date(customExpDate).toISOString(),
                            reason: subReason || 'Custom date override',
                          });
                          setInspectedUser((prev) => prev ? {
                            ...prev,
                            subscription: 'premium',
                            subscription_expires_at: new Date(customExpDate).toISOString(),
                            status: 'active',
                          } : null);
                        }}
                        disabled={updateSubscription.isPending}
                        className="px-4 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 transition-colors"
                      >
                        Apply Date
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: RBAC & Permissions */}
              {drawerTab === 'role' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Authoritative Database Role
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Synchronizes directly with PostgreSQL <code>user_roles</code> table for Row Level Security (RLS).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ROLES.map((role) => {
                      const isCurrent = inspectedUser.role === role;
                      return (
                        <div
                          key={role}
                          onClick={async () => {
                            if (confirm(`Change ${inspectedUser.name}'s role to ${role}?`)) {
                              await updateRole.mutateAsync({
                                userId: inspectedUser.user_id,
                                role,
                                profileId: inspectedUser.id,
                              });
                              setInspectedUser((prev) => prev ? { ...prev, role, roles: [role] } : null);
                            }
                          }}
                          className={`p-4 rounded-xl glass border cursor-pointer transition-all ${
                            isCurrent
                              ? 'border-primary bg-primary/10 shadow-lg'
                              : 'border-border/50 hover:border-border hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm capitalize text-foreground flex items-center gap-1.5">
                              {role === 'admin' && <Shield className="h-4 w-4 text-purple-400" />}
                              {role === 'teacher' && <GraduationCap className="h-4 w-4 text-blue-400" />}
                              {role === 'school' && <Building2 className="h-4 w-4 text-emerald-400" />}
                              {role === 'student' && <Users className="h-4 w-4 text-muted-foreground" />}
                              {role}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground">
                                Active Role
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {role === 'admin' && 'Unrestricted access to all modules, billing, and system operations.'}
                            {role === 'teacher' && 'Can build courses, monitor student batches, and publish quizzes.'}
                            {role === 'school' && 'Institutional license holder with school-wide classroom management.'}
                            {role === 'student' && 'Standard learner with library, AI tutor, and quiz access.'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: Learning Activity */}
              {drawerTab === 'activity' && (
                <div className="space-y-6">
                  {activityLoading ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                      <p>Loading student learning telemetry...</p>
                    </div>
                  ) : (
                    <>
                      {/* Reading Progress */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4 text-primary" /> Book Reading Records ({userActivity?.readingProgress.length || 0})
                        </h4>

                        {userActivity?.readingProgress && userActivity.readingProgress.length > 0 ? (
                          <div className="divide-y divide-border/20 max-h-48 overflow-y-auto pr-1">
                            {userActivity.readingProgress.map((r: any) => (
                              <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
                                <div>
                                  <p className="font-semibold text-foreground">Content Item ID: {r.content_item_id.slice(0, 8)}...</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    Page {r.current_page} of {r.total_pages} · {r.progress_percent}% completed
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-muted-foreground">
                                    {r.last_read_at ? new Date(r.last_read_at).toLocaleDateString() : '—'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground py-2">No reading records for this user.</p>
                        )}
                      </div>

                      {/* Recent System Events */}
                      <div className="space-y-3 pt-3 border-t border-border/30">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-cyan-400" /> Recent Activity Events ({userActivity?.events.length || 0})
                        </h4>

                        {userActivity?.events && userActivity.events.length > 0 ? (
                          <div className="divide-y divide-border/20 max-h-56 overflow-y-auto pr-1">
                            {userActivity.events.map((e: any) => (
                              <div key={e.id} className="py-2.5 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-mono font-semibold text-foreground capitalize">
                                    {e.event_type.replace(/_/g, ' ')}
                                  </span>
                                  {e.event_data && (
                                    <p className="text-[10px] text-muted-foreground font-mono truncate max-w-xs">
                                      {JSON.stringify(e.event_data)}
                                    </p>
                                  )}
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                  {e.created_at ? new Date(e.created_at).toLocaleString() : '—'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground py-2">No recent audit events.</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Add / Save User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-strong border border-border/60 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/20 text-primary">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold font-orbitron text-base text-foreground">Add New User</h3>
                  <p className="text-xs text-muted-foreground">Save user record directly to the database & admin panel</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Abebe Bikila"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl glass border border-border/50 text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. abebe@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl glass border border-border/50 text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Password <span className="text-[10px] text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl glass border border-border/50 text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+251 9..."
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl glass border border-border/50 text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">System Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl glass border border-border/50 text-foreground bg-background/80 focus:outline-none focus:border-primary/50"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="school">School</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Grade Level</label>
                  <select
                    value={newUserGrade ?? ''}
                    onChange={(e) => setNewUserGrade(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 text-xs rounded-xl glass border border-border/50 text-foreground bg-background/80 focus:outline-none focus:border-primary/50"
                  >
                    <option value="">None / Not set</option>
                    {GRADES.map((g) => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Subscription</label>
                  <select
                    value={newUserSub}
                    onChange={(e) => setNewUserSub(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl glass border border-border/50 text-foreground bg-background/80 focus:outline-none focus:border-primary/50"
                  >
                    <option value="free">Free Tier</option>
                    <option value="premium">Premium Pass</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl glass border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser || !newUserEmail.trim()}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isCreatingUser ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving User...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" /> Save User to Panel
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default UserDirectoryManagement;
