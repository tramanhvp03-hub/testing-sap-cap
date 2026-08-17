sap.ui.define([
    'sap/ui/comp/library',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/type/String',
    'sap/m/ColumnListItem',
    'sap/m/Label',
    'sap/m/SearchField',
    'sap/m/Token',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/odata/v2/ODataModel',
    'sap/ui/table/Column',
    'sap/m/Column',
    'sap/m/Text',
    'sap/ui/comp/smartvariants/PersonalizableInfo',
    'sap/ui/core/UIComponent',
    'sap/ui/core/format/DateFormat',
    'sap/m/MessageBox',
    'sap/m/MessageToast',
    'sap/m/Dialog',
    'sap/m/Input',
    'sap/m/DatePicker',
    'sap/m/Title',
    'sap/m/Toolbar',
    'sap/m/ToolbarSpacer', 
    'sap/m/Button',
    'sap/m/Table',
    'sap/m/ComboBox',
    'sap/ui/core/ListItem'

], function (compLibrary, Controller, TypeString, ColumnListItem, Label, SearchField, Token, Filter, FilterOperator,
    ODataModel, UIColumn, MColumn, Text, PersonalizableInfo, UIComponent, DateFormat, MessageBox, MessageToast, Dialog, 
    Input, DatePicker, Title, Toolbar, ToolbarSpacer, Button, Table, ComboBox, ListItem) {
    "use strict";

    return Controller.extend("zsaleorder.controller.Saleorder", {

        onInit: function () {
            var oMultiInput, oMultiInputWithSuggestions;
            // Value Help Dialog standard use case with filter bar without filter suggestions
            oMultiInput = this.byId("multiInput");
            oMultiInput.addValidator(this._onMultiInputValidate);
            this._oMultiInput = oMultiInput;

            //Filterbar dynamicpage
            this.applyData = this.applyData.bind(this);
            this.fetchData = this.fetchData.bind(this);
            this.getFiltersWithValues = this.getFiltersWithValues.bind(this);

            this.oSmartVariantManagement = this.getView().byId("svm");
            this.oExpandedLabel = this.getView().byId("expandedLabel");
            this.oSnappedLabel = this.getView().byId("snappedLabel");
            this.oFilterBar = this.getView().byId("filterbar");
            this.oTable = this.getView().byId("table");

            this.oFilterBar.registerFetchData(this.fetchData);
            this.oFilterBar.registerApplyData(this.applyData);
            this.oFilterBar.registerGetFiltersWithValues(this.getFiltersWithValues);
            this.oFilterBar.attachSearch(this.onSearch, this);

            var oPersInfo = new PersonalizableInfo({
                type: "filterBar",
                keyName: "persistencyKey",
                dataSource: "",
                control: this.oFilterBar
            });
            this.oSmartVariantManagement.addPersonalizableControl(oPersInfo);
            this.oSmartVariantManagement.initialise(function () { }, this.oFilterBar);

        },

        onExit: function () {
            this.oSmartVariantManagement = null;
            this.oExpandedLabel = null;
            this.oSnappedLabel = null;
            this.oFilterBar = null;
            this.oTable = null;
        },

        fetchData: function () {
            var aData = this.oFilterBar.getAllFilterItems().reduce(function (aResult, oFilterItem) {
                aResult.push({
                    groupName: oFilterItem.getGroupName(),
                    fieldName: oFilterItem.getName(),
                    fieldData: oFilterItem.getControl().getSelectedKeys()
                });

                return aResult;
            }, []);

            return aData;
        },

        applyData: function (aData) {
            aData.forEach(function (oDataObject) {
                var oControl = this.oFilterBar.determineControlByName(oDataObject.fieldName, oDataObject.groupName);
                oControl.setSelectedKeys(oDataObject.fieldData);
            }, this);
        },

        getFiltersWithValues: function () {
            var aFiltersWithValue = this.oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
                var oControl = oFilterGroupItem.getControl();

                if (oControl && oControl.getSelectedKeys && oControl.getSelectedKeys().length > 0) {
                    aResult.push(oFilterGroupItem);
                }

                return aResult;
            }, []);

            return aFiltersWithValue;
        },

        onSelectionChange: function (oEvent) {
            this.oSmartVariantManagement.currentVariantSetModified(true);
            this.oFilterBar.fireFilterChange(oEvent);
        },

        onSearch: function () {
            var aTableFilters = this.oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
                var oControl = oFilterGroupItem.getControl();
                var aFilters = [];

                // MultiComboBox
                if (oControl.getSelectedKeys) {
                    oControl.getSelectedKeys().forEach(function (sKey) {
                        aFilters.push(new Filter({
                            path: "items/product_ID",
                            operator: FilterOperator.Contains,
                            value1: sKey
                        }));
                    });
                }

                // MultiInput
                else if (oControl.getTokens) {
                    oControl.getTokens().forEach(function (oToken) {
                        aFilters.push(new Filter({
                            path: "customer_ID",
                            operator: FilterOperator.Contains,
                            value1: oToken.getKey() || oToken.getText()
                        }));
                    });
                }

                // DatePicker
                else if (oControl.getDateValue) {
                    var oDate = oControl.getDateValue();
                    if (oDate) {
                        var year = oDate.getFullYear();
                        var month = String(oDate.getMonth() + 1).padStart(2, '0');
                        var day = String(oDate.getDate()).padStart(2, '0');
                        var sDate = year + "-" + month + "-" + day; // YYYY-MM-DD
                        aFilters.push(new Filter({
                            path: "orderDate",
                            operator: FilterOperator.EQ,
                            value1: sDate
                        }));
                    }
                }

                if (aFilters.length > 0) {
                    aResult.push(new Filter({
                        filters: aFilters,
                        and: false
                    }));
                }

                return aResult;
            }, []);

            this.oTable.getBinding("items").filter(aTableFilters);
            this.oTable.setShowOverlay(false);
        },

        onFilterChange: function () {
            this._updateLabelsAndTable();
        },

        onAfterVariantLoad: function () {
            this._updateLabelsAndTable();
        },

        getFormattedSummaryText: function () {
            var aFiltersWithValues = this.oFilterBar.retrieveFiltersWithValues();

            if (aFiltersWithValues.length === 0) {
                return "No filters active";
            }

            if (aFiltersWithValues.length === 1) {
                return aFiltersWithValues.length + " filter active: " + aFiltersWithValues.join(", ");
            }

            return aFiltersWithValues.length + " filters active: " + aFiltersWithValues.join(", ");
        },

        getFormattedSummaryTextExpanded: function () {
            var aFiltersWithValues = this.oFilterBar.retrieveFiltersWithValues();

            if (aFiltersWithValues.length === 0) {
                return "No filters active";
            }

            var sText = aFiltersWithValues.length + " filters active",
                aNonVisibleFiltersWithValues = this.oFilterBar.retrieveNonVisibleFiltersWithValues();

            if (aFiltersWithValues.length === 1) {
                sText = aFiltersWithValues.length + " filter active";
            }

            if (aNonVisibleFiltersWithValues && aNonVisibleFiltersWithValues.length > 0) {
                sText += " (" + aNonVisibleFiltersWithValues.length + " hidden)";
            }

            return sText;
        },

        onValueHelpRequested: function () {
            this._oBasicSearchField = new SearchField();
            this.loadFragment({
                name: "zsaleorder.fragment.ValueHelpDialogFilterbar"
            }).then(function (oDialog) {
                var oFilterBar = oDialog.getFilterBar(), oColumnCustomerID, oColumnCustomerName;
                this._oVHD = oDialog;
                oDialog.attachOk(this.onValueHelpOkPress, this);
                oDialog.attachCancel(this.onValueHelpCancelPress, this);
                oDialog.attachAfterClose(this.onValueHelpAfterClose, this);
                this.getView().addDependent(oDialog);

                // Set key fields for filtering in the Define Conditions Tab
                oDialog.setKey("ID");
                oDialog.setDescriptionKey("name");
                oDialog.setRangeKeyFields([{
                    label: "Customer",
                    key: "ID",
                    type: "string",
                    typeInstance: new TypeString({}, {
                        maxLength: 7
                    })
                }]);

                // Set Basic Search for FilterBar
                oFilterBar.setFilterBarExpanded(false);
                oFilterBar.setBasicSearch(this._oBasicSearchField);

                // Trigger filter bar search when the basic search is fired
                this._oBasicSearchField.attachSearch(function () {
                    oFilterBar.search();
                });

                oDialog.getTableAsync().then(function (oTable) {

                    oTable.setModel(this.getView().getModel());

                    // For Desktop and tabled the default table is sap.ui.table.Table
                    if (oTable.bindRows) {
                        // Bind rows to the ODataModel and add columns
                        oTable.bindAggregation("rows", {
                            path: "/Customers",
                            events: {
                                dataReceived: function () {
                                    oDialog.update();
                                }
                            }
                        });
                        oColumnCustomerID = new UIColumn({ label: new Label({ text: "Customer ID" }), template: new Text({ wrapping: false, text: "{ID}" }) });
                        oColumnCustomerID.data({
                            fieldName: "ID"
                        });
                        oColumnCustomerName = new UIColumn({ label: new Label({ text: "Customer Name" }), template: new Text({ wrapping: false, text: "{name}" }) });
                        oColumnCustomerName.data({
                            fieldName: "name"
                        });
                        oTable.addColumn(oColumnCustomerID);
                        oTable.addColumn(oColumnCustomerName);
                    }

                    // For Mobile the default table is sap.m.Table
                    if (oTable.bindItems) {
                        // Bind items to the ODataModel and add columns
                        oTable.bindAggregation("items", {
                            path: "/Customers",
                            template: new ColumnListItem({
                                cells: [new Label({ text: "{ID}" }), new Label({ text: "{name}" })]
                            }),
                            events: {
                                dataReceived: function () {
                                    oDialog.update();
                                }
                            }
                        });
                        oTable.addColumn(new MColumn({ header: new Label({ text: "Customer ID" }) }));
                        oTable.addColumn(new MColumn({ header: new Label({ text: "Customer Name" }) }));
                    }
                    oDialog.update();
                }.bind(this));

                oDialog.setTokens(this._oMultiInput.getTokens());
                oDialog.open();
            }.bind(this));
        },

        onFilterBarSearch: function (oEvent) {
            var sSearchQuery = this._oBasicSearchField.getValue(),
                aSelectionSet = oEvent.getParameter("selectionSet");

            var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
                if (oControl.getValue()) {
                    aResult.push(new Filter({
                        path: oControl.getName(),
                        operator: FilterOperator.Contains,
                        value1: oControl.getValue()
                    }));
                }

                return aResult;
            }, []);

            aFilters.push(new Filter({
                filters: [
                    new Filter({ path: "ID", operator: FilterOperator.Contains, value1: sSearchQuery }),
                    new Filter({ path: "name", operator: FilterOperator.Contains, value1: sSearchQuery })
                ],
                and: false
            }));

            this._filterTable(new Filter({
                filters: aFilters,
                and: true
            }));
        },

        onValueHelpOkPress: function (oEvent) {
            var aTokens = oEvent.getParameter("tokens");
            this._oMultiInput.setTokens(aTokens);
            this._oVHD.close();
        },

        onValueHelpCancelPress: function () {
            this._oVHD.close();
        },

        onValueHelpAfterClose: function () {
            this._oVHD.destroy();
        },

        onNavigate: function (oEvent) {
            var oButton = oEvent.getSource();              
            var oContext = oButton.getBindingContext();    
            var sOrderId = oContext.getProperty("ID");     

            this.getOwnerComponent().getRouter().navTo("RouteDetailpage", {
                OrderId: sOrderId
            });
        },

        onAdd: function () {
            if (!this._oAddDialog) {
                this._oAddDialog = new Dialog({
                    title: "New Sale Order",
                    contentWidth: "800px",
                    contentHeight: "500px",

                    content: [
                        new Label({ text: "Customer Name" }),
                        new Input("addCustomer"),

                        new Label({ text: "Order Date" }),
                        new DatePicker("addOrderDate", {
                            valueFormat: "dd-MM-yyyy"
                        }),

                        new Toolbar({
                            content: [
                                new Title({ text: "Product List" }),
                                new ToolbarSpacer(),
                                new Button({
                                    icon: "sap-icon://add",
                                    press: this.onAddProductRow.bind(this)
                                })
                            ]
                        }),

                        new Table("addProductsTable", {
                            columns: [
                                new Column({ header: new Text({ text: "Product" }) }),
                                new Column({ header: new Text({ text: "Quantity" }) }),
                                new Column({ header: new Text({ text: "Price" }) })
                            ]
                        })
                    ],

                    beginButton: new Button({
                        text: "Save",
                        type: "Emphasized",
                        press: this.onSaveSaleOrder.bind(this)
                    }),

                    endButton: new Button({
                        text: "Cancel",
                        press: function () {
                            this._oAddDialog.close();
                        }.bind(this)
                    })
                });

                this.getView().addDependent(this._oAddDialog);
            }

            this._oAddDialog.open();
        },

        onAddProductRow: function () {
            var oTable = sap.ui.getCore().byId("addProductsTable");

            oTable.addItem(new ColumnListItem({
                cells: [
                    new ComboBox({
                        placeholder: "Select Product Name",
                        items: {
                            path: "/Products",
                            template: new ListItem({
                                key: "{ID}",
                                text: "{name}",
                                additionalText: "{price}"
                            })
                        },
                        selectionChange: function (oEvent) {
                            var oComboBox = oEvent.getSource();
                            var oCtx = oComboBox.getSelectedItem().getBindingContext();
                            var oData = oCtx.getObject();

                            var oRow = oComboBox.getParent();
                            var aCells = oRow.getCells();
                            aCells[2].setValue(oData.price);
                        }.bind(this)
                    }),
                    new Input({ type: "Number", placeholder: "Quantity" }),
                    new Input({ type: "Number", placeholder: "Price" })
                ]
            }));
        },

        onSaveSaleOrder: function () {
            var oModel = this.getView().getModel();
            var sCustomer = sap.ui.getCore().byId("addCustomer").getValue();
            var oDate = sap.ui.getCore().byId("addOrderDate").getDateValue();

            // 1. Kiểm tra Customer và Order Date
            if (!sCustomer || !oDate) {
                MessageBox.warning("Customer name and Order date cannot be empty!");
                return;
            }

            // 2. Kiểm tra danh sách sản phẩm
            var oTable = sap.ui.getCore().byId("addProductsTable");
            var aItems = oTable.getItems();

            if (aItems.length === 0) {
                MessageBox.warning("Please add at least one product to the order!");
                return;
            }

            var aOrderItems = [];
            var bIsValid = true;

            // Duyệt qua từng dòng trong bảng để Validate
            for (var i = 0; i < aItems.length; i++) {
                var aCells = aItems[i].getCells();
                var sProductId = aCells[0].getSelectedKey();
                var sQtyValue = aCells[1].getValue().trim();
                var iQty = Number(sQtyValue);

                // Bắt buộc chọn Product
                if (!sProductId) {
                    MessageBox.warning("Please select a Product for row " + (i + 1) + "!");
                    bIsValid = false;
                    break;
                }

                // Bắt buộc nhập Quantity, phải là số hợp lệ và lớn hơn 0
                if (!sQtyValue || isNaN(iQty) || !Number.isInteger(iQty) || iQty <= 0) {
                    MessageBox.warning("Quantity in row " + (i + 1) + " must be a valid positive integer!");
                    bIsValid = false;
                    break;
                }

                aOrderItems.push({
                    product_ID: sProductId,
                    quantity: iQty
                });
            }

            // Nếu có dòng vi phạm thì dừng xử lý
            if (!bIsValid) {
                return;
            }

            var sDateISO = oDate.toISOString().split("T")[0];

            // Bước 1: Tạo Customer và tiếp tục lưu Order
            var oCustomersBinding = oModel.bindList("/Customers");
            var oCustContext = oCustomersBinding.create({
                name: sCustomer
            });

            oCustContext.created().then(function () {
                var oCustData = oCustContext.getObject();
                var sCustomerID = oCustData.ID;

                // Bước 2: Tạo Order cùng với items
                var oOrdersBinding = oModel.bindList("/Orders");
                var oOrderContext = oOrdersBinding.create({
                    ID: String(Date.now()),
                    customer_ID: String(sCustomerID),
                    orderDate: sDateISO,
                    items: aOrderItems
                });

                return oOrderContext.created();
            }).then(function () {
                MessageToast.show("Sale Order created successfully!");
                if (this._oAddDialog) {
                    this._oAddDialog.close();
                    this._oAddDialog.destroy();
                    this._oAddDialog = null;
                }
                var oMainTable = this.byId("table");
                if (oMainTable && oMainTable.getBinding("items")) {
                    oMainTable.getBinding("items").refresh();
                }
            }.bind(this)).catch(function (oError) {
                console.error("Save Error:", oError);
                MessageBox.error("Create Sale Order Failed: " + (oError.message || "Unknown error"));
            });
        },

        onDelete: function () {
            var oTable = this.byId("table");
            var aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length === 0) {
                MessageBox.warning("Select at least 1 row");
                return;
            }

            MessageBox.confirm("Are you sure delete selected row(s)?", {
                onClose: function (sAction) {
                    if (sAction !== "OK") {
                        return;
                    }

                    // Tạo mảng danh sách Promise xóa từng dòng
                    var aDeletePromises = aSelectedItems.map(function (oItem) {
                        var oContext = oItem.getBindingContext();
                        return oContext.delete(); // OData V4 dùng context.delete()
                    });

                    Promise.all(aDeletePromises).then(function () {
                        MessageToast.show("Sale Order(s) deleted successfully!");
                        oTable.removeSelections(true); 
                    }).catch(function (oError) {
                        console.error("Delete Error:", oError);
                        MessageBox.error("Delete Sale Order Failed: " + (oError.message || "Unknown error"));
                    });
                }
            });
        },

        formatCreatedAt: function (vValue) {
            if (!vValue) return "";
            var oDate = (vValue instanceof Date) ? vValue : new Date(vValue);
            if (isNaN(oDate.getTime())) return vValue;
            var dd = ("0" + oDate.getDate()).slice(-2);
            var mm = ("0" + (oDate.getMonth() + 1)).slice(-2);
            var yyyy = oDate.getFullYear();
            var h = oDate.getHours();
            var ampm = h >= 12 ? "pm" : "am";
            h = h % 12;
            h = h ? h : 12;
            var hh = ("0" + h).slice(-2);
            var min = ("0" + oDate.getMinutes()).slice(-2);
            return dd + "/" + mm + "/" + yyyy + " " + hh + ":" + min + ampm;
        },

        formatOrderDate: function (sDate) {
            if (!sDate) return "";
            var oDate = new Date(sDate); // parse chuỗi thành Date object
            var oDateFormat = DateFormat.getDateInstance({ pattern: "dd/MM/yyyy" });
            return oDateFormat.format(oDate);
        },

        _updateLabelsAndTable: function () {
            this.oExpandedLabel.setText(this.getFormattedSummaryTextExpanded());
            this.oSnappedLabel.setText(this.getFormattedSummaryText());
            this.oTable.setShowOverlay(true);
        },

        _filterTable: function (oFilter) {
            var oVHD = this._oVHD;

            oVHD.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    oTable.getBinding("rows").filter(oFilter);
                }
                if (oTable.bindItems) {
                    oTable.getBinding("items").filter(oFilter);
                }

                // This method must be called after binding update of the table.
                oVHD.update();
            });
        },

        _onRouteMatched: function () {
            var oTable = this.byId("table");
            if (oTable && oTable.getBinding("items")) {
                oTable.getBinding("items").refresh();
            }
        },
    });
});