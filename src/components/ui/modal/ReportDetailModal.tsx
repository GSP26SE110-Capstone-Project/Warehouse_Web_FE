import React from 'react';
import { MODAL_BODY_SCROLL_SPACE } from '../../../styles/scrollClasses';

export type Report = {
  id: string;
  staffName: string;
  title: string;
  type: 'Incident' | 'Inventory' | 'Delivery';
  typeClassName: string;
  status: 'Pending' | 'Reviewed' | 'Rejected';
  statusClassName: string;
  createdAt: string;
  priority: 'Low' | 'Medium' | 'High';
  priorityClassName: string;
};

type Props = {
  report: Report;
  onClose: () => void;
};

const getTypeIcon = (type: Report['type']) => {
  switch (type) {
    case 'Incident':
      return 'warning';
    case 'Inventory':
      return 'inventory_2';
    case 'Delivery':
      return 'local_shipping';
    default:
      return 'description';
  }
};

export const ReportViewModal: React.FC<Props> = ({ report, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[#0b101a]/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl border border-white/5 bg-[#0b101a] shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-cyan-400">
              {getTypeIcon(report.type)}
            </span>

            <div>
              <h2 className="text-lg font-bold text-white">
                {report.title}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Mã báo cáo: <span className="text-cyan-400">{report.id}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-slate-400">
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div className={MODAL_BODY_SCROLL_SPACE}>

          {/* INFO GRID */}
          <div className="grid grid-cols-3 gap-6">

            {/* STAFF */}
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
              <p className="text-xs text-slate-400 mb-2">Nhân viên</p>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                  {report.staffName.charAt(0)}
                </div>
                <p className="text-sm text-white">{report.staffName}</p>
              </div>
            </div>

            {/* DATE */}
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
              <p className="text-xs text-slate-400 mb-2">Ngày tạo</p>
              <p className="text-sm text-white">{report.createdAt}</p>
            </div>

            {/* TYPE */}
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
              <p className="text-xs text-slate-400 mb-2">Loại</p>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${report.typeClassName}`}
              >
                {report.type}
              </span>
            </div>
          </div>

          {/* STATUS + PRIORITY */}
          <div className="grid grid-cols-2 gap-6">

            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
              <p className="text-xs text-slate-400 mb-2">Trạng thái</p>
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ring-1 ring-inset ${report.statusClassName}`}
              >
                {report.status}
              </span>
            </div>

            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
              <p className="text-xs text-slate-400 mb-2">Mức độ</p>
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ring-1 ring-inset ${report.priorityClassName}`}
              >
                {report.priority}
              </span>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <p className="text-xs text-slate-400 mb-3">Mô tả chi tiết</p>
            <div className="text-sm text-slate-300 leading-relaxed">
              Đây là nội dung chi tiết của báo cáo. API sẽ trả dữ liệu thật về đây.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-white/5 bg-white/[0.02]">
          <span className="text-xs text-slate-500">
            Hệ thống quản lý kho
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};