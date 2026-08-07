namespace sale.order;

using { managed } from '@sap/cds/common';
using { sale.order.Customers } from './Customers';
using { sale.order.OrderItems } from './OrderItems';

entity Orders : managed {
  key ID       : Integer;                                               // @title: Order ID 
  customer     : Association to Customers;     // @title: Customer
  orderDate    : Date;                                                  // @title: Order Date
  items        : Composition of OrderItems on items.order = $self;      // @title: Item
}