#  SAP CAP Bookshop Project

### How to run the project:
1. Install dependencies:
   ```bash
   npm install
2. Run the application:

    ```bash
    cds w

    The service will be exposed at:

    http://localhost:4004/odata/v4/catalog/Books
    http://localhost:4004/odata/v4/catalog/Authors
    http://localhost:4004/odata/v4/catalog/Publishers

### Entities:

Authors.cds
```bash
entity Authors {
    key ID     : Integer;
    name       : String;
    country    : String;
}

ID: Integer (Primary Key)
name: String
country: String
```

Publishers.cds
```bash
Publishers
cds
entity Publishers {
    key ID     : Integer;
    name       : String;
    address    : String;
}

ID: Integer (Primary Key)
name: String
address: String
```

Books.cds
```bash
entity Books {
    key ID       : Integer;
    title        : String;
    stock        : Integer;
    author       : Association to Authors;
    publisher    : Association to Publishers;
}

ID: Integer (Primary Key)
title: String
stock: Integer
author: Association → Authors
publisher: Association → Publishers
```

### Relationships between Entities
1. One Author can write many Books.
2. One Publisher can publish many Books.
3. The Books entity has associations to both Authors and Publishers.

### Available APIs
```bash
# Books
GET /odata/v4/catalog/Books → Get all Books

GET /odata/v4/catalog/Books(ID) → Get Book details by ID

POST /odata/v4/catalog/Books → Create a new Book

PUT /odata/v4/catalog/Books(ID) → Update entire Book by ID

PATCH /odata/v4/catalog/Books(ID) → Partially update Book by ID

DELETE /odata/v4/catalog/Books(ID) → Delete Book by ID

# Authors
GET /odata/v4/catalog/Authors → Get all Authors

GET /odata/v4/catalog/Authors(ID) → Get Author details by ID

POST /odata/v4/catalog/Authors → Create a new Author

PUT /odata/v4/catalog/Authors(ID) → Update entire Author by ID

PATCH /odata/v4/catalog/Authors(ID) → Partially update Author by ID

DELETE /odata/v4/catalog/Authors(ID) → Delete Author by ID

# Publishers
GET /odata/v4/catalog/Publishers → Get all Publishers

GET /odata/v4/catalog/Publishers(ID) → Get Publisher details by ID

POST /odata/v4/catalog/Publishers → Create a new Publisher

PUT /odata/v4/catalog/Publishers(ID) → Update entire Publisher by ID

PATCH /odata/v4/catalog/Publishers(ID) → Partially update Publisher by ID

DELETE /odata/v4/catalog/Publishers(ID) → Delete Publisher by ID
```

### Custom Action
```bash
action increaseStock(ID: Integer, amount: Integer) returns Integer;
Endpoint: POST /odata/v4/catalog/increaseStock

Input:

ID (Book ID)
amount (quantity to increase)
Output: new stock value of the Book
```

### Supported Query Options
```bash
Filter: /odata/v4/catalog/Books?$filter=stock gt 10
Sort: /odata/v4/catalog/Books?$orderby=title asc
Select: /odata/v4/catalog/Books?$select=ID,title
Expand: /odata/v4/catalog/Books?$expand=author,publisher
```