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

            // Áp dụng filter cho bảng
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

        // #region Value Help Dialog standard use case with filter bar without filter suggestions
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
            var oButton = oEvent.getSource();              // chính là Button được bấm
            var oContext = oButton.getBindingContext();    // context của dòng chứa Button
            var sOrderId = oContext.getProperty("ID");     // lấy Order ID từ model

            this.getOwnerComponent().getRouter().navTo("RouteDetailpage", {
                OrderId: sOrderId
            });
        },

        formatOrderDate: function (sDate) {
            if (!sDate) return "";
            var oDate = new Date(sDate); // parse chuỗi thành Date object
            var oDateFormat = DateFormat.getDateInstance({ pattern: "dd-MM-yyyy" });
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
        }
    });
});
