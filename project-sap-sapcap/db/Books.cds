namespace my.bookshop;

using { my.bookshop.Authors } from './Authors';
using { my.bookshop.Publishers } from './Publishers';

entity Books {
  key ID     : Integer;
  title      : String;
  author    : Association to Authors;
  stock      : Integer;
  publisher : Association to Publishers;
}

