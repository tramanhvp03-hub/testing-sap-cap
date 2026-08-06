namespace sale.order;

using { managed } from '@sap/cds/common';

entity Customers : managed {
  key ID   : Integer;    // @title: Customer ID 
  name     : String;     // @title: Customer Name
  email    : String;     // @title: Customer Email 
}