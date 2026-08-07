using sale.order as order;

service SaleService {
  entity Customers  as projection on order.Customers;
  entity Products   as projection on order.Products;
  entity Orders     as projection on order.Orders;
  entity OrderItems as projection on order.OrderItems;
}