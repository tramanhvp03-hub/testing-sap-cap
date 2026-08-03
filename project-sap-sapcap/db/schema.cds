namespace my.bookshop;

// Bảng sách
entity Books {
  key ID     : Integer;
  title      : String;
  author    : Association to Authors;
  stock      : Integer;
}


entity Authors {
  key ID     : Integer;
  name       : String;
  country    : String;
}

