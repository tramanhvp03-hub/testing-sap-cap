namespace my.bookshop;

using { managed } from '@sap/cds/common';
using { my.bookshop.Authors } from './Authors';
using { my.bookshop.Publishers } from './Publishers';

entity Books : managed {
  key ID     : Integer;                   // @title: Book ID 
  title      : String;                    // @title: Book Title 
  author    : Association to Authors;     // @title: Author
  stock      : Integer;                   // @title: Stock 
  publisher : Association to Publishers;  // @title: Publisher
}

