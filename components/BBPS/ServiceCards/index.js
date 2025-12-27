// Service Card Components - Export all card types
export { default as CreditCardItem } from "./CreditCardItem";
export { default as FasTagItem } from "./FasTagItem";
export { default as DefaultBillerItem } from "./DefaultBillerItem";

// Utility Bills
export { 
  ElectricityBillItem, 
  WaterBillItem, 
  GasBillItem,
  LPGBillItem 
} from "./UtilityBillItems";

// Finance
export { 
  InsuranceItem, 
  LoanItem, 
  RecurringDepositItem,
  EducationItem 
} from "./FinanceItems";

// Entertainment
export { 
  DTHItem, 
  BroadbandItem, 
  CableTVItem,
  SubscriptionItem 
} from "./EntertainmentItems";

// Other Billers
export { 
  MobilePostpaidItem, 
  LandlineItem, 
  HousingSocietyItem,
  MunicipalItem,
  RentalItem,
  ClubsItem 
} from "./DefaultBillerItem";

// Endpoint to Component mapping
export const getServiceCardComponent = (endpoint) => {
  const componentMap = {
    // Credit Card
    "Credit Card": "CreditCardItem",
    
    // Vehicle
    "Fastag": "FasTagItem",
    
    // Utilities
    "Electricity": "ElectricityBillItem",
    "Prepaid Meter": "ElectricityBillItem",
    "Water": "WaterBillItem",
    "Gas": "GasBillItem",
    "LPG Gas": "LPGBillItem",
    
    // Finance
    "Insurance": "InsuranceItem",
    "Loan Repayment": "LoanItem",
    "Recurring Deposit": "RecurringDepositItem",
    "Education Fees": "EducationItem",
    "National Pension System": "EducationItem",
    
    // Entertainment
    "DTH": "DTHItem",
    "Broadband Postpaid": "BroadbandItem",
    "Cable TV": "CableTVItem",
    "Subscription": "SubscriptionItem",
    
    // Telecom
    "Mobile Postpaid": "MobilePostpaidItem",
    "Landline Postpaid": "LandlineItem",
    
    // Housing
    "Housing Society": "HousingSocietyItem",
    "Housing society": "HousingSocietyItem",
    "Municipal Taxes": "MunicipalItem",
    "Municipal Services": "MunicipalItem",
    "Rental": "RentalItem",
    "Clubs and Associations": "ClubsItem",
  };
  
  return componentMap[endpoint] || "DefaultBillerItem";
};
