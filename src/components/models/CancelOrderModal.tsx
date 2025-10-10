'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Check, Loader2, CheckCircle } from 'lucide-react';
import { useOrderStore } from '@/stores/orderStore';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    _id: string;
    orderNumber: string;
    totalAmount: number;
    items: Array<{
      name: string;
      quantity: number;
    }>;
  };
}

const cancelReasons = [
  { id: 'change_mind', label: 'Changed my mind', popular: true },
  { id: 'found_better_price', label: 'Found better price elsewhere', popular: true },
  { id: 'wrong_item', label: 'Ordered wrong item/size', popular: false },
  { id: 'delivery_delay', label: 'Delivery taking too long', popular: true },
  { id: 'payment_issue', label: 'Payment/billing issue', popular: false },
  { id: 'product_defect', label: 'Product defect/quality concern', popular: false },
  { id: 'duplicate_order', label: 'Duplicate order placed', popular: false },
  { id: 'other', label: 'Other reason', popular: false },
];

export default function CancelOrderModal({ isOpen, onClose, order }: CancelOrderModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [step, setStep] = useState<'reason' | 'confirm' | 'success'>('reason');
  const [isCancelling, setIsCancelling] = useState(false);

  const { cancelOrder } = useOrderStore();

  const handleCancel = async () => {
    const reason =
      selectedReason === 'other'
        ? otherReason
        : cancelReasons.find((r) => r.id === selectedReason)?.label || '';

    setIsCancelling(true);
    try {
      const success = await cancelOrder(order._id, reason);
      if (success) {
        setStep('success');
        setTimeout(() => {
          onClose();
          setStep('reason');
          setSelectedReason('');
          setOtherReason('');
        }, 2000);
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const resetModal = () => {
    onClose();
    setStep('reason');
    setSelectedReason('');
    setOtherReason('');
  };

  const canProceed = selectedReason && (selectedReason !== 'other' || otherReason.trim());

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-sm max-w-[520px] w-full max-h-[90vh] overflow-hidden shadow-2xl"
        >
          {/* --- HEADER --- */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Cancel Order</h2>
                <p className="text-xs text-gray-500">Order #{order.orderNumber}</p>
              </div>
            </div>
            <button
              onClick={resetModal}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* --- BODY --- */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {step === 'reason' && (
              <div className="p-5 space-y-5">
                {/* Order Summary */}
                <div className="bg-gray-50 p-4 rounded-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-900">Order Total</span>
                    <span className="text-lg font-semibold">
                      ₹{order.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {order.items.length} item{order.items.length > 1 ? 's' : ''} •{' '}
                    {order.items.reduce((acc, item) => acc + item.quantity, 0)} quantity
                  </p>
                </div>

                {/* Reason Selection */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Why are you cancelling?
                  </h3>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {cancelReasons.map((reason) => (
                      <label
                        key={reason.id}
                        className={`flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-all ${
                          selectedReason === reason.id
                            ? 'border-red-200 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="relative">
                          <input
                            type="radio"
                            name="cancelReason"
                            value={reason.id}
                            checked={selectedReason === reason.id}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                              selectedReason === reason.id
                                ? 'border-red-500 bg-red-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {selectedReason === reason.id && (
                              <Check className="w-2.5 h-2.5 text-white" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <span className="text-sm text-gray-900">{reason.label}</span>
                          {reason.popular && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              Popular
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  {selectedReason === 'other' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3"
                    >
                      <textarea
                        value={otherReason}
                        onChange={(e) => setOtherReason(e.target.value)}
                        placeholder="Please specify your reason..."
                        rows={3}
                        className="w-full p-3 border border-gray-200 rounded-sm focus:border-red-300 focus:ring-1 focus:ring-red-200 resize-none text-sm placeholder-gray-400"
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {step === 'confirm' && (
              <div className="p-5 space-y-5">
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-7 h-7 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Confirm Cancellation
                    </h3>
                    <p className="text-sm text-gray-600">
                      Are you sure you want to cancel this order? This action cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-sm">
                  <div className="text-xs text-gray-600 mb-1">Cancellation reason:</div>
                  <div className="text-sm font-medium text-gray-900">
                    {selectedReason === 'other'
                      ? otherReason
                      : cancelReasons.find((r) => r.id === selectedReason)?.label}
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-sm">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Refund Information</h4>
                  <ul className="text-xs text-green-700 space-y-1">
                    <li>• Full refund of ₹{order.totalAmount.toLocaleString()}</li>
                    <li>• Refund will be processed within 5-7 business days</li>
                    <li>• Amount will be credited to your original payment method</li>
                  </ul>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="p-8 text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto"
                >
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Order Cancelled Successfully
                  </h3>
                  <p className="text-sm text-gray-600">
                    Your refund will be processed within 5-7 business days.
                  </p>
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-xs text-gray-500"
                >
                  This window will close automatically...
                </motion.div>
              </div>
            )}
          </div>

          {/* --- FOOTER --- */}
          {step !== 'success' && (
            <div className="flex gap-3 p-5 border-t border-gray-100 bg-gray-50">
              <button
                onClick={step === 'reason' ? resetModal : () => setStep('reason')}
                disabled={isCancelling}
                className="flex-1 py-2 px-3 border border-gray-200 text-gray-700 rounded-sm text-sm font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {step === 'reason' ? 'Keep Order' : 'Back'}
              </button>
              <button
                onClick={step === 'reason' ? () => setStep('confirm') : handleCancel}
                disabled={!canProceed || isCancelling}
                className="flex-1 py-2 px-3 bg-red-500 text-white rounded-sm text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>{step === 'reason' ? 'Continue' : 'Cancel Order'}</span>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
