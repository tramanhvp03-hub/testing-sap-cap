namespace my.bookshop;
using { managed } from '@sap/cds/common';

entity Publishers : managed {
  key ID     : Integer;    @title: Publisher ID
  name       : String;     @title: Publisher Name
  address    : String;     @title: Publisher Address
}

