// stores/addressStore.ts - Fixed Production Ready Version
import { create } from "zustand";
import { fetchWithCredentials, handleApiResponse } from "@/utils/fetchWithCredentials";
import { toast } from "react-hot-toast";

// Types
export type AddressType = "home" | "work" | "other";

export interface Address {
  _id: string;
  type: AddressType;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface AddressForm {
  type: AddressType;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface AddressStore {
  addresses: Address[];
  selectedAddressId: string;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  showAddressForm: boolean;
  addressForm: AddressForm;
  editingAddressId: string | null;
  deletingId: string | null;

  // Actions
  initializeAddresses: () => Promise<void>;
  fetchAddresses: () => Promise<void>;
  addAddress: (address: Omit<AddressForm, 'country'> & { country?: string }) => Promise<boolean>;
  updateAddress: (id: string, address: Partial<AddressForm>) => Promise<boolean>;
  deleteAddress: (id: string) => Promise<boolean>;
  setDefaultAddress: (id: string) => Promise<boolean>;

  // UI Actions
  setSelectedAddress: (id: string) => void;
  setShowAddressForm: (show: boolean) => void;
  updateAddressForm: (updates: Partial<AddressForm>) => void;
  resetAddressForm: () => void;
  clearError: () => void;
  setEditingAddress: (id: string | null) => void;

  // Getters
  getSelectedAddress: () => Address | null;
  getDefaultAddress: () => Address | null;
  getAddressById: (id: string) => Address | null;
  isValidForm: () => boolean;
  hasAddresses: () => boolean;
}

const initialAddressForm: AddressForm = {
  type: "home",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false,
};

// Validation helpers
const validatePhone = (phone: string): boolean => /^[6-9]\d{9}$/.test(phone.replace(/\s+/g, ''));
const validatePostalCode = (postalCode: string): boolean => /^[1-9][0-9]{5}$/.test(postalCode.trim());
const validateName = (name: string): boolean => /^[a-zA-Z\s]{2,50}$/.test(name.trim());

export const useAddressStore = create<AddressStore>((set, get) => ({
  addresses: [],
  selectedAddressId: "",
  loading: false,
  initialized: false,
  error: null,
  showAddressForm: false,
  addressForm: { ...initialAddressForm },
  editingAddressId: null,
  deletingId: null,

  // Initialize addresses on first call
  initializeAddresses: async () => {
    if (get().initialized) return;
    
    
    set({ initialized: true });
    await get().fetchAddresses();
  },

  // Fetch all addresses with proper error handling
  fetchAddresses: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetchWithCredentials("/api/address");
      
      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated - this is expected in some cases
          
          set({ 
            addresses: [], 
            selectedAddressId: "",
            loading: false,
            error: null 
          });
          return;
        }
        
        // Other HTTP errors
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      const data = await handleApiResponse(response);
      
      // Validate response structure
      if (!data || !Array.isArray(data.addresses)) {
        console.warn('Invalid address data structure:', data);
        set({ addresses: [], loading: false });
        return;
      }
      
      const addresses = data.addresses as Address[];
      set({ addresses, loading: false, error: null });

      // Auto-select default or first address
      const { selectedAddressId } = get();
      if (!selectedAddressId || !addresses.find((a) => a._id === selectedAddressId)) {
        const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];
        if (defaultAddress) {
          set({ selectedAddressId: defaultAddress._id });
        }
      }
      
      
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch addresses";
      console.error("fetchAddresses error:", errorMessage);
      
      set({ 
        addresses: [], 
        loading: false, 
        error: errorMessage,
        selectedAddressId: ""
      });
      
      // Only show toast for non-auth errors
      if (!errorMessage.includes('401')) {
        toast.error(errorMessage);
      }
    }
  },

  // Add new address with comprehensive validation
  addAddress: async (addressData) => {
    const { addressForm } = get();
    
    // Client-side validation
    if (!get().isValidForm()) {
      toast.error("Please fill in all required fields correctly");
      return false;
    }

    const payload = {
      ...addressData,
      country: addressData.country || "India",
      // Trim all string fields
      fullName: addressData.fullName.trim(),
      phone: addressData.phone.replace(/\s+/g, ''),
      addressLine1: addressData.addressLine1.trim(),
      addressLine2: addressData.addressLine2?.trim() || "",
      city: addressData.city.trim(),
      state: addressData.state.trim(),
      postalCode: addressData.postalCode.trim(),
    };

    // Additional server-side validation
    if (!validatePhone(payload.phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return false;
    }

    if (!validatePostalCode(payload.postalCode)) {
      toast.error("Please enter a valid 6-digit PIN code");
      return false;
    }

    if (!validateName(payload.fullName)) {
      toast.error("Please enter a valid full name");
      return false;
    }

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticAddress: Address = { 
      _id: tempId, 
      ...payload,
      addressLine2: payload.addressLine2 || undefined,
    } as Address;
    
    set(state => ({ 
      addresses: [...state.addresses, optimisticAddress],
      loading: true 
    }));

    try {
      const response = await fetchWithCredentials("/api/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await handleApiResponse(response);
      
      if (!response.ok) {
        throw new Error(responseData.error || `HTTP Error: ${response.status}`);
      }

      if (!responseData.address || !responseData.address._id) {
        throw new Error("Invalid response: missing address data");
      }

      // Replace optimistic with real data
      set(state => ({
        addresses: state.addresses.map(addr =>
          addr._id === tempId ? responseData.address : addr
        ),
        selectedAddressId: responseData.address._id,
        showAddressForm: false,
        loading: false,
      }));
      
      get().resetAddressForm();
      toast.success("Address added successfully");
      return true;
      
    } catch (error) {
      // Rollback optimistic update
      set(state => ({
        addresses: state.addresses.filter(addr => addr._id !== tempId),
        loading: false,
      }));
      
      const errorMessage = error instanceof Error ? error.message : "Failed to add address";
      console.error('Add address error:', errorMessage);
      toast.error(errorMessage);
      return false;
    }
  },

  // Update address with optimistic updates
  updateAddress: async (id, updates) => {
    const current = get().getAddressById(id);
    if (!current) {
      toast.error("Address not found");
      return false;
    }

    // Clean and validate updates
    const cleanUpdates = { ...updates };
    if (cleanUpdates.phone) {
      cleanUpdates.phone = cleanUpdates.phone.replace(/\s+/g, '');
      if (!validatePhone(cleanUpdates.phone)) {
        toast.error("Please enter a valid 10-digit phone number");
        return false;
      }
    }

    if (cleanUpdates.postalCode) {
      cleanUpdates.postalCode = cleanUpdates.postalCode.trim();
      if (!validatePostalCode(cleanUpdates.postalCode)) {
        toast.error("Please enter a valid 6-digit PIN code");
        return false;
      }
    }

    if (cleanUpdates.fullName && !validateName(cleanUpdates.fullName.trim())) {
      toast.error("Please enter a valid full name");
      return false;
    }

    // Trim string fields
    (Object.keys(cleanUpdates) as (keyof AddressForm)[]).forEach(key => {
      if (typeof cleanUpdates[key] === 'string') {
        const trimmed = (cleanUpdates[key] as string).trim();
        // Only assign if the property is not possibly undefined
        if (trimmed.length > 0) {
          cleanUpdates[key] = trimmed as any;
        } else if (key === 'addressLine2') {
          // For optional fields, assign undefined if empty
          cleanUpdates[key] = undefined;
        }
      }
      // Do not assign undefined to a string property
    });

    const optimisticAddress = { ...current, ...cleanUpdates };
    
    // Optimistic update
    set(state => ({
      addresses: state.addresses.map(addr => 
        addr._id === id ? optimisticAddress : addr
      ),
      loading: true
    }));

    try {
      const response = await fetchWithCredentials(`/api/address/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanUpdates),
      });

      const responseData = await handleApiResponse(response);
      
      if (!response.ok) {
        throw new Error(responseData.error || `HTTP Error: ${response.status}`);
      }

      if (!responseData.address) {
        throw new Error("Invalid response: missing address data");
      }

      // Update with server response
      set(state => ({
        addresses: state.addresses.map(addr => 
          addr._id === id ? responseData.address : addr
        ),
        editingAddressId: null,
        showAddressForm: false,
        loading: false
      }));
      
      get().resetAddressForm();
      toast.success("Address updated successfully");
      return true;
      
    } catch (error) {
      // Rollback optimistic update
      set(state => ({
        addresses: state.addresses.map(addr => 
          addr._id === id ? current : addr
        ),
        loading: false
      }));
      
      const errorMessage = error instanceof Error ? error.message : "Failed to update address";
      console.error('Update address error:', errorMessage);
      toast.error(errorMessage);
      return false;
    }
  },

  // Delete address with optimistic updates
  deleteAddress: async (id) => {
    const currentAddresses = get().addresses;
    const addressToDelete = currentAddresses.find(addr => addr._id === id);
    
    if (!addressToDelete) {
      toast.error("Address not found");
      return false;
    }

    // Optimistic update
    const filteredAddresses = currentAddresses.filter(a => a._id !== id);
    set({ 
      addresses: filteredAddresses, 
      deletingId: id,
      selectedAddressId: get().selectedAddressId === id ? "" : get().selectedAddressId
    });

    try {
      const response = await fetchWithCredentials(`/api/address/${id}`, { 
        method: "DELETE" 
      });
      
      if (!response.ok) {
        const errorData = await handleApiResponse(response).catch(() => ({}));
        throw new Error(errorData.error || `HTTP Error: ${response.status}`);
      }
      
      set({ deletingId: null });
      toast.success("Address deleted successfully");
      
      // Auto-select new address if deleted one was selected
      if (filteredAddresses.length > 0 && !get().selectedAddressId) {
        const defaultAddr = filteredAddresses.find(a => a.isDefault) || filteredAddresses[0];
        set({ selectedAddressId: defaultAddr._id });
      }
      
      return true;
      
    } catch (error) {
      // Rollback optimistic update
      set({ 
        addresses: currentAddresses, 
        deletingId: null 
      });
      
      const errorMessage = error instanceof Error ? error.message : "Failed to delete address";
      console.error('Delete address error:', errorMessage);
      toast.error(errorMessage);
      return false;
    }
  },

  // Set default address
  setDefaultAddress: async (id) => {
    return get().updateAddress(id, { isDefault: true });
  },

  // UI Actions
  setSelectedAddress: (id) => {
    const address = get().addresses.find(a => a._id === id);
    if (address) {
      set({ selectedAddressId: id });
    } else {
      console.warn(`Attempted to select non-existent address: ${id}`);
    }
  },

  setShowAddressForm: (show) => set({ showAddressForm: show }),

  updateAddressForm: (updates) => {
    set(state => ({ 
      addressForm: { ...state.addressForm, ...updates } 
    }));
  },

  resetAddressForm: () => {
    set({ 
      addressForm: { ...initialAddressForm }, 
      editingAddressId: null,
      error: null
    });
  },

  clearError: () => set({ error: null }),

  setEditingAddress: (id) => {
    if (id) {
      const address = get().getAddressById(id);
      if (address) {
        set({
          editingAddressId: id,
          addressForm: { 
            ...address, 
            addressLine2: address.addressLine2 || "" 
          },
          showAddressForm: true,
          error: null
        });
      } else {
        console.warn(`Attempted to edit non-existent address: ${id}`);
        toast.error("Address not found");
      }
    } else {
      set({ editingAddressId: null });
    }
  },

  // Getters
  getSelectedAddress: () => {
    const { addresses, selectedAddressId } = get();
    return addresses.find(a => a._id === selectedAddressId) || null;
  },

  getDefaultAddress: () => {
    return get().addresses.find(a => a.isDefault) || null;
  },

  getAddressById: (id) => {
    return get().addresses.find(a => a._id === id) || null;
  },

  hasAddresses: () => get().addresses.length > 0,

  isValidForm: () => {
    const { addressForm } = get();
    
    // Check required fields
    const requiredFields = [
      addressForm.fullName?.trim(),
      addressForm.phone?.trim(),
      addressForm.addressLine1?.trim(),
      addressForm.city?.trim(),
      addressForm.state?.trim(),
      addressForm.postalCode?.trim(),
    ];

    // All required fields must be filled
    const hasAllRequiredFields = requiredFields.every(field => field && field.length > 0);
    
    if (!hasAllRequiredFields) return false;

    // Validate formats
    const phoneValid = validatePhone(addressForm.phone);
    const postalCodeValid = validatePostalCode(addressForm.postalCode);
    const nameValid = validateName(addressForm.fullName);
    const addressValid = addressForm.addressLine1.trim().length >= 10;
    const cityValid = validateName(addressForm.city);
    const stateValid = validateName(addressForm.state);

    return phoneValid && postalCodeValid && nameValid && addressValid && cityValid && stateValid;
  },
}));