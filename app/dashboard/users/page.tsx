'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth, AuthUser } from '@/lib/auth-context';
import { getUsers, createUser, updateUser, deleteUser, getCenters, getDepartments } from '@/lib/api';
import { UserCog, Plus, X, Search, Edit, Trash2 } from 'lucide-react';
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
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100 group-hover:rotate-6 transition-transform">
                <UserCog size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase leading-none">User Management</h1>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">{users.length} Total Users</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={openCreate} 
            className="group relative px-6 py-3.5 bg-gray-900 text-white rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-800 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
            <div className="relative flex items-center gap-3">
              <Plus size={22} className="group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">Add User</span>
            </div>
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
        <div className="group/table relative">
          <div className="absolute -inset-1 bg-gradient-to-b from-indigo-50 via-transparent to-indigo-50 rounded-[3.5rem] blur-2xl opacity-0 group-hover/table:opacity-100 transition-opacity" />
          <div className="card relative bg-white/70 backdrop-blur-3xl border-none shadow-[0_32px_128px_-32px_rgba(0,0,0,0.08)] overflow-hidden rounded-[3rem]">
            {loading ? (
              <div className="p-32 flex flex-col items-center justify-center gap-8 opacity-40">
                <div className="w-20 h-20 border-8 border-gray-100 border-t-indigo-600 rounded-full animate-spin shadow-inner" />
                <div className="space-y-1 text-center">
                   <p className="text-sm font-black uppercase tracking-[0.4em] animate-pulse">Loading Users...</p>
                   <p className="text-[10px] font-medium italic">Connecting to authentication system.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-white/50 border-b border-gray-100">
                      <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">User</th>
                      <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Role</th>
                      <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Center</th>
                      <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Department</th>
                      <th className="px-6 py-4 text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Status</th>
                      {isSuperAdmin && <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50/50">
                    {users.map(u => (
                      <tr key={u.id} className="group hover:bg-white hover:shadow-xl transition-all duration-300">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center text-indigo-700 font-black text-base shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                               {u.username[0].toUpperCase()}
                            </div>
                            <span className="text-base font-black text-gray-900 tracking-tighter uppercase group-hover:text-indigo-700 transition-colors">{u.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                            u.role === 'super_admin' ? 'bg-indigo-600 text-white shadow-md' :
                            u.role === 'center_admin' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                            'bg-gray-50 text-gray-400 border border-gray-100'
                          }`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                              <span className="text-xs font-black text-gray-600 uppercase tracking-tight">{u.center?.name || 'RSSB HQ'}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">
                          {u.department?.name || 'All Departments'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-2 px-2 py-1 bg-green-50 text-green-600 rounded text-[9px] font-black uppercase tracking-widest border border-green-100">
                             Active
                          </div>
                        </td>
                        {isSuperAdmin && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => openEdit(u)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                <Edit size={16} />
                              </button>
                              <button onClick={() => handleDelete(u.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* User Account Details Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/80 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="bg-white rounded-[3.5rem] w-full max-w-xl shadow-[0_64px_256px_-64px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-500 border-4 border-white">
              <div className="relative h-40 bg-gray-900 flex flex-col justify-center px-12">
                 <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-600/30 rounded-full translate-x-24 -translate-y-24 blur-3xl" />
                 <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em] mb-2">User Account Details</p>
                 <h3 className="font-black text-4xl text-white tracking-widest uppercase">{isEditMode ? 'Edit User' : 'Create New User'}</h3>
                 <button 
                   onClick={() => setIsModalOpen(false)} 
                   className="absolute right-10 top-10 text-white/30 hover:text-white transition-all bg-white/5 hover:bg-white/10 p-3 rounded-2xl"
                 >
                   <X size={24} />
                 </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-10 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-1">Username</label>
                      <input required type="text" className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-black text-gray-900 shadow-inner" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-1">{isEditMode ? 'New Password (Optional)' : 'Password'}</label>
                      <input required={!isEditMode} type="password" minLength={6} className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-black text-gray-900 shadow-inner" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                   </div>
                </div>

                {isSuperAdmin && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-1">User Role</label>
                    <select className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-black text-gray-900 appearance-none shadow-inner" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                      <option value="operator">Operator</option>
                      <option value="center_admin">Center Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                )}

                {isSuperAdmin && formData.role !== 'super_admin' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-1">Center</label>
                    <select className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-black text-gray-900 appearance-none shadow-inner" value={formData.center_id} onChange={e => {
                        setFormData({...formData, center_id: e.target.value, department_id: ''});
                        fetchDepartmentsData(parseInt(e.target.value));
                    }}>
                      <option value="">Select Center...</option>
                      {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}

                {formData.role === 'operator' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-1">Department (Optional)</label>
                    <select className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-black text-gray-900 appearance-none shadow-inner" value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})}>
                      <option value="">All Departments</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                )}

                <div className="pt-6 flex gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 rounded-2xl transition-all">Cancel</button>
                  <button type="submit" className="flex-[2] py-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-indigo-100 transition-all active:scale-[0.98]">{isEditMode ? 'Save Changes' : 'Create User'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
