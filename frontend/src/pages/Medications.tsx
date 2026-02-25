import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMedications } from '../presentation/hooks/useMedications';
import { MedicationList } from '../components/medications/MedicationList';
import { MedicationForm, MedicationFormData } from '../components/medications/MedicationForm';

export default function Medications() {
  const { memberId = 'member-1' } = useParams<{ memberId: string }>();
  const { medications, isLoading, createMedication, deleteMedication } = useMedications(memberId);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (data: MedicationFormData) => {
    await createMedication({
      memberId,
      userId: 'user-1', // TODO: 実際のuserIdに置き換え
      name: data.name,
      category: data.category,
      dosage: data.dosage,
      frequency: data.frequency,
      stockQuantity: data.stockQuantity,
      lowStockThreshold: data.lowStockThreshold,
      instructions: data.instructions,
    });
    setShowForm(false);
  };

  const handleDelete = async (medicationId: string) => {
    await deleteMedication(medicationId);
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-20">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Link to="/members" className="text-gray-500 hover:text-gray-700">
            &larr;
          </Link>
          <h1 className="text-xl font-bold text-primary-700">お薬管理</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          {showForm ? '閉じる' : '+ 追加'}
        </button>
      </header>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">新しい薬を追加</h2>
          <MedicationForm onSubmit={handleSubmit} />
        </div>
      )}

      <section>
        <MedicationList medications={medications} isLoading={isLoading} onDelete={handleDelete} />
      </section>
    </div>
  );
}
