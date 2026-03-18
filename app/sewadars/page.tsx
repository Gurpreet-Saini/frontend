'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  getSewadars, 
  getDepartments, 
  createSewadar, 
  updateSewadar, 
  deleteSewadar, 
  transferSewadar,
  bulkUploadSewadars,
  exportSewadars
} from '@/lib/api';
import { Sewadar, Department } from '@/lib/types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  MoveHorizontal, 
  Upload, 
  Download, 
  Search, 
  X,
  UserPlus,
  Loader2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

export default function SewadarsPage() {
  const [sewadars, setSewadars] = useState<Sewadar[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'transfer' | 'upload'>('add');
  const [currentSewadar, setCurrentSewadar] = useState<Sewadar | null>(null);
  const [deleteSewadarId, setDeleteSewadarId] = useState<number | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sewadar_id: '',
    department_id: '',
    parent_spouse_name: '',
    gender: 'Male',
    badge_status: 'Permanent',
    phone: '',
    email: ''
  });
  const [newDeptId, setNewDeptId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [sewsRes, deptsRes] = await Promise.all([
        getSewadars(),
        getDepartments()
      ]);
      setSewadars(sewsRes.data);
      setDepartments(deptsRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const filteredSewadars = sewadars.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.sewadar_id.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter ? s.department_id === Number(deptFilter) : true;
    return matchesSearch && matchesDept;
  });

  const openModal = (type: 'add' | 'edit' | 'transfer' | 'upload', sewadar?: Sewadar) => {
    setModalType(type);
    setCurrentSewadar(sewadar || null);
    if (sewadar) {
      setFormData({
        name: sewadar.name,
        sewadar_id: sewadar.sewadar_id,
        department_id: String(sewadar.department_id),
        parent_spouse_name: sewadar.parent_spouse_name || '',
        gender: sewadar.gender || 'Male',
        badge_status: sewadar.badge_status || 'Permanent',
        phone: sewadar.phone || '',
        email: sewadar.email || ''
      });
      setNewDeptId('');
    } else {
      setFormData({ name: '', sewadar_id: '', department_id: '', parent_spouse_name: '', gender: 'Male', badge_status: 'Permanent', phone: '', email: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === 'add') {
        await createSewadar({ ...formData, department_id: formData.department_id ? Number(formData.department_id) : null });
        toast.success('Sewadar added');
      } else if (modalType === 'edit' && currentSewadar) {
        await updateSewadar(currentSewadar.id, { ...formData, department_id: formData.department_id ? Number(formData.department_id) : null });
        toast.success('Sewadar updated');
      } else if (modalType === 'transfer' && currentSewadar) {
        await transferSewadar(currentSewadar.id, Number(newDeptId));
        toast.success('Sewadar transferred');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) return;
    try {
      setLoading(true);
      await bulkUploadSewadars(uploadFile);
      toast.success('Bulk upload successful');
      setIsModalOpen(false);
      setUploadFile(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Bulk upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const { data } = await exportSewadars(deptFilter ? Number(deptFilter) : undefined);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sewadars.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const handleDeleteRequest = (id: number) => {
    setDeleteSewadarId(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteSewadarId === null) return;
    try {
      await deleteSewadar(deleteSewadarId);
      toast.success('Sewadar deleted');
      setDeleteSewadarId(null);
      fetchData();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sewadars</h1>
          <p className="text-gray-500 mt-1">Manage personnel records and assignments</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="btn-secondary">
            <Download size={18} />
            Export List
          </button>
          <button onClick={() => openModal('upload')} className="btn-secondary">
            <Upload size={18} />
            Bulk Upload
          </button>
          <button onClick={() => openModal('add')} className="btn-primary">
            <Plus size={18} />
            Add Sewadar
          </button>
        </div>
      </div>

      <div className="card shadow-sm mb-6 p-4 flex flex-col md:flex-row gap-4 items-center bg-white">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            className="input pl-10 h-11"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <select
            className="select h-11"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="table-th">Sewadar Details</th>
                <th className="table-th">Department</th>
                <th className="table-th">Contact Info</th>
                <th className="table-th">Joined</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400">
                    <Loader2 className="animate-spin mx-auto mb-2" size={32} />
                    <p>Loading sewadars...</p>
                  </td>
                </tr>
              ) : filteredSewadars.length > 0 ? (
                filteredSewadars.map((sw) => (
                  <tr key={sw.id} className="table-tr">
                    <td className="table-td">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{sw.name}</span>
                        <span className="text-xs text-gray-500 font-mono tracking-tighter uppercase">{sw.sewadar_id}</span>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className="badge badge-blue">{sw.department?.name}</span>
                    </td>
                    <td className="table-td">
                      <div className="text-xs space-y-1">
                        {sw.phone && <p className="text-gray-600 font-medium">☏ {sw.phone}</p>}
                        {sw.email && <p className="text-gray-400">✉ {sw.email}</p>}
                        {!sw.phone && !sw.email && <span className="text-gray-300 italic">No contact</span>}
                      </div>
                    </td>
                    <td className="table-td text-gray-500 text-xs">
                      {formatDate(sw.created_at)}
                    </td>
                    <td className="table-td text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openModal('transfer', sw)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Transfer Department">
                          <MoveHorizontal size={18} />
                        </button>
                        <button onClick={() => openModal('edit', sw)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteRequest(sw.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400 italic">
                    No sewadars found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay z-50">
          <div className="modal-box max-w-lg lg:max-w-xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {modalType === 'add' && 'Add New Sewadar'}
                {modalType === 'edit' && 'Edit Sewadar'}
                {modalType === 'transfer' && 'Transfer Sewadar'}
                {modalType === 'upload' && 'Bulk Upload Sewadars'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {modalType === 'upload' ? (
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-primary-300 hover:bg-primary-50/50 transition-all group flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mb-4 group-hover:scale-110 transition-transform">
                      <Upload size={32} />
                    </div>
                    <label className="cursor-pointer">
                      <span className="text-primary-600 font-bold hover:underline">Click to upload</span> or drag and drop
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".xlsx" 
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      />
                    </label>
                    <p className="text-xs text-gray-400 mt-2">Excel (.xlsx) files only</p>
                    {uploadFile && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2 text-green-700 text-sm">
                        <AlertCircle size={16} />
                        Selected: <span className="font-bold">{uploadFile.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-2 border border-gray-100">
                    <p className="font-bold text-gray-700 mb-1">Upload Instructions:</p>
                    <p>• Header row is required.</p>
                    <p>• Columns: Sewadar ID, Name, Department ID, Phone, Email, Parent/Spouse Name, Gender, Badge Status.</p>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                    <button onClick={handleBulkUpload} disabled={!uploadFile || loading} className="btn-primary px-8">
                      {loading ? <Loader2 className="animate-spin" size={18} /> : 'Start Upload'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {(modalType === 'add' || modalType === 'edit') && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">Name</label>
                          <input
                            type="text"
                            className="input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="label">Sewadar ID</label>
                          <input
                            type="text"
                            className="input font-mono uppercase"
                            value={formData.sewadar_id}
                            onChange={(e) => setFormData({ ...formData, sewadar_id: e.target.value.toUpperCase() })}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">Department</label>
                          <select
                            className="select"
                            value={formData.department_id}
                            onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                          >
                            <option value="">Select Department</option>
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="label">Parent/Spouse Name</label>
                          <input
                            type="text"
                            className="input"
                            value={formData.parent_spouse_name}
                            onChange={(e) => setFormData({ ...formData, parent_spouse_name: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">Gender</label>
                          <select
                            className="select"
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="label">Badge Status</label>
                          <select
                            className="select"
                            value={formData.badge_status}
                            onChange={(e) => setFormData({ ...formData, badge_status: e.target.value })}
                          >
                            <option value="Permanent">Permanent</option>
                            <option value="Open">Open</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">Phone (Optional)</label>
                          <input
                            type="text"
                            className="input"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="label">Email (Optional)</label>
                          <input
                            type="email"
                            className="input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {modalType === 'transfer' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-200 flex items-center justify-center text-primary-700 order-last">
                           <MoveHorizontal size={24} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-primary-600 font-bold uppercase tracking-wider mb-0.5">Transferring Sewadar</p>
                          <p className="font-bold text-gray-900">{currentSewadar?.name}</p>
                          <p className="text-xs text-gray-500">Currently in: <span className="font-bold">{currentSewadar?.department?.name}</span></p>
                        </div>
                      </div>
                      <div>
                        <label className="label">New Department</label>
                        <select
                          className="select"
                          value={newDeptId}
                          onChange={(e) => setNewDeptId(e.target.value)}
                          required
                        >
                          <option value="">Select Department</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-50 mt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary px-10">
                      {modalType === 'add' ? 'Save Sewadar' : modalType === 'edit' ? 'Update Details' : 'Confirm Transfer'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteSewadarId !== null && (
        <div className="modal-overlay z-[60]">
          <div className="modal-box max-w-sm">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Sewadar?</h3>
              <p className="text-gray-500 mb-6">This action cannot be undone. All attendance records linked to this profile will also be deleted.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeleteSewadarId(null)} className="btn-secondary px-6">Cancel</button>
                <button onClick={handleDeleteConfirm} className="btn-primary bg-red-600 hover:bg-red-700 border-none px-6">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
