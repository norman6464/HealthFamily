'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHospitals } from '@/presentation/hooks/useHospitals';
import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { HospitalList } from '@/components/hospitals/HospitalList';
import { HospitalForm, HospitalFormData } from '@/components/hospitals/HospitalForm';
import { ArrowLeft, Plus, X } from 'lucide-react';

export default function HospitalsPage() {
  const router = useRouter();
  const { hospitals, isLoading, createHospital, updateHospital, deleteHospital } = useHospitals();
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (data: HospitalFormData) => {
    await createHospital(data);
    setShowForm(false);
  };

  const handleDelete = async (hospitalId: string) => {
    await deleteHospital(hospitalId);
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-gradient-header shadow-soft">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/appointments')}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="通院管理に戻る"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-white">かかりつけ医(病院)</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors"
            aria-label={showForm ? '閉じる' : '病院を追加'}
          >
            {showForm ? <X size={20} /> : <Plus size={20} />}
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        {showForm && (
          <div className="mb-6 bg-white rounded-2xl shadow-soft p-4 border border-pink-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">病院の追加</h2>
            <HospitalForm onSubmit={handleCreate} />
          </div>
        )}

        <HospitalList
          hospitals={hospitals}
          isLoading={isLoading}
          onUpdate={updateHospital}
          onDelete={handleDelete}
        />
      </main>

      <BottomNavigation activePath="/appointments" />
    </div>
  );
}
