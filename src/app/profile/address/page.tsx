'use client';

import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useRouter } from 'next/navigation';
import { useAddressStore } from '@/stores/addressStore';
import type { Address, AddressForm, AddressType } from '@/stores/addressStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Plus,
  Edit3,
  Trash2,
  Home,
  Building2,
  ArrowLeft,
  Loader2,
  Check,
  X,
  Star,
  Phone,
} from 'lucide-react';
import Link from 'next/link';

const addressTypeConfig = {
  home: {
    label: 'Home',
    icon: Home,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  work: {
    label: 'Work',
    icon: Building2,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  other: {
    label: 'Other',
    icon: MapPin,
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
  },
} as const;

export default function AddressesPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const router = useRouter();

  const {
    addresses,
    loading,
    error,
    showAddressForm,
    addressForm,
    editingAddressId,
    fetchAddresses,
    addAddress,
    deleteAddress,
    setDefaultAddress,
    setShowAddressForm,
    updateAddressForm,
    resetAddressForm,
    setEditingAddress,
    isValidForm,
    clearError,
    deletingId,
  } = useAddressStore();

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user, fetchAddresses]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidForm()) {
      return;
    }

    const success = await addAddress(addressForm);
    if (success) {
      setShowAddressForm(false);
    }
  };

  const handleEdit = (addr: Address) => {
    setEditingAddress(addr._id);
  };

  const handleAddNew = () => {
    resetAddressForm();
    setEditingAddress(null);
    setShowAddressForm(true);
  };

  const AddressTypeSelector = ({
    selected,
    onSelect,
  }: {
    selected: string;
    onSelect: (type: AddressType) => void;
  }) => (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {(['home', 'work', 'other'] as AddressType[]).map((type) => {
        const config = addressTypeConfig[type];
        const Icon = config.icon;
        return (
          <motion.button
            key={type}
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(type)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-sm text-xs font-medium transition-all ${
              selected === type
                ? `${config.border} ${config.bg} ${config.color}`
                : 'border-gray-300 hover:border-gray-400 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-3 h-3" />
            {config.label}
          </motion.button>
        );
      })}
    </div>
  );

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  const isEditing = !!editingAddressId;
  const formTitle = isEditing ? 'Edit Address' : 'Add New Address';

  return (
    <div className="min-h-screen bg-gray-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6"
        >
          <Link href="/profile">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-white rounded-sm shadow-sm hover:shadow border border-gray-300"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </motion.div>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Addresses</h1>
            <p className="text-xs sm:text-sm text-gray-600">Manage delivery addresses</p>
          </div>
        </motion.div>

        {/* Add Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-sm text-sm font-medium hover:bg-gray-800 transition-colors w-full sm:w-auto justify-center sm:justify-start"
          >
            <Plus className="w-4 h-4" />
            Add Address
          </motion.button>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-300 rounded-sm"
          >
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}

        {/* Address Form */}
        <AnimatePresence>
          {showAddressForm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              className="bg-white rounded-sm shadow-sm border border-gray-300 mb-4 sm:mb-6"
            >
              <div className="px-4 py-3 border-b border-gray-300 bg-gray-50 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">{formTitle}</h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAddressForm(false)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Type Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700">Type</label>
                  <AddressTypeSelector
                    selected={addressForm.type}
                    onSelect={(type) => updateAddressForm({ type })}
                  />
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">Full Name *</label>
                    <input
                      value={addressForm.fullName}
                      onChange={(e) => updateAddressForm({ fullName: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                      placeholder="Enter name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">Phone *</label>
                    <input
                      value={addressForm.phone}
                      onChange={(e) => updateAddressForm({ phone: e.target.value })}
                      required
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                {/* Address Lines */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">
                      Address Line 1 *
                    </label>
                    <input
                      value={addressForm.addressLine1}
                      onChange={(e) => updateAddressForm({ addressLine1: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                      placeholder="Street address"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">
                      Address Line 2
                    </label>
                    <input
                      value={addressForm.addressLine2}
                      onChange={(e) => updateAddressForm({ addressLine2: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                      placeholder="Apartment, suite (optional)"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">City *</label>
                    <input
                      value={addressForm.city}
                      onChange={(e) => updateAddressForm({ city: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">State *</label>
                    <input
                      value={addressForm.state}
                      onChange={(e) => updateAddressForm({ state: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                      placeholder="State"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">PIN *</label>
                    <input
                      value={addressForm.postalCode}
                      onChange={(e) => updateAddressForm({ postalCode: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                      placeholder="PIN"
                    />
                  </div>
                </div>

                {/* Default Checkbox */}
                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-sm cursor-pointer border border-gray-300">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => updateAddressForm({ isDefault: e.target.checked })}
                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                  />
                  <span className="text-xs font-medium text-gray-700">Set as default</span>
                </label>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || !isValidForm()}
                    className="flex items-center justify-center gap-1 bg-gray-900 text-white px-4 py-2 rounded-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {loading ? 'Saving...' : isEditing ? 'Update' : 'Save'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="flex items-center justify-center gap-1 border border-gray-300 text-gray-600 px-4 py-2 rounded-sm text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && !addresses.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-600 mb-2" />
            <p className="text-sm text-gray-600">Loading addresses...</p>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !addresses.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 sm:py-12 bg-white rounded-sm border-2 border-dashed border-gray-300"
          >
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No addresses</h3>
            <p className="text-sm text-gray-600 mb-4 px-4">
              Add your first address for faster checkout
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddNew}
              className="bg-gray-900 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Add Address
            </motion.button>
          </motion.div>
        )}

        {/* Addresses Grid */}
        <AnimatePresence>
          {addresses.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-4 grid-cols-1 lg:grid-cols-2"
            >
              {addresses.map((addr) => {
                const config = addressTypeConfig[addr.type] || addressTypeConfig.other;
                const Icon = config.icon;

                return (
                  <motion.div
                    key={addr._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    layout
                    whileHover={{ y: -2 }}
                    className="bg-white rounded-sm shadow-sm hover:shadow border border-gray-300 transition-all"
                  >
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={`p-2 ${config.bg} rounded-sm flex-shrink-0`}>
                            <Icon className={`w-4 h-4 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-gray-900 text-sm">
                                {config.label}
                              </h4>
                              {addr.isDefault && (
                                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                                  <Star className="w-3 h-3 fill-current" />
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 truncate">{addr.fullName}</p>
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="space-y-1 mb-3">
                        <p className="text-sm text-gray-800 leading-snug">
                          {addr.addressLine1}
                          {addr.addressLine2 && `, ${addr.addressLine2}`}
                        </p>
                        <p className="text-xs text-gray-600">
                          {addr.city}, {addr.state} - {addr.postalCode}
                        </p>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{addr.phone}</span>
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-300">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEdit(addr)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => deleteAddress(addr._id)}
                          disabled={loading}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700 text-xs font-medium bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors disabled:opacity-50"
                        >
                          {deletingId === addr._id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          Delete
                        </motion.button>

                        {!addr.isDefault && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setDefaultAddress(addr._id)}
                            disabled={loading}
                            className="flex items-center gap-1 text-green-600 hover:text-green-700 text-xs font-medium bg-green-50 hover:bg-green-100 px-2 py-1 rounded transition-colors disabled:opacity-50"
                          >
                            <Star className="w-3 h-3" />
                            Default
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
