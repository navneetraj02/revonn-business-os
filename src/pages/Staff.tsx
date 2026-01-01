import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Users,
  Phone,
  Calendar,
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Key,
  Shield,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};

interface Staff {
  id: string;
  name: string;
  phone: string | null;
  role: string | null;
  salary: number;
  username: string | null;
  permissions: {
    billing: boolean;
    inventory: boolean;
    customers: boolean;
    reports: boolean;
    settings: boolean;
  };
  is_active: boolean;
}

interface Attendance {
  id: string;
  staff_id: string;
  date: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
}

export default function StaffPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [newStaff, setNewStaff] = useState({
    name: '',
    phone: '',
    role: 'staff' as string,
    salary: 0,
    username: '',
    password: '',
    permissions: {
      billing: true,
      inventory: false,
      customers: false,
      reports: false,
      settings: false
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Load staff from Supabase
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('user_id', session.user.id);

      if (staffError) throw staffError;
      
      const formattedStaff: Staff[] = (staffData || []).map(s => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        role: s.role,
        salary: Number(s.salary) || 0,
        username: s.username,
        permissions: (typeof s.permissions === 'object' && s.permissions !== null && !Array.isArray(s.permissions))
          ? s.permissions as Staff['permissions']
          : { billing: true, inventory: false, customers: false, reports: false, settings: false },
        is_active: s.is_active ?? true
      }));
      
      setStaffList(formattedStaff);

      // Load today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { data: attData, error: attError } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('date', today);

      if (!attError && attData) {
        setAttendance(attData);
      }
    } catch (error) {
      console.error('Error loading staff:', error);
      toast.error(isHindi ? 'डेटा लोड करने में त्रुटि' : 'Error loading data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.phone) {
      toast.error(isHindi ? 'कृपया आवश्यक फ़ील्ड भरें' : 'Please fill required fields');
      return;
    }

    if (newStaff.username && !newStaff.password) {
      toast.error(isHindi ? 'पासवर्ड आवश्यक है' : 'Password is required for staff login');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Simple password hash (in production, use proper hashing)
      const passwordHash = newStaff.password ? btoa(newStaff.password) : null;

      const { data, error } = await supabase
        .from('staff')
        .insert({
          user_id: session.user.id,
          name: newStaff.name,
          phone: newStaff.phone,
          role: newStaff.role,
          salary: newStaff.salary,
          username: newStaff.username || null,
          password_hash: passwordHash,
          permissions: newStaff.permissions,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      const newStaffMember: Staff = {
        id: data.id,
        name: data.name,
        phone: data.phone,
        role: data.role,
        salary: Number(data.salary) || 0,
        username: data.username,
        permissions: newStaff.permissions,
        is_active: true
      };

      setStaffList([...staffList, newStaffMember]);
      setShowAddModal(false);
      setNewStaff({
        name: '',
        phone: '',
        role: 'staff',
        salary: 0,
        username: '',
        password: '',
        permissions: { billing: true, inventory: false, customers: false, reports: false, settings: false }
      });
      toast.success(isHindi ? 'स्टाफ जोड़ा गया!' : 'Staff member added!');
    } catch (error) {
      console.error('Error adding staff:', error);
      toast.error(isHindi ? 'स्टाफ जोड़ने में त्रुटि' : 'Error adding staff');
    }
  };

  const markAttendance = async (staffId: string, status: 'present' | 'absent' | 'half-day') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const today = new Date().toISOString().split('T')[0];
      const existingToday = attendance.find(a => a.staff_id === staffId);

      if (existingToday) {
        // Update existing
        const { error } = await supabase
          .from('staff_attendance')
          .update({
            status,
            check_in: status === 'present' || status === 'half-day' ? new Date().toISOString() : null
          })
          .eq('id', existingToday.id);

        if (error) throw error;
        setAttendance(prev => prev.map(a => 
          a.id === existingToday.id ? { ...a, status } : a
        ));
      } else {
        // Create new
        const { data, error } = await supabase
          .from('staff_attendance')
          .insert({
            user_id: session.user.id,
            staff_id: staffId,
            date: today,
            status,
            check_in: status === 'present' || status === 'half-day' ? new Date().toISOString() : null
          })
          .select()
          .single();

        if (error) throw error;
        setAttendance([...attendance, data]);
      }
      toast.success(isHindi ? 'हाजिरी दर्ज!' : 'Attendance marked!');
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error(isHindi ? 'हाजिरी में त्रुटि' : 'Error marking attendance');
    }
  };

  const updatePermissions = async () => {
    if (!selectedStaff) return;

    try {
      const { error } = await supabase
        .from('staff')
        .update({ permissions: selectedStaff.permissions })
        .eq('id', selectedStaff.id);

      if (error) throw error;

      setStaffList(prev => prev.map(s => 
        s.id === selectedStaff.id ? selectedStaff : s
      ));
      setShowPermissionsModal(false);
      toast.success(isHindi ? 'अनुमतियां अपडेट!' : 'Permissions updated!');
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error(isHindi ? 'अपडेट में त्रुटि' : 'Error updating');
    }
  };

  const getStaffAttendance = (staffId: string) => {
    return attendance.find(a => a.staff_id === staffId);
  };

  const filteredStaff = staffList.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone?.includes(searchQuery)
  );

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const absentCount = attendance.filter(a => a.status === 'absent').length;

  return (
    <AppLayout title={isHindi ? 'स्टाफ' : 'Staff'}>
      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={isHindi ? 'स्टाफ खोजें...' : 'Search staff...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-3 rounded-xl bg-primary text-primary-foreground"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-card text-center">
            <p className="text-2xl font-bold text-foreground">{staffList.length}</p>
            <p className="text-xs text-muted-foreground">{isHindi ? 'कुल स्टाफ' : 'Total Staff'}</p>
          </div>
          <div className="p-3 rounded-xl bg-card text-center">
            <p className="text-2xl font-bold text-success">{presentCount}</p>
            <p className="text-xs text-muted-foreground">{isHindi ? 'उपस्थित' : 'Present'}</p>
          </div>
          <div className="p-3 rounded-xl bg-card text-center">
            <p className="text-2xl font-bold text-destructive">{absentCount}</p>
            <p className="text-xs text-muted-foreground">{isHindi ? 'अनुपस्थित' : 'Absent'}</p>
          </div>
        </div>

        {/* Today's Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>

        {/* Staff List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">
                {isHindi ? 'कोई स्टाफ नहीं' : 'No staff members'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isHindi ? 'पहला स्टाफ जोड़ें' : 'Add your first staff member'}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium"
              >
                <Plus className="w-4 h-4" />
                {isHindi ? 'स्टाफ जोड़ें' : 'Add Staff'}
              </button>
            </div>
          ) : (
            filteredStaff.map((staff) => {
              const att = getStaffAttendance(staff.id);
              return (
                <div
                  key={staff.id}
                  className="p-4 bg-card rounded-xl border border-border"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">
                          {staff.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{staff.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {staff.phone || 'N/A'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground capitalize">
                            {staff.role} • {formatCurrency(staff.salary)}/month
                          </span>
                          {staff.username && (
                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] flex items-center gap-1">
                              <Key className="w-2.5 h-2.5" />
                              {isHindi ? 'लॉगिन' : 'Login'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {att && (
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          att.status === 'present' && 'bg-success/10 text-success',
                          att.status === 'absent' && 'bg-destructive/10 text-destructive',
                          att.status === 'half-day' && 'bg-warning/10 text-warning'
                        )}>
                          {att.status === 'half-day' ? (isHindi ? 'आधा दिन' : 'Half Day') : att.status}
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setSelectedStaff(staff);
                          setShowPermissionsModal(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-secondary"
                      >
                        <Settings className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  {/* Attendance Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => markAttendance(staff.id, 'present')}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1',
                        att?.status === 'present' 
                          ? 'bg-success text-success-foreground' 
                          : 'bg-success/10 text-success hover:bg-success/20'
                      )}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isHindi ? 'उपस्थित' : 'Present'}
                    </button>
                    <button
                      onClick={() => markAttendance(staff.id, 'half-day')}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1',
                        att?.status === 'half-day' 
                          ? 'bg-warning text-warning-foreground' 
                          : 'bg-warning/10 text-warning hover:bg-warning/20'
                      )}
                    >
                      <Clock className="w-4 h-4" />
                      {isHindi ? 'आधा दिन' : 'Half Day'}
                    </button>
                    <button
                      onClick={() => markAttendance(staff.id, 'absent')}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1',
                        att?.status === 'absent' 
                          ? 'bg-destructive text-destructive-foreground' 
                          : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                      )}
                    >
                      <XCircle className="w-4 h-4" />
                      {isHindi ? 'अनुपस्थित' : 'Absent'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="w-full max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-6 space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-foreground">
              {isHindi ? 'स्टाफ जोड़ें' : 'Add Staff Member'}
            </h2>
            
            <div className="space-y-3">
              <input
                type="text"
                placeholder={isHindi ? 'नाम *' : 'Name *'}
                value={newStaff.name}
                onChange={(e) => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
                className="input-field"
              />
              <input
                type="tel"
                placeholder={isHindi ? 'फ़ोन *' : 'Phone *'}
                value={newStaff.phone}
                onChange={(e) => setNewStaff(prev => ({ ...prev, phone: e.target.value }))}
                className="input-field"
              />
              <select
                value={newStaff.role}
                onChange={(e) => setNewStaff(prev => ({ ...prev, role: e.target.value }))}
                className="input-field"
              >
                <option value="staff">{isHindi ? 'स्टाफ' : 'Staff'}</option>
                <option value="manager">{isHindi ? 'मैनेजर' : 'Manager'}</option>
                <option value="cashier">{isHindi ? 'कैशियर' : 'Cashier'}</option>
              </select>
              <input
                type="number"
                placeholder={isHindi ? 'वेतन' : 'Salary'}
                value={newStaff.salary || ''}
                onChange={(e) => setNewStaff(prev => ({ ...prev, salary: Number(e.target.value) }))}
                className="input-field"
              />

              {/* Login Credentials */}
              <div className="pt-3 border-t border-border">
                <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  {isHindi ? 'लॉगिन क्रेडेंशियल (वैकल्पिक)' : 'Login Credentials (Optional)'}
                </h4>
                <input
                  type="text"
                  placeholder={isHindi ? 'यूजरनेम' : 'Username'}
                  value={newStaff.username}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, username: e.target.value }))}
                  className="input-field mb-2"
                />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isHindi ? 'पासवर्ड' : 'Password'}
                    value={newStaff.password}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, password: e.target.value }))}
                    className="input-field pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Permissions */}
              <div className="pt-3 border-t border-border">
                <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {isHindi ? 'अनुमतियां' : 'Permissions'}
                </h4>
                <div className="space-y-2">
                  {Object.entries(newStaff.permissions).map(([key, value]) => (
                    <label key={key} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                      <span className="text-sm capitalize">{key}</span>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setNewStaff(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, [key]: e.target.checked }
                        }))}
                        className="w-4 h-4 rounded"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium"
              >
                {isHindi ? 'रद्द' : 'Cancel'}
              </button>
              <button
                onClick={handleAddStaff}
                className="flex-1 py-3 rounded-xl btn-gold font-medium"
              >
                {isHindi ? 'जोड़ें' : 'Add Staff'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="w-full max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-6 space-y-4 animate-slide-up">
            <h2 className="text-xl font-bold text-foreground">
              {isHindi ? 'अनुमतियां - ' : 'Permissions - '}{selectedStaff.name}
            </h2>
            
            <div className="space-y-2">
              {Object.entries(selectedStaff.permissions).map(([key, value]) => (
                <label key={key} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <span className="font-medium capitalize">{key}</span>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setSelectedStaff({
                      ...selectedStaff,
                      permissions: { ...selectedStaff.permissions, [key]: e.target.checked }
                    })}
                    className="w-5 h-5 rounded"
                  />
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium"
              >
                {isHindi ? 'रद्द' : 'Cancel'}
              </button>
              <button
                onClick={updatePermissions}
                className="flex-1 py-3 rounded-xl btn-gold font-medium"
              >
                {isHindi ? 'सेव करें' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
