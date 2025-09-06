"use client";

import { useEffect, useState, useCallback, useMemo, memo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCheckoutStore } from "@/stores/checkoutStore";
import { useAddressStore } from "@/stores/addressStore";
import PriceSummaryCard from "@/components/ui/PriceSummaryCard";
import { toast } from "react-hot-toast";

import {
  MapPin,
  Plus,
  Edit2,
  ArrowLeft,
  Loader2,
  Check,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Package,
  Shield,
  ShieldCheck,
  Info,
  Star,
} from "lucide-react";

// Validation patterns - moved outside component to prevent recreation
const VALIDATION_PATTERNS = {
  phone: /^[6-9]\d{9}$/,
  postalCode: /^[1-9][0-9]{5}$/,
  name: /^[a-zA-Z\s]{2,50}$/,
} as const;

// Validation messages - moved outside component
const VALIDATION_MESSAGES = {
  fullName: {
    required: "Full name is required",
    invalid: "Name should contain only letters and spaces (2-50 characters)",
  },
  phone: {
    required: "Phone number is required",
    invalid: "Please enter a valid 10-digit Indian mobile number",
  },
  addressLine1: {
    required: "Address line 1 is required",
    minLength: "Address should be at least 10 characters long",
  },
  city: {
    required: "City is required",
    invalid: "City name should contain only letters and spaces",
  },
  state: {
    required: "State is required",
    invalid: "State name should contain only letters and spaces",
  },
  postalCode: {
    required: "PIN code is required",
    invalid: "Please enter a valid 6-digit PIN code",
  },
} as const;

// Validation function outside component
const validateField = (fieldName: string, value: string): string => {
  const trimmedValue = value.trim();
  
  switch (fieldName) {
    case 'fullName':
      if (!trimmedValue) return VALIDATION_MESSAGES.fullName.required;
      if (!VALIDATION_PATTERNS.name.test(trimmedValue)) return VALIDATION_MESSAGES.fullName.invalid;
      break;
    
    case 'phone':
      if (!trimmedValue) return VALIDATION_MESSAGES.phone.required;
      if (!VALIDATION_PATTERNS.phone.test(trimmedValue)) return VALIDATION_MESSAGES.phone.invalid;
      break;
    
    case 'addressLine1':
      if (!trimmedValue) return VALIDATION_MESSAGES.addressLine1.required;
      if (trimmedValue.length < 10) return VALIDATION_MESSAGES.addressLine1.minLength;
      break;
    
    case 'city':
      if (!trimmedValue) return VALIDATION_MESSAGES.city.required;
      if (!VALIDATION_PATTERNS.name.test(trimmedValue)) return VALIDATION_MESSAGES.city.invalid;
      break;
    
    case 'state':
      if (!trimmedValue) return VALIDATION_MESSAGES.state.required;
      if (!VALIDATION_PATTERNS.name.test(trimmedValue)) return VALIDATION_MESSAGES.state.invalid;
      break;
    
    case 'postalCode':
      if (!trimmedValue) return VALIDATION_MESSAGES.postalCode.required;
      if (!VALIDATION_PATTERNS.postalCode.test(trimmedValue)) return VALIDATION_MESSAGES.postalCode.invalid;
      break;
    
    default:
      break;
  }
  return '';
};

// Separate InputField component to prevent re-renders
interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  pattern?: string;
  maxLength?: number;
  placeholder?: string;
  error?: string;
  isTouched?: boolean;
}

const InputField = memo<InputFieldProps>(({ 
  label, 
  name, 
  type = "text", 
  required = false, 
  value, 
  onChange, 
  pattern,
  maxLength,
  placeholder,
  error,
  isTouched,
  ...props 
}) => {
  const hasError = error && isTouched;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        pattern={pattern}
        maxLength={maxLength}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border transition-colors focus:outline-none focus:ring-2 focus:border-transparent rounded ${
          hasError
            ? 'border-red-300 focus:ring-red-500 bg-red-50'
            : 'border-gray-300 focus:ring-blue-500 hover:border-gray-400'
        }`}
        {...props}
      />
      {hasError && (
        <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
});

InputField.displayName = 'InputField';

// Separate AddressCard component for the address list
interface AddressCardProps {
  address: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
}

const AddressCard = memo<AddressCardProps>(({ address, isSelected, onSelect, onEdit }) => {
  const handleSelect = useCallback(() => {
    onSelect(address._id);
  }, [address._id, onSelect]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(address._id);
  }, [address._id, onEdit]);

  return (
    <div
      className={`p-3 border-2 cursor-pointer transition-all rounded ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-start justify-between">
        <div 
          onClick={handleSelect}
          className="flex-1"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 text-sm">{address.fullName}</span>
            <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded capitalize">
              {address.type}
            </span>
            {address.isDefault && (
              <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">
                Default
              </span>
            )}
          </div>
          <p className="text-gray-600 text-xs">
            {address.addressLine1}
            {address.addressLine2 && `, ${address.addressLine2}`}
          </p>
          <p className="text-gray-600 text-xs">
            {address.city}, {address.state} - {address.postalCode}
          </p>
          <p className="text-gray-600 text-xs">Phone: {address.phone}</p>
        </div>
        <div className="flex items-center gap-2">
          {isSelected && (
            <Check className="w-4 h-4 text-blue-600" />
          )}
          <button 
            onClick={handleEdit}
            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded"
            title="Edit address"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
});

AddressCard.displayName = 'AddressCard';

const CheckoutPage = () => {
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  const { user } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  // Checkout store
  const checkoutStore = useCheckoutStore();
  const getCheckoutData = useCallback(() => checkoutStore.getCheckoutData(), [checkoutStore]);
  const hasValidCheckout = useCallback(() => checkoutStore.hasValidCheckout(), [checkoutStore]);
  const updateSelectedAddress = useCallback((id: string) => checkoutStore.updateSelectedAddress(id), [checkoutStore]);
  const canProceedToPayment = useCallback(() => checkoutStore.canProceedToPayment(), [checkoutStore]);
  const getSelectedItems = useCallback(() => checkoutStore.getSelectedItems(), [checkoutStore]);
  const toggleInsurance = useCallback((productId: string) => checkoutStore.toggleInsurance(productId), [checkoutStore]);

  // Address store
  const addressStore = useAddressStore();
  const addresses = addressStore.addresses;
  const addressLoading = addressStore.loading;
  const addressInitialized = addressStore.initialized;
  const showAddressForm = addressStore.showAddressForm;
  const addressForm = addressStore.addressForm;
  const editingAddressId = addressStore.editingAddressId;
  const addAddress = useCallback((form: any) => addressStore.addAddress(form), [addressStore]);
  const updateAddress = useCallback((id: string, form: any) => addressStore.updateAddress(id, form), [addressStore]);
  const setShowAddressForm = useCallback((show: boolean) => addressStore.setShowAddressForm(show), [addressStore]);
  const updateAddressForm = useCallback((updates: any) => addressStore.updateAddressForm(updates), [addressStore]);
  const initializeAddresses = useCallback(() => addressStore.initializeAddresses(), [addressStore]);
  const resetAddressForm = useCallback(() => addressStore.resetAddressForm(), [addressStore]);
  const setEditingAddress = useCallback((id: string | null) => addressStore.setEditingAddress(id), [addressStore]);
  const isValidForm = useCallback(() => addressStore.isValidForm(), [addressStore]);

  // Local state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [showAllAddresses, setShowAllAddresses] = useState(false);

  // Memoize computed values
  const checkoutData = useMemo(() => getCheckoutData(), [getCheckoutData]);
  const selectedItems = useMemo(() => getSelectedItems(), [getSelectedItems]);
  const selectedAddress = useMemo(
    () => addresses.find(addr => addr._id === checkoutData?.selectedAddressId),
    [addresses, checkoutData?.selectedAddressId]
  );
  const defaultAddress = useMemo(
    () => addresses.find(addr => addr.isDefault) || addresses[0],
    [addresses]
  );

  // Initialize addresses when component mounts
  useEffect(() => {
    if (user?._id && !addressInitialized) {
      initializeAddresses();
    }
  }, [user?._id, addressInitialized, initializeAddresses]);

  // Auto-select default address if none selected
  useEffect(() => {
    if (checkoutData && !checkoutData.selectedAddressId && defaultAddress) {
      updateSelectedAddress(defaultAddress._id);
    }
  }, [checkoutData, defaultAddress, updateSelectedAddress]);

  // Stable field change handler
  const handleFieldChange = useCallback((fieldName: string, value: string) => {
    updateAddressForm({ [fieldName]: value });
    
    setTouchedFields(prev => new Set([...prev, fieldName]));
    
    const error = validateField(fieldName, value);
    setFormErrors(prev => ({
      ...prev,
      [fieldName]: error,
    }));
  }, [updateAddressForm]);

  // Create stable handlers
  const fieldHandlers = useMemo(() => ({
    fullName: (value: string) => handleFieldChange('fullName', value),
    phone: (value: string) => handleFieldChange('phone', value),
    addressLine1: (value: string) => handleFieldChange('addressLine1', value),
    addressLine2: (value: string) => updateAddressForm({ addressLine2: value }),
    city: (value: string) => handleFieldChange('city', value),
    state: (value: string) => handleFieldChange('state', value),
    postalCode: (value: string) => handleFieldChange('postalCode', value),
  }), [handleFieldChange, updateAddressForm]);

  // Form submission handler
  const handleAddressSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: Record<string, string> = {};
    const fields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'postalCode'];
    
    fields.forEach(field => {
      const error = validateField(field, addressForm[field as keyof typeof addressForm] as string);
      if (error) errors[field] = error;
    });
    
    setFormErrors(errors);
    setTouchedFields(new Set(fields));
    
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);
    
    try {
      let success = false;
      let newAddressId: string | null = null;
      
      if (editingAddressId) {
        success = await updateAddress(editingAddressId, addressForm);
        if (success) {
          newAddressId = editingAddressId;
        }
      } else {
        success = await addAddress(addressForm);
        if (success) {
          const newAddress = addresses.find(addr => 
            addr.fullName === addressForm.fullName && 
            addr.phone === addressForm.phone &&
            addr.addressLine1 === addressForm.addressLine1
          );
          newAddressId = newAddress?._id || null;
        }
      }

      if (success && newAddressId) {
        updateSelectedAddress(newAddressId);
        setShowAllAddresses(false);
      }
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('An error occurred while saving the address');
    } finally {
      setIsSubmitting(false);
    }
  }, [addressForm, editingAddressId, updateAddress, addAddress, addresses, updateSelectedAddress]);

  // Event handlers
  const handleProceedToPayment = useCallback(() => {
    if (!canProceedToPayment()) {
      if (!checkoutData?.selectedAddressId) {
        toast.error("Please select a delivery address");
        return;
      }
      toast.error("Unable to proceed to payment");
      return;
    }

    router.push('/checkout/payment');
  }, [canProceedToPayment, checkoutData?.selectedAddressId, router]);

  const handleAddNewAddress = useCallback(() => {
    resetAddressForm();
    setFormErrors({});
    setTouchedFields(new Set());
    setShowAddressForm(true);
    setShowAllAddresses(true);
  }, [resetAddressForm, setShowAddressForm]);

  const handleCloseForm = useCallback(() => {
    setShowAddressForm(false);
    setFormErrors({});
    setTouchedFields(new Set());
    if (editingAddressId) {
      setEditingAddress(null);
    }
  }, [setShowAddressForm, editingAddressId, setEditingAddress]);

  const handleEditAddress = useCallback((addressId: string) => {
    setFormErrors({});
    setTouchedFields(new Set());
    setEditingAddress(addressId);
    setShowAllAddresses(true);
  }, [setEditingAddress]);

  const handleSelectAddress = useCallback((addressId: string) => {
    updateSelectedAddress(addressId);
    setShowAllAddresses(false);
  }, [updateSelectedAddress]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleGoToCart = useCallback(() => {
    router.push("/cart");
  }, [router]);

  const handleAddressTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateAddressForm({ type: e.target.value as 'home' | 'work' | 'other' });
  }, [updateAddressForm]);

  const handleToggleInsurance = useCallback((productId: string) => {
    toggleInsurance(productId);
  }, [toggleInsurance]);

  // Authentication check
  if (!user?._id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 shadow-sm rounded border border-gray-200 max-w-md mx-4">
          <h1 className="text-xl font-semibold mb-4 text-gray-900">
            Authentication Required
          </h1>
          <p className="text-gray-600 mb-4">
            Please sign in to continue with checkout.
          </p>
          <button 
            onClick={() => router.push("/auth/signin?returnUrl=/checkout")}
            className="w-full bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-colors rounded font-medium"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Show loading if no checkout data
  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Show error if no items selected
  if (!selectedItems.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 shadow-sm rounded border border-gray-200 max-w-md mx-4">
          <h1 className="text-xl font-semibold mb-4 text-gray-900">
            No items selected for checkout
          </h1>
          <p className="text-gray-600 mb-4">
            Please go back to your cart and select items to checkout.
          </p>
          <button 
            onClick={handleGoToCart}
            className="w-full bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-colors rounded font-medium"
          >
            Go to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-white transition-colors rounded"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
            <p className="text-sm text-gray-600 mt-1">
              {checkoutData.totals.selectedQuantity} items selected for checkout
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address Section */}
            <div className="bg-white p-6 border border-gray-200 rounded">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <MapPin className="w-5 h-5" />
                  Delivery Address
                </h2>
              </div>

              {/* Default/Selected Address Display */}
              {selectedAddress ? (
                <div className="mb-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900">{selectedAddress.fullName}</span>
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded capitalize">
                            {selectedAddress.type}
                          </span>
                          {selectedAddress.isDefault && (
                            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">
                          {selectedAddress.addressLine1}
                          {selectedAddress.addressLine2 && `, ${selectedAddress.addressLine2}`}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.postalCode}
                        </p>
                        <p className="text-gray-600 text-sm">Phone: {selectedAddress.phone}</p>
                      </div>
                      <Check className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => setShowAllAddresses(!showAllAddresses)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors"
                    >
                      {showAllAddresses ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide Other Addresses
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Change Address ({addresses.length > 1 ? `${addresses.length - 1} more` : 'Add new'})
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded">
                  <p className="text-orange-800 text-sm">No address selected. Please choose or add a delivery address.</p>
                  <button
                    onClick={() => setShowAllAddresses(true)}
                    className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Select Address
                  </button>
                </div>
              )}

              {/* Expandable Address List */}
              {showAllAddresses && (
                <div className="space-y-4">
                  {/* Address Form */}
                  {showAddressForm && (
                    <div className="p-4 border border-gray-200 bg-gray-50 rounded">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-gray-900">
                          {editingAddressId ? 'Edit Address' : 'Add New Address'}
                        </h3>
                        <button
                          onClick={handleCloseForm}
                          className="p-1 hover:bg-gray-200 transition-colors rounded text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <form onSubmit={handleAddressSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InputField
                            label="Full Name"
                            name="fullName"
                            required
                            value={addressForm.fullName}
                            onChange={fieldHandlers.fullName}
                            placeholder="Enter your full name"
                            error={formErrors.fullName}
                            isTouched={touchedFields.has('fullName')}
                          />
                          
                          <InputField
                            label="Phone Number"
                            name="phone"
                            type="tel"
                            required
                            value={addressForm.phone}
                            onChange={fieldHandlers.phone}
                            placeholder="Enter 10-digit mobile number"
                            maxLength={10}
                            error={formErrors.phone}
                            isTouched={touchedFields.has('phone')}
                          />
                          
                          <div className="md:col-span-2">
                            <InputField
                              label="Address Line 1"
                              name="addressLine1"
                              required
                              value={addressForm.addressLine1}
                              onChange={fieldHandlers.addressLine1}
                              placeholder="House/Flat no., Building, Street"
                              error={formErrors.addressLine1}
                              isTouched={touchedFields.has('addressLine1')}
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <InputField
                              label="Address Line 2"
                              name="addressLine2"
                              value={addressForm.addressLine2 ?? ""}
                              onChange={fieldHandlers.addressLine2}
                              placeholder="Area, Colony, Landmark (Optional)"
                            />
                          </div>
                          
                          <InputField
                            label="City"
                            name="city"
                            required
                            value={addressForm.city}
                            onChange={fieldHandlers.city}
                            placeholder="Enter city name"
                            error={formErrors.city}
                            isTouched={touchedFields.has('city')}
                          />
                          
                          <InputField
                            label="State"
                            name="state"
                            required
                            value={addressForm.state}
                            onChange={fieldHandlers.state}
                            placeholder="Enter state name"
                            error={formErrors.state}
                            isTouched={touchedFields.has('state')}
                          />
                          
                          <InputField
                            label="PIN Code"
                            name="postalCode"
                            required
                            value={addressForm.postalCode}
                            onChange={fieldHandlers.postalCode}
                            placeholder="Enter 6-digit PIN code"
                            maxLength={6}
                            error={formErrors.postalCode}
                            isTouched={touchedFields.has('postalCode')}
                          />
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Address Type
                            </label>
                            <select
                              value={addressForm.type}
                              onChange={handleAddressTypeChange}
                              className="w-full px-3 py-2 border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors rounded"
                            >
                              <option value="home">Home</option>
                              <option value="work">Work</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-6">
                          <button
                            type="submit"
                            disabled={isSubmitting || addressLoading || !isValidForm()}
                            className="bg-blue-600 text-white px-6 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 rounded"
                          >
                            {(isSubmitting || addressLoading) && (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            {editingAddressId ? 'Update Address' : 'Save Address'}
                          </button>
                          <button
                            type="button"
                            onClick={handleCloseForm}
                            className="text-gray-600 hover:text-gray-900 text-sm px-4 py-2 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Address List */}
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <AddressCard
                        key={addr._id}
                        address={addr}
                        isSelected={checkoutData.selectedAddressId === addr._id}
                        onSelect={handleSelectAddress}
                        onEdit={handleEditAddress}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleAddNewAddress}
                    className="w-full p-3 border-2 border-dashed border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors rounded flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Address
                  </button>
                </div>
              )}
            </div>

            {/* Order Items Section */}
            <div className="bg-white p-6 border border-gray-200 rounded">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900 mb-4">
                <Package className="w-5 h-5" />
                Order Items ({selectedItems.length})
              </h2>

              <div className="space-y-4">
                {selectedItems.map((item) => {
                  const hasProtection = checkoutData.insuranceEnabled.includes(item.productId);
                  const itemInsuranceCost = hasProtection ? Math.round(item.itemTotal * 0.02) : 0;

                  return (
                    <div
                      key={item.productId}
                      className="border border-gray-200 rounded p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {item.product?.mainImage?.url ? (
                            <img
                              src={item.product.mainImage.url}
                              alt={item.product.mainImage.alt || item.product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextElementSibling) {
                                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {item.product?.name || "Product"}
                              </h3>
                              <div className="text-sm text-gray-600 mb-2">
                                Qty: {item.quantity}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">
                                ₹{item.itemTotal.toLocaleString()}
                              </div>
                              {item.product?.originalPrice && 
                               item.product.originalPrice > item.product.finalPrice && (
                                <div className="text-xs text-gray-500 line-through">
                                  ₹{(item.product.originalPrice * item.quantity).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Price per unit */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm text-gray-600">
                              ₹{item.product?.finalPrice?.toLocaleString()} each
                            </span>
                            {item.product?.discountPercent && item.product.discountPercent > 0 && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                {Math.round(item.product.discountPercent)}% OFF
                              </span>
                            )}
                          </div>

                          {/* Product ratings if available */}
                          {item.product && (item.product as any).ratings > 0 && (
                            <div className="flex items-center gap-1 mb-3">
                              <div className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-3 h-3 ${
                                      i < Math.floor((item.product as any).ratings) 
                                        ? 'text-yellow-400 fill-current' 
                                        : 'text-gray-300'
                                    }`} 
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-gray-600">
                                ({(item.product as any).ratings.toFixed(1)})
                              </span>
                            </div>
                          )}

                          {/* Protection Plan */}
                          <div 
                            className={`border rounded p-3 transition-all duration-200 ${
                              hasProtection 
                                ? 'border-blue-200 bg-blue-50' 
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleToggleInsurance(item.productId)}
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                                    hasProtection
                                      ? "bg-blue-600 border-blue-600 text-white"
                                      : "border-gray-300 hover:border-blue-400"
                                  }`}
                                >
                                  {hasProtection && <Check className="w-3 h-3" />}
                                </button>
                                <div className="flex items-center gap-2">
                                  {hasProtection ? (
                                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                                  ) : (
                                    <Shield className="w-4 h-4 text-gray-400" />
                                  )}
                                  <div>
                                    <div className="font-medium text-sm text-gray-900">
                                      Product Protection Plan
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      2-year damage & theft coverage
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-sm text-gray-900">
                                  +₹{Math.round(item.itemTotal * 0.02).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  (2% of item value)
                                </div>
                              </div>
                            </div>
                            {hasProtection && (
                              <div className="mt-2 pt-2 border-t border-blue-200">
                                <div className="flex items-center gap-1 text-xs text-blue-700">
                                  <Info className="w-3 h-3" />
                                  <span>Covers accidental damage, liquid spills & theft</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Item total with insurance */}
                          {hasProtection && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-right">
                              <div className="text-sm font-semibold text-gray-900">
                                Item Total: ₹{(item.itemTotal + itemInsuranceCost).toLocaleString()}
                              </div>
                              <div className="text-xs text-blue-600">
                                (includes ₹{itemInsuranceCost} protection)
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal ({checkoutData.totals.selectedQuantity} items)</span>
                    <span className="font-medium">₹{checkoutData.totals.subtotal.toLocaleString()}</span>
                  </div>
                  {checkoutData.totals.insuranceCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Protection Plan</span>
                      <span className="font-medium text-blue-600">₹{checkoutData.totals.insuranceCost.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {checkoutData.totals.shippingCost === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        `₹${checkoutData.totals.shippingCost.toLocaleString()}`
                      )}
                    </span>
                  </div>
                  {checkoutData.totals.totalDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Discount</span>
                      <span className="font-medium text-green-600">-₹{checkoutData.totals.totalDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold text-lg">
                    <span className="text-gray-900">Total Amount</span>
                    <span className="text-gray-900">₹{checkoutData.totals.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Price Summary Card */}
          <div className="lg:col-span-1">
            <PriceSummaryCard
              mode="checkout"
              onProceedToPayment={handleProceedToPayment}
              showItemDetails={true}
              showTrustSignals={true}
              showContinueShopping={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;