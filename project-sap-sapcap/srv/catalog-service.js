const cds = require('@sap/cds');

module.exports = cds.service.impl(function () {
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
});
