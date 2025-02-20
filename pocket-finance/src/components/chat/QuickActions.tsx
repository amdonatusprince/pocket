import { Sparkles, ArrowRightLeft, Coins, BookOpen } from 'lucide-react';

export const QUICK_ACTIONS = [
  {
    title: 'Utility Agent',
    description: 'Payments, invoices, payroll, etc',
    icon: Sparkles,
  },
  {
    title: 'Trade Agent',
    description: 'Swap tokens on Openocean',
    icon: ArrowRightLeft,
  },
  {
    title: 'Stake Agent',
    description: 'Stake S for sPOCKET rewards',
    icon: Coins,
  },
  {
    title: 'Knowledge Agent',
    description: 'Get info on almost anything',
    icon: BookOpen,
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 max-w-xl mx-auto">
      {QUICK_ACTIONS.map((action, index) => {
        const Icon = action.icon;
        return (
          <button
            key={index}
            className="flex items-start p-2 sm:p-3 rounded-lg bg-white dark:bg-gray-800 
              border border-gray-200 dark:border-gray-700 
              hover:border-[#007BFF] dark:hover:border-[#007BFF] 
              hover:shadow-md transition-all group text-left"
          >
            <div className="p-1.5 sm:p-2 rounded-lg bg-gray-50 dark:bg-gray-700 mr-2 sm:mr-3">
              <Icon size={16} className="text-[#222831] dark:text-white sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-[#222831] dark:text-white text-sm sm:text-base">
                  {action.title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                {action.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}