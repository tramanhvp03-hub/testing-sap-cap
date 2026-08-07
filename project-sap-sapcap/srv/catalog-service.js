const cds = require('@sap/cds');

module.exports = cds.service.impl(function () {

  // Before hook for UPDATE on Books,  Reject negative stock values
  // Parameter: req → request object containing data being updated
  this.before('UPDATE', 'Books', (req) => {
    if (req.data.stock < 0) {
      req.error(400, 'Stock cannot be negative'); // Reject invalid stock values
    }
  });

  // Before hook for CREATE on Books, Reject negative stock values
  // Parameter: req → request object containing data being created
  this.before('CREATE', 'Books', (req) => {
    if (req.data.stock < 0) {
      req.error(400, 'Stock cannot be negative');
    }
  });

  // Custom action: increaseStock
  // Parameters: req → request object with { ID, amount }
  this.on('increaseStock', async (req) => {
    const { ID, amount } = req.data; 
    const { Books } = this.entities;
    const book = await SELECT.one.from(Books).where({ ID });
    if (!book) return req.error(404, `Book with ID ${ID} not found`);
    const newStock = book.stock + amount;
    await UPDATE(Books).set({ stock: newStock }).where({ ID });
    return newStock;
  });

  // Custom action: decreaseStock
  // Parameters: req → request object with { ID, amount }
  this.on('decreaseStock', async (req) => {
    const { ID, amount } = req.data; 
    const book = await SELECT.one.from('Books').where({ ID });
    if (!book) return req.error(404, 'Can not find Book');
    const newStock = book.stock - amount;
    if (newStock < 0) return req.error(400, 'Stock insufficience');
    await UPDATE('Books').set({ stock: newStock }).where({ ID });
    return newStock; 
  });

});
