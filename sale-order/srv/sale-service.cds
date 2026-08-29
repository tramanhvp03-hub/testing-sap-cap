using { sale.order.Customers as saleCustomers } from '../db/Customers';
using { sale.order.Products as saleProducts } from '../db/Products';
using { sale.order.Orders as saleOrders } from '../db/Orders';
using { sale.order.OrderItems as saleOrderItems } from '../db/OrderItems';

service SaleService @(requires: 'authenticated-user') {
  entity Customers  as projection on saleCustomers;
  entity Products @(requires: 'Manager') as projection on saleProducts;
  entity Orders @(requires: 'Admin') as projection on saleOrders;
  entity OrderItems as projection on saleOrderItems;
}
