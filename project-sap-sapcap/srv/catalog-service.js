const cds = require('@sap/cds');

module.exports = cds.service.impl(function () {
  this.before('UPDATE', 'Books', (req) => {
    if (req.data.stock < 0) {
      req.error(400, 'Stock cannot be negative');
    }
  });

  this.before('CREATE', 'Books', (req) => {
  if (req.data.stock < 0) {
    req.error(400, 'Stock cannot be negative');
  }
});

  this.on('increaseStock', async (req) => {
    const { ID, amount } = req.data;

    // Lấy entity Books
    const { Books } = this.entities;

    // Đọc sách theo ID
    const book = await SELECT.one.from(Books).where({ ID });
    if (!book) return req.error(404, `Book with ID ${ID} not found`);

    // Cập nhật stock
    const newStock = book.stock + amount;
    await UPDATE(Books).set({ stock: newStock }).where({ ID });

    return newStock;
  });

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
