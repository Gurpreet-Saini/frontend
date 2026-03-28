'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth, AuthUser } from '@/lib/auth-context';
import { getUsers, createUser, updateUser, deleteUser, getCenters, getDepartments } from '@/lib/api';
import { UserCog, Plus, X, Search, Edit, Trash2, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SelectOption { id: number; name: string; }

export default function UsersPage() {
  const { isAdmin, isSuperAdmin, token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [centers, setCenters] = useState<SelectOption[]>([]);
  const [departments, setDepartments] = useState<SelectOption[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'operator', center_id: '', department_id: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin && token) {
      fetchUsers();
      if (isSuperAdmin) {
        fetchCentersData();
      } else {
        fetchDepartmentsData();
      }
    } else if (!isAdmin) {
      setLoading(false);
    }
  }, [isAdmin, token, isSuperAdmin]);

  const fetchUsers = async () => {
    try {
      const { data } = await getUsers();
      setUsers(data || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchCentersData = async () => {
    try {
      const { data } = await getCenters();
      setCenters(data || []);
    } catch {
      toast.error('Failed to load centers');
    }
  };
  
  const fetchDepartmentsData = async (centerId?: number) => {
    try {
      const { data } = await getDepartments({ center_id: centerId });
      setDepartments(data || []);
    } catch {
      toast.error('Failed to load departments');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { 
        username: formData.username, 
        role: formData.role 
      };
      
      if (formData.password) payload.password = formData.password;
      
      if (isSuperAdmin && formData.center_id) payload.center_id = parseInt(formData.center_id);
      if (!isSuperAdmin) payload.center_id = currentUser?.center_id;
      
      if (formData.department_id) payload.department_id = parseInt(formData.department_id);

      if (isEditMode && selectedUserId) {
        await updateUser(selectedUserId, payload);
        toast.success('User updated');
      } else {
        if (!formData.password) {
          toast.error('Password is required for new users');
          return;
        }
        await createUser({ ...payload, password_hash: formData.password });
        toast.success('User created');
      }
      
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save user');
    }
  };

  const openCreate = () => {
    setIsEditMode(false);
    setSelectedUserId(null);
    setFormData({ username: '', password: '', role: 'operator', center_id: '', department_id: '' });
    setIsModalOpen(true);
  };

  const openEdit = (user: AuthUser) => {
    setIsEditMode(true);
    setSelectedUserId(user.id);
    setFormData({
      username: user.username,
      password: '', // Leave blank for edit
      role: user.role,
      center_id: user.center_id?.toString() || '',
      department_id: user.department_id?.toString() || ''
    });
    if (user.center_id) fetchDepartmentsData(user.center_id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(id);
      toast.success('User deleted');
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  if (!isAdmin && !loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-red-500 font-bold">Unauthorized</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
        {/* Elite Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
              <UserCog size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">User Management</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{users.length} accounts</p>
            </div>
          </div>
          <button 
            onClick={openCreate} 
            className="h-10 px-5 bg-gray-900 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg"
          >
            <Plus size={16} />
            <span>Add User</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="card p-2 bg-white/80 backdrop-blur-xl flex items-center shadow-[0_16px_32px_-8px_rgba(0,0,0,0.05)] border-white border-2 rounded-2xl">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search users..." 
                className="w-full bg-transparent border-none focus:ring-0 pl-12 pr-6 py-3 text-gray-900 font-bold placeholder:text-gray-300 text-sm uppercase tracking-tight"
                // Assuming you'll add local search state if needed
              />
           </div>
        </div>

        {/* User List */}
        <div className="card bg-white border border-gray-100 shadow-sm overflow-hidden rounded-3xl">
          {loading ? (
            <div className="p-20 flex flex-col items-center gap-6 text-gray-400">
              <div className="w-12 h-12 border-4 border-gray-100 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm font-bold uppercase tracking-widest">Loading Users...</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-white/50 border-b border-gray-100">
                      <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">User</th>
                      <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Role</th>
                      <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Center</th>
                      <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Department</th>
                      {isSuperAdmin && <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50/50">
                    {users.map(u => (
                      <tr key={u.id} className="group hover:bg-gray-50 transition-all">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700 font-black shadow-inner">
                               {u.username[0].toUpperCase()}
                            </div>
                            <span className="text-sm font-black text-gray-900 uppercase">{u.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                            u.role === 'super_admin' ? 'bg-indigo-600 text-white' :
                            u.role === 'center_admin' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                            'bg-gray-50 text-gray-400 border border-gray-100'
                          }`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-gray-600">{u.center?.name || 'RSSB HQ'}</td>
                        <td className="px-6 py-4 text-xs font-bold text-gray-400">{u.department?.name || 'All Departments'}</td>
                        {isSuperAdmin && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => openEdit(u)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit size={15} /></button>
                              <button onClick={() => handleDelete(u.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-gray-50">
                {users.map(u => (
                  <div key={u.id} className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700 font-black text-sm flex-shrink-0">
                      {u.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 uppercase truncate">{u.username}</p>
                      <p className="text-xs text-gray-400 font-medium truncate">
                        <span className={`inline-block mr-1.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                          u.role === 'super_admin' ? 'bg-indigo-600 text-white' :
                          u.role === 'center_admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'
                        }`}>{u.role.replace('_', ' ')}</span>
                        {u.center?.name || 'HQ'}
                      </p>
                    </div>
                    {isSuperAdmin && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => openEdit(u)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(u.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="py-16 text-center">
                    <UserCog size={36} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-black text-gray-400 uppercase">No Users Found</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* User Account Details Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 animate-in fade-in duration-300">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
            <div className="relative bg-white w-full sm:rounded-[2.5rem] rounded-t-[2.5rem] sm:max-w-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-gray-900 to-indigo-950 p-6 text-white relative overflow-hidden">
                 <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-600/20 rounded-full translate-x-12 -translate-y-12 blur-3xl" />
                 <div className="relative z-10 flex justify-between items-center">
                    <div>
                       <p className="text-[7px] font-black uppercase tracking-[0.4em] text-indigo-300 mb-1">Security & Access</p>
                       <h3 className="text-xl font-black tracking-tight uppercase">{isEditMode ? 'Update User Account' : 'Create New Account'}</h3>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all active:scale-90">
                       <X size={18} />
                    </button>
                 </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Username</label>
                      <input 
                        required 
                        type="text" 
                        className="w-full h-11 px-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-xl outline-none transition-all font-bold text-gray-900 shadow-inner text-sm" 
                        value={formData.username} 
                        onChange={e => setFormData({...formData, username: e.target.value})} 
                        placeholder="Enter username"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{isEditMode ? 'New Password' : 'Account Password'}</label>
                      <input 
                        required={!isEditMode} 
                        type="password" 
                        minLength={6} 
                        className="w-full h-11 px-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-xl outline-none transition-all font-bold text-gray-900 shadow-inner text-sm" 
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        placeholder={isEditMode ? "Leave blank to keep current" : "Min. 6 characters"}
                      />
                   </div>
                </div>

                {isSuperAdmin && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Privilege Level</label>
                    <div className="relative group">
                      <select className="w-full h-11 px-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-xl outline-none font-bold text-gray-900 appearance-none shadow-inner text-sm cursor-pointer" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                        <option value="operator">Operator (Attendance Marking)</option>
                        <option value="center_admin">Center Admin (Management)</option>
                        <option value="super_admin">Super Admin (System Control)</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronRight size={16} className="rotate-90" />
                      </div>
                    </div>
                  </div>
                )}

                {isSuperAdmin && formData.role !== 'super_admin' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Assigned Center</label>
                    <div className="relative group">
                      <select className="w-full h-11 px-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-xl outline-none font-bold text-gray-900 appearance-none shadow-inner text-sm cursor-pointer" value={formData.center_id} onChange={e => {
                          setFormData({...formData, center_id: e.target.value, department_id: ''});
                          fetchDepartmentsData(parseInt(e.target.value));
                      }}>
                        <option value="">Choose Center...</option>
                        {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronRight size={16} className="rotate-90" />
                      </div>
                    </div>
                  </div>
                )}

                {formData.role === 'operator' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Department Constraint</label>
                    <div className="relative group">
                      <select className="w-full h-11 px-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-xl outline-none font-bold text-gray-900 appearance-none shadow-inner text-sm cursor-pointer" value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})}>
                        <option value="">All Departments (Unrestricted)</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronRight size={16} className="rotate-90" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="h-11 flex-1 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 rounded-xl transition-all border border-gray-100">Cancel</button>
                  <button type="submit" className="h-11 flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all active:scale-95">{isEditMode ? 'Update Account' : 'Create Account'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
