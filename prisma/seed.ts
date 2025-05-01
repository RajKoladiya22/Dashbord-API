// /**
//  * Prisma Seed Script
//  * This script populates all tables with sample data.
//  * Run with: `npx prisma db seed`
//  */
// import {
//   PrismaClient,
//   Role,
//   OfferType,
//   SubscriptionStatus,
// } from "@prisma/client";
// import bcrypt from "bcrypt";

// const prisma = new PrismaClient();

// async function main() {
//   // Hash passwords
//   const password = "P@ssw0rd!";
//   const hash = await bcrypt.hash(password, 10);

//   // 1. Admins
//   const admin1 = await prisma.admin.create({
//     data: {
//       firstName: "Alice",
//       lastName: "Anderson",
//       email: "alice@example.com",
//       passwordHash: hash,
//       companyName: "Alice Co",
//       address: { street: "123 Main St", city: "Metropolis" },
//       contactInfo: { phone: "123-456-7890" },
//       planStatus: "free trial",
//     },
//   });

//   // 2. Team Members
//   const tm1 = await prisma.teamMember.create({
//     data: {
//       adminId: admin1.id,
//       firstName: "Bob",
//       lastName: "Builder",
//       email: "bob@example.com",
//       passwordHash: hash,
//       department: "Support",
//       position: "Agent",
//       status: "active",
//       contactInfo: { phone: "234-567-8901" },
//     },
//   });

//   // 3. Partners
//   const partner1 = await prisma.partner.create({
//     data: {
//       adminId: admin1.id,
//       companyName: "Partner Co",
//       firstName: "Charlie",
//       lastName: "Chaplin",
//       email: "charlie@partner.com",
//       passwordHash: hash,
//       status: "active",
//       contactInfo: { phone: "345-678-9012" },
//     },
//   });

//   // 4. Login Credentials
//   await prisma.loginCredential.createMany({
//     data: [
//       {
//         role: Role.admin,
//         email: admin1.email,
//         passwordHash: hash,
//         userProfileId: admin1.id,
//       },
//       {
//         role: Role.team_member,
//         email: tm1.email,
//         passwordHash: hash,
//         userProfileId: tm1.id,
//         adminId: admin1.id,
//       },
//       {
//         role: Role.partner,
//         email: partner1.email,
//         passwordHash: hash,
//         userProfileId: partner1.id,
//         adminId: admin1.id,
//       },
//     ],
//   });

//   // 5. Plans and related
//   const planBasic = await prisma.plan.create({
//     data: { name: "Basic", duration: "30 days", price: 9.99 },
//   });
//   await prisma.planOffer.create({
//     data: {
//       planId: planBasic.id,
//       offerType: OfferType.free_trial,
//       value: 0,
//       startsAt: new Date(),
//       endsAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
//     },
//   });
//   await prisma.planSpec.create({
//     data: { planId: planBasic.id, specName: "Users", specValue: "5" },
//   });
//   await prisma.planDescription.create({
//     data: { planId: planBasic.id, content: "Basic plan with 5 users." },
//   });

//   // 6. Subscription
//   const sub1 = await prisma.subscription.create({
//     data: {
//       adminId: admin1.id,
//       planId: planBasic.id,
//       status: SubscriptionStatus.free_trial,
//       startsAt: new Date(),
//       endsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
//     },
//   });
//   await prisma.subscriptionPayment.create({
//     data: {
//       subscriptionId: sub1.id,
//       amount: 0,
//       currency: "USD",
//       paidAt: new Date(),
//       status: "paid",
//     },
//   });
//   await prisma.subscriptionEvent.create({
//     data: {
//       subscriptionId: sub1.id,
//       eventType: "free_trial_started",
//       eventAt: new Date(),
//     },
//   });

//   // 7. Products
//   const product1 = await prisma.product.create({
//     data: {
//       productName: "USB Mini Chopper",
//       productCategory: { category: "Kitchen" },
//       productPrice: "29.99",
//       description: "Portable USB-powered chopper.",
//       tags: ["kitchen", "gadget"],
//       specifications: { power: "5W" },
//       adminId: admin1.id,
//     },
//   });

//   // 8. Customer & history
//   const customer1 = await prisma.customer.create({
//     data: {
//       adminId: admin1.id,
//       companyName: "CustCo",
//       contactPerson: "Dana",
//       mobileNumber: "456-789-0123",
//       email: "dana@custco.com",
//       serialNo: "SN123",
//       prime: false,
//       adminCustomFields: { key: 'value' },
//       referenceDetail: { ref: 'ABC123' },
//     },
//   });
//   await prisma.customerProductHistory.create({
//     data: {
//       customerId: customer1.id,
//       adminId: admin1.id,
//       productId: product1.id,
//       purchaseDate: new Date(),
//       renewal: false,
//       expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000),
//     },
//   });

//   // 9. Admin Custom Fields
//   await prisma.adminCustomField.create({
//     data: {
//       adminId: admin1.id,
//       fieldName: "ReferralCode",
//       fieldType: "string",
//       isRequired: false,
//       options: [],
//       isMultiSelect: false,
//     },
//   });

//   console.log("🌱 Database seeded successfully");
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });


/**
 * Prisma Seed Script
 * This script populates all tables with sample data, relying on DB triggers to auto-create login credentials.
 * Run with: `npx prisma db seed`
 */
import {
  PrismaClient,
  Role,
  OfferType,
  SubscriptionStatus,
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Hash a shared password for all seeded users
  const rawPassword = "P@ssw0rd!";
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  // 1. Create Plans and related entities
  const planBasic = await prisma.plan.create({
    data: { name: "Basic", duration: "30 days", price: 9.99 },
  });

  await prisma.planOffer.create({
    data: {
      planId: planBasic.id,
      offerType: OfferType.free_trial,
      value: 0,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    },
  });

  await prisma.planSpec.create({
    data: {
      planId: planBasic.id,
      specName: "Users",
      specValue: "5",
    },
  });

  await prisma.planDescription.create({
    data: {
      planId: planBasic.id,
      content: "Basic plan with up to 5 users and free 7-day trial.",
    },
  });

  // 2. Seed an Admin (loginCredential auto-created via trigger)
  const admin1 = await prisma.admin.create({
    data: {
      firstName: "Alice",
      lastName: "Anderson",
      email: "alice@example.com",
      passwordHash,
      companyName: "Alice Co",
      address: { street: "123 Main St", city: "Metropolis" },
      contactInfo: { phone: "123-456-7890" },
      status: "active",
      role: Role.admin,
    },
  });

  // 3. Seed Team Member (loginCredential auto-created via trigger)
  const tm1 = await prisma.teamMember.create({
    data: {
      adminId: admin1.id,
      firstName: "Bob",
      lastName: "Builder",
      email: "bob@example.com",
      passwordHash,
      department: "Support",
      position: "Agent",
      status: "active",
      contactInfo: { phone: "234-567-8901" },
    },
  });

  // 4. Seed Partner (loginCredential auto-created via trigger)
  const partner1 = await prisma.partner.create({
    data: {
      adminId: admin1.id,
      companyName: "Partner Co",
      firstName: "Charlie",
      lastName: "Chaplin",
      email: "charlie@partner.com",
      passwordHash,
      status: "active",
      contactInfo: { phone: "345-678-9012" },
    },
  });

  // 5. Seed Subscription for Admin1
  const sub1 = await prisma.subscription.create({
    data: {
      adminId: admin1.id,
      planId: planBasic.id,
      status: SubscriptionStatus.free_trial,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
  });

  // 6. Seed Subscription Payment & Event
  await prisma.subscriptionPayment.create({
    data: {
      subscriptionId: sub1.id,
      amount: 0,
      currency: "USD",
      paidAt: new Date(),
      status: "paid",
    },
  });

  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId: sub1.id,
      eventType: "free_trial_started",
      eventAt: new Date(),
    },
  });

  // 7. Seed a Product
  const product1 = await prisma.product.create({
    data: {
      productName: "USB Mini Chopper",
      productCategory: { category: "Kitchen" },
      productPrice: "29.99",
      description: "Portable USB-powered chopper.",
      tags: ["kitchen", "gadget"],
      specifications: { power: "5W" },
      adminId: admin1.id,
    },
  });

  // 8. Seed a Customer and Purchase History
  const customer1 = await prisma.customer.create({
    data: {
      adminId: admin1.id,
      companyName: "CustCo",
      contactPerson: "Dana",
      mobileNumber: "456-789-0123",
      email: "dana@custco.com",
      serialNo: "SN123",
      prime: false,
      adminCustomFields: {},
      referenceDetail: {},
    },
  });

  await prisma.customerProductHistory.create({
    data: {
      customerId: customer1.id,
      adminId: admin1.id,
      productId: product1.id,
      purchaseDate: new Date(),
      renewal: false,
      expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000),
    },
  });

  // 9. Seed an Admin Custom Field
  await prisma.adminCustomField.create({
    data: {
      adminId: admin1.id,
      fieldName: "ReferralCode",
      fieldType: "string",
      isRequired: false,
      options: [],
      isMultiSelect: false,
    },
  });

  console.log("🌱 Database seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
