sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/m/MessageToast',
    "sap/ui/core/Fragment",
    'sap/m/MessageBox',
], function (Controller, JSONModel, MessageToast, Fragment,  MessageBox
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
            var oCreateModel = new JSONModel({
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
            var oCreateModel = this.getView().getModel("createModel");
            var oData = oCreateModel ? oCreateModel.getData() : {};

            var sCustomerName = oData.customerName ? oData.customerName.trim() : "";
            var sOrderDate = oData.orderDate || "";
            var aItems = oData.items || [];

            if (!sCustomerName || !sOrderDate) {
                sap.m.MessageBox.warning("Please fill in Customer Name and Order Date!");
                return;
            }

            if (aItems.length === 0) {
                sap.m.MessageBox.warning("Please add at least one product!");
                return;
            }

            var aPayloadItems = [];
            for (var i = 0; i < aItems.length; i++) {
                var item = aItems[i];
                if (!item.product_ID || !item.quantity || Number(item.quantity) <= 0) {
                    sap.m.MessageBox.warning("Please select product and valid quantity at row " + (i + 1));
                    return;
                }
                aPayloadItems.push({
                    product_ID: String(item.product_ID),
                    quantity: Number(item.quantity)
                });
            }

            sap.ui.core.BusyIndicator.show(0);
            var oMainModel = this.getView().getModel();

            // 1. Tạo Customer trong group mặc định
            var oCustBinding = oMainModel.bindList("/Customers");
            var oCustContext = oCustBinding.create({
                name: sCustomerName
            });

            // 2. Gọi submitBatch để ÉP OData V4 gửi ngay request lên Server
            oMainModel.submitBatch("mySaveGroup").then(function () {
                var sCustomerID = oCustContext.getProperty("ID");

                if (!sCustomerID) {
                    throw new Error("Cannot get Customer ID from server response");
                }

                // 3. Sau khi có ID Customer, tiếp tục tạo Order và Items
                var oOrderBinding = oMainModel.bindList("/Orders");
                var oOrderContext = oOrderBinding.create({
                    customer_ID: sCustomerID,
                    orderDate: sOrderDate,
                    items: aPayloadItems
                });

                // Submit tiếp lượt 2 cho Order
                return oMainModel.submitBatch("mySaveGroup");
            }.bind(this)).then(function () {
                sap.ui.core.BusyIndicator.hide();
                sap.m.MessageToast.show("Sale Order created successfully!");

                this.onCloseAddDialog();

                if (this._oCreateModel) {
                    this._oCreateModel.setData({
                        customerName: "",
                        orderDate: "",
                        items: [{ product_ID: "", quantity: 1, price: "" }]
                    });
                }

                // Gọi hàm load lại dữ liệu Table
                this._onRefresh();
            }.bind(this))
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
            if (oModel.hasPendingChanges("mySaveGroup")) {
                // Chỉ gửi Batch request cho group thủ công
                oModel.submitBatch("mySaveGroup").then(function () {
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
            // 1. Refresh Model tổng OData V4 (Bắt buộc để đồng bộ lại cache)
            var oMainModel = this.getView().getModel();
            if (oMainModel && typeof oMainModel.refresh === "function") {
                oMainModel.refresh();
            }

            // 2. Refresh từng Binding của Table
            var aTableIds = ["idProductsTable", "idProductsTable1", "idProductsTable2"];
            aTableIds.forEach(function (sId) {
                var oTable = this.byId(sId);
                if (oTable) {
                    var oBinding = oTable.getBinding("items");
                    if (oBinding && typeof oBinding.refresh === "function") {
                        oBinding.refresh();
                    }
                }
            }.bind(this));
        },
    });
    return TableController;
});