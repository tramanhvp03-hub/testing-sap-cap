sap.ui.define([
    'sap/m/MessageToast',
    'sap/ui/core/mvc/Controller',
    'sap/ui/core/routing/History'],
    function (MessageToast, Controller, History) {
        "use strict";

        var PageController = Controller.extend("zsaleorder.controller.Detailpage", {
            onInit: function () {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("RouteDetailpage").attachPatternMatched(this._onObjectMatched, this);
            },

            onNavBack: function () {
                var oHistory = sap.ui.core.routing.History.getInstance();
                var sPreviousHash = oHistory.getPreviousHash();

                if (sPreviousHash !== undefined) {
                    // Quay lại trang trước trong browser history
                    window.history.go(-1);
                } else {
                    // Nếu không có history, điều hướng về route mặc định
                    var oRouter = this.getOwnerComponent().getRouter();
                    oRouter.navTo("RouteSaleorder", {}, true);
                }
            },

            _onObjectMatched: function (oEvent) {
                var sOrderId = oEvent.getParameter("arguments").OrderId;
                // Bind dữ liệu vào view
                this.getView().bindElement({
                    path: "/Orders(" + sOrderId + ")"
                });

                // // Nếu chỉ muốn set title thủ công:
                // this.byId("_IDGenTitle").setText("Order ID: " + sOrderId);
            },

            onPress: function (evt) {
                MessageToast.show(evt.getSource().getId() + " Pressed");
            },

        
        });

        return PageController;

    });
