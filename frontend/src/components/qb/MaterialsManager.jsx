import React, { useState, useRef, useEffect } from 'react';
import { useLazyImage } from "../../hooks/qb/usePerformance";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter } from 'react-icons/fa';

const MaterialsManager = () => {
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  const categories = [
    'All',
    'Concrete',
    'Steel',
    'Brick',
    'Cement',
    'Sand',
    'Aggregate',
    'Wood',
    'Paint',
    'Tiles',
    'Plumbing',
    'Electrical',
    'Other'
  ];

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [materials, searchTerm, selectedCategory]);

  const fetchMaterials = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockMaterials = [
      {
        _id: '1',
        name: 'خرسانة مسلحة',
        category: 'Concrete',
        description: 'خرسانة مسلحة نوع 300',
        unit: 'م³',
        basePrice: 250,
        currentPrice: 280,
        supplier: {
          name: 'مصانع الخرسانة',
          contact: '0123456789'
        },
        specifications: {
          strength: '300 kg/cm²',
          size: 'Standard',
          brand: 'National Cement'
        },
        availability: 'In Stock',
        lastUpdated: new Date()
      },
      {
        _id: '2',
        name: 'حديد تسليح',
        category: 'Steel',
        description: 'حديد تسليح 12 مم',
        unit: 'طن',
        basePrice: 3500,
        currentPrice: 3800,
        supplier: {
          name: 'مصانع الحديد',
          contact: '0123456789'
        },
        specifications: {
          strength: 'Grade 60',
          size: '12mm',
          brand: 'Egyptian Steel'
        },
        availability: 'In Stock',
        lastUpdated: new Date()
      },
      {
        _id: '3',
        name: 'طوب أحمر',
        category: 'Brick',
        description: 'طوب أحمر عادي',
        unit: 'piece',
        basePrice: 2.5,
        currentPrice: 3,
        supplier: {
          name: 'مصانع الطوب',
          contact: '0123456789'
        },
        specifications: {
          size: '25x12x6 cm',
          color: 'Red',
          brand: 'Local Brick'
        },
        availability: 'In Stock',
        lastUpdated: new Date()
      }
    ];

    setMaterials(mockMaterials);
    setLoading(false);
  };

  const filterMaterials = () => {
    let filtered = materials;

    if (searchTerm) {
      filtered = filtered.filter(material =>
        material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(material => material.category === selectedCategory);
    }

    setFilteredMaterials(filtered);
  };

  const handleDelete = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المادة؟')) {
      setMaterials(materials.filter(material => material._id !== id));
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setShowAddModal(true);
  };

  const handleSave = (materialData) => {
    if (editingMaterial) {
      setMaterials(materials.map(material =>
        material._id === editingMaterial._id ? { ...materialData, _id: editingMaterial._id } : material
      ));
    } else {
      const newMaterial = {
        ...materialData,
        _id: Date.now().toString(),
        lastUpdated: new Date()
      };
      setMaterials([...materials, newMaterial]);
    }
    setShowAddModal(false);
    setEditingMaterial(null);
  };

  const categoryLabels = {
    'Concrete': 'خرسانة',
    'Steel': 'حديد',
    'Brick': 'طوب',
    'Cement': 'أسمنت',
    'Sand': 'رمل',
    'Aggregate': 'زلط',
    'Wood': 'خشب',
    'Paint': 'دهانات',
    'Tiles': 'بلاط',
    'Plumbing': 'سباكة',
    'Electrical': 'كهرباء',
    'Other': 'أخرى'
  };

  const availabilityLabels = {
    'In Stock': 'متوفر',
    'Out of Stock': 'غير متوفر',
    'Limited': 'كمية محدودة'
  };

  const availabilityColors = {
    'In Stock': 'bg-green-100 text-green-800',
    'Out of Stock': 'bg-red-100 text-red-800',
    'Limited': 'bg-yellow-100 text-yellow-800'
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">إدارة المواد</h1>
          <p className="text-gray-600">إدارة وتحديث أسعار ومواصفات مواد البناء</p>
        </div>
        <button
          onClick={() => {
            setEditingMaterial(null);
            setShowAddModal(true);
          }}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <FaPlus className="ml-2" />
          إضافة مادة
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FaSearch className="absolute right-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="بحث عن مادة..."
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <FaFilter className="absolute right-3 top-3 text-gray-400" />
            <select
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'All' ? 'جميع الفئات' : categoryLabels[category]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المادة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الفئة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السعر الحالي</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الوحدة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التوفر</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMaterials.map((material) => (
                <tr key={material._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{material.name}</div>
                      <div className="text-sm text-gray-500">{material.description}</div>
                      {material.supplier.name && (
                        <div className="text-xs text-gray-400">المورد: {material.supplier.name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {categoryLabels[material.category]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">{material.currentPrice}</span>
                      {material.basePrice !== material.currentPrice && (
                        <span className="text-xs text-gray-500 block">
                          الأساسي: {material.basePrice}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {material.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${availabilityColors[material.availability]}`}>
                      {availabilityLabels[material.availability]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleEdit(material)}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(material._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredMaterials.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">لا توجد مواد مطابقة للبحث</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <MaterialForm
          material={editingMaterial}
          onSave={handleSave}
          onCancel={() => {
            setShowAddModal(false);
            setEditingMaterial(null);
          }}
        />
      )}
    </div>
  );
};

// Material Form Component
const MaterialForm = ({ material, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: material?.name || '',
    category: material?.category || 'Concrete',
    description: material?.description || '',
    unit: material?.unit || 'm³',
    basePrice: material?.basePrice || '',
    currentPrice: material?.currentPrice || '',
    supplier: {
      name: material?.supplier?.name || '',
      contact: material?.supplier?.contact || ''
    },
    specifications: {
      strength: material?.specifications?.strength || '',
      size: material?.specifications?.size || '',
      color: material?.specifications?.color || '',
      brand: material?.specifications?.brand || ''
    },
    availability: material?.availability || 'In Stock'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const categories = [
    'Concrete',
    'Steel',
    'Brick',
    'Cement',
    'Sand',
    'Aggregate',
    'Wood',
    'Paint',
    'Tiles',
    'Plumbing',
    'Electrical',
    'Other'
  ];

  const units = ['m³', 'm²', 'm', 'kg', 'ton', 'piece', 'bag', 'liter'];

  const availabilityOptions = ['In Stock', 'Out of Stock', 'Limited'];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {material ? 'تعديل مادة' : 'إضافة مادة جديدة'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم المادة *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الفئة *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الوحدة *</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السعر الحالي *</label>
              <input
                type="number"
                name="currentPrice"
                value={formData.currentPrice}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السعر الأساسي</label>
              <input
                type="number"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">التوفر</label>
              <select
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {availabilityOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="3"
            />
          </div>
          
          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-700 mb-3">معلومات المورد</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المورد</label>
                <input
                  type="text"
                  name="supplier.name"
                  value={formData.supplier.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الاتصال</label>
                <input
                  type="text"
                  name="supplier.contact"
                  value={formData.supplier.contact}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-700 mb-3">المواصفات</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">القوة</label>
                <input
                  type="text"
                  name="specifications.strength"
                  value={formData.specifications.strength}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الحجم</label>
                <input
                  type="text"
                  name="specifications.size"
                  value={formData.specifications.size}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اللون</label>
                <input
                  type="text"
                  name="specifications.color"
                  value={formData.specifications.color}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العلامة التجارية</label>
                <input
                  type="text"
                  name="specifications.brand"
                  value={formData.specifications.brand}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 space-x-reverse pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              حفظ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaterialsManager;