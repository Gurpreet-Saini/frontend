'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/lib/api';
import { Department } from '@/lib/types';
import { Building2, Users, ArrowRight, Loader2, Info, Plus, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [currentDept, setCurrentDept] = useState<Department | null>(null);
  const [deleteDeptId, setDeleteDeptId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await getDepartments();
      setDepartments(data);
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (type: 'add' | 'edit', dept?: Department) => {
    setModalType(type);
    setCurrentDept(dept || null);
    if (dept) {
      setFormData({ name: dept.name, description: dept.description });
    } else {
      setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === 'add') {
        await createDepartment(formData);
        toast.success('Department created');
      } else if (modalType === 'edit' && currentDept) {
        await updateDepartment(currentDept.id, formData);
        toast.success('Department updated');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDeleteRequest = (id: number) => {
    setDeleteDeptId(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteDeptId === null) return;
    try {
      await deleteDepartment(deleteDeptId);
      toast.success('Department deleted');
      setDeleteDeptId(null);
      fetchData();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-500 mt-1">Hierarchical organization structure</p>
        </div>
        <button onClick={() => openModal('add')} className="btn-primary">
          <Plus size={18} />
          Add Department
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="font-medium">Loading organization structure...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div key={dept.id} className="card group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                    <Building2 size={24} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openModal('edit', dept)} className="text-gray-400 hover:text-blue-600 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteRequest(dept.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                    <span className="badge badge-gray px-3 py-1 text-[10px] uppercase font-bold tracking-widest ml-2">{dept.center?.name || 'Main Center'}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{dept.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-6">{dept.description || 'Primary operational unit responsible for organizational seva.'}</p>
                
                <div className="flex items-center gap-6 py-4 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-400" />
                    <span className="text-sm font-bold text-gray-700">{dept.sewadar_count || 0} Sewadars</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Link 
                    href={`/sewadars?department_id=${dept.id}`}
                    className="flex-1 bg-gray-50 text-gray-700 text-xs font-bold uppercase tracking-wider py-3 rounded-xl hover:bg-primary-50 hover:text-primary-700 flex items-center justify-center gap-2 transition-colors"
                  >
                    Manage
                    <ArrowRight size={14} />
                  </Link>
                  <Link 
                    href={`/attendance?department_id=${dept.id}`}
                    className="flex-1 bg-gray-50 text-gray-700 text-xs font-bold uppercase tracking-wider py-3 rounded-xl hover:bg-primary-50 hover:text-primary-700 flex items-center justify-center gap-2 transition-colors"
                  >
                    View Attendance
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {departments.length === 0 && (
            <div className="col-span-full py-24 text-center card bg-gray-50 border-dashed border-2">
              <Info size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-bold text-gray-900">No departments found</h3>
              <p className="text-gray-500">Departments will appear here once they are added by the administrator.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay z-50">
          <div className="modal-box">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {modalType === 'add' ? 'Add New Department' : 'Edit Department'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Department Name</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Description (Optional)</label>
                  <textarea
                    className="input min-h-[100px] resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">
                    {modalType === 'add' ? 'Create Department' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteDeptId !== null && (
        <div className="modal-overlay z-[60]">
          <div className="modal-box max-w-sm">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Department?</h3>
              <p className="text-gray-500 mb-6">This action cannot be undone. Associated records will lose their department linkage.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeleteDeptId(null)} className="btn-secondary px-6">Cancel</button>
                <button onClick={handleDeleteConfirm} className="btn-primary bg-red-600 hover:bg-red-700 border-none px-6">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
