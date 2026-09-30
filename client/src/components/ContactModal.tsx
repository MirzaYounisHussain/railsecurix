import React from "react";
import { X, Phone, Mail, MapPin, Clock, Shield, Headphones } from "lucide-react";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#0b2144] dark:text-white">
                Contact & Support
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official RailSim Express 24x7 Customer Assistance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contact Numbers Grid */}
        <div className="space-y-3">
          {/* Rail Madad 139 */}
          <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900 flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-orange-500 text-white shrink-0 mt-0.5">
              <Phone className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-orange-950 dark:text-orange-200 uppercase tracking-wider">
                  Rail Madad Helpline
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-orange-200 text-orange-900 dark:bg-orange-900 dark:text-orange-200">
                  Toll-Free 24x7
                </span>
              </div>
              <p className="text-lg font-black text-orange-700 dark:text-orange-400 font-mono mt-0.5">
                139
              </p>
              <p className="text-[11px] text-orange-900/80 dark:text-orange-300/80 mt-0.5">
                For security, medical assistance, enquiry, catering, and grievance redressal.
              </p>
            </div>
          </div>

          {/* Customer Care Email */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
              <Mail className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                E-Ticketing & Customer Care
              </span>
              <a
                href="mailto:customercare@railsim.express"
                className="text-sm font-extrabold text-blue-700 dark:text-blue-400 hover:underline block mt-0.5"
              >
                customercare@railsim.express
              </a>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                For online booking cancellations, refund queries, and transaction assistance.
              </p>
            </div>
          </div>

          {/* Security Helpline */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                Passenger Safety & Security
              </span>
              <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                182 / 139
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Direct connect with the Railway Protection Force (RPF) on-train security staff.
              </p>
            </div>
          </div>

          {/* Corporate Office */}
          <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-3">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              RailSim Express Central Support Centre, State Entry Road, New Delhi - 110001
            </span>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-full bg-[#1b439b] hover:bg-[#143275] text-white text-xs font-black uppercase tracking-wider transition shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
