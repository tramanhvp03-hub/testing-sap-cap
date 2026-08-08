namespace sale.order;

using { managed } from '@sap/cds/common';
using { sale.order.Orders } from './Orders';
using { sale.order.Products } from './Products';

entity OrderItems : managed {
  key ID       : Integer;                     @title: OrderItem ID
  order        : Association to Orders;       @title: Order
  product      : Association to Products;     @title: Product
  quantity     : Integer;                     @title: Quantity 
  amount        : Decimal(9,2);               @title: Amount
}