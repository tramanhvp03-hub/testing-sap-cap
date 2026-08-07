const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
  
  // Import entities defined in CDS models
  const { Orders, OrderItems, Customers } = this.entities;

  // BEFORE handler for CREATE on Orders
  // req: the request object containing input data from the client
  this.before('CREATE', Orders, async (req) => {
    const customerId = req.data.customer_ID; // parameter from payload
    const exists = await SELECT.one.from(Customers).where({ ID: customerId });
    if (!exists) {
      req.error(400, `Customer with ID ${customerId} does not exist`);
    }
  });

  // AFTER handler for READ on Orders
  // orders: the result set returned from the database
  // req: the request object (not used here, but available)
  this.after('READ', Orders, async (orders, req) => {
    if (!Array.isArray(orders)) orders = [orders]; // normalize to array
    for (const order of orders) {
      // Query related OrderItems by foreign key order_ID
      const items = await SELECT.from(OrderItems).where({ order_ID: order.ID });
      // Add a calculated property totalAmount to each order
      order.totalAmount = items.reduce((sum, i) => sum + i.amount, 0);
    }
  });

  // Custom action handler: cancelOrder
  // req: the request object, req.data contains parameters passed by the client
  this.on('cancelOrder', async (req) => {
    const { ID } = req.data; // parameter from client request
    const order = await SELECT.one.from(Orders).where({ ID });
    if (!order) return req.error(404, `Order ${ID} not found`);
    
    // Delete all related OrderItems first
    await DELETE.from(OrderItems).where({ order_ID: ID });
    // Then delete the Order itself
    await DELETE.from(Orders).where({ ID });
    return { message: `Order ${ID} cancelled successfully` };
  });

});
