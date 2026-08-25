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
    'sap/m/MessageBox',
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

        onCreate: function () {
            // 1. Khoi tao JSONModel voi du lieu trong
            var oCreateModel = new sap.ui.model.json.JSONModel({
                customerName: "",
                orderDate: "",
                items: []
            });
            this.getView().setModel(oCreateModel, "createModel");

            // 2. Load Dialog Fragment
            if (!this._oAddDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "zsaleordersapm.view.fragment.CreateOrder", // Thay đúng Namespace của bạn
                    controller: this
                }).then(function (oDialog) {
                    this._oAddDialog = oDialog;
                    this.getView().addDependent(this._oAddDialog); // BẮT BUỘC có dòng này
                    this._oAddDialog.open();
                }.bind(this));
            } else {
                this._oAddDialog.open();
            }
        },
        // 2. Thêm 1 dòng rỗng vào Table
        onAddProductRow: function () {
            var oCreateModel = this.getView().getModel("createModel");
            var aItems = oCreateModel.getProperty("/items");

            aItems.push({
                product_ID: "",
                quantity: 1,
                price: 0
            });

            oCreateModel.setProperty("/items", aItems);
        },

        // Xử lý TỰ ĐỘNG ĐIỀN PRICE khi chọn Product
        onProductChange: function (oEvent) {
            var oComboBox = oEvent.getSource();
            var oSelectedItem = oComboBox.getSelectedItem();
            var oCreateModel = this.getView().getModel("createModel");

            // Lấy Context binding của dòng hiện tại trong createModel
            var oBindingContext = oComboBox.getBindingContext("createModel");

            if (!oBindingContext) {
                return;
            }

            if (oSelectedItem) {
                // Lấy dữ liệu OData thật từ item được chọn
                var oProductData = oSelectedItem.getBindingContext().getObject();
                var fPrice = oProductData ? (oProductData.price || 0) : 0;

                // Cập nhật giá trực tiếp vào JSONModel tạm
                oCreateModel.setProperty(oBindingContext.getPath() + "/price", fPrice);
            } else {
                // Reset về 0 nếu bỏ chọn
                oCreateModel.setProperty(oBindingContext.getPath() + "/price", 0);
            }
        },

        // Hàm xóa dòng trong Dialog
        onDeleteProductRow: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext("createModel");

            if (oContext) {
                var sPath = oContext.getPath();
                var iIndex = parseInt(sPath.split("/").pop(), 10);

                var oCreateModel = this.getView().getModel("createModel");
                var aItems = oCreateModel.getProperty("/items");

                aItems.splice(iIndex, 1);
                oCreateModel.setProperty("/items", aItems);
            }
        },

        // 5. Đóng Dialog
        onCloseAddDialog: function () {
            this.byId("addSaleOrderDialog").close();
        },

        onSaveSaleOrder: function () {
            var oModel = this.getView().getModel();
            var oCustomerInput = this.byId("addCustomer");
            var oDatePicker = this.byId("addOrderDate");
            var oTable = this.byId("addProductsTable");

            var sCustomer = oCustomerInput ? oCustomerInput.getValue().trim() : "";
            var sOrderDate = oDatePicker ? oDatePicker.getValue() : "";

            if (!sCustomer || !sOrderDate) {
                MessageBox.warning("Customer name and Order date cannot be empty!");
                return;
            }

            var aItems = oTable ? oTable.getItems() : [];
            if (aItems.length === 0) {
                MessageBox.warning("Please add at least one product!");
                return;
            }

            var aOrderItems = [];
            for (var i = 0; i < aItems.length; i++) {
                var aCells = aItems[i].getCells();
                var sProductId = aCells[0].getSelectedKey();
                var iQty = Number(aCells[1].getValue().trim());

                if (!sProductId || iQty <= 0) {
                    MessageBox.warning("Please check product and quantity at row " + (i + 1));
                    return;
                }
                aOrderItems.push({ product_ID: String(sProductId), quantity: iQty });
            }

            sap.ui.core.BusyIndicator.show(0);

            // BƯỚC 1: TẠO CUSTOMER
            var oCustomersBinding = oModel.bindList("/Customers", null, null, null, { $$groupId: "$auto" });
            var oCustContext = oCustomersBinding.create({
                ID: String(Date.now()),
                name: sCustomer
            });

            // Chờ Customer tạo xong
            oCustContext.created().then(function () {
                var sCustomerID = oCustContext.getProperty("ID");

                // BƯỚC 2: TẠO ORDER (Dùng $$groupId: "$auto" để kích hoạt POST luôn)
                var oOrdersBinding = oModel.bindList("/Orders", null, null, null, { $$groupId: "$auto" });
                var oOrderContext = oOrdersBinding.create({
                    ID: String(Date.now() + 1),
                    customer_ID: String(sCustomerID),
                    orderDate: sOrderDate,
                    items: aOrderItems
                });

                return oOrderContext.created();
            }.bind(this)).then(function () {
                sap.ui.core.BusyIndicator.hide();
                MessageToast.show("Sale Order created successfully!");

                this.onCloseAddDialog();
                this._onRefresh();

            }.bind(this)).catch(function (oError) {
                sap.ui.core.BusyIndicator.hide();
                console.error("Save Error:", oError);
                MessageBox.error("Create Failed: " + (oError.message || "Backend Error"));
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

            // Ép Input mất focus để ăn dữ liệu vào Model
            if (document.activeElement) {
                document.activeElement.blur();
            }
            sap.ui.getCore().applyChanges();

            // Kiểm tra pending changes trên group cụ thể hoặc toàn model
            if (oModel.hasPendingChanges("myUpdateGroup")) {
                // Chỉ gửi Batch request cho group thủ công
                oModel.submitBatch("myUpdateGroup").then(function () {
                    MessageToast.show("Changes saved successfully!");
                    oUIModel.setProperty("/editable", false);
                    this._onRefresh();
                }.bind(this)).catch(function (oError) {
                    console.error("Save Error:", oError);
                    MessageBox.error("Failed to save changes: " + (oError.message || "Unknown error"));
                });
            } else {
                MessageToast.show("No changes to save.");
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

        onRefreshpress: function () {
            this._onRefresh();
            MessageToast.show("Data is refreshed");
        },

        onPopinLayoutChanged: function () {
            var PopinLayout = mobileLibrary.PopinLayout;
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

        _onRefresh: function () {
            var oModel = this.getView().getModel();
            if (oModel) {
                // Refresh lại dữ liệu OData V4
                var aTableIds = ["idProductsTable", "idProductsTable1", "idProductsTable2"];

                aTableIds.forEach(function (sId) {
                    var oTable = this.byId(sId);
                    if (oTable) {
                        var oBinding = oTable.getBinding("items");
                        // Kiểm tra binding tồn tại và đang ở trạng thái sẵn sàng
                        if (oBinding && typeof oBinding.refresh === "function") {
                            oBinding.refresh();
                        }
                    }
                }.bind(this));
            }
        }
    });
    return TableController;
});