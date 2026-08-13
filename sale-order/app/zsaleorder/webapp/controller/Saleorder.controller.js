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
    'sap/ui/core/format/DateFormat'
], function (compLibrary, Controller, TypeString, ColumnListItem, Label, SearchField, Token, Filter, FilterOperator,
    ODataModel, UIColumn, MColumn, Text, PersonalizableInfo, UIComponen, DateFormat) {
    "use strict";

    return Controller.extend("zsaleorder.controller.Saleorder", {

        onInit: function () {
            // defensive guards and debug
            try {
                console.log("Saleorder controller onInit start");

                // MultiInput validator guard
                var oMultiInput = this.byId("multiInput");
                if (oMultiInput && typeof this._onMultiInputValidate === "function") {
                    oMultiInput.addValidator(this._onMultiInputValidate.bind(this));
                    this._oMultiInput = oMultiInput;
                } else {
                    console.warn("multiInput or _onMultiInputValidate missing");
                }

                // Filterbar dynamicpage
                this.applyData = this.applyData.bind(this);
                this.fetchData = this.fetchData.bind(this);
                this.getFiltersWithValues = this.getFiltersWithValues.bind(this);

                this.oSmartVariantManagement = this.getView().byId("svm");
                this.oExpandedLabel = this.getView().byId("expandedLabel");
                this.oSnappedLabel = this.getView().byId("snappedLabel");
                this.oFilterBar = this.getView().byId("filterbar");
                this.oTable = this.getView().byId("table");

                if (this.oFilterBar) {
                    this.oFilterBar.registerFetchData(this.fetchData);
                    this.oFilterBar.registerApplyData(this.applyData);
                    this.oFilterBar.registerGetFiltersWithValues(this.getFiltersWithValues);
                    this.oFilterBar.attachSearch(this.onSearch, this);
                } else {
                    console.warn("FilterBar not found by id 'filterbar'");
                }

                var oPersInfo = new PersonalizableInfo({
                    type: "filterBar",
                    keyName: "persistencyKey",
                    dataSource: "",
                    control: this.oFilterBar
                });
                if (this.oSmartVariantManagement) {
                    this.oSmartVariantManagement.addPersonalizableControl(oPersInfo);
                    this.oSmartVariantManagement.initialise(function () { }, this.oFilterBar);
                }

                // JSONModel tạm cho dialog new order
                this._oNewOrderModel = new sap.ui.model.json.JSONModel({
                    productID: "",
                    price: 0,
                    quantity: 1
                });
                this.getView().setModel(this._oNewOrderModel, "newOrder");

                console.log("Saleorder controller onInit completed");
            } catch (e) {
                console.error("onInit error:", e);
            }
        },

        onExit: function () {
            this.oSmartVariantManagement = null;
            this.oExpandedLabel = null;
            this.oSnappedLabel = null;
            this.oFilterBar = null;
            this.oTable = null;
            if (this._oNewOrderDialog && !this._oNewOrderDialog.bIsDestroyed) {
                this._oNewOrderDialog.destroy();
                this._oNewOrderDialog = null;
            }
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
                if (oControl && oControl.setSelectedKeys) {
                    oControl.setSelectedKeys(oDataObject.fieldData);
                }
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
            if (this.oSmartVariantManagement) {
                this.oSmartVariantManagement.currentVariantSetModified(true);
            }
            if (this.oFilterBar) {
                this.oFilterBar.fireFilterChange(oEvent);
            }
        },

        onSearch: function () {
            if (!this.oFilterBar || !this.oTable) return;
            var aTableFilters = this.oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
                var oControl = oFilterGroupItem.getControl();
                var aFilters = [];

                // MultiComboBox
                if (oControl && oControl.getSelectedKeys) {
                    oControl.getSelectedKeys().forEach(function (sKey) {
                        aFilters.push(new Filter({
                            path: "items/product_ID",
                            operator: FilterOperator.Contains,
                            value1: sKey
                        }));
                    });
                }
                // MultiInput
                else if (oControl && oControl.getTokens) {
                    oControl.getTokens().forEach(function (oToken) {
                        aFilters.push(new Filter({
                            path: "customer_ID",
                            operator: FilterOperator.Contains,
                            value1: oToken.getKey() || oToken.getText()
                        }));
                    });
                }
                // DatePicker
                else if (oControl && oControl.getDateValue) {
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

            var oBinding = this.oTable.getBinding("items");
            if (oBinding) {
                oBinding.filter(aTableFilters);
            }
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
            if (!aFiltersWithValues || aFiltersWithValues.length === 0) {
                return "No filters active";
            }
            if (aFiltersWithValues.length === 1) {
                return aFiltersWithValues.length + " filter active: " + aFiltersWithValues.join(", ");
            }
            return aFiltersWithValues.length + " filters active: " + aFiltersWithValues.join(", ");
        },

        getFormattedSummaryTextExpanded: function () {
            var aFiltersWithValues = this.oFilterBar.retrieveFiltersWithValues();
            if (!aFiltersWithValues || aFiltersWithValues.length === 0) {
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

        // Value Help Dialog (unchanged)
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

                oDialog.setKey("ID");
                oDialog.setDescriptionKey("name");
                oDialog.setRangeKeyFields([{
                    label: "Customer",
                    key: "ID",
                    type: "string",
                    typeInstance: new TypeString({}, { maxLength: 7 })
                }]);

                oFilterBar.setFilterBarExpanded(false);
                oFilterBar.setBasicSearch(this._oBasicSearchField);
                this._oBasicSearchField.attachSearch(function () { oFilterBar.search(); });

                oDialog.getTableAsync().then(function (oTable) {
                    oTable.setModel(this.getView().getModel());
                    if (oTable.bindRows) {
                        oTable.bindAggregation("rows", {
                            path: "/Customers",
                            events: { dataReceived: function () { oDialog.update(); } }
                        });
                        oColumnCustomerID = new UIColumn({ label: new Label({ text: "Customer ID" }), template: new Text({ wrapping: false, text: "{ID}" }) });
                        oColumnCustomerID.data({ fieldName: "ID" });
                        oColumnCustomerName = new UIColumn({ label: new Label({ text: "Customer Name" }), template: new Text({ wrapping: false, text: "{name}" }) });
                        oColumnCustomerName.data({ fieldName: "name" });
                        oTable.addColumn(oColumnCustomerID);
                        oTable.addColumn(oColumnCustomerName);
                    }
                    if (oTable.bindItems) {
                        oTable.bindAggregation("items", {
                            path: "/Customers",
                            template: new ColumnListItem({ cells: [new Label({ text: "{ID}" }), new Label({ text: "{name}" })] }),
                            events: { dataReceived: function () { oDialog.update(); } }
                        });
                        oTable.addColumn(new MColumn({ header: new Label({ text: "Customer ID" }) }));
                        oTable.addColumn(new MColumn({ header: new Label({ text: "Customer Name" }) }));
                    }
                    oDialog.update();
                }.bind(this));

                oDialog.setTokens(this._oMultiInput ? this._oMultiInput.getTokens() : []);
                oDialog.open();
            }.bind(this)).catch(function (e) {
                console.error("ValueHelpRequested error:", e);
            });
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

            this._filterTable(new Filter({ filters: aFilters, and: true }));
        },

        onValueHelpOkPress: function (oEvent) {
            var aTokens = oEvent.getParameter("tokens");
            if (this._oMultiInput) {
                this._oMultiInput.setTokens(aTokens);
            }
            this._oVHD.close();
        },

        onValueHelpCancelPress: function () {
            if (this._oVHD) this._oVHD.close();
        },

        onValueHelpAfterClose: function () {
            if (this._oVHD) {
                this._oVHD.destroy();
                this._oVHD = null;
            }
        },

        onNavigate: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext();
            var sOrderId = oContext ? oContext.getProperty("ID") : null;
            if (sOrderId) {
                this.getOwnerComponent().getRouter().navTo("RouteDetailpage", { OrderId: sOrderId });
            }
        },

        /* ---------- New Order: full safe implementation ---------- */

        onAdd: function () {
            try {
                console.log("onAdd called");
                if (!this._oNewOrderDialog || this._oNewOrderDialog.bIsDestroyed) {
                    this._createNewOrderDialog();
                }
                this._resetNewOrderDialog();
                this._oNewOrderDialog.open();
            } catch (e) {
                console.error("onAdd error:", e);
                sap.m.MessageToast.show("Không thể mở dialog. Kiểm tra console.");
            }
        },

        _createNewOrderDialog: function () {
            var oView = this.getView();
            if (this._oNewOrderDialog && !this._oNewOrderDialog.bIsDestroyed) {
                return;
            }

            // Controls
            var oProductCombo = new sap.m.ComboBox({
                id: oView.createId("newOrderProductCombo"),
                width: "100%",
                placeholder: "Select product",
                selectionChange: this.onProductSelectionChange.bind(this)
            });

            var oPriceInput = new sap.m.Input({
                id: oView.createId("newOrderPriceInput"),
                width: "100%",
                value: "{newOrder>/price}",
                editable: false
            });

            var oQtyInput = new sap.m.Input({
                id: oView.createId("newOrderQuantityInput"),
                width: "100%",
                value: "{newOrder>/quantity}",
                type: "Number"
            });

            // Dialog
            this._oNewOrderDialog = new sap.m.Dialog({
                title: "New Order",
                contentWidth: "420px",
                content: [new sap.m.VBox({
                    width: "100%",
                    items: [
                        new sap.m.Label({ text: "Product" }), oProductCombo,
                        new sap.m.Label({ text: "Price" }), oPriceInput,
                        new sap.m.Label({ text: "Quantity" }), oQtyInput
                    ]
                }).addStyleClass("sapUiContentPadding")],
                beginButton: new sap.m.Button({
                    text: "Save",
                    type: "Emphasized",
                    press: this.onSaveNewOrder.bind(this)
                }),
                endButton: new sap.m.Button({
                    text: "Cancel",
                    press: function () { this._oNewOrderDialog.close(); }.bind(this)
                }),
                afterClose: function () {
                    // keep dialog instance to reuse; destroy if you prefer
                }.bind(this)
            });

            oView.addDependent(this._oNewOrderDialog);

            // cache refs
            this._oNewOrderProductCombo = oProductCombo;
            this._oNewOrderPriceInput = oPriceInput;
            this._oNewOrderQuantityInput = oQtyInput;

            // Bind items: prefer named model "ui", fallback to default model, fallback to fetch
            var oComponent = this.getOwnerComponent();
            var oUiModel = oComponent && oComponent.getModel("ui");
            var oDefaultModel = oComponent && oComponent.getModel();

            if (oUiModel) {
                this._oNewOrderDialog.setModel(oUiModel, "ui");
                oProductCombo.bindItems({
                    path: "ui>/Products",
                    template: new sap.ui.core.Item({ key: "{ui>ID}", text: "{ui>name}" })
                });
            } else if (oDefaultModel) {
                this._oNewOrderDialog.setModel(oDefaultModel);
                oProductCombo.bindItems({
                    path: "/Products",
                    template: new sap.ui.core.Item({ key: "{ID}", text: "{name}" })
                });
            } else {
                // fallback: fetch products and populate combo manually
                fetch("/odata/v4/sale/Products")
                    .then(function (res) { return res.ok ? res.json() : Promise.reject(res.status); })
                    .then(function (json) {
                        var a = json.value || [];
                        a.forEach(function (p) {
                            oProductCombo.addItem(new sap.ui.core.Item({ key: String(p.ID), text: p.name + (p.price ? " — " + p.price : "") }));
                        });
                    }).catch(function (err) {
                        console.warn("Load products failed", err);
                    });
            }
        },

        _resetNewOrderDialog: function () {
            if (!this._oNewOrderDialog) return;
            try {
                // reset JSON model values
                var oNewModel = this.getView().getModel("newOrder");
                if (oNewModel) {
                    oNewModel.setProperty("/productID", "");
                    oNewModel.setProperty("/price", 0);
                    oNewModel.setProperty("/quantity", 1);
                }
                if (this._oNewOrderProductCombo) {
                    this._oNewOrderProductCombo.setSelectedKey("");
                }
            } catch (e) {
                console.warn("reset dialog error:", e);
            }
        },

        onProductSelectionChange: function (oEvent) {
            var oItem = oEvent.getParameter("selectedItem");
            if (!oItem) {
                var oNewModel = this.getView().getModel("newOrder");
                if (oNewModel) oNewModel.setProperty("/price", 0);
                return;
            }

            // Try to read price from binding context (works when combo is bound to OData model)
            var oCtx = oItem.getBindingContext("ui") || oItem.getBindingContext();
            var vPrice = oCtx ? oCtx.getProperty("price") : null;

            // If no binding context, try to find price from item text (fallback) or leave 0
            if (vPrice === undefined || vPrice === null) {
                // attempt to parse price from item text if present (fallback)
                var sText = oItem.getText() || "";
                var m = sText.match(/—\s*([\d.,]+)/);
                vPrice = m ? parseFloat(m[1].replace(/,/g, "")) : 0;
            }

            var oNewModel = this.getView().getModel("newOrder");
            if (oNewModel) {
                oNewModel.setProperty("/price", vPrice || 0);
                oNewModel.setProperty("/productID", oItem.getKey());
            }
        },

        onSaveNewOrder: function () {
            var oNew = this.getView().getModel("newOrder").getData();
            if (!oNew.productID) {
                sap.m.MessageToast.show("Please select a product");
                return;
            }
            var iQty = parseInt(oNew.quantity, 10) || 0;
            if (iQty <= 0) {
                sap.m.MessageToast.show("Quantity must be > 0");
                return;
            }

            // Build payload for deep insert (CAP must support deep insert)
            var oPayload = {
                orderDate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                items: [
                    {
                        "product@odata.bind": "/Products(" + encodeURIComponent(oNew.productID) + ")",
                        price: parseFloat(oNew.price) || 0,
                        quantity: iQty
                    }
                ]
            };

            // Prefer OData V4 named model "ui", fallback to default model
            var oComponent = this.getOwnerComponent();
            var oV4Model = oComponent && (oComponent.getModel("ui") || oComponent.getModel());

            if (!oV4Model) {
                sap.m.MessageToast.show("OData model not found");
                this._oNewOrderDialog.close();
                return;
            }

            try {
                // If model is OData V4 (has bindList), use bindList().create()
                if (typeof oV4Model.bindList === "function") {
                    var oListBinding = oV4Model.bindList("/Orders");
                    var oCreated = oListBinding.create(oPayload);
                    sap.ui.core.BusyIndicator.show(0);
                    oCreated.created().then(function () {
                        sap.ui.core.BusyIndicator.hide();
                        sap.m.MessageToast.show("Order created successfully");
                        var oTable = this.getView().byId("table");
                        if (oTable && oTable.getBinding("items")) {
                            oTable.getBinding("items").refresh();
                        } else {
                            oListBinding.refresh();
                        }
                    }.bind(this)).catch(function (oErr) {
                        sap.ui.core.BusyIndicator.hide();
                        console.error("Create error:", oErr);
                        sap.m.MessageToast.show("Error creating order");
                    });
                } else if (typeof oV4Model.create === "function") {
                    // OData V2 model create
                    sap.ui.core.BusyIndicator.show(0);
                    oV4Model.create("/Orders", oPayload, {
                        success: function () {
                            sap.ui.core.BusyIndicator.hide();
                            sap.m.MessageToast.show("Order created successfully");
                            var oTable = this.getView().byId("table");
                            if (oTable && oTable.getBinding("items")) {
                                oTable.getBinding("items").refresh();
                            }
                        }.bind(this),
                        error: function (oErr) {
                            sap.ui.core.BusyIndicator.hide();
                            console.error("Create error V2:", oErr);
                            sap.m.MessageToast.show("Error creating order");
                        }
                    });
                } else {
                    console.error("Model does not support create operations");
                    sap.m.MessageToast.show("Model does not support create operations");
                }
            } catch (e) {
                sap.ui.core.BusyIndicator.hide();
                console.error("onSaveNewOrder exception:", e);
                sap.m.MessageToast.show("Create failed: " + (e.message || e));
            } finally {
                this._oNewOrderDialog.close();
            }
        },

        formatOrderDate: function (sDate) {
            if (!sDate) return "";
            var oDate = new Date(sDate);
            var oDateFormat = DateFormat.getDateInstance({ pattern: "dd/MM/yyyy" });
            return oDateFormat.format(oDate);
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

        _updateLabelsAndTable: function () {
            if (this.oExpandedLabel) this.oExpandedLabel.setText(this.getFormattedSummaryTextExpanded());
            if (this.oSnappedLabel) this.oSnappedLabel.setText(this.getFormattedSummaryText());
            if (this.oTable) this.oTable.setShowOverlay(true);
        },

        _filterTable: function (oFilter) {
            var oVHD = this._oVHD;
            if (!oVHD) return;
            oVHD.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    oTable.getBinding("rows").filter(oFilter);
                }
                if (oTable.bindItems) {
                    oTable.getBinding("items").filter(oFilter);
                }
                oVHD.update();
            });
        }

    });
});
