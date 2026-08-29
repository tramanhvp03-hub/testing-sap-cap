sap.ui.define([
    'sap/m/MessageToast',
    'sap/ui/core/mvc/Controller',
    'sap/ui/core/routing/History',
    'sap/m/MessageBox',
    'sap/ui/model/json/JSONModel',
    "zsaleorder/model/formatter"
], function (MessageToast, Controller, History, MessageBox, JSONModel, formatter) {
    "use strict";

    var PageController = Controller.extend("zsaleorder.controller.Detailpage", {
        formatter: formatter,

        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteDetailpage").attachPatternMatched(this._onObjectMatched, this);
           
            var oUIModel = new JSONModel({
                editable: false
            });

            this.getOwnerComponent().setModel(oUIModel, "ui");
        },

        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteSaleorder", {}, true);
            }
        },

        onPress: function (evt) {
            MessageToast.show(evt.getSource().getId() + " Pressed");
        },

        onEdit: function () {
            this.getView().getModel("ui").setProperty("/editable", true);
        },

        onCancelPress: function () {
            var oModel = this.getView().getModel();

            if (oModel.hasPendingChanges()) {
                oModel.resetChanges();
            }

            this.getView().getModel("ui").setProperty("/editable", false);
        },

        onSaveInline: function () {
            var oModel = this.getView().getModel();
            var oUIModel = this.getView().getModel("ui");

            if (oModel.hasPendingChanges("myUpdateGroup")) {
                // Submit toàn bộ thay đổi trong batch group mặc định ($auto)
                oModel.submitBatch("myUpdateGroup").then(function () {
                    MessageToast.show("Changes saved successfully!");
                    oUIModel.setProperty("/editable", false);

                    // Rebind lại element để cập nhật lại dữ liệu mới nhất từ server
                    this.getView().getElementBinding().refresh();
                }.bind(this)).catch(function (oError) {
                    console.error("Save Error:", oError);
                    MessageBox.error("Failed to save changes: " + (oError.message || "Unknown error"));
                });
            } else {
                MessageToast.show("No changes detected.");
                oUIModel.setProperty("/editable", false);
            }
        },

        onResetInline: function () {
            var oModel = this.getView().getModel();
            if (oModel.hasPendingChanges()) {
                oModel.resetChanges();
                MessageToast.show("Changes reverted.");
            }
        },

        onDeleteItem: function (oEvent) {
            // 1. Lấy context của đúng dòng vừa bấm nút thùng rác
            var oButton = oEvent.getSource();
            var oItemContext = oButton.getBindingContext();

            if (!oItemContext) {
                MessageBox.warning("No item to delete!");
                return;
            }

            var that = this;
            var sProductName = oItemContext.getProperty("product/name") ;

            MessageBox.confirm("Do you want to delete item " + sProductName + "?", {
                title: "Delete Confirm",
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.OK && sAction !== "OK") {
                        return;
                    }

                    // 2. Thực hiện xóa dòng item hiện tại
                    oItemContext.delete("$auto").then(function () {
                        MessageToast.show("Deleted successfully!");

                        // Refresh lại binding của View để cập nhật lại Header/Total Amount
                        that.getView().getModel().refresh();
                    }).catch(function (oError) {
                        console.error("Delete Error:", oError);
                        MessageBox.error("Delete failed: " + (oError.message || "Error"));
                    });
                }
            });
        },

        _onObjectMatched: function (oEvent) {
            var sOrderId = oEvent.getParameter("arguments").OrderId;

            if (!sOrderId) {
                return;
            }

            // Bind dữ liệu Order vào View
            this.getView().bindElement({
                path: "/Orders(" + sOrderId + ")",
                parameters: {
                    $expand: "customer,items($expand=product)"
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
        }
    });

    return PageController;
});