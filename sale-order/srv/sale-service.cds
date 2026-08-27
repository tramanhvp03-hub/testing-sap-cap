using sale.order as order;

service SaleService {
  entity Customers  as projection on order.Customers;
  entity Products   as projection on order.Products;
  @odata.draft.enabled
  entity Orders     as projection on order.Orders;
  entity OrderItems as projection on order.OrderItems;
}

// 1. KHAI BÁO SEARCH TỪ KHÓA ĐỦ CÚ PHÁP
annotate SaleService.Orders with @cds.search: {
  ID,
  customer.name
};

// 2. ĐẶT NHÃN & VALUE LIST CHO CÁC THUỘC TÍNH
annotate SaleService.Orders with {
  ID        @title: 'Order ID';
  orderDate @title: 'Order Date';
  customer  @title: 'Customer'
            @Common.ValueList: {
              CollectionPath: 'Customers',
              Parameters    : [
                {
                  $Type            : 'Common.ValueListParameterInOut',
                  LocalDataProperty: customer_ID,
                  ValueListProperty: 'ID'
                },
                {
                  $Type            : 'Common.ValueListParameterDisplayOnly',
                  ValueListProperty: 'name'
                }
              ]
            };
  items     @title: 'Order Items';
};

annotate SaleService.OrderItems with {
  product   @title: 'Product'
            @Common.ValueList: {
              CollectionPath: 'Products',
              Parameters    : [
                {
                  $Type            : 'Common.ValueListParameterInOut',
                  LocalDataProperty: product_ID,
                  ValueListProperty: 'ID'
                },
                {
                  $Type            : 'Common.ValueListParameterDisplayOnly',
                  ValueListProperty: 'name'
                }
              ]
            };
  quantity  @title: 'Quantity';
  amount    @title: 'Amount';
  createdAt @title: 'Created At';
};

// 3. CẤU HÌNH GIAO DIỆN MÀN HÌNH CHÍNH (ORDERS)
annotate SaleService.Orders with @(
  UI.HeaderInfo: {
    TypeName: 'Sale Order',
    TypeNamePlural: 'Sale Orders',
    Title: { Value: ID }
  },

  // Các cột hiển thị trên List Report
  UI.LineItem: [
    { Value: ID },
    { Value: orderDate },
    { Value: customer.name, Label: 'Customer Name' },
    { Value: createdAt, Label: 'Created At'}
  ],

  // Thanh lọc Filter Bar (Chỉ chọn 2 trường này)
  UI.SelectionFields: [ orderDate, customer ],

  UI.Facets: [
    {
      $Type: 'UI.ReferenceFacet',
      Label: 'General Information',
      Target: '@UI.FieldGroup#General'
    },
    {
      $Type: 'UI.ReferenceFacet',
      Label: 'Order Items',
      Target: 'items/@UI.LineItem'
    }
  ],

  UI.FieldGroup #General: {
    Data: [
      { Value: orderDate },
      { Value: customer_ID }
    ]
  }
);

// 4. CẤU HÌNH BẢNG CON (ORDER ITEMS)
annotate SaleService.OrderItems with @(
  UI.LineItem: [
    { Value: product.ID, Label: 'Product ID' },
    { Value: product.name, Label: 'Product Name' },
    { Value: quantity },
    { Value: product.price, Label: 'Price' },
    { Value: amount },
    { Value: createdAt }
  ]
);