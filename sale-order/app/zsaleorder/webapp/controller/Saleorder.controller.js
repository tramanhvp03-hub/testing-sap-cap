sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/type/String',
    'sap/m/ColumnListItem',
    'sap/m/Label',
    'sap/m/SearchField',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/table/Column',
    'sap/m/Column',
    'sap/m/Text',
    'sap/ui/comp/smartvariants/PersonalizableInfo',
    'sap/ui/core/format/DateFormat',
    'sap/m/MessageBox',
    'sap/m/MessageToast',
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel"

], function (Controller, TypeString, ColumnListItem, Label, SearchField, Filter, FilterOperator, UIColumn,
    MColumn, Text, PersonalizableInfo, DateFormat, MessageBox, MessageToast, Fragment, JSONModel) {
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
            this.oExpandedLabel = this.getView().byId("_IDGenLabel5");
            this.oSnappedLabel = this.getView().byId("_IDGenLabel6");
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

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteSaleorder").attachPatternMatched(this._onRefresh, this);
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
                var sName = oFilterGroupItem.getName();
                var aControlFilters = [];

                // 1. MultiComboBox (Chọn Product ID)
                if (sName === "Product Name" && oControl.getSelectedKeys) {
                    var aSelectedKeys = oControl.getSelectedKeys();
                    if (aSelectedKeys && aSelectedKeys.length > 0) {
                        aSelectedKeys.forEach(function (sKey) {
                            if (sKey) {
                                aControlFilters.push(new Filter({
                                    path: "items",
                                    operator: FilterOperator.Any,
                                    variable: "item",
                                    condition: new Filter("item/product_ID", FilterOperator.EQ, sKey)
                                }));
                            }
                        });
                    }
                }
                // 2. MultiInput (Chọn Customer ID)
                else if (sName === "Customer Name" && oControl.getTokens) {
                    var aTokens = oControl.getTokens();
                    if (aTokens && aTokens.length > 0) {
                        aTokens.forEach(function (oToken) {
                            var sValue = oToken.getKey() || oToken.getText();
                            if (sValue) {
                                aControlFilters.push(new Filter({
                                    path: "customer_ID",
                                    operator: FilterOperator.EQ,
                                    value1: sValue
                                }));
                            }
                        });
                    }
                }
                // 3. DatePicker (Lọc ngày tạo đơn)
                else if (sName === "Order Date" && oControl.getDateValue) {
                    var oDate = oControl.getDateValue();
                    if (oDate) {
                        // Định dạng YYYY-MM-DD dạng chuỗi chuẩn cho OData V4 Edm.Date
                        var sYear = oDate.getFullYear();
                        var sMonth = String(oDate.getMonth() + 1).padStart(2, '0');
                        var sDay = String(oDate.getDate()).padStart(2, '0');
                        var sFormattedDate = sYear + "-" + sMonth + "-" + sDay;

                        aControlFilters.push(new Filter({
                            path: "orderDate",
                            operator: FilterOperator.EQ,
                            value1: sFormattedDate
                        }));
                    }
                }

                // CHỈ đẩy vào aResult khi ô đó thực sự CÓ bộ lọc
                if (aControlFilters.length > 0) {
                    aResult.push(new Filter({
                        filters: aControlFilters,
                        and: false
                    }));
                }

                return aResult;
            }, []);

            // Gán bộ lọc lên Table
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
            // Khởi tạo model dữ liệu cho form tạo mới
            var oNewOrderModel = new JSONModel({
                customer: { name: "" },
                orderDate: new Date().toISOString().substring(0, 10),
                items: [
                    { product_ID: "", quantity: 1, price: 0 } // Dòng mặc định đầu tiên
                ]
            });
            this.getView().setModel(oNewOrderModel, "newOrder");

            // Load Fragment nếu chưa load
            if (!this._pAddDialog) {
                this._pAddDialog = Fragment.load({
                    id: this.getView().getId(), // Giúp dùng this.byId() an toàn
                    name: "zsaleorder.view.fragment.CreateSaleOrderDialog", // Đổi đường dẫn theo namespace dự án
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                }.bind(this));
            }

            this._pAddDialog.then(function (oDialog) {
                oDialog.open();
            });
        },

        // 2. Thêm 1 dòng sản phẩm mới vào JSON Model
        onAddProductRow: function () {
            var oModel = this.getView().getModel("newOrder");
            var aItems = oModel.getProperty("/items");

            aItems.push({ product_ID: "", quantity: 1, price: 0 });
            oModel.setProperty("/items", aItems);
        },

        // 3. Xóa dòng tương ứng khi bấm nút Delete
        onDeleteProductRow: function (oEvent) {
            var oItem = oEvent.getSource().getParent();
            var sPath = oItem.getBindingContext("newOrder").getPath();
            var iIndex = parseInt(sPath.split("/").pop(), 10);

            var oModel = this.getView().getModel("newOrder");
            var aItems = oModel.getProperty("/items");
            aItems.splice(iIndex, 1);

            oModel.setProperty("/items", aItems);
        },

        // 4. Tự động fill Giá khi chọn Sản phẩm
        onProductSelectionChange: function (oEvent) {
            var oComboBox = oEvent.getSource();
            var oSelectedItem = oComboBox.getSelectedItem();

            if (oSelectedItem) {
                var oProductCtx = oSelectedItem.getBindingContext(); // Lấy context từ OData /Products
                var oProductData = oProductCtx.getObject();

                // Cập nhật giá trực tiếp vào model row tương ứng
                var oRowCtx = oComboBox.getBindingContext("newOrder");
                this.getView().getModel("newOrder").setProperty(oRowCtx.getPath() + "/price", oProductData.price);
            }
        },

        // 5. Đóng Dialog
        onCloseCreateDialog: function () {
            this._pAddDialog.then(function (oDialog) {
                oDialog.close();
            });
        },

        onSaveSaleOrder: function () {
            const oView = this.getView();
            const oODataModel = oView.getModel(); // OData V4 Model
            const oNewOrderModel = oView.getModel("newOrder");
            const oRawData = oNewOrderModel.getData();

            // 1. Validate dữ liệu đầu vào
            if (!oRawData.customer || !oRawData.customer.name || !oRawData.customer.name.trim()) {
                MessageBox.warning("Customer name cannot be empty!");
                return;
            }

            if (!oRawData.orderDate) {
                MessageBox.warning("Order date cannot be empty!");
                return;
            }

            if (!oRawData.items || !Array.isArray(oRawData.items) || oRawData.items.length === 0) {
                MessageBox.warning("Please add at least one product to the order!");
                return;
            }

            // 2. Xây dựng Payload Items (Vì items là Composition nên hỗ trợ Deep Insert)
            const aCleanItems = [];
            for (let i = 0; i < oRawData.items.length; i++) {
                const oItem = oRawData.items[i];
                const iQty = parseInt(oItem.quantity, 10);

                if (!oItem.product_ID) {
                    MessageBox.warning(`Please select a Product for row ${i + 1}!`);
                    return;
                }

                if (isNaN(iQty) || iQty <= 0) {
                    MessageBox.warning(`Quantity in row ${i + 1} must be a valid positive integer!`);
                    return;
                }

                aCleanItems.push({
                    product_ID: oItem.product_ID,
                    quantity: iQty
                });
            }

            sap.ui.core.BusyIndicator.show(0);

            // BƯỚC A: Tạo Customer trước trong entity /Customers
            const oCustBinding = oODataModel.bindList("/Customers");
            const oCustContext = oCustBinding.create({
                name: oRawData.customer.name.trim()
            });
            oODataModel.submitBatch("myUpdateGroup");//Bạn không thể tạo Order nếu chưa có customer_ID. Muốn Backend trả ID về, bắt buộc phải gọi submitBatch lần 1 để gửi thông tin Customer lên Server.
            // BƯỚC B: Chờ Customer được tạo thành công trên Server (Backend tự sinh UUID cho ID)
            oCustContext.created().then(() => {
                // Lấy UUID thật từ Backend vừa trả về
                const sGeneratedCustomerID = oCustContext.getProperty("ID");

                const oPayload = {
                    orderDate: oRawData.orderDate,
                    customer_ID: sGeneratedCustomerID, // Gán khóa ngoại customer_ID
                    items: aCleanItems                 // Deep Insert cho items (Composition)
                };

                const oOrdersBinding = oODataModel.bindList("/Orders");
                const oOrderContext = oOrdersBinding.create(oPayload);
                oODataModel.submitBatch("myUpdateGroup");//Vì lệnh create Order này diễn ra sau khi lô Batch 1 đã gửi xong, nên dữ liệu Order này rơi vào một lượt chờ mới nên bắt buộc phải gọi submitBatch lần 2 để đẩy nốt lệnh tạo Order lên Server.

                return oOrderContext.created();
            }).then(() => {
                sap.ui.core.BusyIndicator.hide();
                MessageToast.show("Sale Order created successfully!");

                // Đóng Dialog & Reset Form
                this.onCloseCreateDialog();
                oNewOrderModel.setData({
                    customer: { name: "" },
                    orderDate: new Date().toISOString().substring(0, 10),
                    items: [{ product_ID: "", quantity: 1, price: 0 }]
                });

                // Refresh lại Table danh sách chính
                this._onRefresh();

            }).catch((oError) => {
                sap.ui.core.BusyIndicator.hide();
                console.error("Save Error:", oError);

                // Hủy transient context nếu tạo thất bại
                if (oCustContext && oCustContext.isTransient()) {
                    oCustContext.delete();
                }

                MessageBox.error("Create Sale Order Failed: " + (oError.message || "Backend error"));
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

        _onRefresh: function () {
            const oModel = this.getView().getModel();
            var oTable = this.byId("table");
            if (oTable && oTable.getBinding("items")) {
                oTable.getBinding("items").refresh();
                oModel.refresh("$auto");
            }
        }

    });
});