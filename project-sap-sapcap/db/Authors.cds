namespace my.bookshop;
using { managed } from '@sap/cds/common';
entity Authors :managed {
  key ID     : Integer;  // @title: Author ID 
  name       : String;   // @title: Author's Name 
  country    : String;   // @title: Author's Country 
}
