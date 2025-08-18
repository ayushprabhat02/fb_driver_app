// export const generateCSVData = (jsonData: any) => {
//   // const headers = Object.keys(data[0]); // Extract headers
//   // // const rows = data.map((obj: any) => {
//   // //   return headers
//   // //     .map((header: any) => {
//   // //       let field = obj[header];

//   // //       // Escape commas and double quotes by wrapping the field in double quotes and escaping inner quotes
//   // //       if (
//   // //         typeof field === 'string' &&
//   // //         (field.includes(',') || field.includes('"'))
//   // //       ) {
//   // //         field = `"${field.replace(/"/g, '""')}"`;
//   // //       }

//   // //       return field;
//   // //     })
//   // //     .join(',');
//   // // });
//   // const rows = data.map((obj: any) => {
//   //   return headers
//   //     .map((header: any) => {
//   //       let field = obj[header];

//   //       // Ensure the field is a string
//   //       if (typeof field === 'string') {
//   //         // Replace the Indian Rupee symbol with 'Rs'
//   //         field = field.replace(/₹/g, 'Rs');

//   //         // Properly handle other special characters (like comma, quotes)
//   //         if (field.includes(',') || field.includes('"')) {
//   //           // Escape commas and double quotes by wrapping the field in double quotes and escaping inner quotes
//   //           field = `"${field.replace(/"/g, '""')}"`;
//   //         }
//   //       }
//   //       return field;
//   //     })
//   //     .join(',');
//   // });
//   // return [headers.join(','), ...rows].join('\n');
//   // Sample data array (replace this with your actual data)
//   const data = [
//     {
//       product_variation_partner_localities_slot: {
//         start_time: '15:00:00+05:30',
//         end_time: '18:00:00+05:30',
//         day_date: '2024-09-19',
//       },
//       customer_order_item_stateflows: [
//         {id: 'cfaf8f94-619a-4205-88e6-afd0543c022f', state: 'CONFIRMED'},
//         {id: 'c39cd3f7-07f5-4cc0-ba88-672fdff580ce', state: 'ACCEPTED'},
//         {id: '26012091-7aa7-41bd-bce1-a6400ee39d73', state: 'ASSIGNED'},
//         {id: '94671ceb-d321-4df5-9a84-eaf02eeca850', state: 'DELIVERED'},
//       ],
//       id: '6cead152-ab80-48a8-9f11-26706809bc7e',
//       state: 'DELIVERED',
//       unit_price: 1,
//       actual_qty: 10,
//       actual_amount: 10,
//       customer_order: {
//         order_code: 248694,
//         state: 'DELIVERED',
//         erp_code: 'SO-CO-HSD-24-25-00127696',
//         customer_purchase_order_number: 'PO-00123',
//         order_date: '2024-09-19T12:41:18.608',
//       },
//       task: {
//         state: 'DELIVERED',
//         driver_vehicle: {
//           vehicle: {
//             name: 'FUELBUDDY_TEST_SUPPLIER',
//             registration_number: 'FUELBUDDY_TEST_SUPPLIER - DP',
//           },
//         },
//       },
//       invoices: [
//         {
//           delivery_fee_no_tax: 199,
//           discount_amount: 0,
//           amount: 236.82,
//           delivery_fee: '234.82',
//         },
//       ],
//       product_variation: {
//         variation: {
//           product_variations: [{price: '123', product: {name: 'Diesel'}}],
//         },
//       },
//     },
//     // Add more objects here
//   ];

//   // Function to convert JSON to CSV

//   // Convert the data to CSV format
//   const csvData = processJSONToCSV(data);

//   // Output the result (you can write it to a file or download as needed)
//   console.log(csvData);
//   return csvData;
// };

// function processJSONToCSV(jsonData: any) {
//   const csvRows = [];

//   // Headers
//   const headers = [
//     'Order Date',
//     'Delivery Date',
//     'ERP Code',
//     'App Code',
//     'Order Status',
//     'User Name',
//     'Shipping Address',
//     'Billing Address',
//     'Selected Slot',
//     'Ordered QTY',
//     'Delivered QTY',
//     'Net Total (without GST)',
//     'Delivery Charges',
//     'Discount',
//     'Total Amount',
//     'Purchase Order Code',
//   ];
//   csvRows.push(headers.join(','));

//   // Loop through each item and extract relevant fields
//   jsonData.forEach((item: any) => {
//     const orderDate = item.customer_order?.order_date;
//     const deliveryDate = item.actual_delivery_date;
//     const erpCode = item.customer_order?.erp_code;
//     const appCode = item.customer_order?.order_code;
//     const orderStatus = item.customer_order?.state;
//     const userName = `${
//       item.customer_order?.organization_user?.user?.first_name
//     } ${item.customer_order?.organization_user?.user?.last_name || ''}`;
//     const shippingAddress =
//       item.customer_order?.organizationAddressByShippingAddressId
//         ?.address_line1;
//     const billingAddress =
//       item.customer_order?.organization_address?.address_line1;
//     const selectedSlot = `${item.product_variation_partner_localities_slot?.start_time} - ${item.product_variation_partner_localities_slot?.end_time}`;
//     const orderedQty =
//       item.product_variation?.variation?.product_variations[0]?.price;
//     const deliveredQty = item.actual_qty;
//     const netTotal = item.invoices[0]?.delivery_fee_no_tax;
//     const deliveryCharges = item.invoices[0]?.delivery_fee;
//     const discount = item.invoices[0]?.discount_amount;
//     const totalAmount = item.invoices[0]?.amount;
//     const purchaseOrderCode =
//       item.customer_order?.customer_purchase_order_number;

//     // Combine all the extracted fields into a CSV row
//     const row = [
//       orderDate,
//       deliveryDate,
//       erpCode,
//       appCode,
//       orderStatus,
//       userName,
//       shippingAddress,
//       billingAddress,
//       selectedSlot,
//       orderedQty,
//       deliveredQty,
//       netTotal,
//       deliveryCharges,
//       discount,
//       totalAmount,
//       purchaseOrderCode,
//     ];
//     csvRows.push(row.join(','));
//   });

//   return csvRows.join('\n');
// }

// Sample data array (replace this with your actual data)
const data = [
  {
    product_variation_partner_localities_slot: {
      start_time: '15:00:00+05:30',
      end_time: '18:00:00+05:30',
      day_date: '2024-09-19',
    },
    customer_order_item_stateflows: [
      {id: 'cfaf8f94-619a-4205-88e6-afd0543c022f', state: 'CONFIRMED'},
      {id: 'c39cd3f7-07f5-4cc0-ba88-672fdff580ce', state: 'ACCEPTED'},
      {id: '26012091-7aa7-41bd-bce1-a6400ee39d73', state: 'ASSIGNED'},
      {id: '94671ceb-d321-4df5-9a84-eaf02eeca850', state: 'DELIVERED'},
    ],
    id: '6cead152-ab80-48a8-9f11-26706809bc7e',
    state: 'DELIVERED',
    unit_price: 1,
    actual_qty: 10,
    actual_amount: 10,
    customer_order: {
      order_code: 248694,
      state: 'DELIVERED',
      erp_code: 'SO-CO-HSD-24-25-00127696',
      customer_purchase_order_number: 'PO-00123',
      order_date: '2024-09-19T12:41:18.608',
    },
    task: {
      state: 'DELIVERED',
      driver_vehicle: {
        vehicle: {
          name: 'FUELBUDDY_TEST_SUPPLIER',
          registration_number: 'FUELBUDDY_TEST_SUPPLIER - DP',
        },
      },
    },
    invoices: [
      {
        delivery_fee_no_tax: 199,
        discount_amount: 0,
        amount: 236.82,
        delivery_fee: '234.82',
      },
    ],
    product_variation: {
      variation: {
        product_variations: [{price: '123', product: {name: 'Diesel'}}],
      },
    },
  },
  // Add more objects here
];

// Function to convert JSON to CSV
export function processJSONToCSV(jsonData: any) {
  const csvRows = [];

  // Headers
  const headers = [
    'Order Date',
    'Delivery Date',
    'ERP Code',
    'App Code',
    'Order Status',
    'User Name',
    'Shipping Address',
    'Billing Address',
    'Selected Slot',
    'Ordered QTY',
    'Delivered QTY',
    'Net Total (without GST)',
    'Delivery Charges',
    'Discount',
    'Total Amount',
    'Purchase Order Code',
  ];
  csvRows.push(headers.join(','));

  // Loop through each item and extract relevant fields
  jsonData.forEach(item => {
    const orderDate = item.customer_order?.order_date;
    const deliveryDate = item.actual_delivery_date;
    const erpCode = item.customer_order?.erp_code;
    const appCode = item.customer_order?.order_code;
    const orderStatus = item.customer_order?.state;
    const userName = `${
      item.customer_order?.organization_user?.user?.first_name
    } ${item.customer_order?.organization_user?.user?.last_name || ''}`;
    const shippingAddress =
      item.customer_order?.organizationAddressByShippingAddressId
        ?.address_line1;
    const billingAddress =
      item.customer_order?.organization_address?.address_line1;
    const selectedSlot = `${item.product_variation_partner_localities_slot?.start_time} - ${item.product_variation_partner_localities_slot?.end_time}`;
    const orderedQty =
      item.product_variation?.variation?.product_variations[0]?.price;
    const deliveredQty = item.actual_qty;
    const netTotal = item.invoices[0]?.delivery_fee_no_tax;
    const deliveryCharges = item.invoices[0]?.delivery_fee;
    const discount = item.invoices[0]?.discount_amount;
    const totalAmount = item.invoices[0]?.amount;
    const purchaseOrderCode =
      item.customer_order?.customer_purchase_order_number;

    // Combine all the extracted fields into a CSV row
    const row = [
      orderDate,
      deliveryDate,
      erpCode,
      appCode,
      orderStatus,
      userName,
      shippingAddress,
      billingAddress,
      selectedSlot,
      orderedQty,
      deliveredQty,
      netTotal,
      deliveryCharges,
      discount,
      totalAmount,
      purchaseOrderCode,
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

// Convert the data to CSV format
const csvData = processJSONToCSV(data);

// Output the result (you can write it to a file or download as needed)
console.log(csvData);
