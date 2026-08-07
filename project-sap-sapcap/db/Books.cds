namespace my.bookshop;

using { managed } from '@sap/cds/common';
using { my.bookshop.Authors } from './Authors';
using { my.bookshop.Publishers } from './Publishers';

entity Books : managed {
  key ID     : Integer;                    @title: Book's_ID 
  title      : String;                     @title: Book's_Title 
  author    : Association to Authors;      @title: Book's_Author
  stock      : Integer;                    @title: Book's_Stock 
  publisher : Association to Publishers;   @title: Book's_Publisher
}

