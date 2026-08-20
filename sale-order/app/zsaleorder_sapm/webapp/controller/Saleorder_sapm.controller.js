sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/m/MessageToast',
    'sap/m/library',
    "sap/ui/core/Fragment",
    'sap/m/Label',
    'sap/m/Input',
    'sap/m/Column',
    'sap/m/DatePicker',
    'sap/m/Title',
    'sap/m/Toolbar',
    'sap/m/ToolbarSpacer',
    'sap/m/Button',
    'sap/m/Table',
    'sap/m/ComboBox',
    'sap/ui/core/ListItem',
    'sap/m/ColumnListItem',
    'sap/m/Dialog',
    'sap/m/Text',
    'sap/m/MessageBox'
], function (Controller, JSONModel, MessageToast, mobileLibrary, Fragment, Label, Input, MColumn, DatePicker,
    Title, Toolbar, ToolbarSpacer, Button, Table, ComboBox, ListItem, ColumnListItem, Dialog, Text, MessageBox
) {
    "use strict";

    var TableController = Controller.extend("zsaleordersapm.controller.Saleorder_sapm", {

        onInit: function () {
             var oUIModel = new JSONModel({
                editable: false
            });
            this.getView().setModel(oUIModel, "ui");
        },

        onCreateOrder: function () {
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
                                new MColumn({ header: new Text({ text: "Product" }) }),
                                new MColumn({ header: new Text({ text: "Quantity" }) }),
                                new MColumn({ header: new Text({ text: "Price" }) })
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
                MessageBox.warning("Customer name and Order date can not be empty!");
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
                var oMainTable1 = this.byId("idProductsTable");
                var oMainTable2 = this.byId("idProductsTable1");
                if (oMainTable1 && oMainTable1.getBinding("items")) {
                    oMainTable1.getBinding("items").refresh();
                }
                if (oMainTable2 && oMainTable2.getBinding("items")) {
                    oMainTable2.getBinding("items").refresh();
                }
            }.bind(this)).catch(function (oError) {
                console.error("Save Error:", oError);
                MessageBox.error("Create Sale Order Failed: " + (oError.message || "Unknown error"));
            });
        },

        onDelete: function () {
            var oTable = this.byId("idProductsTable");
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

        onEdit: function () {
            this.getView().getModel("ui").setProperty("/editable", true);
        },

          onSave: function () {
            var oModel = this.getView().getModel();
            var oUIModel = this.getView().getModel("ui");
            var oTable = this.byId("idProductsTable");

            if (oModel.hasPendingChanges()) {
                oModel.submitBatch("$auto").then(function () {
                    MessageToast.show("Changes saved successfully!");
                    oUIModel.setProperty("/editable", false);

                    if (oTable && oTable.getBinding("items")) {
                        oTable.getBinding("items").refresh();
                    }
                }.bind(this)).catch(function (oError) {
                    console.error("Save Error:", oError);
                    MessageBox.error("Failed to save changes: " + (oError.message || "Unknown error"));
                });
            } else {
                MessageToast.show("No changes detected.");
                oUIModel.setProperty("/editable", false);
            }
        },

        onCancel: function () {
            var oModel = this.getView().getModel();

            if (oModel.hasPendingChanges()) {
                oModel.resetChanges();
            }

            this.getView().getModel("ui").setProperty("/editable", false);
        },

        onPopinLayoutChanged: function () {
            var oTable = this.byId("idProductsTable");
            var oComboBox = this.byId("idPopinLayout");
            var sPopinLayout = oComboBox.getSelectedKey();
            switch (sPopinLayout) {
                case "Block":
                    oTable.setPopinLayout(PopinLayout.Block);
                    break;
                case "GridLarge":
                    oTable.setPopinLayout(PopinLayout.GridLarge);
                    break;
                case "GridSmall":
                    oTable.setPopinLayout(PopinLayout.GridSmall);
                    break;
                default:
                    oTable.setPopinLayout(PopinLayout.Block);
                    break;
            }
        },

        onSelect: function (oEvent) {
            var bSelected = oEvent.getParameter("selected"),
                sText = oEvent.getSource().getText(),
                oTable = this.byId("idProductsTable"),
                aSticky = oTable.getSticky() || [];

            if (bSelected) {
                aSticky.push(sText);
            } else if (aSticky.length) {
                var iElementIndex = aSticky.indexOf(sText);
                aSticky.splice(iElementIndex, 1);
            }

            oTable.setSticky(aSticky);
        },

        onToggleInfoToolbar: function (oEvent) {
            var oTable = this.byId("idProductsTable");
            oTable.getInfoToolbar().setVisible(!oEvent.getParameter("pressed"));
        },

        onRefresh: function () {
            var oTable = this.byId("idProductsTable");
            oTable.getBinding("items").refresh();
            MessageToast.show("Data is refreshed");
        }
    });

    return TableController;

});