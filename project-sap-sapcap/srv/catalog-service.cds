using my.bookshop as bookshop;

service CatalogService {
    entity Books      as projection on bookshop.Books;
    entity Authors    as projection on bookshop.Authors;
    entity Publishers as projection on bookshop.Publishers;

    action increaseStock(ID: Integer, amount: Integer) returns Integer;
}
