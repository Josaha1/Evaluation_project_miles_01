import React, { useEffect, useState } from 'react';
import { X, Clock, Info, Calendar } from 'lucide-react';

interface AnnouncementData {
    title?: string;
    
    deadline?: string;
    year?: string;
}

interface AnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    autoCloseDelay?: number; // in milliseconds
    announcement?: AnnouncementData;
}

export default function AnnouncementModal({ 
    isOpen, 
    onClose, 
   
    announcement
}: AnnouncementModalProps) {
  
  

   

    const handleManualClose = () => {
      
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleManualClose}
            />
            
            {/* Modal - Responsive */}
            <div className="relative w-full max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in duration-300 scale-in-95">
                {/* Header - Responsive */}
                <div className="relative p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl sm:rounded-t-2xl text-white">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg flex-shrink-0">
                                <Info size={20} className="sm:hidden" />
                                <Info size={24} className="hidden sm:block" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg sm:text-xl font-bold leading-tight">
                                    {announcement?.title || 'ประกาศการประเมิน 360 องศา'}
                                </h2>
                                <p className="text-blue-100 text-xs sm:text-sm mt-1">
                                    กนอ. ประจำปี {announcement?.year || '2567-2568'}
                                </p>
                            </div>
                        </div>
                        
                        <button
                            onClick={handleManualClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                            aria-label="ปิด"
                        >
                            <X size={18} className="sm:hidden" />
                            <X size={20} className="hidden sm:block" />
                        </button>
                    </div>

                    
                </div>

                {/* Content - Responsive */}
                <div className="p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                        {/* Main announcement */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg sm:rounded-xl p-3 sm:p-4">
                            <div className="flex items-start gap-2 sm:gap-3">
                                <div className="p-1 bg-blue-500 rounded-full mt-0.5 sm:mt-1 flex-shrink-0">
                                    <Calendar size={14} className="text-white sm:hidden" />
                                    <Calendar size={16} className="text-white hidden sm:block" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">
                                        {announcement?.title || 'การประเมิน 360 องศา ของ กนอ.'}
                                    </h3>
                                    <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                        <ul className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-1 sm:space-y-2">
                                        <li className="pl-1">• ในการประเมิน 360 องศา ของ กนอ. ในครั้งนี้ จะเป็นการประเมินตามตำแหน่งงาน/ระดับพนักงานของบุคลากรในปี 2568 จนถึงวันที่ 31 มีนาคม 2568</li>
                                        <li className="pl-1">• พนักงานตามคำสั่งมอบหมายให้ไปช่วยปฏิบัติงาน (เฉพาะกรณีช่วยปฏิบัติงาน) หรือพนักงานที่โยกย้ายไป ดำรงสังกัดใหม่ หากอายุงานในสังกัดนั้นไม่ครบ 8 เดือน ให้ผู้บังคับบัญชาสังกัดเดิมเป็นผู้ประเมิน หากเกินกว่า 8 เดือน ให้ผู้บังคับบัญชาสังกัดปัจจุบันเป็นผู้ประเมิน</li>
                                    </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional info */}
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg sm:rounded-xl p-3 sm:p-4">
                            <div className="flex items-start gap-2 sm:gap-3">
                                <div className="p-1 bg-amber-500 rounded-full mt-0.5 sm:mt-1 flex-shrink-0">
                                    <Clock size={14} className="text-white sm:hidden" />
                                    <Clock size={16} className="text-white hidden sm:block" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-1 sm:mb-2 text-sm sm:text-base">
                                        ข้อมูลสำคัญ
                                    </h4>
                                    <ul className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-1 sm:space-y-2">
                                         <li className="pl-1">• ความคิดเห็นของท่านจะถูกเก็บรักษา อย่างเป็นความลับโดยสถาบันวิจัยและให้คำปรึกษาแห่งมหาวิทยาลัยธรรมศาสตร์ จะไม่มีการระบุถึงผู้ให้ข้อมูล/แหล่งที่มาของข้อมูลในการสรุปผลดังกล่าว</li>
                                        <li className="pl-1">• การประเมินจะดำเนินการตามตำแหน่งงานและระดับพนักงาน</li>
                                        <li className="pl-1">• กรุณาทำการประเมินให้ครบถ้วนตามที่ได้รับมอบหมาย</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Responsive */}
                    <div className="flex items-center justify-center sm:justify-between mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          {/* Empty space for future use on desktop */}
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={handleManualClose}
                                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm sm:text-base min-w-[80px] sm:min-w-[100px]"
                            >
                                รับทราบ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}