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
            this.getView().setModel(oUIModel, "ui");
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
            var oTable = this.byId("table");

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

        onResetInline: function () {
            var oModel = this.getView().getModel();
            if (oModel.hasPendingChanges()) {
                oModel.resetChanges();
                MessageToast.show("Changes reverted.");
            }
        },

        onDeleteCurrentOrder: function () {
            var oContext = this.getView().getBindingContext();

            if (!oContext) {
                MessageBox.error("No Order selected to delete!");
                return;
            }

            var sOrderId = oContext.getProperty("ID");
            var that = this; // Giữ tham chiếu tới Controller

            MessageBox.confirm("Are you sure you want to delete Sale Order " + sOrderId + "?", {
                title: "Confirm Delete",
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.OK && sAction !== "OK") {
                        return;
                    }

                    // Gọi hàm xóa dạng Promise
                    oContext.delete().then(function () {
                        MessageToast.show("Sale Order deleted successfully!");
                        that.getOwnerComponent().getRouter().navTo("RouteSaleorder", {}, true);
                    }).catch(function (oError) {
                        console.error("Delete Error:", oError);

                        if (oError.status === 404 || (oError.message && oError.message.includes("Not Found"))) {
                            MessageBox.warning("This order no longer exists on server. Returning to main page...", {
                                onClose: function () {
                                    that.getOwnerComponent().getRouter().navTo("RouteSaleorder", {}, true);
                                }
                            });
                        } else {
                            MessageBox.error("Delete failed: " + (oError.message || "Unknown error"));
                        }
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
                path: "/Orders(" + sOrderId + ")"
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