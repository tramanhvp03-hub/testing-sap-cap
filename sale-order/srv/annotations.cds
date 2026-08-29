using SaleService from './sale-service'; 

// 1. SEARCH CONFIGURATION
annotate SaleService.Orders with @cds.search: {
    ID,
    customer.name
};

// 2. LABELS & VALUE LISTS
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
              @Common.Text: product.name 
              @Common.TextArrangement: #TextFirst
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
                  },
                  {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'price'
                  }
                ]
              };
    quantity  @title: 'Quantity';
    amount    @title: 'Amount';
    createdAt @title: 'Created At';
};

// 3. UI LAYOUT FOR ORDERS
annotate SaleService.Orders with @(
    UI.HeaderInfo: {
        TypeName: 'Sale Order',
        TypeNamePlural: 'Sale Orders',
        Title: { Value: ID }
    },
    UI.LineItem: [
        { Value: ID },
        { Value: orderDate },
        { Value: customer.name, Label: 'Customer Name' },
        { Value: createdAt, Label: 'Created At'}
    ],
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
            { Value: customer.name, Label: 'Customer Name'}
        ]
    }
);

// 4. UI LAYOUT FOR ORDER ITEMS
annotate SaleService.OrderItems with @(
    UI.LineItem: [
        { Value: product_ID, Label: 'Product ID' },
        { Value: quantity },
        { Value: product.price, Label: 'Price' },
        { Value: amount },
        { Value: createdAt }
    ]
);