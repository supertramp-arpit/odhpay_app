export const bbpsCategories = {
  "Agent Collection": {
    icon: "👨‍💼",
    emoji: "👨‍💼",
    color: "#FF6B6B",
    bgColor: "#FFE5E5",
  },
  "Broadband Postpaid": {
    icon: "🌐",
    emoji: "🌐",
    color: "#4ECDC4",
    bgColor: "#E5F9F7",
  },
  "Cable TV": {
    icon: "📺",
    emoji: "📺",
    color: "#45B7D1",
    bgColor: "#E5F5F9",
  },
  "Clubs and Associations": {
    icon: "🏛️",
    emoji: "🏛️",
    color: "#8B5CF6",
    bgColor: "#F5E5FF",
  },
  "Credit Card": {
    icon: "💳",
    emoji: "💳",
    color: "#F59E0B",
    bgColor: "#FEF3E5",
  },
  "Donation": {
    icon: "❤️",
    emoji: "❤️",
    color: "#EF4444",
    bgColor: "#FFE5E5",
  },
  "DTH": {
    icon: "📡",
    emoji: "📡",
    color: "#06B6D4",
    bgColor: "#E5F9FB",
  },
  "eChallan": {
    icon: "📋",
    emoji: "📋",
    color: "#DC2626",
    bgColor: "#FFE5E5",
  },
  "Education Fees": {
    icon: "🎓",
    emoji: "🎓",
    color: "#3B82F6",
    bgColor: "#E5F0FF",
  },
  "Electricity": {
    icon: "⚡",
    emoji: "⚡",
    color: "#FBBF24",
    bgColor: "#FEFCE8",
  },
  "EV Recharge": {
    icon: "🔌",
    emoji: "🔌",
    color: "#10B981",
    bgColor: "#E5F9F0",
  },
  "Fastag": {
    icon: "🛣️",
    emoji: "🛣️",
    color: "#8B5CF6",
    bgColor: "#F5E5FF",
  },
  "Fleet Card Recharge": {
    icon: "🚗",
    emoji: "🚗",
    color: "#6366F1",
    bgColor: "#EEF2FF",
  },
  "Gas": {
    icon: "🔥",
    emoji: "🔥",
    color: "#F97316",
    bgColor: "#FFEDE5",
  },
  "Housing Society": {
    icon: "🏢",
    emoji: "🏢",
    color: "#7C3AED",
    bgColor: "#F5E5FF",
  },
  "Insurance": {
    icon: "🛡️",
    emoji: "🛡️",
    color: "#0EA5E9",
    bgColor: "#E5F7FF",
  },
  "Landline Postpaid": {
    icon: "☎️",
    emoji: "☎️",
    color: "#EC4899",
    bgColor: "#FFE5F0",
  },
  "Loan Repayment": {
    icon: "💰",
    emoji: "💰",
    color: "#14B8A6",
    bgColor: "#E5FAF7",
  },
  "LPG Gas": {
    icon: "🔥",
    emoji: "🔥",
    color: "#F59E0B",
    bgColor: "#FEF3E5",
  },
  "Mobile Postpaid": {
    icon: "📱",
    emoji: "📱",
    color: "#3B82F6",
    bgColor: "#E5F0FF",
  },
  "Mobile Prepaid": {
    icon: "📲",
    emoji: "📲",
    color: "#06B6D4",
    bgColor: "#E5F9FB",
  },
  "Municipal Services": {
    icon: "🏛️",
    emoji: "🏛️",
    color: "#8B5CF6",
    bgColor: "#F5E5FF",
  },
  "Municipal Taxes": {
    icon: "🏛️",
    emoji: "🏛️",
    color: "#6366F1",
    bgColor: "#EEF2FF",
  },
  "National Pension System": {
    icon: "🏦",
    emoji: "🏦",
    color: "#059669",
    bgColor: "#E5F8F3",
  },
  "NCMC Recharge": {
    icon: "🎫",
    emoji: "🎫",
    color: "#D97706",
    bgColor: "#FEF6E5",
  },
  "Prepaid Meter": {
    icon: "⚡",
    emoji: "⚡",
    color: "#FBBF24",
    bgColor: "#FEFCE8",
  },
  "Recurring Deposit": {
    icon: "💵",
    emoji: "💵",
    color: "#10B981",
    bgColor: "#E5F9F0",
  },
  "Rental": {
    icon: "🏠",
    emoji: "🏠",
    color: "#F97316",
    bgColor: "#FFEDE5",
  },
  "Subscription": {
    icon: "📬",
    emoji: "📬",
    color: "#0EA5E9",
    bgColor: "#E5F7FF",
  },
  "Water": {
    icon: "💧",
    emoji: "💧",
    color: "#0891B2",
    bgColor: "#E5F9FC",
  },
};

// Helper function to get category details
export const getCategoryDetails = (categoryName) => {
  return (
    bbpsCategories[categoryName] || {
      icon: "💳",
      emoji: "💳",
      color: "#6B7280",
      bgColor: "#F3F4F6",
    }
  );
};

export default bbpsCategories;
