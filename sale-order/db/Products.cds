namespace sale.order;

using { managed } from '@sap/cds/common';

entity Products : managed {
  key ID   : Integer;
  name     : String;
  price    : Decimal(9,2);
  stock    : Integer;
}