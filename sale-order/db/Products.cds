namespace sale.order;

using { managed } from '@sap/cds/common';

entity Products : managed {
  key ID   : Integer;           @title: Product ID
  name     : String;            @title: Product Name
  price    : Decimal(9,2);      @title: Price
  stock    : Integer;           @title: Stock
}