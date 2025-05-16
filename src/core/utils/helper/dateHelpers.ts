// utils/helper/dateHelpers.ts
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

// // In your controller / service where you build `historyCreates`:

// import { addMonths, addYears } from './utils/dateHelpers';

// const historyCreates = products.map((p) => {
//   const purchase = new Date(p.purchaseDate);
//   let renewalDate: Date;
//   let expiryDate: Date;

//   switch (p.renewPeriod) {
//     case 'monthly':
//       renewalDate = addMonths(purchase, 1);
//       expiryDate  = new Date(renewalDate);
//       expiryDate.setDate(expiryDate.getDate() - 1);
//       break;

//     case 'quarterly':
//       renewalDate = addMonths(purchase, 3);
//       expiryDate  = new Date(renewalDate);
//       expiryDate.setDate(expiryDate.getDate() - 1);
//       break;

//     case 'half_yearly':
//       renewalDate = addMonths(purchase, 6);
//       expiryDate  = new Date(renewalDate);
//       expiryDate.setDate(expiryDate.getDate() - 1);
//       break;

//     case 'yearly':
//       renewalDate = addYears(purchase, 1);
//       expiryDate  = new Date(renewalDate);
//       expiryDate.setDate(expiryDate.getDate() - 1);
//       break;

//     case 'custom':
//     default:
//       // For custom, trust the incoming values (if any)
//       renewalDate = p.renewalDate ? new Date(p.renewalDate) : undefined;
//       expiryDate  = p.expiryDate  ? new Date(p.expiryDate)  : undefined;
//       break;
//   }

//   return tx.customerProductHistory.create({
//     data: {
//       customerId:  customer.id,
//       adminId,
//       productId:   p.productDetailId,
//       purchaseDate: purchase,
//       status:      true,
//       renewPeriod: p.renewPeriod,
//       renewal:     p.renewal ?? false,
//       renewalDate,
//       expiryDate,
//     },
//   });
// });

// const history = await Promise.all(historyCreates);

