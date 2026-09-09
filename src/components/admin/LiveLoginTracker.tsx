import React, { useState, useMemo } from 'react';
import {
  useLoginHistoryLog,
  AdminUser,
} from '@/hooks/useAdminData';
import {
  Search,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Users,
  Copy,
  Check,
  Edit3,
  Key,
  LogIn,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LiveLoginTrackerProps {
  onInspectUser: (userId: string) => void;
  allUsers?: AdminUser[];
}

export const LiveLoginTracker: React.FC<LiveLoginTrackerProps> = ({
  onInspectUser,
  allUsers = [],
}) => {
  const { data: logs = [], isLoading, isRefetching, refetch } = useLoginHistoryLog(150);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Map of userId -> AdminUser for rich profile display
  const userMap = useMemo(() => {
    const map = new Map<string, AdminUser>();
    allUsers.forEach((u) => {
      if (u.user_id) map.set(u.user_id, u);
    });
    return map;
  }, [allUsers]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase().trim();
      const user = log.user_id ? userMap.get(log.user_id) : null;
      const userName = (user?.name || '').toLowerCase();
      const userEmail = (user?.email || '').toLowerCase();
      const userId = (log.user_id || '').toLowerCase();
      const method = (log.login_method || '').toLowerCase();

      const matchesSearch =
        !q ||
        userName.includes(q) ||
        userEmail.includes(q) ||
        userId.includes(q) ||
        method.includes(q);

      const matchesStatus =
        statusFilter === 'all' || (log.status || 'success') === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [logs, searchQuery, statusFilter, userMap]);

  // Metrics
  const metrics = useMemo(() => {
    const total = logs.length;
    const successful = logs.filter((l) => (l.status || 'success') === 'success').length;
    const failed = total - successful;
    const uniqueUserIds = new Set(logs.map((l) => l.user_id).filter(Boolean));
    const rate = total > 0 ? Math.round((successful / total) * 100) : 100;

    return { total, successful, failed, uniqueUsers: uniqueUserIds.size, rate };
  }, [logs]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast({ title: 'Copied to clipboard', description: `${label} copied.` });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 1. Header & Live Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold font-orbitron text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-400" />
              Live Authentication & Session Feed
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Session Tracking
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time audit log tracking user logins, authentication attempts, session heartbeats, and client metadata.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="px-3 py-1.5 rounded-xl glass border border-border/50 text-xs font-semibold text-foreground hover:bg-white/5 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin text-primary' : ''}`} />
            <span>Refresh Feed</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl glass border border-border/50 space-y-1">
          <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between">
            <span>Total Logins Logged</span>
            <LogIn className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-xl font-bold font-orbitron text-foreground">{metrics.total}</p>
          <p className="text-[10px] text-muted-foreground">Historical tracked events</p>
        </div>

        <div className="p-3.5 rounded-xl glass border border-border/50 space-y-1">
          <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between">
            <span>Unique Learners</span>
            <Users className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <p className="text-xl font-bold font-orbitron text-cyan-400">{metrics.uniqueUsers}</p>
          <p className="text-[10px] text-muted-foreground">Distinct accounts recognized</p>
        </div>

        <div className="p-3.5 rounded-xl glass border border-border/50 space-y-1">
          <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between">
            <span>Auth Success Rate</span>
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <p className="text-xl font-bold font-orbitron text-emerald-400">{metrics.rate}%</p>
          <p className="text-[10px] text-muted-foreground">{metrics.successful} successful / {metrics.failed} failed</p>
        </div>

        <div className="p-3.5 rounded-xl glass border border-border/50 space-y-1">
          <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between">
            <span>Active Live Status</span>
            <Activity className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <p className="text-xl font-bold font-orbitron text-amber-400">
            {allUsers.filter((u) => u.is_online).length}
          </p>
          <p className="text-[10px] text-muted-foreground">Currently online now</p>
        </div>
      </div>

      {/* 3. Search & Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by user name, email address, auth UUID, or login method..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl glass border border-border/50 focus:outline-none focus:border-primary/50 text-foreground bg-background/80"
          >
            <option value="all">All Auth Statuses</option>
            <option value="success">Successful Logins</option>
            <option value="failed">Failed Attempts</option>
          </select>
        </div>
      </div>

      {/* 4. Real-Time Activity Log Table */}
      <div className="overflow-x-auto rounded-xl border border-border/40">
        <table className="w-full text-xs text-left">
          <thead className="text-muted-foreground uppercase text-[10px] bg-white/[0.02] border-b border-border/40">
            <tr>
              <th className="py-3 px-4">User Account</th>
              <th className="py-3 px-4">Auth UUID</th>
              <th className="py-3 px-4">Login Method</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Session Timestamp</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                  <p>Streaming login audit events...</p>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground space-y-2">
                  <LogIn className="h-8 w-8 mx-auto opacity-40 text-muted-foreground" />
                  <p className="font-semibold text-foreground">No login events match your criteria</p>
                  <p className="text-[11px]">User logins will automatically populate here in real time as they sign in.</p>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const user = log.user_id ? userMap.get(log.user_id) : null;
                const isOnline = user?.is_online;
                const isSuccess = (log.status || 'success') === 'success';

                return (
                  <tr key={log.id} className="hover:bg-white/[0.03] transition-colors">
                    {/* User Profile */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-purple-600/30 border border-primary/40 flex items-center justify-center font-bold text-[11px] text-foreground uppercase">
                            {(user?.name || 'KU').slice(0, 2)}
                          </div>
                          {isOnline && (
                            <span
                              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background"
                              title="Online right now"
                            />
                          )}
                        </div>
                        <div>
                          <p
                            className="font-semibold text-foreground hover:underline cursor-pointer flex items-center gap-1.5"
                            onClick={() => log.user_id && onInspectUser(log.user_id)}
                          >
                            {user?.name || 'Registered User'}
                            {user?.role && (
                              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-bold bg-muted/40 text-muted-foreground border border-border/30">
                                {user.role}
                              </span>
                            )}
                          </p>
                          <p className="text-muted-foreground text-[11px]">
                            {user?.email || (log.user_id ? `ID: ${log.user_id.slice(0, 12)}...` : 'Unknown Account')}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Auth UUID */}
                    <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                      {log.user_id ? (
                        <div className="flex items-center gap-1.5">
                          <span>{log.user_id.slice(0, 10)}...</span>
                          <button
                            onClick={() => handleCopy(log.user_id, 'User ID')}
                            className="p-1 rounded hover:text-foreground text-muted-foreground/60 transition-colors"
                            title="Copy full UUID"
                          >
                            {copiedId === log.user_id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Login Method */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-muted/40 text-foreground border border-border/40 capitalize">
                        <Key className="h-3 w-3 text-primary" />
                        {log.login_method || 'Email Auth'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {isSuccess ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                          <AlertCircle className="h-3 w-3 text-red-400" /> Failed
                        </span>
                      )}
                    </td>

                    {/* Session Timestamp */}
                    <td className="py-3 px-4 text-muted-foreground text-[11px]">
                      <div className="space-y-0.5">
                        <p className="text-foreground font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground/60" />
                          {formatRelativeTime(log.login_at)}
                        </p>
                        <p className="text-[10px] text-muted-foreground/80 font-mono">
                          {log.login_at ? new Date(log.login_at).toLocaleString() : '—'}
                        </p>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      {log.user_id && (
                        <button
                          onClick={() => onInspectUser(log.user_id)}
                          className="px-2.5 py-1 rounded-lg glass border border-border/50 text-xs font-semibold text-foreground hover:border-primary/50 hover:text-primary transition-all inline-flex items-center gap-1"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Manage
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
