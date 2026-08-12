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

                 var oModel = new sap.ui.model.odata.v4.ODataModel({
        serviceUrl: "/odata/v4/sale/"
    });
    this.getView().setModel(oModel);
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

          onAdd: function () {
    var oView = this.getView();

    if (!this._oAddDialog) {
        this._oAddDialog = new sap.m.Dialog({
            title: "Add Order",
            contentWidth: "500px",
            content: [
                new sap.m.VBox({
                    width: "100%",
                    items: [
                        new sap.m.Label({ text: "Product Name" }),
                        new sap.m.ComboBox("productCombo", {
                            width: "100%", 
                            placeholder: "Select product",
                            items: {
                                path: "/Products",
                                template: new sap.ui.core.Item({
                                    key: "{ID}",
                                    text: "{name}"
                                })
                            }
                        }),

                        new sap.m.Label({ text: "Price" }),
                        new sap.m.Input("priceInput", {
                            width: "100%",
                            type: "Number",
                            placeholder: "Enter price"
                        }),

                        new sap.m.Label({ text: "Quantity" }),
                        new sap.m.Input("quantityInput", {
                            width: "100%",
                            type: "Number",
                            placeholder: "Enter quantity"
                        })
                    ]
                }).addStyleClass("sapUiContentPadding") // thêm padding để không chạm viền dialog
            ],
            beginButton: new sap.m.Button({
                text: "Save",
                type: "Emphasized",
                press: function () {
                    var sProductId = sap.ui.getCore().byId("productCombo").getSelectedKey();
                    var sPrice = sap.ui.getCore().byId("priceInput").getValue();
                    var sQuantity = sap.ui.getCore().byId("quantityInput").getValue();

                    var oPayload = {
                        product_ID: sProductId,
                        price: parseFloat(sPrice),
                        quantity: parseInt(sQuantity, 10)
                    };

                    var oModel = oView.getModel();
                    oModel.create("/Orders", oPayload, {
                        success: function () {
                            sap.m.MessageToast.show("Order created successfully!");
                        },
                        error: function () {
                            sap.m.MessageToast.show("Error creating order!");
                        }
                    });

                    this._oAddDialog.close();
                }.bind(this)
            }),
            endButton: new sap.m.Button({
                text: "Cancel",
                press: function () {
                    this._oAddDialog.close();
                }.bind(this)
            })
        });

        oView.addDependent(this._oAddDialog);
    }

    this._oAddDialog.open();
}

        });

        return PageController;

    });
